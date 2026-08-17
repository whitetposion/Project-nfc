export const paragraphFields = {
  text: { type: "textarea" as const, label: "Your message" }
};

export function Paragraph({ text }: { text?: string }) {
  return <p style={{ fontSize: 18, lineHeight: 1.6 }}>{text ?? ""}</p>;
}
