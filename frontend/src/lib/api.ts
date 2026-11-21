const BASE = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "")
).replace(/\/$/, "");
const TOKEN_KEY = "fati_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function messageFrom(data: unknown, fallback: string): string {
  const d = (data as { detail?: unknown })?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg).replace(/^Value error, /, "");
  return fallback;
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  if (!BASE) {
    throw new ApiError(0, "API URL is not configured. Set VITE_API_URL in the frontend deployment environment.");
  }
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth) { const t = getToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method: opts.method || "GET", headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && opts.auth) { setToken(null); window.dispatchEvent(new Event("fati-logout")); }
    throw new ApiError(res.status, messageFrom(data, `Request failed (${res.status})`));
  }
  return data as T;
}

export const admin = {
  get: <T,>(p: string) => api<T>(`/api/admin${p}`, { auth: true }),
  post: <T,>(p: string, body?: unknown) => api<T>(`/api/admin${p}`, { method: "POST", body: body ?? {}, auth: true }),
  put: <T,>(p: string, body: unknown) => api<T>(`/api/admin${p}`, { method: "PUT", body, auth: true }),
  patch: <T,>(p: string, body: unknown) => api<T>(`/api/admin${p}`, { method: "PATCH", body, auth: true }),
  del: <T,>(p: string) => api<T>(`/api/admin${p}`, { method: "DELETE", auth: true }),
};
