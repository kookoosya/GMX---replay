import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson, requestSiteExtensionSync } from "../api";
import { useBridgeCopy } from "../bridgeI18n";

type AnyObj = Record<string, any>;
type AccessSnapshot = {
  ok?: boolean;
  handle?: string;
  sub?: AnyObj | null;
  resetAt?: string;
  usage?: {
    gm?: AnyObj | null;
    gn?: AnyObj | null;
  } | null;
  tools?: AnyObj | null;
  limits?: AnyObj | null;
  extension?: AnyObj | null;
  refreshedAt?: string;
};

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function isUnlimitedSub(sub: AnyObj | null | undefined): boolean {
  return !!(sub?.isUnlimited || sub?.tier === "unlimited");
}

function boolLabel(value: unknown, onText = "Unlocked", offText = "Locked") {
  return value ? onText : offText;
}

function planLabel(sub: AnyObj | null | undefined): string {
  if (isUnlimitedSub(sub)) return "Unlimited";
  if (sub?.active) return "Paid";
  return "Free";
}

function subscriptionLabel(sub: AnyObj | null | undefined): string {
  if (isUnlimitedSub(sub)) return "Unlimited access";
  if (sub?.active) return sub?.paidUntil ? `Active until ${fmtDate(String(sub.paidUntil))}` : "Active";
  return "Free tier";
}

function grantMessage(data: AnyObj | null): string {
  const grantType = String(data?.grant?.grantType || "");
  const grantValue = Number(data?.grant?.grantValue || 0) || 0;
  if (grantType === "eligible_credit") {
    return `Unlock credits applied: +${grantValue}`;
  }
  if (isUnlimitedSub((data?.sub || null) as AnyObj | null)) return "Unlimited access is active";
  if (data?.sub?.active && data?.sub?.paidUntil) return `Paid access updated until ${fmtDate(String(data.sub.paidUntil))}`;
  return "Code redeemed";
}

function redeemErrorText(raw: string): string {
  const code = String(raw || "").trim();
  if (!code) return "redeem_failed";
  if (code === "invalid_code") return "Enter a valid code";
  if (code === "code_not_found") return "Code was not found";
  if (code === "code_already_redeemed") return "This code was already used";
  if (code === "server_error") return "Server error while redeeming the code";
  return code;
}

function dailyCapLabel(sub: AnyObj | null | undefined, extension: AnyObj | null, gmUsage: AnyObj | null | undefined): string {
  if (extension?.insertMode === "unlimited") return "Unlimited";
  if (isUnlimitedSub(sub) || sub?.active) return "Unlimited";
  const limit = Number(extension?.dailyLimitPerKind ?? gmUsage?.limit ?? 0) || 0;
  return limit > 0 ? `${limit} per kind / day` : "—";
}

function cosmeticsLabel(sub: AnyObj | null | undefined, extension: AnyObj | null, unlocks: AnyObj | null): string {
  if (isUnlimitedSub(sub) || sub?.active) return "All via paid plan";
  if (extension?.backgrounds?.cosmeticsAllPacks || unlocks?.cosmeticsAllPacks) return "All referral packs";
  if (extension?.backgrounds?.cosmeticsOnePack || unlocks?.cosmeticsOnePack) return "1 referral pack";
  return "Free-only set";
}

function loadErrorText(raw: string): string {
  const code = String(raw || "").trim();
  if (!code) return "Failed to load entitlements";
  if (code === "server_error") return "Server error while loading entitlements";
  return code;
}

export function AccessPage({
  token,
  usage,
  me,
  refreshKey = 0,
  onRefresh,
  refreshBusy = false,
}: {
  token: string;
  usage: AnyObj | null;
  me: AnyObj | null;
  refreshKey?: number;
  onRefresh?: () => Promise<void> | void;
  refreshBusy?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<AccessSnapshot | null>(null);
  const [loadBusy, setLoadBusy] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeemErr, setRedeemErr] = useState("");
  const { copy } = useBridgeCopy();

  const fillTemplate = useCallback((template: string, vars: Record<string, string | number>) => {
    let out = String(template || "");
    Object.entries(vars).forEach(([key, value]) => {
      out = out.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    });
    return out;
  }, []);

  const copyText = useCallback((key: string, fallback: string, vars?: Record<string, string | number>) => {
    const base = copy(key, fallback);
    return vars ? fillTemplate(base, vars) : base;
  }, [copy, fillTemplate]);

  const loadSnapshot = useCallback(async () => {
    if (!token) {
      setSnapshot(null);
      setLoadErr("");
      return;
    }
    setLoadBusy(true);
    setLoadErr("");
    try {
      const r = await apiJson<AccessSnapshot>("/api/access/entitlements", { token });
      const loadCode = String(r.errorText || (r.data as AnyObj)?.error || "server_error");
      if (!r.ok || !r.data) {
        if (loadCode === "server_error") throw new Error(copyText("loadEntitlementsServerError", "Server error while loading entitlements"));
        throw new Error(copyText("loadEntitlementsFailed", "Failed to load entitlements"));
      }
      setSnapshot(r.data);
    } catch (e: any) {
      setSnapshot(null);
      setLoadErr(String(e?.message || copyText("loadEntitlementsFailed", "Failed to load entitlements")));
    } finally {
      setLoadBusy(false);
    }
  }, [copyText, token]);

  useEffect(() => {
    if (!token) {
      setSnapshot(null);
      setLoadErr("");
      setRedeemCode("");
      setRedeemMsg("");
      setRedeemErr("");
      return;
    }
    void loadSnapshot();
  }, [token, refreshKey, loadSnapshot]);

  const currentSub = (snapshot?.sub || usage?.sub || null) as AnyObj | null;
  const currentUsage = useMemo(() => {
    return {
      gm: (snapshot?.usage?.gm || usage?.gm || null) as AnyObj | null,
      gn: (snapshot?.usage?.gn || usage?.gn || null) as AnyObj | null,
    };
  }, [snapshot, usage]);
  const currentLimits = (snapshot?.limits || usage?.limits || me?.limits || null) as AnyObj | null;
  const currentTools = (snapshot?.tools || me?.tools || null) as AnyObj | null;
  const extension = (snapshot?.extension || null) as AnyObj | null;

  const unlocks = useMemo(() => {
    return (currentLimits?.referralUnlocks || me?.limits?.referralUnlocks || null) as AnyObj | null;
  }, [currentLimits, me]);

  const planText = useMemo(() => {
    if (isUnlimitedSub(currentSub)) return copy("unlimited", "Unlimited");
    if (currentSub?.active) return copy("paid", "Paid");
    return copy("free", "Free");
  }, [copy, currentSub]);

  const subscriptionText = useMemo(() => {
    if (isUnlimitedSub(currentSub)) return copyText("unlimitedAccess", "Unlimited access");
    if (currentSub?.active) {
      return currentSub?.paidUntil
        ? copyText("activeUntil", "Active until {date}", { date: fmtDate(String(currentSub.paidUntil)) })
        : copy("active", "Active");
    }
    return copyText("freeTier", "Free tier");
  }, [copy, copyText, currentSub]);

  const extensionPlanText = useMemo(() => {
    const raw = String(extension?.plan || "").trim().toLowerCase();
    if (raw === "unlimited") return copy("unlimited", "Unlimited");
    if (raw === "paid" || raw === "pro") return copy("paid", "Paid");
    return planText;
  }, [copy, extension?.plan, planText]);

  const unlockFlag = useCallback((value: unknown) => boolLabel(value, copy("unlocked", "Unlocked"), copy("locked", "Locked")), [copy]);

  async function redeemAccessCode() {
    const code = String(redeemCode || "").trim();
    if (!token || !code) return;
    setRedeemBusy(true);
    setRedeemErr("");
    setRedeemMsg("");
    try {
      const r = await apiJson<AnyObj>("/api/billing/redeem", {
        method: "POST",
        token,
        body: { code },
      });
      if (!r.ok) {
        const redeemCodeText = String(r.errorText || (r.data as AnyObj)?.error || "redeem_failed");
        if (redeemCodeText === "invalid_code") throw new Error(copyText("invalidCode", "Enter a valid code"));
        if (redeemCodeText === "code_not_found") throw new Error(copyText("codeNotFound", "Code was not found"));
        if (redeemCodeText === "code_already_redeemed") throw new Error(copyText("codeAlreadyUsed", "This code was already used"));
        if (redeemCodeText === "server_error") throw new Error(copyText("redeemServerError", "Server error while redeeming the code"));
        throw new Error(redeemCodeText || "redeem_failed");
      }
      setRedeemCode("");
      {
        const data = (r.data as AnyObj) || null;
        const grantType = String(data?.grant?.grantType || "");
        const grantValue = Number(data?.grant?.grantValue || 0) || 0;
        if (grantType === "eligible_credit") {
          setRedeemMsg(copyText("unlockCreditsApplied", "Unlock credits applied: +{value}", { value: grantValue }));
        } else if (isUnlimitedSub((data?.sub || null) as AnyObj | null)) {
          setRedeemMsg(copyText("unlimitedAccess", "Unlimited access"));
        } else if (data?.sub?.active && data?.sub?.paidUntil) {
          setRedeemMsg(copyText("paidAccessUpdatedUntil", "Paid access updated until {date}", { date: fmtDate(String(data.sub.paidUntil)) }));
        } else {
          setRedeemMsg(copyText("codeRedeemed", "Code redeemed"));
        }
      }
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }
      await loadSnapshot();
      requestSiteExtensionSync();
    } catch (e: any) {
      setRedeemErr(String(e?.message || "redeem_failed"));
    } finally {
      setRedeemBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="card">
        <div className="h1" style={{ fontSize: 18 }}>{copy("navAccess", "Access")}</div>
        <div className="hint" style={{ marginTop: 8 }}>
          {copy("accessConnectFirst", "Connect first to load your plan, unlocks, and access code status.")}
        </div>
      </div>
    );
  }

  return (
    <div className="stackSection">
      <div className="grid">
        <div className="card">
          <div className="sectionTitle">{copy("accountSnapshot", "Account snapshot")}</div>
          <div className="sectionSub">{copy("accountSnapshotSub", "One backend snapshot keeps the site and extension on the same rules.")}</div>

          <div className="accessStatGrid" style={{ marginTop: 12 }}>
            <div className="miniStat"><span>{copy("plan", "Plan")}</span><strong>{planText}</strong></div>
            <div className="miniStat"><span>{copy("status", "Status")}</span><strong>{currentSub?.active ? copy("active", "Active") : copy("free", "Free")}</strong></div>
            <div className="miniStat"><span>{copy("saveCap", "Save cap")}</span><strong>{String(currentLimits?.saveCapFree ?? "—")}</strong></div>
            <div className="miniStat"><span>{copy("bgSlots", "BG slots")}</span><strong>{unlocks?.unlimitedBg ? "∞" : String(unlocks?.bgSlots ?? 3)}</strong></div>
          </div>

          <div className="k" style={{ marginTop: 10 }}><div className="kv">{copy("subscription", "Subscription")}</div><div className="mono pageValue">{subscriptionText}</div></div>
          <div className="k"><div className="kv">{copy("resetAt", "Reset at")}</div><div className="mono pageValue">{fmtDate(String(snapshot?.resetAt || usage?.resetAt || ""))}</div></div>
          <div className="k"><div className="kv">{copy("gmUsage", "GM usage")}</div><div className="mono">{currentUsage.gm ? `${currentUsage.gm.used}/${currentUsage.gm.limit}` : "—"}</div></div>
          <div className="k"><div className="kv">{copy("gnUsage", "GN usage")}</div><div className="mono">{currentUsage.gn ? `${currentUsage.gn.used}/${currentUsage.gn.limit}` : "—"}</div></div>
          <div className="k"><div className="kv">{copy("snapshotSource", "Snapshot source")}</div><div className="mono">{loadBusy ? `${copy("refresh", "Refresh")}…` : snapshot ? copy("backendSnapshotSource", "Backend /api/access/entitlements") : copy("fallbackSnapshotSource", "Fallback from /api/usage + /api/me")}</div></div>
          <div className="k"><div className="kv">{copy("lastSync", "Last sync")}</div><div className="mono">{fmtDate(String(snapshot?.refreshedAt || ""))}</div></div>
          {loadErr ? <div className="err">{loadErr}</div> : null}
        </div>

        <div className="card">
          <div className="sectionTitle">{copy("activeLimits", "Active limits")}</div>
          <div className="sectionSub">{copy("activeLimitsSub", "This shows what the current account can use right now from one source.")}</div>

          <div className="k" style={{ marginTop: 12 }}><div className="kv">{copy("studioDailyLimit", "Studio daily limit")}</div><div className="mono">{String(currentTools?.studio?.limit ?? "—")}</div></div>
          <div className="k"><div className="kv">{copy("bulkCallsPerDay", "Bulk calls per day")}</div><div className="mono">{currentTools?.bulk ? `${currentTools.bulk.callsUsed}/${currentTools.bulk.callsLimit}` : "—"}</div></div>
          <div className="k"><div className="kv">{copy("bulkMaxPerCall", "Bulk max per call")}</div><div className="mono">{String(currentTools?.bulk?.maxPerCall ?? "—")}</div></div>
          <div className="k"><div className="kv">{copy("historyLimit", "History limit")}</div><div className="mono">{currentTools?.history ? `${currentTools.history.limit} · ${currentTools.history.searchEnabled ? copy("searchOn", "search on") : copy("searchOff", "search off")}` : "—"}</div></div>
          <div className="k"><div className="kv">{copy("favoritesLimit", "Favorites limit")}</div><div className="mono">{String(currentTools?.favorites?.limit ?? "—")}</div></div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="sectionTitle">{copy("redeemCode", "Redeem code")}</div>
          <div className="sectionSub">{copy("redeemCodeSub", "Paste a code here to apply paid access or unlock credits to this handle now.")}</div>

          <div className="row" style={{ marginTop: 12 }}>
            <input
              className="input redeemInput"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder={copy("enterAccessCode", "Enter access code")}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              disabled={redeemBusy || refreshBusy || loadBusy}
            />
            <button className="btn" onClick={() => void redeemAccessCode()} disabled={!redeemCode.trim() || redeemBusy || refreshBusy || loadBusy}>{copy("redeem", "Redeem")}</button>
          </div>

          {redeemMsg ? <div className="hint" style={{ marginTop: 10 }}>{redeemMsg}</div> : null}
          {redeemErr ? <div className="err">{redeemErr}</div> : null}
        </div>

        <div className="card">
          <div className="sectionTitle">{copy("activeUnlocks", "Active unlocks")}</div>
          <div className="sectionSub">{copy("activeUnlocksSub", "These are the referral and code-based perks active on this account right now.")}</div>

          <div className="flagList" style={{ marginTop: 12 }}>
            <div className="flagRow"><span className={`flagBadge ${unlocks?.proTrial7dUnlocked ? "ok" : "warn"}`}>{unlockFlag(unlocks?.proTrial7dUnlocked)}</span><span>{copy("trial7dUnlock", "7-day Pro trial unlock")}</span></div>
            <div className="flagRow"><span className={`flagBadge ${unlocks?.discount50Unlocked ? "ok" : "warn"}`}>{unlockFlag(unlocks?.discount50Unlocked)}</span><span>{copy("discount50Unlock", "50% discount unlock")}</span></div>
            <div className="flagRow"><span className={`flagBadge ${unlocks?.toolkitUnlocked ? "ok" : "warn"}`}>{unlockFlag(unlocks?.toolkitUnlocked)}</span><span>{copy("toolkitUnlock", "Referral toolkit unlock")}</span></div>
            <div className="flagRow"><span className={`flagBadge ${unlocks?.unlimitedBg ? "ok" : "warn"}`}>{unlocks?.unlimitedBg ? copy("unlimited", "Unlimited") : `${unlocks?.bgSlots ?? 3} ${copy("backgroundSlots", "Background slots").toLowerCase()}`}</span><span>{copy("backgroundSlots", "Background slots")}</span></div>
            <div className="flagRow"><span className="flagBadge neutral">{String(extension?.unlocks?.nextUnlockAt ?? unlocks?.nextUnlockAt ?? "—")}</span><span>{copy("nextUnlockTarget", "Next unlock target")}</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="sectionTitle">{copy("extensionSnapshot", "Extension snapshot")}</div>
        <div className="sectionSub">{copy("extensionSnapshotSub", "The extension now reads the same backend-owned rules, so plan checks and cosmetic gates stay aligned.")}</div>

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="miniStat"><span>{copy("dailyInsertMode", "Daily generation cap")}</span><strong>{extension?.insertMode === "unlimited" || isUnlimitedSub(currentSub) || currentSub?.active ? copy("unlimitedPerKind", "Unlimited") : ((Number(extension?.dailyLimitPerKind ?? currentUsage.gm?.limit ?? 0) || 0) > 0 ? copyText("perKindPerDay", "{value} per kind / day", { value: Number(extension?.dailyLimitPerKind ?? currentUsage.gm?.limit ?? 0) || 0 }) : "—")}</strong></div>
          <div className="miniStat"><span>{copy("cosmeticsPacks", "Cosmetics packs")}</span><strong>{isUnlimitedSub(currentSub) || currentSub?.active ? copy("allViaPaidPlan", "All via paid plan") : (extension?.backgrounds?.cosmeticsAllPacks || unlocks?.cosmeticsAllPacks ? copy("allReferralPacks", "All referral packs") : (extension?.backgrounds?.cosmeticsOnePack || unlocks?.cosmeticsOnePack ? copy("oneReferralPack", "1 referral pack") : copy("freeOnlySet", "Free-only set")))}</strong></div>
        </div>

        <div className="k" style={{ marginTop: 10 }}><div className="kv">{copy("planGate", "Plan gate")}</div><div className="mono">{extensionPlanText}</div></div>
        <div className="k"><div className="kv">{copy("backgroundAccess", "Background access")}</div><div className="mono">{extension?.backgrounds?.unlimited ? copy("unlimitedBackgrounds", "Unlimited backgrounds") : `${extension?.backgrounds?.slots ?? unlocks?.bgSlots ?? 3} ${copy("backgroundSlots", "Background slots").toLowerCase()}`}</div></div>
        <div className="k"><div className="kv">{copy("saveCapMirror", "Save cap")}</div><div className="mono">{String(extension?.saveCap ?? currentLimits?.saveCapFree ?? "—")}</div></div>
        <div className="k"><div className="kv">{copy("referralBoosts", "Referral-driven boosts")}</div><div className="mono">{`${unlockFlag(extension?.backgrounds?.cosmeticsOnePack ?? unlocks?.cosmeticsOnePack)} · ${unlockFlag(extension?.backgrounds?.cosmeticsAllPacks ?? unlocks?.cosmeticsAllPacks)}`}</div></div>
        <div className="hint" style={{ marginTop: 10 }}>
          {copy("accessLockHint", "If something is locked in the extension, this screen should explain why before the user hits the wall.")}
        </div>
      </div>
    </div>
  );
}
