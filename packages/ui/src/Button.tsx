import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 20px",
        borderRadius: 8,
        border: "none",
        background: "#E91E63",
        color: "#fff",
        cursor: "pointer",
        ...props.style
      }}
    />
  );
}
