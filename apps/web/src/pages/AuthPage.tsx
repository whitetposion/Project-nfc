import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/auth.css";

type Mode = "signin" | "signup" | "reset";

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  signin: { title: "Welcome back", sub: "Your gifts are waiting.", cta: "Sign in" },
  signup: { title: "Create your account", sub: "Start gifting moments, not just things.", cta: "Create account" },
  reset:  { title: "Reset password", sub: "We'll email you a reset link.", cta: "Send reset link" }
};

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<"verify" | "reset" | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSent(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    let err: string | null = null;
    if (mode === "signin") {
      err = await signIn(email, password);
      if (!err) navigate(from, { replace: true });
    } else if (mode === "signup") {
      err = await signUp(name, email, password);
      if (!err) setSent("verify");
    } else {
      err = await resetPassword(email);
      if (!err) setSent("reset");
    }

    setError(err);
    setBusy(false);
  }

  const copy = COPY[mode];

  return (
    <div className="auth-shell">
      <aside className="auth-brand" aria-hidden="true">
        <span className="wordmark">Gifting</span>

        <div className="nfc-field">
          <span className="nfc-ring" />
          <span className="nfc-ring" />
          <span className="nfc-ring" />
          <span className="nfc-ring" />
          <span className="sparkle" />
          <span className="sparkle s2" />
          <span className="sparkle s3" />
          <div className="gift-emblem">🎁</div>
        </div>

        <p className="tagline">
          One tap opens <em>a moment</em> made just for them.
        </p>
      </aside>

      <main className="auth-form-panel">
        <div className="auth-card">
          {sent ? (
            <div className="auth-success">
              <div className="pulse">✉️</div>
              <h2>{sent === "verify" ? "Check your inbox" : "Reset link sent"}</h2>
              <p>
                {sent === "verify"
                  ? `We sent a verification link to ${email}. Open it to activate your account.`
                  : `If an account exists for ${email}, a reset link is on its way.`}
              </p>
              <button className="auth-cta" onClick={() => switchMode("signin")}>
                Back to sign in
              </button>
            </div>
          ) : (
            <div className="mode-enter" key={mode}>
              <h1>{copy.title}</h1>
              <p className="sub">{copy.sub}</p>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="field">
                    <input
                      id="name"
                      type="text"
                      placeholder=" "
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                    <label htmlFor="name">Your name</label>
                  </div>
                )}

                <div className="field">
                  <input
                    id="email"
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <label htmlFor="email">Email</label>
                </div>

                {mode !== "reset" && (
                  <div className="field">
                    <input
                      id="password"
                      type="password"
                      placeholder=" "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    />
                    <label htmlFor="password">Password</label>
                  </div>
                )}

                {mode === "signin" && (
                  <span className="forgot">
                    <button type="button" onClick={() => switchMode("reset")}>
                      Forgot password?
                    </button>
                  </span>
                )}

                <button className="auth-cta" type="submit" disabled={busy}>
                  {busy ? "One moment…" : copy.cta}
                </button>
              </form>

              <p className="auth-switch">
                {mode === "signin" ? (
                  <>
                    New here?{" "}
                    <button onClick={() => switchMode("signup")}>Create an account</button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => switchMode("signin")}>Sign in</button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
