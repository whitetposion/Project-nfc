import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../lib/validate.js";
import { createOrderSchema } from "@gifting/validation";
import { supabaseAdmin } from "../lib/supabase.js";

export const ordersRouter = Router();

// M2: validate stock, snapshot prices, create order as 'pending'.
ordersRouter.post("/", requireAuth, validate(createOrderSchema), async (req, res) => {
  // TODO M2: implement. Stub proves the wiring.
  res.status(501).json({ todo: "M2", received: req.body, user: req.user!.id });
});
