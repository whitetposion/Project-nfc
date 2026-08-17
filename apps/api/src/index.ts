import express from "express";
import cors from "cors";
import { supabaseAdmin } from "./lib/supabase.js";
import { errorMiddleware } from "./core/errorMiddleware.js";

import { ProfileRepository } from "./repositories/ProfileRepository.js";
import { AuthService } from "./services/AuthService.js";
import { AdminUserService } from "./services/AdminUserService.js";
import { AuthController } from "./controllers/AuthController.js";
import { AdminUserController } from "./controllers/AdminUserController.js";

import { healthRouter } from "./routes/health.js";
import { ordersRouter } from "./routes/orders.js";
import { claimsRouter } from "./routes/claims.js";

// ---- Composition root: build the object graph once, here only ----
const profileRepo = new ProfileRepository(supabaseAdmin);
const authController = new AuthController(new AuthService(profileRepo));
const adminUserController = new AdminUserController(new AdminUserService(profileRepo));

const app = express();

app.use(
  cors({
    origin: [process.env.WEB_ORIGIN!, process.env.ADMIN_ORIGIN!].filter(Boolean)
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/auth", authController.router);
app.use("/admin/users", adminUserController.router);
app.use("/orders", ordersRouter);   // M2: refactor into OrderController
app.use("/claims", claimsRouter);   // M4: refactor into ClaimController

app.use(errorMiddleware);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API on :${port}`));
