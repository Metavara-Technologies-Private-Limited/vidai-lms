import type { AuthUser } from "../types/auth.types";

import { toSafePhotoUrl } from "./mediaUrl";

export const buildAuthUserFromLogin = (
  token: string,
  loginIdentifier: string,
  resolvedRole?: string,
  permissions?: Record<string, unknown>,
  user?: Record<string, unknown>,
): AuthUser => {
  const nestedRole =
    user?.role && typeof user.role === "object"
      ? (user.role as { name?: unknown }).name
      : undefined;

  const designation = String(
    resolvedRole ??
      user?.role ??
      user?.designation ??
      user?.designation_label ??
      user?.role_name ??
      user?.user_role ??
      nestedRole ??
      "",
  ).trim();

  const designationLower = designation.toLowerCase();

  const hasSuperFlag =
    user?.is_superuser === true ||
    String(user?.is_superuser || "").toLowerCase() === "true";

  const hasAdminFlag =
    user?.is_staff === true ||
    String(user?.is_staff || "").toLowerCase() === "true";

  const isSuperAdmin =
    hasSuperFlag ||
    designationLower === "super admin" ||
    designationLower === "super_admin" ||
    designationLower === "super-admin" ||
    designationLower === "superadmin";

  const isAdmin = hasAdminFlag || designationLower === "admin" || isSuperAdmin;

  const nestedProfile =
    user?.profile && typeof user.profile === "object"
      ? (user.profile as Record<string, unknown>)
      : null;

  const resolvedPhoto =
    toSafePhotoUrl(user?.photo ?? nestedProfile?.photo) ?? "";

  return {
    access: token,

    user_id: Number(user?.user_id ?? user?.id ?? 0) || 0,

    username: String(user?.username ?? loginIdentifier),

    first_name: String(user?.first_name ?? ""),
    last_name: String(user?.last_name ?? ""),

    email: String(user?.email ?? ""),

    designation,
    designation_label: designation,

    tenant: "",
    tenant_id: 0,

    is_staff: isAdmin,
    is_superuser: isSuperAdmin,

    language_id: 0,
    language_code: "",
    language_name: "",

    permissions: (permissions as AuthUser["permissions"]) ?? { modules: [] },

    clinics: [],

    photo: resolvedPhoto,

    profile_loaded: false,
  };
};
