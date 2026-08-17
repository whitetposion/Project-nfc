import { useParams } from "react-router-dom";

// M4: check claim status via API, route to claim flow or viewer.
export function TagLanding() {
  const { uid } = useParams();
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>NFC Tag: {uid}</h1>
      <p>Claim flow lands here in M4.</p>
    </main>
  );
}
