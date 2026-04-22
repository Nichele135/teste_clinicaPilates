import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const userRole = user?.role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles?.map((role) => role.toLowerCase());

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    if (userRole === "admin") {
      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;