import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../ApiError.js";
import { asyncHandler } from "../asyncHandler.js";
import { errorMiddleware } from "../errorMiddleware.js";

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("ApiError factories", () => {
  it("carries the right status codes", () => {
    expect(ApiError.badRequest().status).toBe(400);
    expect(ApiError.unauthorized().status).toBe(401);
    expect(ApiError.forbidden().status).toBe(403);
    expect(ApiError.notFound().status).toBe(404);
    expect(ApiError.conflict().status).toBe(409);
  });
});

describe("asyncHandler", () => {
  it("forwards rejected promises to next()", async () => {
    const boom = new ApiError(418, "teapot");
    const handler = asyncHandler(async () => {
      throw boom;
    });
    const next = vi.fn();
    handler({} as Request, mockRes(), next as NextFunction);
    await new Promise((r) => setImmediate(r));
    expect(next).toHaveBeenCalledWith(boom);
  });
});

describe("errorMiddleware", () => {
  it("translates ApiError to its status + message", () => {
    const res = mockRes();
    errorMiddleware(ApiError.forbidden("Nope"), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Nope" });
  });

  it("masks unknown errors as 500 without leaking details", () => {
    const res = mockRes();
    vi.spyOn(console, "error").mockImplementation(() => {});
    errorMiddleware(new Error("secret db string"), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal error" });
  });
});
