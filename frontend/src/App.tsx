import React, { useEffect, useMemo, useState } from "react";
import { apiJson, clearAuth, getStoredHandle, getStoredToken, normalizeHandle, setAuth } from "./api";

type AnyObj = Record<string, any>;

function maskToken(t: string){
  if (!t) return "";
  if (t.length <= 10) return "••••";
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

export default function App(){
  const [handle, setHandleState] = useState<string>(() => getStoredHandle());
  const [token, setTokenState] = useState<string>(() => getStoredToken());

  const [connectInput, setConnectInput] = useState<string>(handle || "");
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");

  const [health, setHealth] = useState<AnyObj | null>(null);
  const [version, setVersion] = useState<AnyObj | null>(null);
  const [usage, setUsage] = useState<AnyObj | null>(null);
  const [ref, setRef] = useState<AnyObj | null>(null);

  const authenticated = useMemo(()=> !!token, [token]);

  async function refreshAll(){
    setErr("");
    const t = getStoredToken();
    setHandleState(getStoredHandle());
    setTokenState(t);

    const h = await apiJson("/api/health", { token: t });
    if (h.ok) setHealth(h.data as AnyObj);

    const v = await apiJson("/api/version", { token: t });
    if (v.ok) setVersion(v.data as AnyObj);

    const u = await apiJson("/api/usage", { token: t });
    if (u.ok) setUsage(u.data as AnyObj);

    // referral stats are protected
    if (t){
      const s = await apiJson("/api/referral/stats", { token: t });
      if (s.ok) setRef(s.data as AnyObj);
      else setRef(s.data as AnyObj);
    } else {
      setRef(null);
    }
  }

  async function connect(){
    setBusy(true);
    setErr("");
    try{
      const h = normalizeHandle(connectInput);
      if (!h) throw new Error("enter_valid_handle");

      // Keep ref param compatible with legacy /app?ref=...
      const params = new URLSearchParams(window.location.search);
      const refCode = String(params.get("ref") || "").trim();

      const r = await apiJson("/api/user/init", {
        method: "POST",
        body: { handle: h, ref: refCode || undefined },
        timeoutMs: 20000
      });

      if (!r.ok || !r.data || !(r.data as AnyObj).token){
        const code = (r.data as AnyObj)?.error_code || (r.data as AnyObj)?.error || r.errorText || "init_failed";
        throw new Error(String(code));
      }

      const tok = String((r.data as AnyObj).token || "");
      const hh = String((r.data as AnyObj).handle || h);
      setAuth(hh, tok);
      setHandleState(hh);
      setTokenState(tok);
      setConnectInput(hh);
      await refreshAll();
    }catch(e:any){
      setErr(String(e?.message || "connect_failed"));
    }finally{
      setBusy(false);
    }
  }

  function disconnect(){
    clearAuth();
    setHandleState("");
    setTokenState("");
    setRef(null);
    setUsage(null);
    setErr("");
    // keep health/version
  }

  useEffect(()=>{
    refreshAll();

    // If legacy /app updates localStorage, we refresh automatically.
    const onStorage = (ev: StorageEvent)=>{
      if (!ev.key) return;
      if (ev.key === "gmx_token" || ev.key === "gmx_handle"){
        refreshAll();
      }
    };
    window.addEventListener("storage", onStorage);
    return ()=> window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const usageAuth = Boolean(usage?.authenticated);
  const refOk = Boolean(ref?.ok);
  const refUnauthorized = String(ref?.error || "") === "unauthorized";

  return (
    <div className="wrap">
      <div className="top">
        <div>
          <div className="h1">GMXReply · React Bridge</div>
          <div className="sub">
            Same backend API, stable dev, and auth that matches legacy /app (gmx_handle + gmx_token).
          </div>
        </div>

        <div className="row">
          <button className="btn" onClick={refreshAll} disabled={busy}>Refresh</button>
          <a className="btn" href="/app" target="_blank" rel="noreferrer">Open /app</a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="row" style={{marginBottom: 10}}>
            <div className="pill">
              <span className={`dot ${authenticated ? "ok" : "bad"}`} />
              <span>Token</span>
              <span className="mono">{authenticated ? maskToken(token) : "not set"}</span>
            </div>

            <div className="pill">
              <span className={`dot ${usageAuth ? "ok" : "warn"}`} />
              <span>Usage</span>
              <span className="mono">{usageAuth ? "authenticated" : "guest"}</span>
            </div>

            <div className="spacer" />

            {authenticated ? (
              <button className="btn" onClick={disconnect} disabled={busy}>Disconnect</button>
            ) : null}
          </div>

          <div className="row" style={{gap: 8}}>
            <input
              className="input"
              value={connectInput}
              onChange={(e)=>setConnectInput(e.target.value)}
              placeholder="@handle"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button className="btn" onClick={connect} disabled={busy}>Connect</button>
          </div>

          <div className="hint" style={{marginTop: 10}}>
            Tip: opening <span className="mono">/app</span> from this page uses the same origin (5173) via Vite proxy, so legacy and React share the same localStorage.
          </div>

          {err ? <div className="err"><span className="mono">{err}</span></div> : null}
        </div>

        <div className="card">
          <div className="row" style={{marginBottom: 6}}>
            <div className="pill"><span className="dot ok" /><span>Backend</span></div>
            <div className="pill"><span>Port</span><span className="mono">10000</span></div>
            <div className="pill"><span>Frontend</span><span className="mono">5173</span></div>
          </div>

          <div className="k">
            <div className="kv">/api/health</div>
            <div className="mono">{health ? JSON.stringify(health) : "…"}</div>
          </div>
          <div className="k">
            <div className="kv">/api/version</div>
            <div className="mono">{version ? JSON.stringify(version) : "…"}</div>
          </div>
        </div>

        <div className="card">
          <div className="row" style={{marginBottom: 8}}>
            <div className="pill"><span className={`dot ${usageAuth ? "ok" : "warn"}`} /><span>Usage</span></div>
            {usage?.resetAt ? <div className="pill"><span>Reset</span><span className="mono">{String(usage.resetAt)}</span></div> : null}
          </div>
          <div className="k"><div className="kv">GM used</div><div className="mono">{usage?.gm ? `${usage.gm.used}/${usage.gm.limit}` : "…"}</div></div>
          <div className="k"><div className="kv">GN used</div><div className="mono">{usage?.gn ? `${usage.gn.used}/${usage.gn.limit}` : "…"}</div></div>
          <div className="k"><div className="kv">Tier</div><div className="mono">{usage?.sub?.active ? "pro" : "free"}</div></div>
        </div>

        <div className="card">
          <div className="row" style={{marginBottom: 8}}>
            <div className="pill"><span className={`dot ${refOk ? "ok" : refUnauthorized ? "bad" : "warn"}`} /><span>Referrals</span></div>
            {!token ? <div className="pill"><span className="mono">connect to load</span></div> : null}
          </div>

          {!token ? (
            <div className="hint">Connect first. Referral stats are protected by the same token as legacy /app.</div>
          ) : refUnauthorized ? (
            <div className="err">Unauthorized. Reconnect (Connect button) or open <span className="mono">/app</span> and reconnect there.</div>
          ) : (
            <div className="mono" style={{whiteSpace:"pre-wrap"}}>
              {ref ? JSON.stringify(ref, null, 2) : "…"}
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop: 18}} className="hint">
        If you see an error like <span className="mono">contents.XXXX.js: Failed to load translation … Cannot find module 'hEyG3'</span>, it is almost always from a third-party browser extension (chrome-extension://...). This repo does not ship any <span className="mono">contents.*.js</span> file.
      </div>
    </div>
  );
}
