import { supabase } from "./supabase";

// Fetch wrapper that attaches the Supabase access token for the Node API.
export async function api(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
