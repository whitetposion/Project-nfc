import { Link } from "react-router-dom";

// M1: gate this whole app behind profiles.role = 'admin'.
export function Dashboard() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Admin</h1>
      <ul>
        <li><Link to="/templates/new">New Template (M3)</Link></li>
        <li>Products (M2)</li>
        <li>Orders (M2)</li>
        <li>NFC Inventory (M6)</li>
      </ul>
    </main>
  );
}
