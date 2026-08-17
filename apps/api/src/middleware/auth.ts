import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; role?: string };
  }
}

const jwks = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const { payload } = await jwtVerify(token, jwks);
    req.user = {
      id: payload.sub as string,
      role: (payload.app_metadata as { role?: string } | undefined)?.role
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
