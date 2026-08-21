import { Link } from "react-router-dom";

export function Dashboard() {
  return (
    <div className="adm-shell">
      <h1>Admin</h1>
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/products"><button className="adm-btn">Products</button></Link>
        <Link to="/orders"><button className="adm-btn">Orders</button></Link>
        <Link to="/templates/new"><button className="adm-btn ghost">Template builder (M3)</button></Link>
      </div>
    </div>
  );
}
