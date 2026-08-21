import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function ProductsPage() {
  const { data: products } = useQuery({
    queryKey: ["adm-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="adm-shell">
      <div className="adm-top">
        <h1>Products</h1>
        <Link to="/products/new"><button className="adm-btn">New product</button></Link>
      </div>
      <table className="adm">
        <thead>
          <tr><th>Title</th><th>Category</th><th>Base price</th><th>Variants</th><th>Status</th><th /></tr>
        </thead>
        <tbody>
          {products?.map((p: any) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.category ?? "—"}</td>
              <td>₹{(p.base_price_inr / 100).toLocaleString("en-IN")}</td>
              <td>{p.product_variants?.[0]?.count ?? 0}</td>
              <td>{p.status}</td>
              <td><Link to={`/products/${p.id}`}>Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
