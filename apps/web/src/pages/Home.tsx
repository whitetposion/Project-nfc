import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../lib/store";
import { formatInr } from "../cart/CartContext";
import { Header } from "../components/Header";

export function Home() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts
  });

  return (
    <>
      <Header />
      <main className="page">
        <h1>Gifts that open a moment</h1>
        {isLoading && <p>Loading…</p>}
        {products?.length === 0 && (
          <div className="empty">
            <div className="big">🎁</div>
            <p>No products yet. Check back soon.</p>
          </div>
        )}
        <div className="grid">
          {products?.map((p, i) => (
            <Link key={p.id} to={`/p/${p.id}`} className="card" style={{ animationDelay: `${i * 40}ms` }}>
              {p.media?.[0]?.url
                ? <img src={p.media[0].url} alt={p.title} />
                : <div className="ph">🎁</div>}
              <div className="body">
                <p className="title">{p.title}</p>
                <span className="price">from {formatInr(p.base_price_inr)}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
