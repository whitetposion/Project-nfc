import type { Request, Response } from "express";
import { BaseController } from "../core/BaseController.js";
import { asyncHandler } from "../core/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../lib/validate.js";
import { updateProfileSchema } from "@gifting/validation";
import type { AuthService } from "../services/AuthService.js";

export class AuthController extends BaseController {
  constructor(private readonly auth: AuthService) {
    super();
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.router.get("/me", requireAuth, asyncHandler(this.getMe));
    this.router.patch(
      "/me",
      requireAuth,
      validate(updateProfileSchema),
      asyncHandler(this.updateMe)
    );
  }

  private getMe = async (req: Request, res: Response) => {
    res.json(await this.auth.getMe(req.user!.id));
  };

  private updateMe = async (req: Request, res: Response) => {
    res.json(await this.auth.updateMe(req.user!.id, req.body));
  };
}
