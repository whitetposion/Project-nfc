import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../middleware/auth.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "u1" };
    next();
  }
}));
vi.mock("../../middleware/admin.js", () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next()
}));

import { OrderController } from "../OrderController.js";
import { errorMiddleware } from "../../core/errorMiddleware.js";
import type { OrderService } from "../../services/OrderService.js";

const VALID_UUID = "9f1b2c3d-0000-4000-8000-000000000000";

function buildApp(service: Partial<OrderService>) {
  const app = express();
  app.use(express.json());
  app.use("/orders", new OrderController(service as OrderService).router);
  app.use(errorMiddleware);
  return app;
}

describe("POST /orders", () => {
  it("201s a valid order for the authenticated user", async () => {
    const placeOrder = vi.fn().mockResolvedValue({ id: "o1", status: "pending" });
    const app = buildApp({ placeOrder });
    const res = await request(app)
      .post("/orders")
      .send({ items: [{ variantId: VALID_UUID, quantity: 1 }], addressId: VALID_UUID });
    expect(res.status).toBe(201);
    expect(placeOrder).toHaveBeenCalledWith("u1", expect.anything());
  });

  it("400s on empty items via Zod, service untouched", async () => {
    const placeOrder = vi.fn();
    const app = buildApp({ placeOrder });
    const res = await request(app)
      .post("/orders")
      .send({ items: [], addressId: VALID_UUID });
    expect(res.status).toBe(400);
    expect(placeOrder).not.toHaveBeenCalled();
  });
});

describe("PATCH /orders/:id/status", () => {
  it("updates with a legal status value", async () => {
    const updateStatus = vi.fn().mockResolvedValue({ id: "o1", status: "paid" });
    const app = buildApp({ updateStatus });
    const res = await request(app).patch("/orders/o1/status").send({ status: "paid" });
    expect(res.status).toBe(200);
    expect(updateStatus).toHaveBeenCalledWith("o1", "paid");
  });

  it("400s on a status outside the enum", async () => {
    const app = buildApp({ updateStatus: vi.fn() });
    const res = await request(app)
      .patch("/orders/o1/status")
      .send({ status: "teleported" });
    expect(res.status).toBe(400);
  });
});
