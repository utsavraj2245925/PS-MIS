import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({
  children,
  allowedRoles,
}) {

  const {
    user,
    loading,
  } = useAuth();

  // WAIT FOR STORAGE LOAD
  if (loading) {

    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  }

  // NOT LOGGED IN
  if (!user) {

    return <Navigate to="/login" />;

  }

  // ROLE NOT ALLOWED
  if (
    !allowedRoles.includes(user.role)
  ) {

    return <Navigate to="/" />;

  }

  return children;
}