import { supabase } from "./supabase";

export interface Variant {
  id: string;
  product_id: string;
  name: string;
  price_inr: number;
  inventory: number;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  base_price_inr: number;
  media: { url: string }[];
  product_variants: Variant[];
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface Address {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export async function fetchAddresses(): Promise<Address[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAddress(a: Omit<Address, "id" | "is_default">, userId: string) {
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...a, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Address;
}

export interface OrderRow {
  id: string;
  status: string;
  total_inr: number;
  created_at: string;
  order_items: {
    quantity: number;
    unit_price_inr: number;
    product_variants: { name: string } | null;
  }[];
}

export async function fetchMyOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total_inr, created_at, order_items(quantity, unit_price_inr, product_variants(name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}
