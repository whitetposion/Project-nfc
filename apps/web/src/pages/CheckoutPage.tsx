import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAddresses, createAddress, type Address } from "../lib/store";
import { useCart, formatInr } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { Header } from "../components/Header";

export function CheckoutPage() {
  const { items, subtotalInr, clear } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    label: "Home", line1: "", line2: "", city: "", state: "", postal_code: "", country: "IN"
  });

  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: fetchAddresses
  });

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    const created = await createAddress(form, session!.user.id);
    await qc.invalidateQueries({ queryKey: ["addresses"] });
    setAddressId(created.id);
    setAdding(false);
  }

  async function placeOrder() {
    if (!addressId || items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const order = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          addressId,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.qty }))
        })
      });
      clear();
      navigate(`/orders?placed=${order.id}`);
    } catch (e: any) {
      setError(e.message ?? "Couldn't place the order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="page"><div className="empty"><p>Your cart is empty.</p></div></main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page" style={{ maxWidth: 720 }}>
        <h1>Checkout</h1>

        <h3>Deliver to</h3>
        {addresses?.map((a: Address) => (
          <div
            key={a.id}
            className={`addr-card ${a.id === addressId ? "on" : ""}`}
            onClick={() => setAddressId(a.id)}
          >
            <strong>{a.label ?? "Address"}</strong>
            <div className="muted">
              {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postal_code}
            </div>
          </div>
        ))}

        {adding ? (
          <form onSubmit={saveAddress} className="form-grid" style={{ marginTop: 12 }}>
            <input className="full" placeholder="Label (Home, Office)" value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <input className="full" placeholder="Address line 1" required value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })} />
            <input className="full" placeholder="Address line 2 (optional)" value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })} />
            <input placeholder="City" required value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input placeholder="State" required value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <input placeholder="PIN code" required value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
            <button className="cta full" type="submit">Save address</button>
          </form>
        ) : (
          <button className="cta ghost" onClick={() => setAdding(true)}>+ Add address</button>
        )}

        {error && <p style={{ color: "var(--danger)", marginTop: 16 }}>{error}</p>}

        <div className="totals">Total: {formatInr(subtotalInr)} + shipping</div>
        <div style={{ textAlign: "right", marginTop: 20 }}>
          <button className="cta" disabled={!addressId || busy} onClick={placeOrder}>
            {busy ? "Placing order…" : "Place order"}
          </button>
        </div>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, textAlign: "right" }}>
          Payment is collected offline for now. We'll confirm by email.
        </p>
      </main>
    </>
  );
}
