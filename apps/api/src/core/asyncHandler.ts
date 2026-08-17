import type { Request, Response, NextFunction, RequestHandler } from "express";

// Express 4 doesn't catch rejected promises. Wrap every async handler
// once here instead of try/catch in every route.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
