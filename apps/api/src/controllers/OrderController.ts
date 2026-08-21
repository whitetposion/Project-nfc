import type { Request, Response } from "express";
import { BaseController } from "../core/BaseController.js";
import { asyncHandler } from "../core/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { validate } from "../lib/validate.js";
import { createOrderSchema, updateOrderStatusSchema } from "@gifting/validation";
import type { OrderService } from "../services/OrderService.js";

export class OrderController extends BaseController {
  constructor(private readonly orders: OrderService) {
    super();
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.router.post(
      "/",
      requireAuth,
      validate(createOrderSchema),
      asyncHandler(this.place)
    );
    this.router.patch(
      "/:id/status",
      requireAuth,
      requireAdmin,
      validate(updateOrderStatusSchema),
      asyncHandler(this.updateStatus)
    );
  }

  private place = async (req: Request, res: Response) => {
    const order = await this.orders.placeOrder(req.user!.id, req.body);
    res.status(201).json(order);
  };

  private updateStatus = async (req: Request, res: Response) => {
    res.json(await this.orders.updateStatus(req.params.id, req.body.status));
  };
}
