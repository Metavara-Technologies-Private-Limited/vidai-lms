type KnownRole = "super_admin" | "admin" | "user" | "unknown";

type UserLike = Record<string, unknown> | null | undefined;

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

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

const SUB_LABEL_ALIASES: Record<string, string[]> = {
  integration: ["integration", "integrations"],
  tickets: ["tickets", "ticket"],
  templates: ["templates", "template"],
  users: ["user", "users"],
};

const KNOWN_MENU_LABELS = new Set(Object.values(MENU_LABEL_BY_KEY));
const KNOWN_SUB_LABELS = new Set(Object.values(SUB_LABEL_BY_KEY));

type PermissionState = {
  labels: Set<string>;
  hasPermissionContainer: boolean;
  hasPermissionPayload: boolean;
};

const rowCanView = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return isTrueFlag(row.can_view) || isTrueFlag(row.canView);
};

const rowsContainView = (value: unknown): boolean => {
  if (!Array.isArray(value)) return false;
  return value.some((row) => rowCanView(row));
};

const collectPermissionState = (user: UserLike): PermissionState => {
  const labels = new Set<string>();
  const nestedUser = asRecord(user?.user);
  const permissions = user?.permissions ?? nestedUser?.permissions;
  const permsRecord = asRecord(permissions);

  const addLabel = (value: unknown) => {
    const label = normalize(value);
    if (label && label !== "_") labels.add(label);
  };

  if (!permsRecord) {
    return {
      labels,
      hasPermissionContainer: false,
      hasPermissionPayload: false,
    };
  }

  const hasPermissionContainer = true;
  let hasPermissionPayload = false;

  // Shape A: permissions.modules = [{name, submodules:[{name, type:[{name}]}]}]
  if (Array.isArray(permsRecord.modules)) {
    if (permsRecord.modules.length > 0) {
      hasPermissionPayload = true;
    }
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
    if (moduleKey === "modules") continue;

    const categories = asRecord(categoriesVal);
    if (!categories) {
      if (Array.isArray(categoriesVal) && categoriesVal.length > 0) {
        hasPermissionPayload = true;
      }
      continue;
    }

    if (Object.keys(categories).length > 0) {
      hasPermissionPayload = true;
    }

    if (
      moduleKey !== "_" &&
      Object.values(categories).some((value) => rowsContainView(value))
    ) {
      addLabel(moduleKey);
    }

    for (const [categoryKey, subVal] of Object.entries(categories)) {
      if (categoryKey !== "_" && rowsContainView(subVal)) {
        addLabel(categoryKey);
      }

      // Subcategory permissions are often sent under "_" category; honor
      // explicit can_view on each subcategory row even if parent category
      // was not selected.
      if (Array.isArray(subVal)) {
        for (const row of subVal) {
          if (!rowCanView(row)) continue;
          if (!row || typeof row !== "object") continue;
          const rec = row as Record<string, unknown>;
          const subcategory = rec.subcategory ?? rec.subcategory_key;
          addLabel(subcategory);
        }
      }
    }
  }

  return { labels, hasPermissionContainer, hasPermissionPayload };
};

const hasMenuPermission = (user: UserLike, key: string): boolean | null => {
  const { labels, hasPermissionContainer, hasPermissionPayload } =
    collectPermissionState(user);
  if (!hasPermissionContainer) return null;

  // When a permissions container exists, always use it deterministically.
  // If no permission payload is granted, deny by default.
  if (!hasPermissionPayload) {
    return false;
  }

  // If a real payload exists but no labels could be parsed, deny instead of
  // role fallback to avoid show/hide glitches.
  if (labels.size === 0) {
    return false;
  }

  const hasKnownMenuSignals = [...labels].some(
    (label) => KNOWN_MENU_LABELS.has(label) || KNOWN_SUB_LABELS.has(label),
  );
  if (!hasKnownMenuSignals) {
    // Explicit permissions exist; deny by default when no known grants are present.
    return false;
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

const hasSubMenuPermission = (
  user: UserLike,
  subKey: string,
): boolean | null => {
  const { labels, hasPermissionContainer, hasPermissionPayload } =
    collectPermissionState(user);
  if (!hasPermissionContainer) return null;

  if (!hasPermissionPayload) {
    return false;
  }

  if (labels.size === 0) {
    return false;
  }

  const hasKnownSignals = [...labels].some(
    (label) => KNOWN_MENU_LABELS.has(label) || KNOWN_SUB_LABELS.has(label),
  );

  if (!hasKnownSignals) {
    // Permission payload exists but does not map cleanly to sidebar taxonomy.
    return false;
  }

  const aliases = SUB_LABEL_ALIASES[subKey];
  if (!aliases || aliases.length === 0) {
    const label = SUB_LABEL_BY_KEY[subKey];
    return label ? labels.has(label) : false;
  }

  return aliases.some((alias) => labels.has(alias));
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

export const defaultPathForUser = (
  role: KnownRole,
  user?: UserLike,
): string => {
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

const hasActionFlag = (
  row: Record<string, unknown>,
  action: "view" | "add" | "edit" | "print",
): boolean => {
  const snakeKey = `can_${action}`;
  const compactKey = `can${action}`;
  const camelKey = `can${action.charAt(0).toUpperCase()}${action.slice(1)}`;

  return (
    isTrueFlag(row[snakeKey]) ||
    isTrueFlag(row[compactKey]) ||
    isTrueFlag(row[camelKey]) ||
    isTrueFlag(row[action])
  );
};

export const hasSubcategoryActionPermission = (
  permissions: unknown,
  subcategory: string,
  action: "view" | "add" | "edit" | "print",
): boolean => {
  if (!permissions || typeof permissions !== "object") return false;

  const normalizePermissionKey = (value: unknown): string =>
    normalize(value).replace(/[^a-z0-9]/g, "");

  const normalized = normalizePermissionKey(subcategory);
  const aliases = new Set<string>([normalized]);
  if (normalized.endsWith("s")) aliases.add(normalized.slice(0, -1));
  else aliases.add(`${normalized}s`);

  const root = permissions as Record<string, unknown>;

  const rowMatchesSubcategory = (
    row: Record<string, unknown>,
    fallbackLabel?: string,
  ): boolean => {
    const subValue = normalizePermissionKey(row.subcategory ?? row.subcategory_key);
    const categoryValue = normalizePermissionKey(
      row.category ?? row.category_key,
    );
    const moduleValue = normalizePermissionKey(row.module ?? row.module_key);
    const fallbackValue = normalizePermissionKey(fallbackLabel);

    if (subValue && aliases.has(subValue)) return true;
    if (!subValue && aliases.has(categoryValue)) return true;

    if (!subValue && !categoryValue && aliases.has(moduleValue)) return true;

    // Some API shapes store the permission label in the parent object key
    // and keep row fields null (subcategory/category/module missing).
    return !subValue && !categoryValue && !moduleValue && aliases.has(fallbackValue);
  };

  const rowsAllowAction = (value: unknown, fallbackLabel?: string): boolean => {
    if (!Array.isArray(value)) return false;
    return value.some((row) => {
      if (!row || typeof row !== "object") return false;
      const rec = row as Record<string, unknown>;
      return rowMatchesSubcategory(rec, fallbackLabel) && hasActionFlag(rec, action);
    });
  };

  for (const [moduleKey, moduleValue] of Object.entries(root)) {
    if (!moduleValue || typeof moduleValue !== "object") continue;
    for (const [categoryKey, categoryValue] of Object.entries(
      moduleValue as Record<string, unknown>,
    )) {
      if (rowsAllowAction(categoryValue, categoryKey)) return true;

      // If category key is wildcard-like, fall back to module key label.
      if (
        rowsAllowAction(categoryValue, categoryKey === "_" ? moduleKey : categoryKey)
      ) {
        return true;
      }
    }
  }

  if (rowsAllowAction(root[normalized], normalized)) return true;

  for (const [rootKey, rootValue] of Object.entries(root)) {
    if (
      aliases.has(normalizePermissionKey(rootKey)) &&
      rowsAllowAction(rootValue, rootKey)
    ) {
      return true;
    }
  }

  if (Array.isArray(root.modules)) {
    for (const moduleItem of root.modules as Array<Record<string, unknown>>) {
      const submodules = Array.isArray(moduleItem.submodules)
        ? (moduleItem.submodules as Array<Record<string, unknown>>)
        : [];

      for (const sub of submodules) {
        const subName = normalizePermissionKey(sub.name);
        if (!aliases.has(subName)) continue;

        const permissionRows = Array.isArray(sub.permissions)
          ? (sub.permissions as Array<Record<string, unknown>>)
          : Array.isArray(sub.type)
            ? (sub.type as Array<Record<string, unknown>>)
            : [];

        if (
          permissionRows.some(
            (row) => row && typeof row === "object" && hasActionFlag(row, action),
          )
        ) {
          return true;
        }
      }
    }
  }

  return false;
};

export const hasAnySubcategoryActionPermission = (
  permissions: unknown,
  subcategories: string[],
  action: "view" | "add" | "edit" | "print",
): boolean => {
  return subcategories.some((subcategory) =>
    hasSubcategoryActionPermission(permissions, subcategory, action),
  );
};
