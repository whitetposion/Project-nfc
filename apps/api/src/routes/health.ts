import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => res.json({ ok: true }));

// Smoke test for the JWT guard. Call with a Supabase access token.
healthRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
