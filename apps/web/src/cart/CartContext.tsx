import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode
} from "react";

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  variantName: string;
  priceInr: number;   // paise
  image: string | null;
  qty: number;
}

interface CartValue {
  items: CartItem[];
  count: number;
  subtotalInr: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);
const KEY = "gifting.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartValue>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotalInr: items.reduce((n, i) => n + i.priceInr * i.qty, 0),

    add(item, qty = 1) {
      setItems((prev) => {
        const found = prev.find((i) => i.variantId === item.variantId);
        if (found) {
          return prev.map((i) =>
            i.variantId === item.variantId ? { ...i, qty: Math.min(20, i.qty + qty) } : i
          );
        }
        return [...prev, { ...item, qty }];
      });
    },

    setQty(variantId, qty) {
      setItems((prev) =>
        qty <= 0
          ? prev.filter((i) => i.variantId !== variantId)
          : prev.map((i) => (i.variantId === variantId ? { ...i, qty: Math.min(20, qty) } : i))
      );
    },

    remove(variantId) {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    },

    clear() {
      setItems([]);
    }
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export const formatInr = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN")}`;
