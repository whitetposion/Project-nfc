import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../lib/validate.js";
import { claimTagSchema } from "@gifting/validation";

export const claimsRouter = Router();

// M4: claim NFC tag. DB trigger prevents reclaim as backstop.
claimsRouter.post("/", requireAuth, validate(claimTagSchema), async (req, res) => {
  res.status(501).json({ todo: "M4", uid: req.body.uid });
});
