import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactElement;
  roles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, roles, redirectTo = "/orders" }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const role = user?.role;
    if (!role || !roles.includes(role)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
}
