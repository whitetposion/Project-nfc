import { Router } from "express";

// Every controller owns its Router and declares routes in one place.
// Subclass constructor assigns dependencies, then calls this.registerRoutes().
export abstract class BaseController {
  public readonly router = Router();

  protected abstract registerRoutes(): void;
}
