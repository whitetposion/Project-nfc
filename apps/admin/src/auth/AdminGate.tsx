import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type GateState = "loading" | "signedout" | "denied" | "admin";

/**
 * Wraps the entire admin app.
 * UX gate only — RLS + column grants are the real wall; the API's
 * requireAdmin guards every privileged write.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) {
      setState("signedout");
      return;
    }
    setState("loading");
    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setState(data?.role === "admin" ? "admin" : "denied"));
  }, [session]);

  if (state === "loading") return <Centered><div className="gate-spin" /></Centered>;

  if (state === "signedout") return <AdminLogin />;

  if (state === "denied") {
    return (
      <Centered>
        <div className="gate-card">
          <h1>Not authorized</h1>
          <p>This account doesn't have admin access.</p>
          <button className="gate-cta" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </Centered>
    );
  }

  return <>{children}</>;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setError(error ? error.message : null);
    setBusy(false);
  }

  return (
    <Centered>
      <div className="gate-card">
        <span className="gate-mark">Gifting · Admin</span>
        <h1>Sign in</h1>
        {error && <div className="gate-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button className="gate-cta" type="submit" disabled={busy}>
            {busy ? "One moment…" : "Sign in"}
          </button>
        </form>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="gate-shell">{children}</div>;
}
