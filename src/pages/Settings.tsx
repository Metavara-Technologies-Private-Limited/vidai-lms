import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken, selectUser } from "../store/authSlice";
import {
  canAccessSubMenuKey,
  defaultPathForUser,
  resolveUserRole,
} from "../utils/roleAccess";

export default function Settings() {
  const location = useLocation();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);

  const roleContext =
    (user as Record<string, unknown> | null) ??
    (token ? ({ access: token } as Record<string, unknown>) : null);
  const role = resolveUserRole(roleContext);

  if (location.pathname === "/settings") {
    const subMenus = [
      { key: "tickets", path: "tickets" },
      { key: "templates", path: "templates" },
      { key: "users", path: "users" },
    ] as const;

    const firstAllowed = subMenus.find((sub) =>
      canAccessSubMenuKey(role, "settings", sub.key, roleContext),
    );

    if (firstAllowed) {
      return <Navigate to={firstAllowed.path} replace />;
    }

    return <Navigate to={defaultPathForUser(role, roleContext)} replace />;
  }

  return <Outlet />;
}
