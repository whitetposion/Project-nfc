import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";

export function Header() {
  const { session, signOut } = useAuth();
  const { count } = useCart();

  return (
    <header className="site-header">
      <Link to="/" className="logo">Gifting</Link>
      <nav>
        {session ? (
          <>
            <Link to="/orders">Orders</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); signOut(); }}>Sign out</a>
          </>
        ) : (
          <Link to="/auth">Sign in</Link>
        )}
        <Link to="/cart" className="cart-pill">Cart · {count}</Link>
      </nav>
    </header>
  );
}
