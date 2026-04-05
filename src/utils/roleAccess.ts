type KnownRole = "super_admin" | "admin" | "user" | "unknown";

type UserLike = Record<string, unknown> | null | undefined;

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const isTrueFlag = (value: unknown): boolean => {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  }
  return false;
};

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

const roleFromId = (value: unknown): KnownRole => {
  const id = Number(value);
  if (!Number.isFinite(id)) return "unknown";
  if (id === 2) return "super_admin";
  if (id === 1) return "admin";
  if (id === 3) return "user";
  return "unknown";
};

const MENU_LABEL_BY_KEY: Record<string, string> = {
  dashboard: "dashboard",
  leads: "leads hub",
  referrals: "referral management",
  campaigns: "campaigns",
  reputation: "reputation management",
  reports: "reports",
  pipeline: "sales pipeline configuration",
  settings: "settings",
};

const SUB_LABEL_BY_KEY: Record<string, string> = {
  integration: "integration",
  tickets: "tickets",
  templates: "templates",
  users: "user",
};

const KNOWN_MENU_LABELS = new Set(Object.values(MENU_LABEL_BY_KEY));
const KNOWN_SUB_LABELS = new Set(Object.values(SUB_LABEL_BY_KEY));

const collectPermissionLabels = (user: UserLike): Set<string> => {
  const labels = new Set<string>();
  const nestedUser = asRecord(user?.user);
  const permissions = user?.permissions ?? nestedUser?.permissions;
  const permsRecord = asRecord(permissions);

  const addLabel = (value: unknown) => {
    const label = normalize(value);
    if (label && label !== "_") labels.add(label);
  };

  if (!permsRecord) return labels;

  // Shape A: permissions.modules = [{name, submodules:[{name, type:[{name}]}]}]
  if (Array.isArray(permsRecord.modules)) {
    for (const mod of permsRecord.modules as Array<Record<string, unknown>>) {
      addLabel(mod.name);
      if (Array.isArray(mod.submodules)) {
        for (const sub of mod.submodules as Array<Record<string, unknown>>) {
          addLabel(sub.name);
          if (Array.isArray(sub.type)) {
            for (const t of sub.type as Array<Record<string, unknown>>) {
              addLabel(t.name);
            }
          }
        }
      }
    }
  }

  // Shape B: permission map object from users/list
  for (const [moduleKey, categoriesVal] of Object.entries(permsRecord)) {
    if (moduleKey !== "modules") addLabel(moduleKey);
    const categories = asRecord(categoriesVal);
    if (!categories) continue;

    for (const [categoryKey, subVal] of Object.entries(categories)) {
      addLabel(categoryKey);
      if (categoryKey === "_" && Array.isArray(subVal)) {
        for (const row of subVal as Array<Record<string, unknown>>) {
          addLabel(row.subcategory);
        }
      }
    }
  }

  return labels;
};

const hasMenuPermission = (user: UserLike, key: string): boolean | null => {
  const labels = collectPermissionLabels(user);
  if (labels.size === 0) return null;

  const hasKnownMenuSignals = [...labels].some(
    (label) => KNOWN_MENU_LABELS.has(label) || KNOWN_SUB_LABELS.has(label),
  );
  if (!hasKnownMenuSignals) {
    // Permission payload exists but does not match menu taxonomy; fall back to role.
    return null;
  }

  if (key === "settings") {
    const settingsRelated = [
      "settings",
      "integration",
      "tickets",
      "templates",
      "user",
    ];
    return settingsRelated.some((label) => labels.has(label));
  }

  const label = MENU_LABEL_BY_KEY[key];
  if (!label) return false;
  return labels.has(label);
};

const hasSubMenuPermission = (user: UserLike, subKey: string): boolean | null => {
  const labels = collectPermissionLabels(user);
  if (labels.size === 0) return null;
  const label = SUB_LABEL_BY_KEY[subKey];
  if (!label) return false;
  return labels.has(label);
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

  const nestedUser = asRecord(user.user);
  const roleObject = asRecord(user.role) ?? asRecord(nestedUser?.role);

  // Numeric role IDs from backend payloads.
  const idCandidates = [
    user.role_id,
    user.roleId,
    nestedUser?.role_id,
    nestedUser?.roleId,
    roleObject?.id,
  ];

  for (const idCandidate of idCandidates) {
    const mapped = roleFromId(idCandidate);
    if (mapped !== "unknown") return mapped;
  }

  // Backend-auth flags take priority when available.
  if (isTrueFlag(user.is_superuser) || isTrueFlag(nestedUser?.is_superuser)) {
    return "super_admin";
  }
  if (isTrueFlag(user.is_staff) || isTrueFlag(nestedUser?.is_staff)) {
    return "admin";
  }

  const accessToken = typeof user.access === "string" ? user.access : "";
  if (accessToken.includes(".")) {
    const payload = decodeJwtPayload(accessToken);
    if (payload) {
      if (isTrueFlag(payload.is_superuser)) return "super_admin";
      if (isTrueFlag(payload.is_staff)) return "admin";

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
    user.role_label,
    user.user_role,
    user.type,
    roleObject?.name,
    roleObject?.label,
    nestedUser?.designation_label,
    nestedUser?.designation,
    nestedUser?.role_name,
    nestedUser?.role,
    nestedUser?.role_label,
    nestedUser?.user_role,
    nestedUser?.type,
  ];

  for (const candidate of candidates) {
    const role = toKnownRole(normalize(candidate));
    if (role !== "unknown") return role;
  }

  return "unknown";
};

export const canAccessMenuKey = (
  role: KnownRole,
  key: string,
  user?: UserLike,
): boolean => {
  // Explicit super admin should never be blocked by label mismatches.
  if (role === "super_admin") return true;

  const permissionResult = hasMenuPermission(user, key);
  if (permissionResult !== null) return permissionResult;

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
  user?: UserLike,
): boolean => {
  // Explicit super admin should always see all settings subtabs.
  if (role === "super_admin") return true;

  const permissionResult = hasSubMenuPermission(user, subKey);
  if (permissionResult !== null) return permissionResult;

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

export const defaultPathForUser = (role: KnownRole, user?: UserLike): string => {
  const orderedKeys = [
    "dashboard",
    "reports",
    "leads",
    "referrals",
    "campaigns",
    "reputation",
    "pipeline",
    "settings",
  ];

  for (const key of orderedKeys) {
    if (canAccessMenuKey(role, key, user)) {
      if (key === "dashboard") return "/dashboard";
      if (key === "reports") return "/reports";
      if (key === "leads") return "/leads";
      if (key === "referrals") return "/referrals";
      if (key === "campaigns") return "/campaigns";
      if (key === "reputation") return "/reputation";
      if (key === "pipeline") return "/pipeline";
      if (key === "settings") return "/settings";
    }
  }

  return defaultPathForRole(role);
};
