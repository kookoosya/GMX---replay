export const LS_HANDLE = "gmx_handle";
export const LS_TOKEN = "gmx_token";

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

export function normalizeHandle(input: string): string {
  let t = String(input || "").trim();
  // Strip X/Twitter profile URLs
  t = t.replace(/^https?:\/\/(www\.)?x\.com\//i, "");
  t = t.replace(/^https?:\/\/(www\.)?twitter\.com\//i, "");
  t = t.replace(/^@+/, "");
  t = t.replace(/[^A-Za-z0-9_]/g, "");
  t = t.slice(0, 15);
  return t ? `@${t}` : "";
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
}

export function clearAuth() {
  try { localStorage.removeItem(LS_HANDLE); } catch {}
  try { localStorage.removeItem(LS_TOKEN); } catch {}
}

export async function apiJson<T = any>(
  path: string,
  opts: { method?: string; body?: any; token?: string; timeoutMs?: number } = {}
): Promise<{ ok: boolean; status: number; data: T | null; errorText?: string }> {
  const method = opts.method || (opts.body ? "POST" : "GET");
  const token = String(opts.token || getStoredToken() || "").trim();
  const timeoutMs = Math.max(3000, Math.min(60000, Number(opts.timeoutMs || 20000)));

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(path, {
      method,
      headers,
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      credentials: "include"
    });
    const status = r.status;
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const isJson = ct.includes("application/json");
    const data = (isJson ? await r.json().catch(() => null) : null) as T | null;
    return { ok: r.ok, status, data, errorText: !r.ok ? (data as any)?.error || (data as any)?.error_code : undefined };
  } catch (e: any) {
    return { ok: false, status: 0, data: null, errorText: e?.message || "network_error" };
  } finally {
    window.clearTimeout(timer);
  }
}
