import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMyOrders } from "../lib/store";
import { formatInr } from "../cart/CartContext";
import { Header } from "../components/Header";

export function OrdersPage() {
  const [params] = useSearchParams();
  const placed = params.get("placed");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders
  });

  return (
    <>
      <Header />
      <main className="page" style={{ maxWidth: 720 }}>
        <h1>Your orders</h1>
        {placed && (
          <div className="addr-card on" style={{ cursor: "default" }}>
            🎉 Order placed! We'll be in touch about payment and shipping.
          </div>
        )}
        {isLoading && <p>Loading…</p>}
        {orders?.length === 0 && (
          <div className="empty"><div className="big">📦</div><p>No orders yet.</p></div>
        )}
        {orders?.map((o) => (
          <div key={o.id} className="rowline">
            <div className="grow">
              <strong>#{o.id.slice(0, 8)}</strong>
              <div className="muted">
                {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {" · "}
                {o.order_items.map((i) => `${i.product_variants?.name ?? "Item"} ×${i.quantity}`).join(", ")}
              </div>
            </div>
            <span className={`status-chip ${o.status}`}>{o.status}</span>
            <strong>{formatInr(o.total_inr)}</strong>
          </div>
        ))}
      </main>
    </>
  );
}
