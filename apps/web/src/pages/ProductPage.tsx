import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProduct } from "../lib/store";
import { useCart, formatInr } from "../cart/CartContext";
import { Header } from "../components/Header";

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!)
  });

  if (isLoading) return <><Header /><main className="page"><p>Loading…</p></main></>;
  if (!product) return <><Header /><main className="page"><p>Product not found.</p></main></>;

  const variants = product.product_variants ?? [];
  const selected = variants.find((v) => v.id === variantId) ?? null;

  function addToCart() {
    if (!selected) return;
    add(
      {
        variantId: selected.id,
        productId: product!.id,
        title: product!.title,
        variantName: selected.name,
        priceInr: selected.price_inr,
        image: product!.media?.[0]?.url ?? null
      },
      qty
    );
    navigate("/cart");
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="pdp">
          {product.media?.[0]?.url
            ? <img className="hero" src={product.media[0].url} alt={product.title} />
            : <div className="hero" style={{ display: "grid", placeItems: "center", fontSize: 64 }}>🎁</div>}
          <div>
            <h1>{product.title}</h1>
            <p className="price">
              {selected ? formatInr(selected.price_inr) : `from ${formatInr(product.base_price_inr)}`}
            </p>
            {product.description && <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>{product.description}</p>}

            <div className="variant-row">
              {variants.map((v) => (
                <button
                  key={v.id}
                  className={`variant-chip ${v.id === variantId ? "on" : ""}`}
                  disabled={v.inventory <= 0}
                  onClick={() => setVariantId(v.id)}
                >
                  {v.name}{v.inventory <= 0 ? " · out" : ""}
                </button>
              ))}
            </div>

            <div className="qty-row">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <strong>{qty}</strong>
              <button onClick={() => setQty(Math.min(20, qty + 1))}>+</button>
            </div>

            <button className="cta" disabled={!selected} onClick={addToCart}>
              {selected ? "Add to cart" : "Choose an option"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
