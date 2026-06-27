import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiJson, clearAuth, getStoredHandle, getStoredToken, normalizeHandle, setAuth } from "./api";
import { TopNav } from "./components/TopNav";
import { AccessPage } from "./pages/AccessPage";
import { ReferralsPage } from "./pages/ReferralsPage";
import { AdminPage } from "./pages/AdminPage";
import { useBridgeCopy } from "./bridgeI18n";

type AnyObj = Record<string, any>;
type BridgeRoute = "/" | "/access" | "/referrals" | "/admin";

function maskToken(t: string) {
  if (!t) return "";
  if (t.length <= 10) return "••••";
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

function getBridgeRoute(pathname: string): BridgeRoute {
  const raw = String(pathname || "/");
  const stripped = raw.replace(/^\/bridge(?=\/|$)/, "") || "/";
  const normalized = stripped === "" ? "/" : stripped;
  if (normalized === "/access" || normalized === "/referrals" || normalized === "/admin") return normalized;
  return "/";
}

function routeHref(route: BridgeRoute): string {
  return route === "/" ? "/bridge" : `/bridge${route}`;
}

function getHandleSeedFromLocation(): string {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search || "");
    return normalizeHandle(String(params.get("handle") || ""));
  } catch {
    return "";
  }
}

function preferredConnectSeed(storedHandle: string): string {
  const normalized = normalizeHandle(storedHandle);
  if (normalized) return normalized;
  return getHandleSeedFromLocation();
}

function clearHandleSeedFromLocation() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("handle")) return;
    url.searchParams.delete("handle");
    const nextQuery = url.searchParams.toString();
    const next = `${url.pathname}${nextQuery ? `?${nextQuery}` : ""}${url.hash || ""}`;
    window.history.replaceState({}, "", next);
  } catch {
    // ignore
  }
}

function isUnlimitedSub(sub: AnyObj | null | undefined): boolean {
  return !!(sub?.isUnlimited || sub?.tier === "unlimited");
}

function planLabel(usage: AnyObj | null): string {
  if (isUnlimitedSub((usage?.sub || null) as AnyObj | null)) return "Unlimited";
  if (usage?.sub?.active) return "Paid";
  return "Free";
}

function connectErrorText(raw: string, copy: (key: string, fallback?: string) => string): string {
  const code = String(raw || "").trim();
  if (!code) return "Connect failed";
  if (code === "enter_valid_handle") return copy("invalidHandle", "Enter a valid handle");
  if (code === "init_failed") return "Connect failed";
  if (code === "connect_failed") return "Connect failed";
  return code;
}

export default function App() {
  const authGenerationRef = useRef(0);

  function beginAuthGeneration(): number {
    authGenerationRef.current += 1;
    return authGenerationRef.current;
  }

  function currentAuthGeneration(): number {
    return authGenerationRef.current;
  }

  function isAuthGenerationCurrent(generation: number): boolean {
    return generation === authGenerationRef.current;
  }

  const [handle, setHandleState] = useState<string>(() => getStoredHandle());
  const [token, setTokenState] = useState<string>(() => getStoredToken());
  const [connectInput, setConnectInput] = useState<string>(() => preferredConnectSeed(getStoredHandle()));
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");
  const [route, setRoute] = useState<BridgeRoute>(() => getBridgeRoute(window.location.pathname));
  const [refreshKey, setRefreshKey] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  const [usage, setUsage] = useState<AnyObj | null>(null);
  const [identity, setIdentity] = useState<AnyObj | null>(null);
  const [me, setMe] = useState<AnyObj | null>(null);

  const authenticated = useMemo(() => Boolean(token && usage?.authenticated), [token, usage]);
  const isAdmin = authenticated && !!identity?.isAdmin;
  const usageAuth = Boolean(usage?.authenticated);
  const unlocks = usage?.limits?.referralUnlocks || null;
  const activeToken = authenticated ? token : "";
  const activeHandle = authenticated ? handle : "";
  const { copy } = useBridgeCopy();

  const currentPlanText = useMemo(() => {
    if (isUnlimitedSub((usage?.sub || null) as AnyObj | null)) return copy("unlimited", "Unlimited");
    if (usage?.sub?.active) return copy("paid", "Paid");
    return copy("free", "Free");
  }, [copy, usage]);

  const syncRouteFromLocation = useCallback(() => {
    setRoute(getBridgeRoute(window.location.pathname));
  }, []);

  const navigateTo = useCallback((nextRoute: string) => {
    const safeRoute = (nextRoute === "/access" || nextRoute === "/referrals" || nextRoute === "/admin") ? nextRoute as BridgeRoute : "/";
    const target = routeHref(safeRoute);
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target);
    }
    setRoute(safeRoute);
  }, []);

  async function refreshAll(generation: number = currentAuthGeneration()) {
    setBusy(true);
    setErr("");
    try {
      const storedHandle = getStoredHandle();
      const storedToken = getStoredToken();
      if (!isAuthGenerationCurrent(generation)) return;
      setHandleState(storedHandle);
      setTokenState(storedToken);

      const u = await apiJson("/api/usage", { token: storedToken });
      if (!isAuthGenerationCurrent(generation)) return;

      if (u.ok) {
        const nextUsage = (u.data as AnyObj) || null;
        const serverAuthed = Boolean(nextUsage?.authenticated);
        if (!isAuthGenerationCurrent(generation)) return;
        setUsage(nextUsage);
        setAuthChecked(true);

        if (!serverAuthed) {
          if (storedToken || storedHandle) {
            clearAuth();
          }
          if (!isAuthGenerationCurrent(generation)) return;
          setTokenState("");
          setHandleState("");
          setIdentity(null);
          setMe(null);
          setConnectInput(preferredConnectSeed(storedHandle));
          setRefreshKey((x) => x + 1);
          return;
        }
      } else if (u.status === 401 || u.status === 403) {
        if (!isAuthGenerationCurrent(generation)) return;
        clearAuth();
        setUsage({ authenticated: false });
        setAuthChecked(true);
        setTokenState("");
        setHandleState("");
        setIdentity(null);
        setMe(null);
        setConnectInput(preferredConnectSeed(storedHandle));
        setRefreshKey((x) => x + 1);
        return;
      }

      if (storedHandle && storedToken && u.ok && (u.data as AnyObj)?.authenticated) {
        const [initRes, meRes] = await Promise.all([
          apiJson("/api/user/init", {
            method: "POST",
            token: storedToken,
            body: { handle: storedHandle },
          }),
          apiJson("/api/me", { token: storedToken }),
        ]);
        if (!isAuthGenerationCurrent(generation)) return;

        if (initRes.ok) {
          setIdentity(initRes.data as AnyObj);
        } else if (initRes.status === 401 || initRes.status === 403) {
          if (!isAuthGenerationCurrent(generation)) return;
          clearAuth();
          setUsage({ authenticated: false });
          setTokenState("");
          setHandleState("");
          setIdentity(null);
          setMe(null);
          setConnectInput(preferredConnectSeed(storedHandle));
          return;
        } else {
          setIdentity(null);
        }

        if (meRes.ok) {
          setMe(meRes.data as AnyObj);
        } else if (meRes.status === 401 || meRes.status === 403) {
          setMe(null);
        }
      } else {
        if (!isAuthGenerationCurrent(generation)) return;
        setIdentity(null);
        setMe(null);
      }

      if (!isAuthGenerationCurrent(generation)) return;
      setAuthChecked(true);
      setRefreshKey((x) => x + 1);
    } finally {
      if (isAuthGenerationCurrent(generation)) {
        setBusy(false);
      }
    }
  }

  function handleRefresh() {
    void refreshAll(currentAuthGeneration());
  }

  async function connect() {
    setBusy(true);
    setErr("");
    let generation = currentAuthGeneration();
    try {
      const h = normalizeHandle(connectInput);
      if (!h) throw new Error("enter_valid_handle");

      generation = beginAuthGeneration();

      const params = new URLSearchParams(window.location.search);
      const refCode = String(params.get("ref") || "").trim();

      const r = await apiJson("/api/user/init", {
        method: "POST",
        body: { handle: h, ref: refCode || undefined },
        timeoutMs: 20000,
      });
      if (!isAuthGenerationCurrent(generation)) return;

      if (!r.ok || !r.data || !(r.data as AnyObj).token) {
        const code = (r.data as AnyObj)?.error_code || (r.data as AnyObj)?.error || r.errorText || "init_failed";
        throw new Error(String(code));
      }

      if (!isAuthGenerationCurrent(generation)) return;
      const tok = String((r.data as AnyObj).token || "");
      const hh = String((r.data as AnyObj).handle || h);
      setAuth(hh, tok);
      setHandleState(hh);
      setTokenState(tok);
      setConnectInput(hh);
      setIdentity(r.data as AnyObj);
      clearHandleSeedFromLocation();
      await refreshAll(generation);
    } catch (e: any) {
      if (!isAuthGenerationCurrent(generation)) return;
      setErr(connectErrorText(String(e?.message || "connect_failed"), copy));
    } finally {
      if (isAuthGenerationCurrent(generation)) {
        setBusy(false);
      }
    }
  }

  async function disconnect() {
    beginAuthGeneration();
    clearAuth();
    setHandleState("");
    setTokenState("");
    setUsage({ authenticated: false });
    setIdentity(null);
    setMe(null);
    setErr("");
    setAuthChecked(true);
    setBusy(false);
    clearHandleSeedFromLocation();
    if (window.location.pathname !== "/bridge") {
      window.history.pushState({}, "", "/bridge");
    }
    setRoute("/");
    try {
      await apiJson("/api/user/logout", { method: "POST", timeoutMs: 3000 });
    } catch {
      // best-effort cookie cleanup
    }
  }

  useEffect(() => {
    void refreshAll(currentAuthGeneration());
    const onStorage = (ev: StorageEvent) => {
      if (!ev.key) return;
      if (ev.key === "gmx_token" || ev.key === "gmx_handle") {
        const generation = beginAuthGeneration();
        void refreshAll(generation);
      }
    };
    const onPopState = () => syncRouteFromLocation();
    window.addEventListener("storage", onStorage);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("popstate", onPopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (route !== "/admin") return;
    if (isAdmin) return;
    navigateTo(authenticated ? "/access" : "/");
  }, [authChecked, authenticated, isAdmin, navigateTo, route]);

  return (
    <div className="wrap">
      <div className="top">
        <div>
          <div className="h1">{copy("accountCenterTitle", "GMXReply · Account Center")}</div>
          <div className="sub">{copy("accountCenterSub", "Use this area for access, referrals, and admin. Use /app for GM, GN, themes, wallpapers, and the main reply workspace.")}</div>
        </div>

        <div className="row">
          <button className="btn" onClick={handleRefresh} disabled={busy}>{copy("refresh", "Refresh")}</button>
          <a className="btn" href="/app" target="_blank" rel="noreferrer">{copy("openFullSite", "Open full site")}</a>
          <a className="btn" href="/arcade.html" target="_blank" rel="noreferrer">Open Arcade</a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <div className="pill"><span className={`dot ${authenticated ? "ok" : "bad"}`} /><span>{copy("connection", "Connection")}</span><span className="mono">{authenticated ? maskToken(token) : (authChecked ? copy("notConnected", "not connected") : copy("checking", "checking…"))}</span></div>
          <div className="pill"><span className={`dot ${usageAuth ? "ok" : "warn"}`} /><span>{copy("usage", "Usage")}</span><span className="mono">{authChecked ? (usageAuth ? copy("authenticated", "authenticated") : copy("guest", "guest")) : copy("checking", "checking…")}</span></div>
          <div className={`pill tone-${isAdmin ? "ok" : "warn"}`}>{isAdmin ? copy("adminHandle", "Admin handle") : copy("userHandle", "User handle")}</div>
          <div className="pill"><span>{copy("plan", "Plan")}</span><span className="mono">{currentPlanText}</span></div>
          <div className="spacer" />
          {token ? <button className="btn" onClick={() => void disconnect()} disabled={busy}>{copy("disconnect", "Disconnect")}</button> : null}
        </div>

        <div className="row">
          <input
            className="input"
            value={connectInput}
            onChange={(e) => setConnectInput(e.target.value)}
            placeholder={copy("handlePlaceholder", "@handle")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button className="btn" onClick={() => void connect()} disabled={busy}>{copy("connect", "Connect")}</button>
        </div>

        {err ? <div className="err">{err}</div> : null}
      </div>

      <div className="grid" style={{ marginBottom: 12 }}>
        <div className="card">
          <div className="h1" style={{ fontSize: 18, marginBottom: 8 }}>{copy("accountSnapshot", "Account snapshot")}</div>
          <div className="sectionSub">{copy("accountSnapshotSub", "One backend snapshot keeps the site and extension on the same rules.")}</div>
          <div className="k" style={{ marginTop: 12 }}><div className="kv">{copy("signedInAs", "Signed in as")}</div><div className="mono">{activeHandle || "—"}</div></div>
          <div className="k"><div className="kv">{copy("connection", "Connection")}</div><div className="mono">{authenticated ? maskToken(activeToken) : (authChecked ? copy("notConnected", "not connected") : copy("checking", "checking…"))}</div></div>
          <div className="k"><div className="kv">{copy("usage", "Usage")}</div><div className="mono">{authChecked ? (usageAuth ? copy("authenticated", "authenticated") : copy("guest", "guest")) : copy("checking", "checking…")}</div></div>
          <div className="k"><div className="kv">{copy("plan", "Plan")}</div><div className="mono">{currentPlanText}</div></div>
        </div>

        <div className="card">
          <div className="h1" style={{ fontSize: 18, marginBottom: 8 }}>{copy("currentLimits", "Current limits")}</div>
          <div className="k"><div className="kv">{copy("gmUsedShort", "GM used")}</div><div className="mono">{usage?.gm ? `${usage.gm.used}/${usage.gm.limit}` : "…"}</div></div>
          <div className="k"><div className="kv">{copy("gnUsedShort", "GN used")}</div><div className="mono">{usage?.gn ? `${usage.gn.used}/${usage.gn.limit}` : "…"}</div></div>
          <div className="k"><div className="kv">{copy("freeSaveCap", "Free save cap")}</div><div className="mono">{usage?.limits?.saveCapFree ?? "…"}</div></div>
          <div className="k"><div className="kv">{copy("bgSlots", "BG slots")}</div><div className="mono">{unlocks?.unlimitedBg ? copy("unlimited", "Unlimited") : (unlocks?.bgSlots ?? 3)}</div></div>
        </div>
      </div>

      <TopNav currentRoute={route} isAdmin={isAdmin} onNavigate={navigateTo} />

      <div style={{ marginTop: 12 }}>
        {route === "/" && (
          <div className="grid">
            <div className="card">
              <div className="h1" style={{ fontSize: 18 }}>{copy("whatIsHereNow", "What is here now")}</div>
              <div className="hint" style={{ marginTop: 8 }}>
                {copy("whatIsHereNowHint", "This is the clean account center: check your plan, see what is unlocked, and jump to the next useful screen fast.")}
              </div>
              <div className="ladderList" style={{ marginTop: 14 }}>
                <div className="ladderItem"><span className="dot ok" /><span>{copy("overviewAppWorkspace", "Use /app for GM, GN, themes, wallpapers, and the main reply workspace")}</span></div>
                <div className="ladderItem"><span className="dot ok" /><span>{copy("overviewAccess", "Use Access to check your plan, redeem a code, and confirm what the extension can use right now")}</span></div>
                <div className="ladderItem"><span className="dot ok" /><span>{copy("overviewReferrals", "Use Referrals to track what counts and what unlock comes next")}</span></div>
                <div className="ladderItem"><span className="dot ok" /><span>Open Arcade for the approved games hub</span></div>
                <div className="ladderItem"><span className="dot ok" /><span>{copy("overviewAdmin", "Use Admin only for operational work: codes, grants, rewards, and checks")}</span></div>
              </div>
            </div>

            <div className="card">
              <div className="sectionTitle">{copy("startHere", "Start here")}</div>
              <div className="sectionSub">{copy("startHereSub", "See what you have now, what is unlocked, and what to do next")}</div>
              <div className="ladderList" style={{ marginTop: 14 }}>
                <div className="ladderItem"><span className="dot ok" /><span>{copy("startStep1", "1. Connect your @handle once so the app can link usage and upgrades to the right account")}</span></div>
                <div className="ladderItem"><span className="dot ok" /><span>{copy("startStep2", "2. Open Access to see your plan, limits, unlocks, and code redemption in one place")}</span></div>
                <div className="ladderItem"><span className="dot ok" /><span>{copy("startStep3", "3. Open Referrals if you want more unlocks on Free or want to track reward progress")}</span></div>
                <div className="ladderItem"><span className="dot ok" /><span>4. Open Arcade for the approved game shelf</span></div>
                <div className="ladderItem"><span className="dot ok" /><span>5. Open /app for GM, GN, themes, wallpapers, and the main reply workspace</span></div>
              </div>
            </div>
          </div>
        )}

        {route === "/access" && (
          <AccessPage
            token={activeToken}
            usage={usage}
            me={me}
            refreshKey={refreshKey}
            refreshBusy={busy}
            onRefresh={handleRefresh}
          />
        )}

        {route === "/referrals" && <ReferralsPage token={activeToken} refreshKey={refreshKey} />}
        {route === "/admin" && <AdminPage token={activeToken} handle={activeHandle} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}
