import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock the auth middleware BEFORE importing the controller.
// Simulates a verified token for user u1 without touching JWKS.
vi.mock("../../middleware/auth.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "u1" };
    next();
  }
}));

import { AuthController } from "../AuthController.js";
import { errorMiddleware } from "../../core/errorMiddleware.js";
import { ApiError } from "../../core/ApiError.js";
import type { AuthService } from "../../services/AuthService.js";

const me = { id: "u1", name: "Dikshant", phone: null, role: "customer", suspended: false };

function buildApp(service: Partial<AuthService>) {
  const app = express();
  app.use(express.json());
  app.use("/auth", new AuthController(service as AuthService).router);
  app.use(errorMiddleware);
  return app;
}

describe("GET /auth/me", () => {
  it("returns the caller's profile", async () => {
    const app = buildApp({ getMe: vi.fn().mockResolvedValue(me) });
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("u1");
  });

  it("maps service ApiError to HTTP status", async () => {
    const app = buildApp({
      getMe: vi.fn().mockRejectedValue(ApiError.forbidden("Account suspended"))
    });
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Account suspended");
  });
});

describe("PATCH /auth/me", () => {
  let updateMe: ReturnType<typeof vi.fn>;
  let app: express.Express;

  beforeEach(() => {
    updateMe = vi.fn().mockResolvedValue({ ...me, name: "New" });
    app = buildApp({ updateMe });
  });

  it("updates with a valid body", async () => {
    const res = await request(app).patch("/auth/me").send({ name: "New" });
    expect(res.status).toBe(200);
    expect(updateMe).toHaveBeenCalledWith("u1", { name: "New" });
  });

  it("rejects an empty body via Zod (400), service never called", async () => {
    const res = await request(app).patch("/auth/me").send({});
    expect(res.status).toBe(400);
    expect(updateMe).not.toHaveBeenCalled();
  });

  it("rejects unknown-only fields", async () => {
    const res = await request(app).patch("/auth/me").send({ role: "admin" });
    expect(res.status).toBe(400);
    expect(updateMe).not.toHaveBeenCalled();
  });
});
