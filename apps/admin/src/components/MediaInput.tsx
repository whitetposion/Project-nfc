import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const BUCKET = "media";

interface Props {
  value: { url: string }[];
  onChange: (media: { url: string }[]) => void;
}

export function MediaInput({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded: { url: string }[] = [];
      for (const file of Array.from(files)) {
        const path = `products/${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploaded.push({ url: data.publicUrl });
      }
      onChange([...value, ...uploaded]);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        {value.map((m, i) => (
          <div key={i} style={{ position: "relative" }}>
            <img src={m.url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }} />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              style={{
                position: "absolute", top: -6, right: -6, width: 20, height: 20,
                borderRadius: "50%", border: "none", background: "var(--danger)",
                color: "#fff", cursor: "pointer", fontSize: 11
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
        id="media-input-file"
      />
      <label htmlFor="media-input-file" className="adm-btn ghost" style={{ cursor: busy ? "default" : "pointer" }}>
        {busy ? "Uploading…" : "Upload images"}
      </label>
    </div>
  );
}
