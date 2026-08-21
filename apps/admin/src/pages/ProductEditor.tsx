import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { MediaInput } from "../components/MediaInput";

interface VariantDraft {
  id?: string;
  name: string;
  price_rs: string;      // rupees in the UI, paise in the DB
  inventory: string;
}

export function ProductEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [basePriceRs, setBasePriceRs] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [media, setMedia] = useState<{ url: string }[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([{ name: "", price_rs: "", inventory: "0" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setTitle(data.title);
        setDescription(data.description ?? "");
        setCategory(data.category ?? "");
        setBasePriceRs(String(data.base_price_inr / 100));
        setStatus(data.status);
        setMedia(data.media ?? []);
        setVariants(
          (data.product_variants ?? []).map((v: any) => ({
            id: v.id,
            name: v.name,
            price_rs: String(v.price_inr / 100),
            inventory: String(v.inventory)
          }))
        );
      });
  }, [id, isNew]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const productRow = {
        title,
        description: description || null,
        category: category || null,
        base_price_inr: Math.round(Number(basePriceRs) * 100),
        status,
        media
      };

      let productId = id;
      if (isNew) {
        const { data, error } = await supabase.from("products").insert(productRow).select().single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from("products").update(productRow).eq("id", id);
        if (error) throw error;
      }

      for (const v of variants.filter((v) => v.name.trim())) {
        const row = {
          product_id: productId,
          name: v.name,
          price_inr: Math.round(Number(v.price_rs) * 100),
          inventory: Number(v.inventory)
        };
        const { error } = v.id
          ? await supabase.from("product_variants").update(row).eq("id", v.id)
          : await supabase.from("product_variants").insert(row);
        if (error) throw error;
      }

      navigate("/products");
    } catch (e: any) {
      setError(e.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-shell">
      <h1>{isNew ? "New product" : "Edit product"}</h1>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      <div className="adm-form">
        <div>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label>Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label>Category</label>
            <input placeholder="flower, frame…" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label>Base price (₹)</label>
            <input type="number" value={basePriceRs} onChange={(e) => setBasePriceRs(e.target.value)} />
          </div>
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </div>
        </div>

        <div>
          <label>Media</label>
          <MediaInput value={media} onChange={setMedia} />
        </div>

        <div>
          <label>Variants (name / price ₹ / stock)</label>
          {variants.map((v, i) => (
            <div key={i} className="variant-grid" style={{ marginBottom: 8 }}>
              <input placeholder="Red" value={v.name}
                onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              <input type="number" placeholder="499" value={v.price_rs}
                onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, price_rs: e.target.value } : x))} />
              <input type="number" placeholder="10" value={v.inventory}
                onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, inventory: e.target.value } : x))} />
              <button type="button" className="adm-btn danger"
                onClick={() => setVariants(variants.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button type="button" className="adm-btn ghost"
            onClick={() => setVariants([...variants, { name: "", price_rs: "", inventory: "0" }])}>
            + Variant
          </button>
        </div>

        <div>
          <button className="adm-btn" disabled={busy || !title || !basePriceRs} onClick={save}>
            {busy ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </div>
  );
}
