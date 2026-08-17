import type { Request, Response } from "express";
import { BaseController } from "../core/BaseController.js";
import { asyncHandler } from "../core/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { validate } from "../lib/validate.js";
import { setSuspendedSchema, setRoleSchema } from "@gifting/validation";
import type { AdminUserService } from "../services/AdminUserService.js";

export class AdminUserController extends BaseController {
  constructor(private readonly users: AdminUserService) {
    super();
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    // Guards applied once for the whole controller. DRY.
    this.router.use(requireAuth, requireAdmin);

    this.router.get("/", asyncHandler(this.list));
    this.router.patch(
      "/:id/suspended",
      validate(setSuspendedSchema),
      asyncHandler(this.setSuspended)
    );
    this.router.patch(
      "/:id/role",
      validate(setRoleSchema),
      asyncHandler(this.setRole)
    );
  }

  private list = async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    res.json(await this.users.list({ search, page, pageSize }));
  };

  private setSuspended = async (req: Request, res: Response) => {
    res.json(
      await this.users.setSuspended(req.user!.id, req.params.id, req.body.suspended)
    );
  };

  private setRole = async (req: Request, res: Response) => {
    res.json(await this.users.setRole(req.user!.id, req.params.id, req.body.role));
  };
}
