import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import { config } from "@gifting/puck-config";

// M3: load/save template JSON to Supabase `templates.schema`.
export function TemplateEditor() {
  return (
    <div style={{ height: "100vh" }}>
      <Puck
        config={config}
        data={{ content: [], root: { props: {} } }}
        onPublish={(data) => console.log("save to templates.schema:", data)}
      />
    </div>
  );
}
