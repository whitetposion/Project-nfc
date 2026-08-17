import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

// Role lives in profiles table (source of truth), checked per request.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", req.user.id)
    .single();
  if (data?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}
