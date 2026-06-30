export const LS_HANDLE = "gmx_handle";
export const LS_TOKEN = "gmx_token";
export const SS_ADMIN_TOKEN = "gmx_admin_token";

export type Json = Record<string, unknown>;

export function getStoredHandle(): string {
  try {
    return String(localStorage.getItem(LS_HANDLE) || "").trim();
  } catch {
    return "";
  }
}

export function getStoredToken(): string {
  try {
    return String(localStorage.getItem(LS_TOKEN) || "").trim();
  } catch {
    return "";
  }
}

export function getStoredAdminToken(): string {
  try {
    return String(sessionStorage.getItem(SS_ADMIN_TOKEN) || "").trim();
  } catch {
    return "";
  }
}

export function setStoredAdminToken(token: string) {
  const value = String(token || "").trim();
  try {
    if (value) sessionStorage.setItem(SS_ADMIN_TOKEN, value);
    else sessionStorage.removeItem(SS_ADMIN_TOKEN);
  } catch {
    // ignore
  }
}

export function normalizeHandle(input: string): string {
  let t = String(input || "").trim();
  t = t.replace(/^https?:\/\/(www\.)?x\.com\//i, "");
  t = t.replace(/^https?:\/\/(www\.)?twitter\.com\//i, "");
  t = t.replace(/^@+/, "");
  t = t.replace(/[^A-Za-z0-9_]/g, "");
  t = t.slice(0, 15);
  return t ? `@${t}` : "";
}

export function requestSiteExtensionSync() {
  try {
    if (typeof window === "undefined" || typeof window.postMessage !== "function") return;
    window.postMessage({ type: "GMX_SYNC_NOW", source: "bridge" }, window.location.origin || "*");
  } catch {
    try {
      window.postMessage({ type: "GMX_SYNC_NOW", source: "bridge" }, "*");
    } catch {
      // ignore
    }
  }
}

export function setAuth(handle: string, token: string) {
  const h = normalizeHandle(handle);
  const tok = String(token || "").trim();
  if (!h || !tok) return;
  try {
    localStorage.setItem(LS_HANDLE, h);
    localStorage.setItem(LS_TOKEN, tok);
  } catch {
    // ignore
  }
  requestSiteExtensionSync();
}

export function clearAuth() {
  try { localStorage.removeItem(LS_HANDLE); } catch {}
  try { localStorage.removeItem(LS_TOKEN); } catch {}
  try { localStorage.setItem("gmx_ext_force_logout", String(Date.now())); } catch {}
  try { localStorage.setItem("gmx_ext_force_logout_v2", String(Date.now())); } catch {}
  setStoredAdminToken("");
  requestSiteExtensionSync();
}

const AUTH_COOKIE_MUTATION_LOCK = "gmx-auth-cookie-mutation";
let authCookieMutationTail: Promise<unknown> = Promise.resolve();

function isAuthCookieMutationPath(path: string): boolean {
  const p = String(path || "").split("?")[0];
  return p === "/api/user/init" || p === "/api/user/logout";
}

function enqueueAuthCookieMutationFallback<T>(operation: () => Promise<T>): Promise<T> {
  const run = authCookieMutationTail.then(operation, operation);
  authCookieMutationTail = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function runAuthCookieMutation<T>(operation: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (locks && typeof locks.request === "function") {
    return locks.request(AUTH_COOKIE_MUTATION_LOCK, { mode: "exclusive" }, operation);
  }
  return enqueueAuthCookieMutationFallback(operation);
}

async function performApiJsonFetch<T>(
  path: string,
  opts: { method?: string; body?: any; token?: string; adminToken?: string; timeoutMs?: number }
): Promise<{ ok: boolean; status: number; data: T | null; errorText?: string }> {
  const method = opts.method || (opts.body ? "POST" : "GET");
  const token = String(opts.token || getStoredToken() || "").trim();
  const adminToken = String(opts.adminToken || getStoredAdminToken() || "").trim();
  const timeoutMs = Math.max(3000, Math.min(60000, Number(opts.timeoutMs || 20000)));

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (adminToken) headers["X-Admin-Token"] = adminToken;

    const r = await fetch(path, {
      method,
      headers,
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      credentials: "include",
    });

    const status = r.status;
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const isJson = ct.includes("application/json");
    const data = (isJson ? await r.json().catch(() => null) : null) as T | null;
    const text = !isJson ? await r.text().catch(() => "") : "";
    const plainError = !r.ok && text ? String(text).trim().slice(0, 180) : "";
    return {
      ok: r.ok,
      status,
      data,
      errorText: !r.ok ? (data as any)?.error || (data as any)?.error_code || (data as any)?.hint || plainError || undefined : undefined,
    };
  } catch (e: any) {
    return { ok: false, status: 0, data: null, errorText: e?.message || "network_error" };
  } finally {
    window.clearTimeout(timer);
  }
}

export async function apiJson<T = any>(
  path: string,
  opts: { method?: string; body?: any; token?: string; adminToken?: string; timeoutMs?: number } = {}
): Promise<{ ok: boolean; status: number; data: T | null; errorText?: string }> {
  if (isAuthCookieMutationPath(path)) {
    return runAuthCookieMutation(() => performApiJsonFetch<T>(path, opts));
  }
  return performApiJsonFetch<T>(path, opts);
}

export async function copyText(text: string): Promise<boolean> {
  const value = String(text || "");
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "true");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return !!ok;
    } catch {
      return false;
    }
  }
}
