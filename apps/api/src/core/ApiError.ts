// Single error type for the whole API. Throw anywhere, the error
// middleware translates it to an HTTP response. No scattered res.status().
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(msg = "Bad request") {
    return new ApiError(400, msg);
  }
  static unauthorized(msg = "Unauthorized") {
    return new ApiError(401, msg);
  }
  static forbidden(msg = "Forbidden") {
    return new ApiError(403, msg);
  }
  static notFound(msg = "Not found") {
    return new ApiError(404, msg);
  }
  static conflict(msg = "Conflict") {
    return new ApiError(409, msg);
  }
}
