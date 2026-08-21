import { Link } from "react-router-dom";
import { useCart, formatInr } from "../cart/CartContext";
import { Header } from "../components/Header";

export function CartPage() {
  const { items, subtotalInr, setQty, remove } = useCart();

  return (
    <>
      <Header />
      <main className="page" style={{ maxWidth: 720 }}>
        <h1>Your cart</h1>
        {items.length === 0 ? (
          <div className="empty">
            <div className="big">🛒</div>
            <p>Nothing here yet. <Link to="/">Browse gifts</Link></p>
          </div>
        ) : (
          <>
            {items.map((i) => (
              <div key={i.variantId} className="rowline">
                {i.image ? <img src={i.image} alt="" /> : <div className="ph">🎁</div>}
                <div className="grow">
                  <strong>{i.title}</strong>
                  <div className="muted">{i.variantName} · {formatInr(i.priceInr)}</div>
                </div>
                <div className="qty-row" style={{ margin: 0 }}>
                  <button onClick={() => setQty(i.variantId, i.qty - 1)}>−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.variantId, i.qty + 1)}>+</button>
                </div>
                <button
                  onClick={() => remove(i.variantId)}
                  style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="totals">Subtotal: {formatInr(subtotalInr)}</div>
            <div style={{ textAlign: "right", marginTop: 20 }}>
              <Link to="/checkout"><button className="cta">Checkout</button></Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
