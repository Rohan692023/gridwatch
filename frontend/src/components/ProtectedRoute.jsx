import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted data-mono text-sm">
        LOADING SESSION...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center text-off data-mono text-sm">
        ACCESS DENIED — insufficient role
      </div>
    );
  }

  return children;
}
