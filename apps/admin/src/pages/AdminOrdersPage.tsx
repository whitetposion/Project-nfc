import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import { useState } from "react";

const STATUSES = ["pending","paid","processing","packed","shipped","delivered","cancelled","returned"];

export function AdminOrdersPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: orders } = useQuery({
    queryKey: ["adm-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, profiles(name), order_items(quantity, product_variants(name))")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    }
  });

  async function setStatus(orderId: string, status: string) {
    setError(null);
    try {
      await api(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      qc.invalidateQueries({ queryKey: ["adm-orders"] });
    } catch (e: any) {
      setError(e.message); // e.g. "Cannot move order from 'pending' to 'delivered'"
    }
  }

  return (
    <div className="adm-shell">
      <h1>Orders</h1>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      <table className="adm">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Placed</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders?.map((o: any) => (
            <tr key={o.id}>
              <td>#{o.id.slice(0, 8)}</td>
              <td>{o.profiles?.name ?? "—"}</td>
              <td>
                {o.order_items
                  ?.map((i: any) => `${i.product_variants?.name ?? "item"} ×${i.quantity}`)
                  .join(", ")}
              </td>
              <td>₹{(o.total_inr / 100).toLocaleString("en-IN")}</td>
              <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
              <td>
                <select
                  className="status"
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
