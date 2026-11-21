import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "@/lib/api";

interface Ctx { email: string | null; checking: boolean; login: (e: string, p: string) => Promise<void>; logout: () => void }
const AuthCtx = createContext<Ctx>({ email: null, checking: true, login: async () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api<{ email: string }>("/api/auth/me", { auth: true })
      .then((r) => setEmail(r.email))
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    const onLogout = () => setEmail(null);
    window.addEventListener("fati-logout", onLogout);
    return () => window.removeEventListener("fati-logout", onLogout);
  }, []);

  const login = async (e: string, p: string) => {
    const r = await api<{ token: string; email: string }>("/api/auth/login", { method: "POST", body: { email: e, password: p } });
    setToken(r.token); setEmail(r.email);
  };
  const logout = () => { setToken(null); setEmail(null); };
  return <AuthCtx.Provider value={{ email, checking, login, logout }}>{children}</AuthCtx.Provider>;
}
