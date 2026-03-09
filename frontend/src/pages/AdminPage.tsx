import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson, copyText, getStoredAdminToken, normalizeHandle, setStoredAdminToken } from "../api";
import { useBridgeCopy } from "../bridgeI18n";

type AdminCodeRow = {
  code: string;
  note?: string | null;
  tier?: string;
  days?: number;
  grant_type?: string;
  grant_value?: number;
  created_at?: string;
};




type RedemptionRow = {
  code: string;
  handle?: string;
  created_at?: string;
  tier?: string;
  days?: number;
  note?: string | null;
  grant_type?: string | null;
  grant_value?: number;
};

type LeaderboardRow = {
  rank: number;
  handle: string;
  confirmed: number;
  active: number;
  eligible: number;
};

type LeaderboardAwardRow = {
  period_days?: number;
  cycle_key?: string;
  place?: number;
  handle?: string;
  award_days?: number;
  code?: string;
  created_at?: string;
};

type ManualGrantRow = {
  id?: number;
  handle?: string;
  grant_type?: string | null;
  grant_value?: number;
  note?: string | null;
  admin_handle?: string | null;
  created_at?: string;
};

type AdminCodePresets = {
  eligibleCredits: number[];
  paidDays: number[];
  batchSizes: number[];
  notes: string[];
};

const DEFAULT_PRESETS: AdminCodePresets = {
  eligibleCredits: [1, 3, 5, 7, 15, 30],
  paidDays: [90, 180, 365],
  batchSizes: [1, 5, 10, 25],
  notes: ["promo", "giveaway", "partner", "lb_7d", "lb_30d"],
};

function safeNum(value: unknown): number {
  return Math.max(0, Number(value || 0) || 0);
}

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}


function codeLabel(row: AdminCodeRow): string {
  if (row.grant_type === "eligible_credit") {
    return `Unlock +${row.grant_value || 0}`;
  }
  if ((row.days || 0) === 90) return "Pro 3 months";
  if ((row.days || 0) === 180) return "Pro 6 months";
  if ((row.days || 0) === 365) return "Pro 1 year";
  if ((row.days || 0) === 0) return "Unlimited";
  return `${row.days || 0} days`;
}

function redemptionLabel(row: RedemptionRow): string {
  if (row.grant_type === "eligible_credit") {
    return `Unlock +${row.grant_value || 0}`;
  }
  if (row.tier === "paid") {
    if ((row.days || 0) === 90) return "Pro 3 months";
    if ((row.days || 0) === 180) return "Pro 6 months";
    if ((row.days || 0) === 365) return "Pro 1 year";
    if ((row.days || 0) === 0) return "Unlimited";
    return `${row.days || 0} days`;
  }
  if (row.tier === "unlimited") return "Unlimited";
  return row.tier || "—";
}

function manualGrantLabel(row: ManualGrantRow): string {
  if (row.grant_type === "eligible_credit") {
    return `Unlock +${row.grant_value || 0}`;
  }
  if ((row.grant_value || 0) === 0) return "Unlimited";
  if ((row.grant_value || 0) === 90) return "Pro 3 months";
  if ((row.grant_value || 0) === 180) return "Pro 6 months";
  if ((row.grant_value || 0) === 365) return "Pro 1 year";
  return `${row.grant_value || 0} days`;
}

function suggestedAwardDays(windowDays: number, place: number): number {
  const p = Math.max(1, Math.min(3, Number(place) || 1));
  if (Number(windowDays) >= 30) return p === 1 ? 30 : (p === 2 ? 7 : 3);
  return p === 1 ? 7 : 3;
}

function normQuery(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function matchesQuery(parts: Array<string | number | null | undefined>, query: string): boolean {
  if (!query) return true;
  return parts.some((part) => String(part || "").toLowerCase().includes(query));
}

function normalizeAdminCodePresets(input: any): AdminCodePresets {
  const eligibleCredits = Array.isArray(input?.eligibleCredits)
    ? input.eligibleCredits.map((value: unknown) => Math.max(1, Math.floor(Number(value) || 0))).filter((value: number) => Number.isFinite(value) && value > 0)
    : [];
  const paidDays = Array.isArray(input?.paidDays)
    ? input.paidDays.map((value: unknown) => Math.max(0, Math.floor(Number(value) || 0))).filter((value: number) => Number.isFinite(value) && value >= 0)
    : [];
  const batchSizes = Array.isArray(input?.batchSizes)
    ? input.batchSizes.map((value: unknown) => Math.max(1, Math.floor(Number(value) || 0))).filter((value: number) => Number.isFinite(value) && value > 0)
    : [];
  const notes = Array.isArray(input?.notes)
    ? input.notes.map((value: unknown) => String(value || "").trim()).filter(Boolean)
    : [];

  const unique = (values: number[]) => Array.from(new Set(values));

  return {
    eligibleCredits: unique(eligibleCredits).length ? unique(eligibleCredits) : DEFAULT_PRESETS.eligibleCredits,
    paidDays: unique(paidDays).length ? unique(paidDays) : DEFAULT_PRESETS.paidDays,
    batchSizes: unique(batchSizes).length ? unique(batchSizes) : DEFAULT_PRESETS.batchSizes,
    notes: Array.from(new Set(notes)).length ? Array.from(new Set(notes)) : DEFAULT_PRESETS.notes,
  };
}

export function AdminPage({ token, handle, isAdmin }: { token: string; handle: string; isAdmin: boolean }) {
  const { copy } = useBridgeCopy();
  const [password, setPassword] = useState("");
  const [adminToken, setAdminTokenState] = useState(() => getStoredAdminToken());
  const [note, setNote] = useState("promo");
  const [count, setCount] = useState(5);
  const [grantMode, setGrantMode] = useState<"eligible_credit" | "subscription">("eligible_credit");
  const [grantValue, setGrantValue] = useState(3);
  const [paidDays, setPaidDays] = useState(90);
  const [leaderboardDays, setLeaderboardDays] = useState<7 | 30>(7);
  const [leaderboardCycleKey, setLeaderboardCycleKey] = useState(() => `manual_${new Date().toISOString().slice(0, 10)}`);
  const [directGrantHandle, setDirectGrantHandle] = useState("");
  const [directGrantNote, setDirectGrantNote] = useState("manual");
  const [directGrantMode, setDirectGrantMode] = useState<"eligible_credit" | "subscription">("subscription");
  const [directGrantValue, setDirectGrantValue] = useState(3);
  const [directGrantDays, setDirectGrantDays] = useState(30);

  const [rows, setRows] = useState<AdminCodeRow[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [leaderboardTop, setLeaderboardTop] = useState<LeaderboardRow[]>([]);
  const [leaderboardAwards, setLeaderboardAwards] = useState<LeaderboardAwardRow[]>([]);
  const [manualGrants, setManualGrants] = useState<ManualGrantRow[]>([]);
  const [presets, setPresets] = useState<AdminCodePresets>(DEFAULT_PRESETS);

  const [codeFilter, setCodeFilter] = useState("");
  const [redemptionFilter, setRedemptionFilter] = useState("");
  const [redemptionKind, setRedemptionKind] = useState<"all" | "eligible_credit" | "subscription">("all");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [generatedCount, setGeneratedCount] = useState(0);

  const canUseAdmin = !!token && !!isAdmin;
  const signedIn = useMemo(() => !!adminToken && canUseAdmin, [adminToken, canUseAdmin]);
  const codeQuery = useMemo(() => normQuery(codeFilter), [codeFilter]);
  const redemptionQuery = useMemo(() => normQuery(redemptionFilter), [redemptionFilter]);
  const normalizedGrantHandle = useMemo(() => normalizeHandle(directGrantHandle), [directGrantHandle]);

  const fillTemplate = useCallback((template: string, vars: Record<string, string | number>) => {
    let out = String(template || "");
    Object.entries(vars).forEach(([key, value]) => {
      out = out.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    });
    return out;
  }, []);

  const copyTextLabel = useCallback((key: string, fallback: string, vars?: Record<string, string | number>) => {
    const base = copy(key, fallback);
    return vars ? fillTemplate(base, vars) : base;
  }, [copy, fillTemplate]);

  const formatGrantDays = useCallback((days: number) => {
    const value = Number(days || 0) || 0;
    if (value === 0) return copy("unlimited", "Unlimited");
    if (value === 90) return copy("pro3Months", "Pro 3 months");
    if (value === 180) return copy("pro6Months", "Pro 6 months");
    if (value === 365) return copy("pro1Year", "Pro 1 year");
    return copyTextLabel("daysCount", "{count} days", { count: value });
  }, [copy, copyTextLabel]);

  const formatCodeGrant = useCallback((row: AdminCodeRow) => {
    if (row.grant_type === "eligible_credit") return `${copy("unlockCredits", "Unlock credits")} +${row.grant_value || 0}`;
    return formatGrantDays(row.days || 0);
  }, [copy, formatGrantDays]);

  const formatRedemptionGrant = useCallback((row: RedemptionRow) => {
    if (row.grant_type === "eligible_credit") return `${copy("unlockCredits", "Unlock credits")} +${row.grant_value || 0}`;
    if (row.tier === "paid") return formatGrantDays(row.days || 0);
    if (row.tier === "unlimited") return copy("unlimited", "Unlimited");
    return row.tier || "—";
  }, [copy, formatGrantDays]);

  const formatManualGrant = useCallback((row: ManualGrantRow) => {
    if (row.grant_type === "eligible_credit") return `${copy("unlockCredits", "Unlock credits")} +${row.grant_value || 0}`;
    return formatGrantDays(row.grant_value || 0);
  }, [copy, formatGrantDays]);

  const visibleRows = useMemo(
    () => rows.filter((row) => matchesQuery([row.code, row.note, codeLabel(row), row.created_at], codeQuery)),
    [rows, codeQuery]
  );

  useEffect(() => {
    if (!canUseAdmin && adminToken) {
      setStoredAdminToken("");
      setAdminTokenState("");
    }
  }, [adminToken, canUseAdmin]);

  const visibleRedemptions = useMemo(
    () =>
      redemptions.filter((row) => {
        if (redemptionKind === "eligible_credit" && row.grant_type !== "eligible_credit") return false;
        if (redemptionKind === "subscription" && row.grant_type === "eligible_credit") return false;
        return matchesQuery([row.handle, row.code, row.note, row.tier, row.grant_type, row.created_at], redemptionQuery);
      }),
    [redemptions, redemptionKind, redemptionQuery]
  );

  const resetAdminSession = useCallback((nextMessage?: string) => {
    setStoredAdminToken("");
    setAdminTokenState("");
    setRows([]);
    setRedemptions([]);
    setLeaderboardTop([]);
    setLeaderboardAwards([]);
    setManualGrants([]);
    setPresets(DEFAULT_PRESETS);
    setCodeFilter("");
    setRedemptionFilter("");
    setRedemptionKind("all");
    setOut("");
    setGeneratedCount(0);
    setCopied("");
    if (nextMessage) setMsg(nextMessage);
  }, []);

  const handleAdminAuthFailure = useCallback((status: number) => {
    if (status !== 401 && status !== 403) return false;
    setErr("");
    resetAdminSession(copy("adminSessionExpired", "Admin session expired. Sign in again"));
    return true;
  }, [copy, resetAdminSession]);

  const directGrantDayOptions = useMemo(() => {
    const merged = [7, 30, ...presets.paidDays, 0];
    const out = Array.from(new Set(merged.filter((value) => Number.isFinite(value) && value >= 0)));
    return out;
  }, [presets.paidDays]);

  function flashCopy(text: string) {
    setCopied(text);
    window.setTimeout(() => setCopied(""), 1800);
  }

  async function adminLogin() {
    if (!token || !isAdmin) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await apiJson<{ adminToken?: string }>("/api/admin/login", {
        method: "POST",
        token,
        body: { password },
      });
      if (!r.ok || !r.data?.adminToken) throw new Error(r.errorText || "admin_login_failed");
      const nextToken = String(r.data.adminToken);
      setStoredAdminToken(nextToken);
      setAdminTokenState(nextToken);
      setMsg(copy("adminSessionReady", "Admin session ready"));
      setPassword("");
      await loadWorkspace(nextToken);
    } catch (e: any) {
      setErr(String(e?.message || "admin_login_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function adminLogout() {
    if (!signedIn) return;
    setBusy(true);
    try {
      await apiJson("/api/admin/logout", { method: "POST", token, adminToken });
    } catch {
      // ignore
    } finally {
      resetAdminSession(copy("adminSessionLocked", "Admin session locked"));
      setBusy(false);
    }
  }

  async function loadCodes(forcedAdminToken?: string) {
    if (!token || !isAdmin || !(forcedAdminToken || adminToken)) return;
    const r = await apiJson<{ rows?: AdminCodeRow[]; presets?: Partial<AdminCodePresets> }>("/api/admin/codes?limit=200", {
      token,
      adminToken: forcedAdminToken || adminToken,
    });
    if (!r.ok) {
      if (handleAdminAuthFailure(r.status)) return;
      throw new Error(r.errorText || "admin_codes_failed");
    }
    setRows(Array.isArray(r.data?.rows) ? r.data.rows : []);
    setPresets(normalizeAdminCodePresets(r.data?.presets));
  }


  async function reloadCodes() {
    setErr("");
    try {
      await loadCodes();
    } catch (e: any) {
      setErr(String(e?.message || "admin_codes_failed"));
    }
  }

  async function awardLeaderboardWinner(row: LeaderboardRow) {
    if (!token || !adminToken || !isAdmin || !row?.handle) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const awardDays = suggestedAwardDays(leaderboardDays, row.rank);
      const r = await apiJson<{ code?: string }>("/api/admin/leaderboard/award", {
        method: "POST",
        token,
        adminToken,
        body: {
          days: leaderboardDays,
          place: row.rank,
          handle: row.handle,
          cycleKey: leaderboardCycleKey,
          awardDays,
        },
      });
      if (!r.ok) {
        if (handleAdminAuthFailure(r.status)) return;
        throw new Error(r.errorText || "admin_leaderboard_award_failed");
      }
      setMsg(copyTextLabel("awardedWinner", "Awarded {handle} for {days}d leaderboard ({award} days)", { handle: row.handle, days: leaderboardDays, award: awardDays }));
      await loadWorkspace();
    } catch (e: any) {
      setErr(String(e?.message || "admin_leaderboard_award_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function applyDirectGrant() {
    if (!token || !adminToken || !isAdmin || !normalizedGrantHandle) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const body = directGrantMode === "eligible_credit"
        ? { handle: normalizedGrantHandle, note: directGrantNote, grantType: "eligible_credit", grantValue: directGrantValue }
        : { handle: normalizedGrantHandle, note: directGrantNote, grantType: "subscription", days: directGrantDays };
      const r = await apiJson<{ handle?: string; grantType?: string; grantValue?: number }>("/api/admin/grant", {
        method: "POST",
        token,
        adminToken,
        body,
      });
      if (!r.ok) {
        if (handleAdminAuthFailure(r.status)) return;
        throw new Error(r.errorText || "admin_grant_failed");
      }
      const grantText = directGrantMode === "eligible_credit"
        ? `${copy("unlockCredits", "Unlock credits")} +${directGrantValue}`
        : formatGrantDays(directGrantDays);
      setMsg(copyTextLabel("grantedTo", "Granted {handle} → {grant}", { handle: normalizedGrantHandle, grant: grantText }));
      await loadWorkspace();
    } catch (e: any) {
      setErr(String(e?.message || "admin_grant_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function loadWorkspace(forcedAdminToken?: string) {
    if (!token || !isAdmin || !(forcedAdminToken || adminToken)) return;
    setBusy(true);
    setErr("");
    try {
      const adminAuth = forcedAdminToken || adminToken;
      const [codesRes, redemptionsRes, leaderboardRes, awardsRes, grantsRes] = await Promise.all([
        apiJson<{ rows?: AdminCodeRow[]; presets?: Partial<AdminCodePresets> }>("/api/admin/codes?limit=200", { token, adminToken: adminAuth }),
        apiJson<{ rows?: RedemptionRow[] }>("/api/admin/redemptions?limit=200", { token, adminToken: adminAuth }),
        apiJson<{ top?: LeaderboardRow[] }>(`/api/admin/leaderboard/referrals?days=${leaderboardDays}`, { token, adminToken: adminAuth }),
        apiJson<{ rows?: LeaderboardAwardRow[] }>(`/api/admin/leaderboard/awards?days=${leaderboardDays}&limit=50`, { token, adminToken: adminAuth }),
        apiJson<{ rows?: ManualGrantRow[] }>("/api/admin/grants?limit=50", { token, adminToken: adminAuth }),
      ]);

      const authFailed = [codesRes, redemptionsRes, leaderboardRes, awardsRes, grantsRes].some((res) => res.status === 401 || res.status === 403);
      if (authFailed) {
        handleAdminAuthFailure(401);
        return;
      }
      if (!codesRes.ok) throw new Error(codesRes.errorText || "admin_codes_failed");
      if (!redemptionsRes.ok) throw new Error(redemptionsRes.errorText || "admin_redemptions_failed");
      if (!leaderboardRes.ok) throw new Error(leaderboardRes.errorText || "admin_leaderboard_failed");
      if (!awardsRes.ok) throw new Error(awardsRes.errorText || "admin_leaderboard_awards_failed");
      if (!grantsRes.ok) throw new Error(grantsRes.errorText || "admin_grants_failed");

      setRows(Array.isArray(codesRes.data?.rows) ? codesRes.data.rows : []);
      setPresets(normalizeAdminCodePresets(codesRes.data?.presets));
      setRedemptions(Array.isArray(redemptionsRes.data?.rows) ? redemptionsRes.data.rows : []);
      setLeaderboardTop(Array.isArray(leaderboardRes.data?.top) ? leaderboardRes.data.top : []);
      setLeaderboardAwards(Array.isArray(awardsRes.data?.rows) ? awardsRes.data.rows : []);
      setManualGrants(Array.isArray(grantsRes.data?.rows) ? grantsRes.data.rows : []);
    } catch (e: any) {
      setErr(String(e?.message || "admin_load_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function createCodes() {
    if (!token || !adminToken || !isAdmin) return;
    setBusy(true);
    setErr("");
    setMsg("");
    setOut("");
    try {
      const body = grantMode === "eligible_credit"
        ? { n: count, note, grantType: "eligible_credit", grantValue }
        : { n: count, note, grantType: "subscription", days: paidDays };
      const r = await apiJson<{ codes?: string[] }>("/api/admin/codes", {
        method: "POST",
        token,
        adminToken,
        body,
      });
      if (!r.ok) {
        if (handleAdminAuthFailure(r.status)) return;
        throw new Error(r.errorText || "admin_create_failed");
      }
      const codes = Array.isArray(r.data?.codes) ? r.data.codes : [];
      setGeneratedCount(codes.length);
      setOut(codes.join("\n"));
      setMsg(copyTextLabel("generatedCodes", "Generated {count} code(s)", { count: codes.length }));
      await loadWorkspace();
    } catch (e: any) {
      setErr(String(e?.message || "admin_create_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function copyGenerated() {
    const ok = await copyText(out);
    flashCopy(ok ? copy("generatedOutputCopied", "Generated output copied") : copy("copyFailed", "Copy failed"));
  }

  async function copySingleCode(code: string) {
    const ok = await copyText(code);
    flashCopy(ok ? copyTextLabel("copiedCode", "Copied {code}", { code }) : copy("copyFailed", "Copy failed"));
  }

  async function copyVisibleCodes() {
    const payload = visibleRows.map((row) => row.code).join("\n");
    if (!payload) return;
    const ok = await copyText(payload);
    flashCopy(ok ? copyTextLabel("copiedVisibleCodes", "Copied {count} visible code(s)", { count: visibleRows.length }) : copy("copyFailed", "Copy failed"));
  }

  useEffect(() => {
    if (signedIn && token) {
      void loadWorkspace();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, token, leaderboardDays]);

  if (!token) {
    return (
      <div className="card">
        <div className="h1" style={{ fontSize: 18 }}>{copy("navAdmin", "Admin")}</div>
        <div className="hint" style={{ marginTop: 8 }}>{copy("adminConnectFirst", "Connect first to unlock admin actions")}</div>
      </div>
    );
  }

  return (
    <div className="stackSection">
      <div className="card adminHeroCard">
        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <div className="h1" style={{ fontSize: 20 }}>{copy("navAdmin", "Admin")}</div>
          </div>
          <div className="spacer" />
          <button className="btn" onClick={() => void loadWorkspace()} disabled={busy || !signedIn}>{copy("refresh", "Refresh")}</button>
        </div>

        <div className="row">
          <div className="pill"><span>{copy("signedInAs", "Signed in as")}</span><span className="mono">{handle || "—"}</span></div>
          <div className={`pill tone-${isAdmin ? "ok" : "bad"}`}>{isAdmin ? copy("adminHandle", "Admin handle") : copy("notAdminHandle", "Not admin handle")}</div>
          <div className={`pill tone-${signedIn ? "ok" : "warn"}`}>{signedIn ? copy("adminSessionActive", "Admin session active") : copy("adminSessionLocked", "Admin session locked")}</div>
        </div>

        {!isAdmin ? (
          <div className="err">{copy("adminNeedAdminHandle", "This handle is not the configured admin handle. Admin actions stay locked.")}</div>
        ) : null}

        <div className="row" style={{ marginTop: 12 }}>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={copy("adminPassword", "Admin password")}
          />
          <button className="btn" onClick={() => void adminLogin()} disabled={busy || !password || !isAdmin}>{copy("signIn", "Sign in")}</button>
          <button className="btn" onClick={() => void adminLogout()} disabled={busy || !signedIn}>{copy("signOut", "Sign out")}</button>
        </div>

        {msg ? <div className="hint" style={{ marginTop: 10 }}>{msg}</div> : null}
        {copied ? <div className="hint" style={{ marginTop: 6 }}>{copied}</div> : null}
        {err ? <div className="err">{err}</div> : null}
      </div>

      {signedIn ? (
        <>

          <div className="grid adminWorkGrid">
            <div className="card">
              <div className="sectionTitle">{copy("createCodes", "Create codes")}</div>

              <div className="row" style={{ marginTop: 12, marginBottom: 12 }}>
                <button className={`btn ${grantMode === "eligible_credit" ? "btnActive" : ""}`} onClick={() => setGrantMode("eligible_credit")}>{copy("unlockCredits", "Unlock credits")}</button>
                <button className={`btn ${grantMode === "subscription" ? "btnActive" : ""}`} onClick={() => setGrantMode("subscription")}>{copy("paidAccess", "Paid access")}</button>
              </div>

              <div className="k"><div className="kv">{copy("howMany", "How many")}</div><div><input className="input tinyInput" type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value || 1) || 1)))} /></div></div>
              <div className="k"><div className="kv">{copy("note", "Note")}</div><div><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div></div>
              <div className="k">
                <div className="kv">{copy("quickBatch", "Quick batch")}</div>
                <div className="row">{presets.batchSizes.map((n) => (
                  <button key={n} className={`btn ${count === n ? "btnActive" : ""}`} onClick={() => setCount(n)}>{n}</button>
                ))}</div>
              </div>
              <div className="k">
                <div className="kv">{copy("notePreset", "Note preset")}</div>
                <div className="row">{presets.notes.map((item) => (
                  <button key={item} className={`btn ${note === item ? "btnActive" : ""}`} onClick={() => setNote(item)}>{item}</button>
                ))}</div>
              </div>

              {grantMode === "eligible_credit" ? (
                <div className="k">
                  <div className="kv">{copy("creditSize", "Credit size")}</div>
                  <div className="row">{presets.eligibleCredits.map((n) => (
                    <button key={n} className={`btn ${grantValue === n ? "btnActive" : ""}`} onClick={() => setGrantValue(n)}>{n}</button>
                  ))}</div>
                </div>
              ) : (
                <div className="k">
                  <div className="kv">{copy("duration", "Duration")}</div>
                  <div className="row">{presets.paidDays.map((value) => {
                    const label = value === 90
                      ? copy("pro3Months", "Pro 3 months")
                      : value === 180
                        ? copy("pro6Months", "Pro 6 months")
                        : value === 365
                          ? copy("pro1Year", "Pro 1 year")
                          : copyTextLabel("daysCount", "{count} days", { count: value });
                    return (
                      <button key={value} className={`btn ${paidDays === value ? "btnActive" : ""}`} onClick={() => setPaidDays(value)}>{label}</button>
                    );
                  })}</div>
                </div>
              )}

              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn" onClick={() => void createCodes()} disabled={busy || !isAdmin}>{copy("generate", "Generate")}</button>
                <button className="btn" onClick={() => void reloadCodes()} disabled={busy || !signedIn}>{copy("reloadCodes", "Reload codes")}</button>
                <button className="btn" onClick={() => void copyGenerated()} disabled={!out}>{copy("copyGenerated", "Copy generated")}</button>
              </div>

              <textarea className="codeBox" readOnly value={out} placeholder={copy("newCodesAppearHere", "New codes appear here")} />
            </div>

            <div className="card">
              <div className="row" style={{ marginBottom: 6 }}>
                <div>
                  <div className="sectionTitle">{copy("recentCodes", "Recent codes")}</div>
                </div>
                <div className="spacer" />
              </div>

              <div className="toolbarRow" style={{ marginTop: 12 }}>
                <input
                  className="input filterInput"
                  value={codeFilter}
                  onChange={(e) => setCodeFilter(e.target.value)}
                  placeholder={copy("filterByCodeNoteGrant", "Filter by code, note, or grant")}
                />
                <button className="btn" onClick={() => void copyVisibleCodes()} disabled={!visibleRows.length}>{copy("copyVisible", "Copy visible")}</button>
                <button className="btn" onClick={() => setCodeFilter("")} disabled={!codeFilter}>{copy("clear", "Clear")}</button>
              </div>

              <div className="tableWrap" style={{ marginTop: 12 }}>
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>{copy("code", "Code")}</th>
                      <th>{copy("grant", "Grant")}</th>
                      <th>{copy("note", "Note")}</th>
                      <th>{copy("created", "Created")}</th>
                      <th>{copy("action", "Action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.length ? visibleRows.map((row) => (
                      <tr key={row.code}>
                        <td className="mono">{row.code}</td>
                        <td>{formatCodeGrant(row)}</td>
                        <td>{row.note || "—"}</td>
                        <td>{fmtDate(row.created_at)}</td>
                        <td className="tableActions"><button className="btn miniBtn" onClick={() => void copySingleCode(row.code)}>{copy("copy", "Copy")}</button></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="hint">{copy("noCodesMatch", "No codes match the current filter")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid adminStatsGrid">
            <div className="card">
              <div className="sectionTitle">{copy("directGrant", "Direct grant")}</div>

              <div className="k" style={{ marginTop: 12 }}><div className="kv">{copy("handle", "Handle")}</div><div><input className="input" value={directGrantHandle} onChange={(e) => setDirectGrantHandle(e.target.value)} placeholder={copy("directGrantPlaceholder", "@handle or x.com/name")} /></div></div>
              <div className="k"><div className="kv">{copy("note", "Note")}</div><div><input className="input" value={directGrantNote} onChange={(e) => setDirectGrantNote(e.target.value)} /></div></div>

              <div className="row" style={{ marginTop: 12, marginBottom: 12 }}>
                <button className={`btn ${directGrantMode === "subscription" ? "btnActive" : ""}`} onClick={() => setDirectGrantMode("subscription")}>{copy("paidAccess", "Paid access")}</button>
                <button className={`btn ${directGrantMode === "eligible_credit" ? "btnActive" : ""}`} onClick={() => setDirectGrantMode("eligible_credit")}>{copy("unlockCredits", "Unlock credits")}</button>
              </div>

              {directGrantMode === "eligible_credit" ? (
                <div className="k">
                  <div className="kv">{copy("creditSize", "Credit size")}</div>
                  <div className="row">{presets.eligibleCredits.map((n) => (
                    <button key={n} className={`btn ${directGrantValue === n ? "btnActive" : ""}`} onClick={() => setDirectGrantValue(n)}>{n}</button>
                  ))}</div>
                </div>
              ) : (
                <div className="k">
                  <div className="kv">{copy("duration", "Duration")}</div>
                  <div className="row">{directGrantDayOptions.map((value) => {
                    const label = value === 0
                      ? copy("unlimited", "Unlimited")
                      : value === 90
                        ? copy("pro3Months", "Pro 3 months")
                        : value === 180
                          ? copy("pro6Months", "Pro 6 months")
                          : value === 365
                            ? copy("pro1Year", "Pro 1 year")
                            : copyTextLabel("daysCount", "{count} days", { count: value });
                    return (
                      <button key={`${value}-${label}`} className={`btn ${directGrantDays === value ? "btnActive" : ""}`} onClick={() => setDirectGrantDays(value)}>{label}</button>
                    );
                  })}</div>
                </div>
              )}

              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn" onClick={() => void applyDirectGrant()} disabled={busy || !isAdmin || !normalizedGrantHandle}>{copy("applyNow", "Apply now")}</button>
                <button className="btn" onClick={() => setDirectGrantHandle("")} disabled={!directGrantHandle}>{copy("clear", "Clear")}</button>
              </div>
            </div>

            <div className="card">
              <div className="row" style={{ marginBottom: 6 }}>
                <div>
                  <div className="sectionTitle">{copy("recentDirectGrants", "Recent direct grants")}</div>
                </div>
                <div className="spacer" />
              </div>

              <div className="tableWrap" style={{ marginTop: 12 }}>
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>{copy("handle", "Handle")}</th>
                      <th>{copy("grant", "Grant")}</th>
                      <th>{copy("note", "Note")}</th>
                      <th>{copy("by", "By")}</th>
                      <th>{copy("created", "Created")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualGrants.length ? manualGrants.slice(0, 8).map((row) => (
                      <tr key={row.id || `${row.handle || "grant"}-${row.created_at || "now"}`}>
                        <td>{row.handle || "—"}</td>
                        <td>{formatManualGrant(row)}</td>
                        <td>{row.note || "—"}</td>
                        <td>{row.admin_handle || "—"}</td>
                        <td>{fmtDate(row.created_at)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="hint">{copy("noManualGrants", "No manual grants yet")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid adminStatsGrid">
            <div className="card">
              <div className="row" style={{ marginBottom: 6 }}>
                <div>
                  <div className="sectionTitle">{copy("leaderboardRewards", "Leaderboard rewards")}</div>
                </div>
                <div className="spacer" />
                <div className="row">
                  {[7, 30].map((days) => (
                    <button
                      key={days}
                      className={`btn ${leaderboardDays === days ? "btnActive" : ""}`}
                      onClick={() => setLeaderboardDays(days as 7 | 30)}
                      disabled={busy}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="toolbarRow" style={{ marginTop: 12 }}>
                <input
                  className="input filterInput"
                  value={leaderboardCycleKey}
                  onChange={(e) => setLeaderboardCycleKey(e.target.value)}
                  placeholder={copy("cycleKey", "Cycle key")}
                />
                <button
                  className="btn"
                  onClick={() => setLeaderboardCycleKey(`manual_${new Date().toISOString().slice(0, 10)}`)}
                  disabled={busy}
                >
                  {copy("todayKey", "Today key")}
                </button>
              </div>

              <div className="tableWrap" style={{ marginTop: 12 }}>
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>{copy("place", "Place")}</th>
                      <th>{copy("handle", "Handle")}</th>
                      <th>{copy("active", "Active")}</th>
                      <th>{copy("confirmed", "Confirmed")}</th>
                      <th>{copy("prize", "Prize")}</th>
                      <th>{copy("action", "Action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardTop.length ? leaderboardTop.slice(0, 3).map((row) => (
                      <tr key={`${leaderboardDays}-${row.rank}-${row.handle}`}>
                        <td>#{row.rank}</td>
                        <td>{row.handle}</td>
                        <td>{safeNum(row.active)}</td>
                        <td>{safeNum(row.confirmed)}</td>
                        <td>{copyTextLabel("daysCount", "{count} days", { count: suggestedAwardDays(leaderboardDays, row.rank) })}</td>
                        <td className="tableActions">
                          <button
                            className="btn miniBtn"
                            onClick={() => void awardLeaderboardWinner(row)}
                            disabled={busy || !leaderboardCycleKey.trim()}
                          >
                            {copy("awardNow", "Award now")}
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="hint">{copy("noActiveWinners", "No active winners in the current leaderboard window")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="row" style={{ marginBottom: 6 }}>
                <div>
                  <div className="sectionTitle">{copy("rewardHistory", "Reward history")}</div>
                </div>
                <div className="spacer" />
              </div>

              <div className="tableWrap" style={{ marginTop: 12 }}>
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>{copy("period", "Period")}</th>
                      <th>{copy("cycle", "Cycle")}</th>
                      <th>{copy("place", "Place")}</th>
                      <th>{copy("handle", "Handle")}</th>
                      <th>{copy("prize", "Prize")}</th>
                      <th>{copy("code", "Code")}</th>
                      <th>{copy("created", "Created")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardAwards.length ? leaderboardAwards.slice(0, 8).map((row, idx) => (
                      <tr key={`${row.code || row.cycle_key || "award"}-${idx}`}>
                        <td>{safeNum(row.period_days)}d</td>
                        <td>{row.cycle_key || "—"}</td>
                        <td>#{safeNum(row.place)}</td>
                        <td>{row.handle || "—"}</td>
                        <td>{copyTextLabel("daysCount", "{count} days", { count: safeNum(row.award_days) })}</td>
                        <td className="mono">{row.code || "—"}</td>
                        <td>{fmtDate(row.created_at)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="hint">{copy("noAwardHistory", "No award history for this leaderboard window yet")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid adminStatsGrid">
            <div className="card">
              <div className="row" style={{ marginBottom: 6 }}>
                <div>
                  <div className="sectionTitle">{copy("redemptions", "Redemptions")}</div>
                </div>
                <div className="spacer" />
              </div>

              <div className="toolbarRow" style={{ marginTop: 12 }}>
                <input
                  className="input filterInput"
                  value={redemptionFilter}
                  onChange={(e) => setRedemptionFilter(e.target.value)}
                  placeholder={copy("filterByHandleCodeNote", "Filter by handle, code, or note")}
                />
                <button className="btn" onClick={() => setRedemptionFilter("")} disabled={!redemptionFilter}>{copy("clear", "Clear")}</button>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                {[
                  { key: "all", label: copy("all", "All") },
                  { key: "eligible_credit", label: copy("unlock", "Unlock") },
                  { key: "subscription", label: copy("paid", "Paid") },
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`btn ${redemptionKind === item.key ? "btnActive" : ""}`}
                    onClick={() => setRedemptionKind(item.key as "all" | "eligible_credit" | "subscription")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="tableWrap" style={{ marginTop: 12 }}>
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>{copy("handle", "Handle")}</th>
                      <th>{copy("code", "Code")}</th>
                      <th>{copy("grant", "Grant")}</th>
                      <th>{copy("note", "Note")}</th>
                      <th>{copy("redeemed", "Redeemed")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRedemptions.length ? visibleRedemptions.map((row, idx) => (
                      <tr key={`${row.code}-${row.created_at || idx}`}>
                        <td>{row.handle || "—"}</td>
                        <td className="mono">{row.code}</td>
                        <td>{formatRedemptionGrant(row)}</td>
                        <td>{row.note || "—"}</td>
                        <td>{fmtDate(row.created_at)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="hint">{copy("noRedemptionsMatch", "No redemptions match the current filter")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
