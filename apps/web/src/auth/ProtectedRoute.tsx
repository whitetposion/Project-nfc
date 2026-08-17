import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Wrap any route that needs a signed-in user.
 * Preserves the intended destination so the M4 claim flow
 * (/t/:uid → login → back to /t/:uid) works for free.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // session restore is near-instant; avoid a flash

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
