import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useDispatch, useSelector } from "react-redux";
import { LEADS_MENU } from "../../../../config/sidebar.menu";
import { selectUser, setUser } from "../../../../store/authSlice";
import type { AppDispatch } from "../../../../store";
import {
  hasAnySubcategoryActionPermission,
  resolveUserRole,
} from "../../../../utils/roleAccess";
import {
  roleApi,
  type RolePermissionPayload,
  type RoleRead,
} from "../../../../services/role.api.ts";
import { authApi } from "../../../../services/auth.api";
import { usersApi, type UserRecord, type UserPermissionRecord } from "../../../../services/users.api";

type RoleName = "Super Admin" | "Admin" | "User";

type PermissionFlags = {
  add: boolean;
  edit: boolean;
  view: boolean;
  print: boolean;
};

type RoleRights = {
  modules: string[];
  categories: string[];
  subCategories: string[];
};

type RoleEntry = {
  apiId: number | null;  // backend id, null for unsaved
  name: RoleName;
  count: number;
  badge: number;
  checked: boolean;
  rights: RoleRights;
  permissions: Record<string, PermissionFlags>;
};

// ──────────────────────────────────────────────────────────────────────────────
// API ↔ UI mapping helpers
// Modules   → module_key = item, category_key = "_", subcategory_key = null
// Categories → module_key = "_", category_key = item, subcategory_key = null
// SubCats   → module_key = "_", category_key = "_", subcategory_key = item
// ──────────────────────────────────────────────────────────────────────────────
const flagsFromApiPerm = (p: RolePermissionPayload): PermissionFlags => ({
  add: p.can_add,
  edit: p.can_edit,
  view: p.can_view,
  print: p.can_print,
});

const normalizePermissionLabel = (value: string): string =>
  value.trim().toLowerCase();

const compactUnique = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of items) {
    const item = String(raw ?? "").trim();
    if (!item || item === "_") continue;
    const key = normalizePermissionLabel(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
};

const fromApiRole = (r: RoleRead): Partial<RoleEntry> => {
  const rights: RoleRights = { modules: [], categories: [], subCategories: [] };
  const permissions: Record<string, PermissionFlags> = {};

  for (const p of r.permissions) {
    if (p.module_key !== "_") {
      rights.modules.push(p.module_key);
      permissions[p.module_key] = flagsFromApiPerm(p);
    } else if (p.category_key !== "_") {
      rights.categories.push(p.category_key);
      permissions[p.category_key] = flagsFromApiPerm(p);
    } else if (p.subcategory_key) {
      rights.subCategories.push(p.subcategory_key);
      permissions[p.subcategory_key] = flagsFromApiPerm(p);
    }
  }

  rights.modules = compactUnique(rights.modules);
  rights.categories = compactUnique(rights.categories);
  rights.subCategories = compactUnique(rights.subCategories);

  return { apiId: r.id, rights, permissions };
};

const userPermissionsToRights = (
  apiPerms: UserPermissionRecord[],
): { rights: RoleRights; permissions: Record<string, PermissionFlags> } => {
  const rights: RoleRights = { modules: [], categories: [], subCategories: [] };
  const permissions: Record<string, PermissionFlags> = {};

  for (const p of apiPerms) {
    const flags: PermissionFlags = {
      add: p.can_add,
      edit: p.can_edit,
      view: p.can_view,
      print: p.can_print,
    };
    if (p.module_key !== "_") {
      rights.modules.push(p.module_key);
      permissions[p.module_key] = flags;
    } else if (p.category_key !== "_") {
      rights.categories.push(p.category_key);
      permissions[p.category_key] = flags;
    } else if (p.subcategory_key) {
      rights.subCategories.push(p.subcategory_key);
      permissions[p.subcategory_key] = flags;
    }
  }

  rights.modules = compactUnique(rights.modules);
  rights.categories = compactUnique(rights.categories);
  rights.subCategories = compactUnique(rights.subCategories);

  return { rights, permissions };
};

const rightsToUserPermissions = (
  rights: RoleRights,
  perms: Record<string, PermissionFlags>,
): UserPermissionRecord[] => {
  const result: UserPermissionRecord[] = [];

  for (const item of compactUnique(rights.modules)) {
    const flags = perms[item] ?? emptyPerm();
    result.push({ module_key: item, category_key: "_", subcategory_key: null, can_view: flags.view, can_add: flags.add, can_edit: flags.edit, can_print: flags.print });
  }

  for (const item of compactUnique(rights.categories)) {
    const flags = perms[item] ?? emptyPerm();
    result.push({ module_key: "_", category_key: item, subcategory_key: null, can_view: flags.view, can_add: flags.add, can_edit: flags.edit, can_print: flags.print });
  }

  for (const item of compactUnique(rights.subCategories)) {
    const flags = perms[item] ?? emptyPerm();
    result.push({ module_key: "_", category_key: "_", subcategory_key: item, can_view: flags.view, can_add: flags.add, can_edit: flags.edit, can_print: flags.print });
  }

  return result;
};

const toApiPermissions = (
  rights: RoleRights,
  perms: Record<string, PermissionFlags>,
  existingApiPerms: RolePermissionPayload[] = [],
): RolePermissionPayload[] => {
  // Build a map of existing perm ids by permission type + normalized label.
  // This avoids collisions when labels repeat across different levels.
  const existingById: Record<string, number> = {};
  for (const p of existingApiPerms) {
    if (p.id === undefined) continue;

    if (p.module_key !== "_") {
      existingById[`module:${normalizePermissionLabel(p.module_key)}`] = p.id;
      continue;
    }

    if (p.category_key !== "_") {
      existingById[`category:${normalizePermissionLabel(p.category_key)}`] = p.id;
      continue;
    }

    const sub = (p.subcategory_key ?? "").trim();
    if (sub) {
      existingById[`subcategory:${normalizePermissionLabel(sub)}`] = p.id;
    }
  }

  const build = (
    kind: "module" | "category" | "subcategory",
    items: string[],
    toObj: (item: string) => Omit<RolePermissionPayload, "id" | "can_view" | "can_add" | "can_edit" | "can_print">,
  ): RolePermissionPayload[] =>
    compactUnique(items).map((item) => {
      const flags = perms[item] ?? { add: false, edit: false, view: false, print: false };
      const base: RolePermissionPayload = {
        ...toObj(item),
        can_view: flags.view,
        can_add: flags.add,
        can_edit: flags.edit,
        can_print: flags.print,
      };
      const idKey = `${kind}:${normalizePermissionLabel(item)}`;
      if (existingById[idKey] !== undefined) base.id = existingById[idKey];
      return base;
    });

  return [
    ...build("module", rights.modules, (item) => ({ module_key: item, category_key: "_", subcategory_key: null })),
    ...build("category", rights.categories, (item) => ({ module_key: "_", category_key: item, subcategory_key: null })),
    ...build("subcategory", rights.subCategories, (item) => ({ module_key: "_", category_key: "_", subcategory_key: item })),
  ];
};

type Props = {
  onCancel: () => void;
  onSave: () => void;
};

type ViewMode = "empty" | "summary" | "edit" | "user-summary" | "user-edit";

const STEP_LABELS = ["Module", "Category", "Sub Category"];
const MODULE_OPTIONS = ["Vidai Leads"];
const FALLBACK_SUBCATEGORY_OPTIONS = ["Integration", "Tickets", "Templates", "User"];
const EXCLUDED_ROW_LABELS = new Set(["vidai leads"]);

const emptyPerm = (): PermissionFlags => ({
  add: false,
  edit: false,
  view: false,
  print: false,
});

const emptyRights = (): RoleRights => ({ modules: [], categories: [], subCategories: [] });

const buildDefaultRole = (name: RoleName, count: number, badge: number): RoleEntry => {
  return {
    apiId: null,
    name,
    count,
    badge,
    checked: false,
    rights: emptyRights(),
    permissions: {},
  };
};

const initialRoles: RoleEntry[] = [
  buildDefaultRole("Super Admin", 0, 0),
  buildDefaultRole("Admin", 0, 0),
  buildDefaultRole("User", 0, 0),
];

const normalizeRoleKey = (value: string): string =>
  value.trim().toLowerCase().replace(/[-_\s]+/g, "");

const shouldShowPermissionRow = (label: string): boolean =>
  !EXCLUDED_ROW_LABELS.has(normalizePermissionLabel(label));

const roleMatches = (roleName: string, userRole: string): boolean => {
  const roleKey = normalizeRoleKey(roleName);
  const userRoleKey = normalizeRoleKey(userRole);

  if (roleKey === "superadmin") {
    return userRoleKey === "superadmin";
  }

  return roleKey === userRoleKey;
};

const Tick = ({ checked, onClick }: { checked: boolean; onClick?: () => void }) => (
  <Box
    onClick={onClick}
    sx={{
      width: 22,
      height: 22,
      borderRadius: "4px",
      border: checked ? "none" : "1px solid #D5D5D5",
      bgcolor: checked ? "#DDF2E3" : "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: onClick ? "pointer" : "default",
      mx: "auto",
      flexShrink: 0,
    }}
  >
    {checked ? <CheckIcon sx={{ fontSize: 14, color: "#43B45B" }} /> : null}
  </Box>
);

const StepDot = ({
  index,
  label,
  active,
  done,
  onClick,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
  onClick?: () => void;
}) => (
  <Box
    onClick={onClick}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 0.8,
      cursor: onClick ? "pointer" : "default",
      userSelect: "none",
    }}
  >
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: done ? "#3FAE53" : active ? "#E97B5A" : "#C9C9C9",
        color: "#fff",
        fontSize: 15,
        fontWeight: 700,
      }}
    >
      {done ? <CheckIcon sx={{ fontSize: 18 }} /> : index + 1}
    </Box>
    <Typography
      sx={{
        fontSize: 15,
        fontWeight: 600,
        color: done ? "#3FAE53" : active ? "#E97B5A" : "#B2B2B2",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const StepConnector = ({ done }: { done: boolean }) => (
  <Box
    sx={{
      flex: 1,
      height: 2,
      minWidth: 72,
      bgcolor: done ? "#3FAE53" : "#D7D7D7",
      mx: 1.5,
      borderRadius: 999,
      alignSelf: "center",
      opacity: 1,
    }}
  />
);

const getItemType = (label: string, rights: RoleRights): "module" | "category" | "subcategory" => {
  if (rights.modules.includes(label)) return "module";
  if (rights.categories.includes(label)) return "category";
  return "subcategory";
};

const chipStyleByType: Record<"module" | "category" | "subcategory", { border: string; bg: string }> = {
  module: { border: "#6E97F7", bg: "#F4F8FF" },
  category: { border: "#6CC27D", bg: "#F2FBF4" },
  subcategory: { border: "#F0A36A", bg: "#FFF8F2" },
};

const UserRightsForm: React.FC<Props> = ({ onSave }) => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isCompactDesktop = useMediaQuery(theme.breakpoints.down("xl"));
  const isTabletDown = useMediaQuery(theme.breakpoints.down("lg"));
  const user = useSelector(selectUser);
  const authUser = user as unknown as Record<string, unknown> | null;
  const authRole = resolveUserRole(authUser);
  const permissions = authUser?.permissions;
  const userRightsAliases = ["user", "users"];
  const isSuperAdmin = authRole === "super_admin";
  const canViewUserRights =
    isSuperAdmin ||
    hasAnySubcategoryActionPermission(permissions, userRightsAliases, "view") ||
    hasAnySubcategoryActionPermission(permissions, userRightsAliases, "print");
  const canManageUserRights =
    isSuperAdmin ||
    hasAnySubcategoryActionPermission(permissions, userRightsAliases, "add") ||
    hasAnySubcategoryActionPermission(permissions, userRightsAliases, "edit");

  const [roles, setRoles] = useState<RoleEntry[]>(initialRoles);
  const [roleUsersMap, setRoleUsersMap] = useState<Record<RoleName, UserRecord[]>>({
    "Super Admin": [],
    Admin: [],
    User: [],
  });
  const [selectedRoleIdx, setSelectedRoleIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<ViewMode>("empty");
  const [activeStep, setActiveStep] = useState(0);
  const [draftRights, setDraftRights] = useState<RoleRights>(emptyRights());
  const [draftPerms, setDraftPerms] = useState<Record<string, PermissionFlags>>({});
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedRoleName, setExpandedRoleName] = useState<RoleName | null>(null);
  const [selectedUserIdsByRole, setSelectedUserIdsByRole] = useState<
    Record<RoleName, Set<number>>
  >({
    "Super Admin": new Set<number>(),
    Admin: new Set<number>(),
    User: new Set<number>(),
  });

  // Individual user permission state
  const [focusedUser, setFocusedUser] = useState<UserRecord | null>(null);
  const [loadingUserPerms, setLoadingUserPerms] = useState(false);
  const [userHasIndividualPerms, setUserHasIndividualPerms] = useState(false);

  // ── Fetch roles from backend ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    roleApi.list()
      .then((apiRoles: RoleRead[]) => {
        if (cancelled) return;
        setRoles((prev) =>
          prev.map((entry) => {
            const found = apiRoles.find(
              (r: RoleRead) => normalizeRoleKey(r.name) === normalizeRoleKey(entry.name),
            );
            if (!found) return entry;
            const mapped = fromApiRole(found);
            return {
              ...entry,
              apiId: mapped.apiId ?? null,
              rights: mapped.rights ?? entry.rights,
              permissions: mapped.permissions ?? entry.permissions,
            };
          }),
        );
      })
      .catch(() => {/* silently fall back to defaults */})
      .finally(() => { if (!cancelled) setLoadingRoles(false); });

    usersApi
      .list()
      .then((users: UserRecord[]) => {
        if (cancelled) return;

        // Merge by source-independent identity so local/client datasets do not double-count.
        const seen = new Set<string>();
        const mergedUsers = users.filter((user) => {
          const key =
            (user.email || "").trim().toLowerCase() ||
            (user.username || "").trim().toLowerCase() ||
            `id:${user.id}`;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const groupedUsers: Record<RoleName, UserRecord[]> = {
          "Super Admin": mergedUsers.filter((u) =>
            roleMatches("Super Admin", String(u.role || "")),
          ),
          Admin: mergedUsers.filter((u) =>
            roleMatches("Admin", String(u.role || "")),
          ),
          User: mergedUsers.filter((u) => roleMatches("User", String(u.role || ""))),
        };

        setRoleUsersMap(groupedUsers);

        setRoles((prev) =>
          prev.map((entry) => {
            const count = groupedUsers[entry.name]?.length ?? 0;
            return {
              ...entry,
              count,
              badge: count,
            };
          }),
        );
      })
      .catch(() => {
        // Keep defaults if user list fails.
      });

    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => LEADS_MENU.map((item) => item.label), []);
  const subCategories = useMemo(() => {
    const settings = LEADS_MENU.find((item) => item.key === "settings");
    const dynamic = settings?.subMenu?.map((item) => item.label) ?? [];
    const merged = [...dynamic, ...FALLBACK_SUBCATEGORY_OPTIONS];
    return Array.from(new Set(merged));
  }, []);

  const activeRole = selectedRoleIdx !== null ? roles[selectedRoleIdx] : null;

  useEffect(() => {
    if (canManageUserRights) return;
    if (mode === "edit") {
      setMode("summary");
    }
  }, [canManageUserRights, mode]);

  const optionList = activeStep === 0 ? MODULE_OPTIONS : activeStep === 1 ? categories : subCategories;
  const rightsKey: keyof RoleRights = activeStep === 0 ? "modules" : activeStep === 1 ? "categories" : "subCategories";

  const allSelected = optionList.length > 0 && draftRights[rightsKey].length === optionList.length;
  const hasStepSelection = draftRights[rightsKey].length > 0;
  const hasAnySelection =
    draftRights.categories.length > 0 ||
    draftRights.subCategories.length > 0;

  const summaryRows = useMemo(() => {
    if (!activeRole) return [] as { label: string; perm: PermissionFlags }[];

    // Always show the complete module list in summary view.
    // Includes top-level modules (Dashboard, Campaign, Leads Hub, etc.) plus sub-modules.
    // Selected permissions render green ticks; unselected stay as empty boxes.
    const allModuleLabels = Array.from(new Set([...categories, ...subCategories]))
      .filter(shouldShowPermissionRow);

    return allModuleLabels.map((label) => ({
      label,
      perm: activeRole.permissions[label] ?? emptyPerm(),
    }));
  }, [activeRole, categories, subCategories]);

  const editRows = useMemo(() => {
    const labels = Array.from(
      new Set([...draftRights.modules, ...draftRights.categories, ...draftRights.subCategories]),
    ).filter(shouldShowPermissionRow);
    return labels.map((label) => ({ label, perm: draftPerms[label] ?? emptyPerm() }));
  }, [draftRights, draftPerms]);

  const selectRole = (idx: number) => {
    const role = roles[idx];

    setRoles((prev) => prev.map((r, i) => ({ ...r, checked: i === idx })));
    setSelectedRoleIdx(idx);
    setDraftRights(role.rights);
    setDraftPerms(role.permissions);
    setActiveStep(0);
    setMode("summary");
    setFocusedUser(null);
  };

  const openUserPermissions = (user: UserRecord) => {
    if (!canViewUserRights) return;
    setFocusedUser(user);
    setLoadingUserPerms(true);
    setMode("user-summary");

    usersApi.getIndividualPermissions(user.id)
      .then((apiPerms) => {
        const hasOwn = apiPerms.length > 0;
        setUserHasIndividualPerms(hasOwn);
        if (hasOwn) {
          const { rights, permissions } = userPermissionsToRights(apiPerms);
          setDraftRights(rights);
          setDraftPerms(permissions);
        } else {
          // Fall back to the role's permissions
          const roleForUser = roles.find((r) => r.name.toLowerCase() === (user.role || "").toLowerCase());
          setDraftRights(roleForUser?.rights ?? emptyRights());
          setDraftPerms(roleForUser?.permissions ?? {});
        }
      })
      .catch(() => {
        const roleForUser = roles.find((r) => r.name.toLowerCase() === (user.role || "").toLowerCase());
        setDraftRights(roleForUser?.rights ?? emptyRights());
        setDraftPerms(roleForUser?.permissions ?? {});
        setUserHasIndividualPerms(false);
      })
      .finally(() => setLoadingUserPerms(false));
  };

  const toggleOption = (label: string, checked: boolean) => {
    if (!canManageUserRights) return;
    setDraftRights((prev) => {
      const values = prev[rightsKey];
      const next = checked ? [...new Set([...values, label])] : values.filter((item) => item !== label);
      return { ...prev, [rightsKey]: next };
    });

    if (checked) {
      setDraftPerms((prev) => ({ ...prev, [label]: prev[label] ?? emptyPerm() }));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!canManageUserRights) return;
    setDraftRights((prev) => ({
      ...prev,
      [rightsKey]: checked ? [...optionList] : [],
    }));

    if (checked) {
      setDraftPerms((prev) => {
        const next = { ...prev };
        optionList.forEach((item) => {
          next[item] = next[item] ?? emptyPerm();
        });
        return next;
      });
    }
  };

  const togglePerm = (label: string, key: keyof PermissionFlags) => {
    if (!canManageUserRights) return;
    setDraftPerms((prev) => {
      const base = prev[label] ?? emptyPerm();
      return { ...prev, [label]: { ...base, [key]: !base[key] } };
    });
  };

  const removeRow = (label: string) => {
    if (!canManageUserRights) return;
    setDraftRights((prev) => ({
      modules: prev.modules.filter((item) => item !== label),
      categories: prev.categories.filter((item) => item !== label),
      subCategories: prev.subCategories.filter((item) => item !== label),
    }));
  };

  const persistRole = () => {
    if (selectedRoleIdx === null) return;
    setRoles((prev) =>
      prev.map((role, idx) => (idx === selectedRoleIdx ? { ...role, rights: draftRights, permissions: draftPerms } : role)),
    );
  };

  const handleEditClick = () => {
    if (!canManageUserRights) return;
    if (!activeRole) return;
    setDraftRights(activeRole.rights);
    setDraftPerms(activeRole.permissions);
    setActiveStep(0);
    setMode("edit");
  };

  const handleNext = () => {
    if (!canManageUserRights) return;
    if (activeStep < 2) {
      setActiveStep((prev) => prev + 1);
      return;
    }
    persistRole();
    setMode("summary");
  };

  const handleSave = () => {
    if (!canManageUserRights) return;
    persistRole();
  };

  const handleSaveGrant = async () => {
    if (!canManageUserRights) return;
    if (selectedRoleIdx === null) return;
    persistRole();

    const role = roles[selectedRoleIdx];
    // Use the freshly persisted values from draftRights/draftPerms
    const rights = draftRights;
    const perms = draftPerms;
    const name = role.name;

    // Gather existing API perm objects for id-passing on update
    const existingApiPerms: RolePermissionPayload[] = role.apiId !== null
      ? await roleApi.list()
          .then((list: RoleRead[]) => list.find((r: RoleRead) => r.id === role.apiId)?.permissions ?? [])
          .catch(() => [])
      : [];

    const payload = {
      name,
      permissions: toApiPermissions(rights, perms, existingApiPerms),
    };

    setSaving(true);
    try {
      let saved: RoleRead;
      if (role.apiId !== null) {
        saved = await roleApi.update(role.apiId, payload);
      } else {
        saved = await roleApi.create(payload);
      }
      // Sync apiId back to local state
      setRoles((prev) =>
        prev.map((r, i) =>
          i === selectedRoleIdx ? { ...r, apiId: saved.id } : r,
        ),
      );

      const selectedIds = Array.from(selectedUserIdsByRole[name]);
      if (selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((userId) =>
            usersApi.update(userId, {
              role: saved.id,
            }),
          ),
        );
      }

      setMode("summary");
      onSave();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { name?: string[]; detail?: string; non_field_errors?: string[] } } })
          ?.response?.data?.name?.[0] ??
        (err as { response?: { data?: { non_field_errors?: string[] } } })
          ?.response?.data?.non_field_errors?.[0] ??
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to save role. Please try again.";
      const { toast } = await import("react-toastify");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserPermissions = async () => {
    if (!canManageUserRights || !focusedUser) return;
    const permissions = rightsToUserPermissions(draftRights, draftPerms);
    setSaving(true);
    try {
      await usersApi.saveIndividualPermissions(focusedUser.id, permissions);

      const authUserId = Number((authUser?.id ?? authUser?.user_id) ?? 0);
      if (authUserId > 0 && focusedUser.id === authUserId && authUser) {
        const myPermPayload = await authApi.getMyPermissions().catch(() => null);
        if (myPermPayload && typeof myPermPayload === "object") {
          const merged = {
            ...(authUser as Record<string, unknown>),
            permissions:
              (myPermPayload as { permissions?: unknown }).permissions ??
              (authUser as Record<string, unknown>).permissions,
          };
          dispatch(setUser(merged as never));
        }
      }

      setUserHasIndividualPerms(permissions.length > 0);
      setMode("user-summary");
      onSave();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to save user permissions.";
      const { toast } = await import("react-toastify");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetUserPermissions = async () => {
    if (!canManageUserRights || !focusedUser) return;
    setSaving(true);
    try {
      await usersApi.clearIndividualPermissions(focusedUser.id);
      // Reload from role
      const roleForUser = roles.find((r) => r.name.toLowerCase() === (focusedUser.role || "").toLowerCase());
      setDraftRights(roleForUser?.rights ?? emptyRights());
      setDraftPerms(roleForUser?.permissions ?? {});
      setUserHasIndividualPerms(false);
      setMode("user-summary");
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to reset user permissions.";
      const { toast } = await import("react-toastify");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleRoleUsersExpand = (
    event: React.MouseEvent<HTMLElement>,
    roleName: RoleName,
  ) => {
    event.stopPropagation();
    setExpandedRoleName((prev) => (prev === roleName ? null : roleName));
  };

  const toggleUserSelection = (roleName: RoleName, userId: number) => {
    if (!canManageUserRights) return;
    setSelectedUserIdsByRole((prev) => {
      const nextSet = new Set(prev[roleName]);
      if (nextSet.has(userId)) {
        nextSet.delete(userId);
      } else {
        nextSet.add(userId);
      }
      return {
        ...prev,
        [roleName]: nextSet,
      };
    });
  };

  const toggleAllUsersSelection = (roleName: RoleName, checked: boolean) => {
    if (!canManageUserRights) return;
    setSelectedUserIdsByRole((prev) => {
      const users = roleUsersMap[roleName] ?? [];
      return {
        ...prev,
        [roleName]: checked ? new Set(users.map((u) => u.id)) : new Set<number>(),
      };
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        flexDirection: isTabletDown ? "column" : "row",
      }}
    >
      {!canViewUserRights ? (
        <Box
          sx={{
            width: "100%",
            border: "1px solid #E0E0E0",
            borderRadius: "10px",
            bgcolor: "#fff",
            p: 3,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#B45309" }}>
            You do not have permission to view User Rights.
          </Typography>
        </Box>
      ) : null}

      {canViewUserRights ? (
      <>
      <Box
        sx={{
          width: { xs: "100%", lg: 340, xl: 360 },
          maxWidth: "100%",
          flexShrink: 0,
          border: "1px solid #E0E0E0",
          borderRadius: "10px",
          bgcolor: "#fff",
          p: 2,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.6, color: "#1F1F1F" }}>All Roles</Typography>

        {loadingRoles ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          roles.map((role, idx) => {
            const isExpanded = expandedRoleName === role.name;
            const roleUsers = roleUsersMap[role.name] ?? [];
            const selectedIds = selectedUserIdsByRole[role.name] ?? new Set<number>();
            const allChecked =
              roleUsers.length > 0 && roleUsers.every((u) => selectedIds.has(u.id));

            return (
              <Box key={role.name} sx={{ borderRadius: "8px", mb: 0.4 }}>
                <Box
                  onClick={() => selectRole(idx)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    py: 0.65,
                    px: 0.4,
                    borderRadius: "6px",
                    cursor: "pointer",
                    bgcolor: role.checked ? "#FFF3EE" : "transparent",
                    "&:hover": { bgcolor: "#FFF8F5" },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={role.checked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => selectRole(idx)}
                    sx={{ p: 0, mr: 0.9, color: "#909090", "&.Mui-checked": { color: "#1F1F1F" } }}
                  />
                  <Typography sx={{ fontSize: 14, flex: 1, color: "#1F1F1F" }}>
                    {role.name} <Box component="span" sx={{ color: "#738091", fontSize: 13 }}>({role.count})</Box>
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#FF8181", mr: 0.8 }}>{String(role.badge).padStart(2, "0")}</Typography>
                  <IconButton
                    size="small"
                    sx={{ p: 0.1, bgcolor: "#F2F2F2", borderRadius: "4px" }}
                    onClick={(e) => toggleRoleUsersExpand(e, role.name)}
                  >
                    {isExpanded ? (
                      <KeyboardArrowUpIcon sx={{ fontSize: 16, color: "#A3A3A3" }} />
                    ) : (
                      <AddIcon sx={{ fontSize: 16, color: "#A3A3A3" }} />
                    )}
                  </IconButton>
                </Box>

                {isExpanded ? (
                  <Box
                    sx={{
                      bgcolor: "#F8F8F8",
                      borderRadius: "8px",
                      px: 1,
                      py: 0.8,
                      ml: 3.2,
                      mr: 0.6,
                      mb: 0.5,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={allChecked}
                          onChange={(e) => toggleAllUsersSelection(role.name, e.target.checked)}
                          sx={{ p: 0, mr: 0.8 }}
                        />
                      }
                      label={<Typography sx={{ fontSize: 12 }}>Select All</Typography>}
                      sx={{ m: 0, mb: 0.6 }}
                    />

                    {roleUsers.length === 0 ? (
                      <Typography sx={{ fontSize: 12, color: "#8A8A8A", py: 0.4 }}>
                        No users found.
                      </Typography>
                    ) : (
                      <Box sx={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {roleUsers.map((user) => (
                          <Box
                            key={user.id}
                            onClick={() => openUserPermissions(user)}
                            sx={{
                              px: 1,
                              py: 0.6,
                              borderRadius: "6px",
                              bgcolor: focusedUser?.id === user.id ? "#FFF3EE" : "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.8,
                              cursor: "pointer",
                              "&:hover": { bgcolor: "#FFF8F5" },
                            }}
                          >
                            <Checkbox
                              size="small"
                              checked={selectedIds.has(user.id)}
                              onChange={() => toggleUserSelection(role.name, user.id)}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ p: 0 }}
                            />
                            <Typography sx={{ fontSize: 12, color: "#2F2F2F", flex: 1 }}>
                              {user.username || user.email || `User ${user.id}`}
                            </Typography>
                            <PersonOutlineIcon sx={{ fontSize: 16, color: "#E17E61" }} />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : null}
              </Box>
            );
          })
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
        {mode === "empty" && (
          <Box
            sx={{
              border: "1px solid #E0E0E0",
              borderRadius: "10px",
              bgcolor: "#fff",
              minHeight: 520,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: 20, color: "#6B7480", mb: 1 }}>Select a Role or User to Continue</Typography>
            <Typography sx={{ fontSize: 13, color: "#A3AAB1" }}>
              Please select a role or individual users from the left panel to configure page access permissions.
            </Typography>
          </Box>
        )}

        {mode === "summary" && activeRole && (
          <Box sx={{ border: "1px solid #E0E0E0", borderRadius: "10px", bgcolor: "#fff", p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
                bgcolor: "#F6F6F6",
                borderRadius: "10px",
                px: 2,
                py: 1.2,
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{activeRole.name.toUpperCase()}</Typography>
              <IconButton
                onClick={handleEditClick}
                disabled={!canManageUserRights}
                sx={{ color: canManageUserRights ? "#6D9CF1" : "#BDBDBD" }}
              >
                <EditIcon />
              </IconButton>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: isCompactDesktop ? 620 : 720 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) repeat(4, minmax(72px, 1fr))", alignItems: "center", bgcolor: "#F7F7F7", borderRadius: "8px", px: 1.2, py: 1.2, mb: 0.8 }}>
                  <Box />
                  {["Add", "Edit", "View", "Print"].map((h) => (
                    <Typography key={h} sx={{ fontSize: 13, textAlign: "center" }}>{h}</Typography>
                  ))}
                </Box>

                {summaryRows.map((row) => (
                  <Box key={row.label} sx={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) repeat(4, minmax(72px, 1fr))", alignItems: "center", px: 1.2, py: 1 }}>
                    <Box sx={{ borderLeft: "6px solid #3A7BD5", bgcolor: "#EDF2F8", borderRadius: "4px", px: 1.3, py: 0.8, fontSize: 13 }}>{row.label}</Box>
                    <Tick checked={row.perm.add} />
                    <Tick checked={row.perm.edit} />
                    <Tick checked={row.perm.view} />
                    <Tick checked={row.perm.print} />
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {mode === "edit" && activeRole && (
          <Box sx={{ border: "1px solid #E0E0E0", borderRadius: "10px", bgcolor: "#fff", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Page Access</Typography>

            <Box sx={{ border: "1px solid #ECECEC", borderRadius: "12px", px: 2, py: 1, display: "flex", alignItems: "center", width: "100%", flexWrap: "wrap", rowGap: 1 }}>
              {STEP_LABELS.map((label, idx) => (
                <React.Fragment key={label}>
                  <StepDot
                    index={idx}
                    label={label}
                    active={activeStep === idx}
                    done={idx < activeStep}
                    onClick={() => setActiveStep(idx)}
                  />
                  {idx < STEP_LABELS.length - 1 && <StepConnector done={idx < activeStep} />}
                </React.Fragment>
              ))}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 1.2 }}>
              {optionList.map((label) => (
                <FormControlLabel
                  key={label}
                  control={
                    <Checkbox
                      size="small"
                      checked={draftRights[rightsKey].includes(label)}
                      onChange={(e) => toggleOption(label, e.target.checked)}
                      disabled={!canManageUserRights}
                      sx={{ p: 0, mr: 0.8, color: "#CDCDCD", "&.Mui-checked": { color: "#4CAF50" } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
                  sx={{ m: 0 }}
                />
              ))}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    disabled={!canManageUserRights}
                    sx={{ p: 0, mr: 0.8, color: "#CDCDCD", "&.Mui-checked": { color: "#4CAF50" } }}
                  />
                }
                label={<Typography sx={{ fontSize: 13 }}>{allSelected ? "Deselect All" : "Select All"}</Typography>}
                sx={{ m: 0 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }} />
              <Button variant="outlined" onClick={activeStep < 2 ? handleNext : handleSave} disabled={!canManageUserRights || (activeStep < 2 ? !hasStepSelection : !hasAnySelection)} sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 110 }, borderRadius: "10px", fontSize: 14, color: "#5C5C5C", borderColor: "#C5C5C5" }}>{activeStep < 2 ? "Next" : "Save"}</Button>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: isCompactDesktop ? 700 : 820 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) repeat(5, minmax(72px, 1fr))", alignItems: "center", bgcolor: "#F7F7F7", borderRadius: "10px", px: 1.2, py: 1 }}>
                  <Box />
                  {["All", "Add", "Edit", "View", "Print"].map((h) => (
                    <Typography key={h} sx={{ fontSize: 13, textAlign: "center" }}>{h}</Typography>
                  ))}
                </Box>

                <Box sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
                  {editRows.map((row) => {
                    const itemType = getItemType(row.label, draftRights);
                    const chipColors = chipStyleByType[itemType];

                    return (
                    <Box key={row.label} sx={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) repeat(5, minmax(72px, 1fr))", alignItems: "center", px: 1, py: 0.8 }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ border: `1px solid ${chipColors.border}`, bgcolor: chipColors.bg, borderRadius: "8px", px: 1.1, py: 0.5, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 0.8 }}>
                          {row.label}
                          <CancelIcon sx={{ fontSize: 15, color: "#E17E61", cursor: "pointer" }} onClick={() => removeRow(row.label)} />
                        </Box>
                      </Box>

                      <Tick checked={row.perm.add && row.perm.edit && row.perm.view && row.perm.print} onClick={() => {
                        if (!canManageUserRights) return;
                        const allOn = row.perm.add && row.perm.edit && row.perm.view && row.perm.print;
                        setDraftPerms((prev) => ({
                          ...prev,
                          [row.label]: {
                            ...row.perm,
                            add: !allOn,
                            edit: !allOn,
                            view: !allOn,
                            print: !allOn,
                          },
                        }));
                      }} />
                      <Tick checked={row.perm.add} onClick={canManageUserRights ? () => togglePerm(row.label, "add") : undefined} />
                      <Tick checked={row.perm.edit} onClick={canManageUserRights ? () => togglePerm(row.label, "edit") : undefined} />
                      <Tick checked={row.perm.view} onClick={canManageUserRights ? () => togglePerm(row.label, "view") : undefined} />
                      <Tick checked={row.perm.print} onClick={canManageUserRights ? () => togglePerm(row.label, "print") : undefined} />
                    </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.2, flexWrap: "wrap" }}>
              <Button variant="outlined" onClick={() => setMode("summary")} sx={{ textTransform: "none", minWidth: 130, borderRadius: "12px", fontSize: 14 }}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSaveGrant}
                disabled={saving || !canManageUserRights}
                sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 240 }, borderRadius: "12px", bgcolor: "#545454", fontSize: 14, "&:hover": { bgcolor: "#232323" } }}
              >
                {saving ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
                Save &amp; Grant Access
              </Button>
            </Box>
          </Box>
        )}

        {(mode === "user-summary" || mode === "user-edit") && focusedUser && (
          <Box sx={{ border: "1px solid #E0E0E0", borderRadius: "10px", bgcolor: "#fff", p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
                bgcolor: "#F6F6F6",
                borderRadius: "10px",
                px: 2,
                py: 1.2,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonOutlineIcon sx={{ fontSize: 20, color: "#E17E61" }} />
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                  {focusedUser.firstName || focusedUser.username || focusedUser.email}
                  {(focusedUser.lastName) ? ` ${focusedUser.lastName}` : ""}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#738091", ml: 0.5 }}>
                  ({focusedUser.role})
                </Typography>
                {userHasIndividualPerms && (
                  <Box sx={{ fontSize: 11, bgcolor: "#FFF3EE", border: "1px solid #E17E61", borderRadius: "6px", px: 1, py: 0.3, color: "#E17E61", fontWeight: 600 }}>
                    Custom
                  </Box>
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                {userHasIndividualPerms && mode === "user-summary" && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleResetUserPermissions}
                    disabled={saving || !canManageUserRights}
                    sx={{ textTransform: "none", borderRadius: "8px", fontSize: 12, borderColor: "#E57373", color: "#E57373" }}
                  >
                    Reset to Role
                  </Button>
                )}
                {mode === "user-summary" && (
                  <IconButton
                    onClick={() => { setActiveStep(0); setMode("user-edit"); }}
                    disabled={!canManageUserRights}
                    sx={{ color: canManageUserRights ? "#6D9CF1" : "#BDBDBD" }}
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            </Box>

            {loadingUserPerms ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : mode === "user-summary" ? (
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: isCompactDesktop ? 620 : 720 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) repeat(4, minmax(72px, 1fr))", alignItems: "center", bgcolor: "#F7F7F7", borderRadius: "8px", px: 1.2, py: 1.2, mb: 0.8 }}>
                    <Box />
                    {["Add", "Edit", "View", "Print"].map((h) => (
                      <Typography key={h} sx={{ fontSize: 13, textAlign: "center" }}>{h}</Typography>
                    ))}
                  </Box>
                  {summaryRows.map((row) => {
                    const perm = draftPerms[row.label] ?? emptyPerm();
                    return (
                      <Box key={row.label} sx={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) repeat(4, minmax(72px, 1fr))", alignItems: "center", px: 1.2, py: 1 }}>
                        <Box sx={{ borderLeft: "6px solid #3A7BD5", bgcolor: "#EDF2F8", borderRadius: "4px", px: 1.3, py: 0.8, fontSize: 13 }}>{row.label}</Box>
                        <Tick checked={perm.add} />
                        <Tick checked={perm.edit} />
                        <Tick checked={perm.view} />
                        <Tick checked={perm.print} />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              /* user-edit mode */
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Page Access</Typography>

                <Box sx={{ border: "1px solid #ECECEC", borderRadius: "12px", px: 2, py: 1, display: "flex", alignItems: "center", width: "100%", flexWrap: "wrap", rowGap: 1 }}>
                  {STEP_LABELS.map((label, idx) => (
                    <React.Fragment key={label}>
                      <StepDot
                        index={idx}
                        label={label}
                        active={activeStep === idx}
                        done={idx < activeStep}
                        onClick={() => setActiveStep(idx)}
                      />
                      {idx < STEP_LABELS.length - 1 && <StepConnector done={idx < activeStep} />}
                    </React.Fragment>
                  ))}
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 1.2 }}>
                  {optionList.map((label) => (
                    <FormControlLabel
                      key={label}
                      control={
                        <Checkbox
                          size="small"
                          checked={draftRights[rightsKey].includes(label)}
                          onChange={(e) => toggleOption(label, e.target.checked)}
                          disabled={!canManageUserRights}
                          sx={{ p: 0, mr: 0.8, color: "#CDCDCD", "&.Mui-checked": { color: "#4CAF50" } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
                      sx={{ m: 0 }}
                    />
                  ))}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        disabled={!canManageUserRights}
                        sx={{ p: 0, mr: 0.8, color: "#CDCDCD", "&.Mui-checked": { color: "#4CAF50" } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: 13 }}>{allSelected ? "Deselect All" : "Select All"}</Typography>}
                    sx={{ m: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }} />
                  <Button variant="outlined" onClick={activeStep < 2 ? handleNext : handleSave} disabled={!canManageUserRights || (activeStep < 2 ? !hasStepSelection : !hasAnySelection)} sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 110 }, borderRadius: "10px", fontSize: 14, color: "#5C5C5C", borderColor: "#C5C5C5" }}>{activeStep < 2 ? "Next" : "Save"}</Button>
                </Box>

                <Box sx={{ overflowX: "auto" }}>
                  <Box sx={{ minWidth: isCompactDesktop ? 700 : 820 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) repeat(5, minmax(72px, 1fr))", alignItems: "center", bgcolor: "#F7F7F7", borderRadius: "10px", px: 1.2, py: 1 }}>
                      <Box />
                      {["All", "Add", "Edit", "View", "Print"].map((h) => (
                        <Typography key={h} sx={{ fontSize: 13, textAlign: "center" }}>{h}</Typography>
                      ))}
                    </Box>
                    <Box sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
                      {editRows.map((row) => {
                        const itemType = getItemType(row.label, draftRights);
                        const chipColors = chipStyleByType[itemType];
                        return (
                          <Box key={row.label} sx={{ display: "grid", gridTemplateColumns: "minmax(220px, 260px) repeat(5, minmax(72px, 1fr))", alignItems: "center", px: 1, py: 0.8 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Box sx={{ border: `1px solid ${chipColors.border}`, bgcolor: chipColors.bg, borderRadius: "8px", px: 1.1, py: 0.5, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 0.8 }}>
                                {row.label}
                                <CancelIcon sx={{ fontSize: 15, color: "#E17E61", cursor: "pointer" }} onClick={() => removeRow(row.label)} />
                              </Box>
                            </Box>
                            <Tick checked={row.perm.add && row.perm.edit && row.perm.view && row.perm.print} onClick={() => {
                              if (!canManageUserRights) return;
                              const allOn = row.perm.add && row.perm.edit && row.perm.view && row.perm.print;
                              setDraftPerms((prev) => ({
                                ...prev,
                                [row.label]: { ...row.perm, add: !allOn, edit: !allOn, view: !allOn, print: !allOn },
                              }));
                            }} />
                            <Tick checked={row.perm.add} onClick={canManageUserRights ? () => togglePerm(row.label, "add") : undefined} />
                            <Tick checked={row.perm.edit} onClick={canManageUserRights ? () => togglePerm(row.label, "edit") : undefined} />
                            <Tick checked={row.perm.view} onClick={canManageUserRights ? () => togglePerm(row.label, "view") : undefined} />
                            <Tick checked={row.perm.print} onClick={canManageUserRights ? () => togglePerm(row.label, "print") : undefined} />
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.2, flexWrap: "wrap" }}>
                  <Button variant="outlined" onClick={() => setMode("user-summary")} sx={{ textTransform: "none", minWidth: 130, borderRadius: "12px", fontSize: 14 }}>Cancel</Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveUserPermissions}
                    disabled={saving || !canManageUserRights}
                    sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 240 }, borderRadius: "12px", bgcolor: "#545454", fontSize: 14, "&:hover": { bgcolor: "#232323" } }}
                  >
                    {saving ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
                    Save User Permissions
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
      </>
      ) : null}
    </Box>
  );
};

export default UserRightsForm;
