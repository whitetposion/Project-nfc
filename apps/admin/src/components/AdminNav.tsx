import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AdminNav() {
  return (
    <nav className="adm-nav">
      <span className="brand">Gifting · Admin</span>
      <Link to="/products">Products</Link>
      <Link to="/orders">Orders</Link>
      <Link to="/templates/new">Templates</Link>
      <a href="#" style={{ marginLeft: "auto" }}
        onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); }}>
        Sign out
      </a>
    </nav>
  );
}
