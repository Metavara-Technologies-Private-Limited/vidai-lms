type KnownRole = "super_admin" | "admin" | "user" | "unknown";

type UserLike = Record<string, unknown> | null | undefined;

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const toKnownRole = (raw: string): KnownRole => {
  if (
    raw === "super admin" ||
    raw === "super_admin" ||
    raw === "super-admin" ||
    raw === "superadmin"
  ) {
    return "super_admin";
  }

  if (raw === "admin" || raw === "administrator") return "admin";
  if (raw === "user") return "user";
  return "unknown";
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const json = atob(base64);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

export const resolveUserRole = (user: UserLike): KnownRole => {
  if (!user) return "unknown";

  // Backend-auth flags take priority when available.
  if (user.is_superuser === true) return "super_admin";
  if (user.is_staff === true) return "admin";

  const accessToken = typeof user.access === "string" ? user.access : "";
  if (accessToken.includes(".")) {
    const payload = decodeJwtPayload(accessToken);
    if (payload) {
      if (payload.is_superuser === true) return "super_admin";
      if (payload.is_staff === true) return "admin";

      const tokenRoleCandidates = [
        payload.role,
        payload.role_name,
        payload.designation,
        payload.designation_label,
        payload.user_role,
        payload.type,
      ];

      for (const candidate of tokenRoleCandidates) {
        const role = toKnownRole(normalize(candidate));
        if (role !== "unknown") return role;
      }
    }
  }

  const candidates = [
    user.designation_label,
    user.designation,
    user.role_name,
    user.role,
    user.user_role,
    user.type,
  ];

  for (const candidate of candidates) {
    const role = toKnownRole(normalize(candidate));
    if (role !== "unknown") return role;
  }

  return "unknown";
};

export const canAccessMenuKey = (role: KnownRole, key: string): boolean => {
  if (role === "super_admin") return true;

  if (role === "unknown") {
    // Restrictive fallback until role is resolved.
    return key === "dashboard";
  }

  if (role === "admin") {
    return true;
  }

  // user role: only reports + settings
  return key === "reports" || key === "settings";
};

export const canAccessSubMenuKey = (
  role: KnownRole,
  parentKey: string,
  subKey: string,
): boolean => {
  if (role === "super_admin") return true;

  if (role === "unknown") return false;

  if (role === "admin") {
    // Admin should not see User tab under Settings
    return !(parentKey === "settings" && subKey === "users");
  }

  // user role: only tickets and templates under settings
  if (parentKey !== "settings") return false;
  return subKey === "tickets" || subKey === "templates";
};

export const defaultPathForRole = (role: KnownRole): string => {
  if (role === "unknown") return "/dashboard";
  if (role === "user") return "/reports";
  return "/dashboard";
};
