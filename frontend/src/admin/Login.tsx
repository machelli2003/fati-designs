import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Msg } from "./parts";

export default function Login() {
  const { email: me, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  if (me) return <Navigate to="/admin" replace />;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await login(email, pw); nav("/admin", { replace: true }); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-5">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-8 shadow-sm">
        <p className="eyebrow mb-2">Private area</p>
        <h1 className="mb-6 text-4xl">Studio login</h1>
        {err && <Msg kind="error">{err}</Msg>}
        <div className="space-y-4">
          <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" required autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label" htmlFor="p">Password</label><input id="p" type="password" required autoComplete="current-password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        </div>
        <button className="btn btn-dark mt-6 w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
    </div>
  );
}
