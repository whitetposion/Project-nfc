import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Home() {
  const { session, signOut } = useAuth();

  return (
    <main style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)" }}>Gifting</h1>
      {session ? (
        <>
          <p>Signed in as <strong>{session.user.email}</strong></p>
          <button
            onClick={signOut}
            style={{
              padding: "10px 20px", borderRadius: 12, border: "1px solid var(--line)",
              background: "#fff", cursor: "pointer", font: "600 14px var(--font-body)"
            }}
          >
            Sign out
          </button>
        </>
      ) : (
        <p>
          <Link to="/auth" style={{ color: "var(--peacock)", fontWeight: 600 }}>
            Sign in or create an account
          </Link>{" "}
          to claim your gift.
        </p>
      )}
    </main>
  );
}
