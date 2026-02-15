import { Outlet, Navigate, useLocation } from "react-router-dom";

export default function Settings() {
  const location = useLocation();

  if (location.pathname === "/settings") {
    return <Navigate to="integration" replace />;
  }

  return <Outlet />;
}
