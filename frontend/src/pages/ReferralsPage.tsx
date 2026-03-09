import { useEffect, useMemo, useRef, useState } from "react";
import { apiJson, copyText } from "../api";
import { useBridgeCopy } from "../bridgeI18n";

type RefStats = {
  ok?: boolean;
  refLink?: string;
  refCode?: string;
  confirmedRefs?: number;
  activeRefs?: number;
  strictEligibleRefs?: number;
  eligibleRefs?: number;
  effectiveEligibleRefs?: number;
  adminEligibleCredits?: number;
  legacyReferrals?: number;
  clicks?: number;
  dailyLimit?: number;
  freeDaily?: number;
  dailyBonus?: number;
  bonusCap?: number;
  bonusPer20?: number;
  bonusChunks?: number;
  nextBonusAt?: number | null;
  promoter?: boolean;
  ownerActive?: boolean;
  starter?: {
    starterBgSlots?: number;
  };
  rewards?: {
    proTrial7dUnlocked?: boolean;
    discount50Unlocked?: boolean;
    toolkitUnlocked?: boolean;
  };
  unlocks?: {
    bgSlots?: number;
    bgSlotsBase?: number;
    starterBgSlots?: number;
    unlimitedBg?: boolean;
    cosmeticsOnePack?: boolean;
    cosmeticsAllPacks?: boolean;
    saveCapBonus?: number;
    proTrial7dUnlocked?: boolean;
    discount50Unlocked?: boolean;
    toolkitUnlocked?: boolean;
    nextUnlockAt?: number | null;
  };
};

type RefListRow = {
  handle: string;
  joinedAt?: string | null;
  confirmedAt?: string | null;
  lastInsertAt?: string | null;
  lastSeen?: string | null;
  inserts?: number;
  activeDays?: number;
  status?: string;
  notCountedReason?: string | null;
  fraud?: boolean;
  fraudReason?: string | null;
};

type RefListMeta = {
  days: number;
  thresholds: {
    minDays: number;
    minUses: number;
  };
};

const LADDER = [
  { at: 1, label: "5 bg slots" },
  { at: 3, label: "8 bg slots + 1 cosmetics pack" },
  { at: 7, label: "+50 save cap + 12 bg slots" },
  { at: 15, label: "Unlimited bg slots + all cosmetics" },
  { at: 30, label: "Pro trial 7d unlocked" },
  { at: 50, label: "50% off 1 month unlocked" },
  { at: 100, label: "Referral Toolkit unlocked" },
] as const;

const RANGE_OPTIONS = [30, 60, 90] as const;
const LOAD_COOLDOWN_MS = 1200;

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function statusTone(status?: string, fraud?: boolean) {
  if (fraud) return "bad";
  if (status === "eligible") return "ok";
  if (status === "active" || status === "confirmed") return "warn";
  return "warn";
}

function safeNum(value: unknown) {
  return Math.max(0, Number(value || 0) || 0);
}

function friendlyError(status: number, fallback?: string) {
  if (status === 429) return "Too many requests right now. Wait a second and press Refresh.";
  return String(fallback || "load_failed");
}

export function ReferralsPage({ token, refreshKey = 0 }: { token: string; refreshKey?: number }) {
  const [stats, setStats] = useState<RefStats | null>(null);
  const [rows, setRows] = useState<RefListRow[]>([]);
  const [listMeta, setListMeta] = useState<RefListMeta>({
    days: 30,
    thresholds: { minDays: 0, minUses: 0 },
  });
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const { copy, siteText } = useBridgeCopy();
  const inflightRef = useRef(false);
  const lastKeyRef = useRef("");
  const lastAtRef = useRef(0);
  const seqRef = useRef(0);

  async function load(force = false) {
    const activeToken = String(token || "").trim();
    if (!activeToken) {
      setStats(null);
      setRows([]);
      setBusy(false);
      setErr("");
      return;
    }

    const requestKey = `${activeToken}:${rangeDays}:${refreshKey}`;
    const now = Date.now();
    if (!force) {
      if (inflightRef.current) return;
      if (lastKeyRef.current === requestKey && (now - lastAtRef.current) < LOAD_COOLDOWN_MS) {
        return;
      }
    }

    inflightRef.current = true;
    lastKeyRef.current = requestKey;
    lastAtRef.current = now;
    const seq = ++seqRef.current;

    setBusy(true);
    setErr("");

    try {
      const [s, l] = await Promise.all([
        apiJson<RefStats>("/api/referral/stats", { token: activeToken }),
        apiJson<{ ok?: boolean; list?: RefListRow[]; days?: number; thresholds?: { minDays?: number; minUses?: number } }>(`/api/referral/list?days=${rangeDays}`, { token: activeToken }),
      ]);

      if (!s.ok) throw new Error(friendlyError(s.status, s.errorText || "ref_stats_failed"));
      if (!l.ok) throw new Error(friendlyError(l.status, l.errorText || "ref_list_failed"));
      if (seq !== seqRef.current) return;

      setStats(s.data || null);
      setRows(Array.isArray(l.data?.list) ? (l.data?.list ?? []) : []);
      setListMeta({
        days: safeNum(l.data?.days) || rangeDays,
        thresholds: {
          minDays: safeNum(l.data?.thresholds?.minDays),
          minUses: safeNum(l.data?.thresholds?.minUses),
        },
      });
    } catch (e: any) {
      if (seq === seqRef.current) {
        setErr(String(e?.message || "load_failed"));
      }
    } finally {
      if (seq === seqRef.current) {
        setBusy(false);
      }
      inflightRef.current = false;
    }
  }

  useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshKey, rangeDays]);

  const confirmed = safeNum(stats?.confirmedRefs);
  const active = safeNum(stats?.activeRefs);
  const strictEligible = safeNum(stats?.strictEligibleRefs);
  const eligible = safeNum(stats?.eligibleRefs);
  const legacy = safeNum(stats?.legacyReferrals);
  const adminCredits = safeNum(stats?.adminEligibleCredits);
  const effective = safeNum(stats?.effectiveEligibleRefs);
  const clicks = safeNum(stats?.clicks);
  const freeDaily = safeNum(stats?.freeDaily) || 70;
  const dailyBonus = safeNum(stats?.dailyBonus);
  const dailyLimit = safeNum(stats?.dailyLimit) || freeDaily;
  const bonusPer20 = safeNum(stats?.bonusPer20) || 10;
  const bonusChunks = safeNum(stats?.bonusChunks);
  const nextBonusAt = stats?.nextBonusAt == null ? null : safeNum(stats?.nextBonusAt);
  const promoter = !!stats?.promoter;

  const nextUnlock = useMemo(() => {
    return LADDER.find((step) => effective < step.at) || null;
  }, [effective]);

  const previousUnlockAt = useMemo(() => {
    if (!nextUnlock) return LADDER[LADDER.length - 1]?.at || 0;
    const idx = LADDER.findIndex((step) => step.at === nextUnlock.at);
    return idx > 0 ? LADDER[idx - 1].at : 0;
  }, [nextUnlock]);

  const neededForNext = useMemo(() => {
    return nextUnlock ? Math.max(0, nextUnlock.at - effective) : 0;
  }, [effective, nextUnlock]);

  const progressPct = useMemo(() => {
    if (!nextUnlock) return 100;
    const span = Math.max(1, nextUnlock.at - previousUnlockAt);
    const progress = Math.max(0, effective - previousUnlockAt);
    return Math.max(0, Math.min(100, Math.round((progress / span) * 100)));
  }, [effective, nextUnlock, previousUnlockAt]);

  async function onCopy() {
    const ok = await copyText(String(stats?.refLink || ""));
    setCopied(ok ? siteText("toast_copied", "Copied.") : siteText("toast_copy_failed", "Copy failed."));
    window.setTimeout(() => setCopied(""), 1800);
  }

  if (!token) {
    return (
      <div className="card">
        <div className="h1" style={{ fontSize: 18 }}>{siteText("t_ref", "Referrals")}</div>
        <div className="hint" style={{ marginTop: 8 }}>{copy("referralsConnectFirst", "Connect first to load your referral stats.")}</div>
      </div>
    );
  }

  return (
    <div className="stackSection">
      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 18 }}>{siteText("t_ref", "Referrals")}</div>
            <div className="hint">{copy("referralsIntro", "This page shows the real referral counters and unlock path. Free stays {free} / {free} until you unlock more.").replace(/\{free\}/g, String(freeDaily))}</div>
          </div>
          <div className="spacer" />
          <div className="row">
            {RANGE_OPTIONS.map((days) => (
              <button
                key={days}
                className={`btn ${rangeDays === days ? "btnActive" : ""}`}
                onClick={() => setRangeDays(days)}
                disabled={busy}
              >
                {days}d
              </button>
            ))}
            <button className="btn" onClick={() => void load(true)} disabled={busy}>{copy("refresh", "Refresh")}</button>
          </div>
        </div>

        {err ? <div className="err">{err}</div> : null}

        <div className="statGrid" style={{ marginTop: 10 }}>
          <div className="miniStat"><span>{siteText("ref_k_confirmed", "Confirmed")}</span><strong>{confirmed}</strong></div>
          <div className="miniStat"><span>{siteText("ref_k_active", "Active")}</span><strong>{active}</strong></div>
          <div className="miniStat"><span>{copy("strictEligible", "Strict eligible")}</span><strong>{strictEligible}</strong></div>
          <div className="miniStat"><span>{siteText("ref_k_legacy", "Carry-over")}</span><strong>{legacy}</strong></div>
          <div className="miniStat"><span>{copy("adminCredits", "Admin credits")}</span><strong>{adminCredits}</strong></div>
          <div className="miniStat"><span>{copy("effective", "Unlock total")}</span><strong>{effective}</strong></div>
          <div className="miniStat"><span>{copy("clicks", "Clicks")}</span><strong>{clicks}</strong></div>
          <div className="miniStat"><span>{copy("dailyLimit", "Daily limit")}</span><strong>{dailyLimit}</strong></div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h1" style={{ fontSize: 18, marginBottom: 10 }}>{copy("referralLink", "Referral link")}</div>
          <div className="k"><div className="kv">Code</div><div className="mono">{stats?.refCode || "—"}</div></div>
          <div className="k"><div className="kv">{copy("countingRule", "Counting rule")}</div><div className="mono">unlock total = max(active, carry-over) + admin credits</div></div>
          <div className="k"><div className="kv">{copy("ownerActive", "Owner active")}</div><div className="mono">{stats?.ownerActive ? copy("yes", "yes") : copy("no", "no")}</div></div>
          <textarea className="area" readOnly value={String(stats?.refLink || "")} style={{ minHeight: 86, marginTop: 10 }} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" onClick={() => void onCopy()} disabled={!stats?.refLink}>{siteText("refCopy", "Copy link")}</button>
            {copied ? <div className="hint">{copied}</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="h1" style={{ fontSize: 18, marginBottom: 10 }}>{copy("nextUnlock", "Next unlock")}</div>
          {nextUnlock ? (
            <>
              <div className="k"><div className="kv">{copy("target", "Target")}</div><div className="mono">{nextUnlock.at}</div></div>
              <div className="k"><div className="kv">{copy("reward", "Reward")}</div><div className="mono">{nextUnlock.label}</div></div>
              <div className="k"><div className="kv">{copy("need", "Need")}</div><div className="mono">{neededForNext}</div></div>
              <div className="progressTrack" style={{ marginTop: 10 }}>
                <div className="progressFill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="hint" style={{ marginTop: 8 }}>{copy("progressFrom", "Progress from {from} to {to}: {pct}%").replace("{from}", String(previousUnlockAt)).replace("{to}", String(nextUnlock.at)).replace("{pct}", String(progressPct))}</div>
            </>
          ) : (
            <div className="hint">{copy("topLadderReached", "Top ladder reached. No further unlock pending.")}</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 18 }}>{copy("promoterBonus", "Promoter bonus")}</div>
            <div className="hint">{copy("promoterHint", "Every 20 eligible referrals adds extra daily generation on top of Free. Tier upgrades at 50 confirmed or eligible referrals.")}</div>
          </div>
          <div className="spacer" />
          <span className={`badge ${promoter ? "badge-ok" : "badge-warn"}`}>{promoter ? copy("activePromoter", "active") : copy("inactivePromoter", "not active yet")}</span>
        </div>
        <div className="statGrid">
          <div className="miniStat"><span>{copy("baseDaily", "Base daily")}</span><strong>{freeDaily}</strong></div>
          <div className="miniStat"><span>{copy("dailyBonus", "Daily bonus")}</span><strong>{dailyBonus}</strong></div>
          <div className="miniStat"><span>{copy("bonusStep", "Bonus per 20")}</span><strong>{bonusPer20}</strong></div>
          <div className="miniStat"><span>{copy("bonusChunks", "20-ref chunks")}</span><strong>{bonusChunks}</strong></div>
        </div>
        <div className="ladderList" style={{ marginTop: 12 }}>
          <div className="ladderItem"><span className="dot ok" /><span>{copy("promoterRule1", "Eligible referrals drive the chunk count: floor(eligible / 20).")}</span></div>
          <div className="ladderItem"><span className="dot ok" /><span>{copy("promoterRule2", "Step size is 10 by default, then 12 once confirmed or eligible reaches 50.")}</span></div>
          <div className="ladderItem"><span className="dot ok" /><span>{copy("promoterRule3", "Daily limit = Free base + daily bonus.")}</span></div>
          <div className="ladderItem"><span className="dot warn" /><span>{nextBonusAt ? copy("promoterNextAt", "Next promoter step at {n} eligible referrals.").replace("{n}", String(nextBonusAt)) : copy("promoterCapReached", "Promoter cap reached for the current rules.")}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="h1" style={{ fontSize: 18, marginBottom: 10 }}>{copy("countingRules", "Counting rules")}</div>
        <div className="ladderList">
          <div className="ladderItem"><span className="dot ok" /><span>{siteText("ref_k_confirmed", "Confirmed")} = {siteText("ref_def_confirmed", "users who registered via your link.")}</span></div>
          <div className="ladderItem"><span className="dot ok" /><span>{siteText("ref_k_active", "Active")} = {siteText("ref_def_active", "confirmed users with at least one recorded usage.")}</span></div>
          <div className="ladderItem"><span className="dot ok" /><span>{copy("strictEligible", "Strict eligible")} = active only</span></div>
          <div className="ladderItem"><span className="dot ok" /><span>{siteText("ref_k_eligible", "Eligible")} = {siteText("ref_def_eligible", "max(active, carry-over).")}</span></div>
          <div className="ladderItem"><span className="dot ok" /><span>{copy("effective", "Unlock total")} = eligible + admin credits</span></div>
          <div className="ladderItem"><span className="dot warn" /><span>{copy("windowNow", "Window now")}: {listMeta.days}d · thresholds: {listMeta.thresholds.minDays} active day(s), {listMeta.thresholds.minUses} use(s)</span></div>
        </div>
      </div>

      <div className="card">
        <div className="h1" style={{ fontSize: 18, marginBottom: 10 }}>{copy("invitesInWindow", "Invites in window")}</div>
        {!rows.length ? (
          <div className="hint">{siteText("r_no_invited", "No invited users yet")}</div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{siteText("r_col_handle", "Handle")}</th>
                  <th>{siteText("r_col_status", "Status")}</th>
                  <th>{siteText("ref_k_confirmed", "Confirmed")}</th>
                  <th>{siteText("r_col_active", "Active days")}</th>
                  <th>{siteText("r_col_inserts", "Used")}</th>
                  <th>{copy("lastInsert", "Last activity")}</th>
                  <th>{copy("lastSeen", "Last seen")}</th>
                  <th>{copy("reason", "Reason")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.handle}:${row.confirmedAt || row.joinedAt || "x"}`}>
                    <td className="mono">{row.handle}</td>
                    <td>
                      <span className={`badge badge-${statusTone(row.status, row.fraud)}`}>
                        {row.fraud ? copy("fraud", "fraud") : (row.status || copy("pending", "pending"))}
                      </span>
                    </td>
                    <td>{fmtDate(row.confirmedAt || row.joinedAt)}</td>
                    <td>{safeNum(row.activeDays)}</td>
                    <td>{safeNum(row.inserts)}</td>
                    <td>{fmtDate(row.lastInsertAt)}</td>
                    <td>{fmtDate(row.lastSeen)}</td>
                    <td>{row.fraudReason || row.notCountedReason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
