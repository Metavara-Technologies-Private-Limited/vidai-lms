/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { lazy, Suspense, useEffect, useState } from "react";
import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

const UsersList = lazy(() => import("./UserDetails/UsersList"));
const UserDetailsForm = lazy(() => import("./UserDetails/UserDetailsForm.tsx"));
const UserRightsForm = lazy(() => import("./UserRights/UserRightsForm.tsx"));
import type { UserFormData } from "./UserDetails/UserDetailsForm";
import {
  usersApi,
  type UserCreateUpdatePayload,
  // type RoleRecord,
  type UserRecord as User,
} from "../../../services/users.api";
import { selectLoginType, selectUser } from "../../../store/authSlice";
import { fetchUsers } from "../../../store/userSlice";
import type { AppDispatch, RootState } from "../../../store";

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "details" | "rights";
type DetailsView = "list" | "form";

const EDIT_PASSWORD_PLACEHOLDER = "********";

const FALLBACK_ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "1", label: "SuperAdmin" },
  { value: "2", label: "Admin" },
  { value: "3", label: "User" },
];

// const FALLBACK_ROLE_BY_ID: Record<number, string> = {
//   1: "SuperAdmin",
//   2: "Admin",
//   3: "User",
// };

const normalizeText = (value: string): string => value.trim().toLowerCase();

const normalizeRoleName = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

const hasUsersActionPermission = (
  permissions: unknown,
  action: "view" | "add" | "edit" | "print",
): boolean => {
  if (!permissions || typeof permissions !== "object") {
    return false;
  }

  const actionKey = `can_${action}`;
  const root = permissions as Record<string, unknown>;

  const legacyRows =
    root.user_management && typeof root.user_management === "object"
      ? (root.user_management as Record<string, unknown>).users
      : null;

  if (Array.isArray(legacyRows)) {
    const allowed = legacyRows.some((row) => {
      if (!row || typeof row !== "object") return false;
      return Boolean((row as Record<string, unknown>)[actionKey]);
    });
    if (allowed) return true;
  }

  for (const moduleValue of Object.values(root)) {
    if (!moduleValue || typeof moduleValue !== "object") continue;

    for (const categoryValue of Object.values(
      moduleValue as Record<string, unknown>,
    )) {
      if (!Array.isArray(categoryValue)) continue;

      const allowed = categoryValue.some((row) => {
        if (!row || typeof row !== "object") return false;
        const rec = row as Record<string, unknown>;
        const subcategory = normalizeRoleName(rec.subcategory);
        if (subcategory !== "user" && subcategory !== "users") return false;
        return Boolean(rec[actionKey]);
      });

      if (allowed) return true;
    }
  }

  return false;
};

// ─── Component ────────────────────────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const authUser = useSelector(selectUser);
  const loginType = useSelector(selectLoginType);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [detailsView, setDetailsView] = useState<DetailsView>("list");
  // const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  // const [roles, setRoles] = useState<RoleRecord[]>([]);
  const resolvedRoleOptions = FALLBACK_ROLE_OPTIONS;
  // const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinnedUserId, setPinnedUserId] = useState<number | null>(null);

  const currentRoleName =
    normalizeRoleName(authUser?.designation_label) ||
    normalizeRoleName(authUser?.designation) ||
    normalizeRoleName(authUser?.role);
  const canAssignRoles =
    loginType === "INT" &&
    (currentRoleName === "super admin" || currentRoleName === "superadmin");
  const isSuperAdmin =
    currentRoleName === "super admin" || currentRoleName === "superadmin";
  const usersPermissions = (authUser as Record<string, unknown> | null)?.permissions;
  const canViewUsers =
    isSuperAdmin || hasUsersActionPermission(usersPermissions, "view");
  const canAddUsers =
    isSuperAdmin || hasUsersActionPermission(usersPermissions, "add");
  const canEditUsers =
    isSuperAdmin || hasUsersActionPermission(usersPermissions, "edit");

  const extractApiErrorMessage = (error: unknown): string => {
    const payload =
      (error as { response?: { data?: unknown } })?.response?.data ?? null;

    const GENERIC_MESSAGES = new Set([
      "Error occurred",
      "Request failed",
      "Internal Server Error",
    ]);

    const normalize = (value: unknown): string => {
      if (value == null) return "Request failed";
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }

      if (Array.isArray(value)) {
        const first = value[0];
        return first == null ? "Request failed" : normalize(first);
      }

      if (typeof value === "object") {
        const obj = value as Record<string, unknown>;

        const preferredKeys = Object.keys(obj).filter(
          (key) =>
            ![
              "message",
              "detail",
              "error",
              "request_id",
              "success",
              "status",
            ].includes(key),
        );

        if (preferredKeys.length > 0) {
          const key = preferredKeys[0];
          return `${key}: ${normalize(obj[key])}`;
        }

        if (
          typeof obj.detail === "string" &&
          !GENERIC_MESSAGES.has(obj.detail)
        ) {
          return obj.detail;
        }

        if (
          typeof obj.message === "string" &&
          !GENERIC_MESSAGES.has(obj.message)
        ) {
          return obj.message;
        }

        if (typeof obj.error === "string" && !GENERIC_MESSAGES.has(obj.error)) {
          return obj.error;
        }

        const firstEntry = Object.entries(obj)[0];
        if (!firstEntry) return "Request failed";

        const [key, val] = firstEntry;
        return `${key}: ${normalize(val)}`;
      }

      return "Request failed";
    };

    return normalize(payload);
  };

  // const resolveRoleLabel = (
  //   user: User,
  //   roleById: Map<number, string>,
  //   selectedRoleLabel?: string,
  // ): string => {
  //   if (user.roleId && roleById.has(user.roleId)) {
  //     return roleById.get(user.roleId) ?? user.role;
  //   }

  //   const trimmedRole = user.role.trim();
  //   if (trimmedRole && Number.isNaN(Number(trimmedRole))) {
  //     return trimmedRole;
  //   }

  //   const numericRoleId = user.roleId ?? Number(trimmedRole);
  //   if (Number.isFinite(numericRoleId) && FALLBACK_ROLE_BY_ID[numericRoleId]) {
  //     return FALLBACK_ROLE_BY_ID[numericRoleId];
  //   }

  //   if (selectedRoleLabel) {
  //     return selectedRoleLabel;
  //   }

  //   return "User";
  // };

  // useEffect(() => {
  //   const fetchUserMasterData = async () => {
  //     setIsUsersLoading(true);
  //     try {
  //       const [localUsersResult, clientUsersResult, rolesResult] =
  //         await Promise.allSettled([
  //           usersApi.listLocal(),
  //           usersApi.listClient(),
  //           usersApi.listRoles(),
  //         ]);

  //       const localUsersData =
  //         localUsersResult.status === "fulfilled" ? localUsersResult.value : [];
  //       const clientUsersData =
  //         clientUsersResult.status === "fulfilled"
  //           ? clientUsersResult.value
  //           : [];
  //       const usersData = [...localUsersData, ...clientUsersData];
  //       const rolesData =
  //         rolesResult.status === "fulfilled" ? rolesResult.value : [];

  //       if (localUsersResult.status === "rejected") {
  //         console.error("Failed to fetch local users", localUsersResult.reason);
  //       }

  //       if (clientUsersResult.status === "rejected") {
  //         console.error(
  //           "Failed to fetch client users",
  //           clientUsersResult.reason,
  //         );
  //       }

  //       if (
  //         localUsersResult.status === "rejected" &&
  //         clientUsersResult.status === "rejected"
  //       ) {
  //         toast.error("Failed to load users");
  //       }

  //       if (rolesResult.status === "rejected") {
  //         console.error("Failed to fetch roles", rolesResult.reason);
  //       }

  //       const roleById = new Map(rolesData.map((role) => [role.id, role.name]));
  //       setRoles(rolesData);
  //       setUsers(
  //         dedupeUsers(
  //           usersData.map((user) => ({
  //             ...user,
  //             role: resolveRoleLabel(user, roleById),
  //           })),
  //         ),
  //       );
  //     } finally {
  //       setIsUsersLoading(false);
  //     }
  //   };

  //   void fetchUserMasterData();
  // }, []);

  const dispatch = useDispatch<AppDispatch>();
  const { data: users, loading: isUsersLoading } = useSelector(
    (state: RootState) => state.users,
  );

  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (token && canViewUsers) {
      dispatch(fetchUsers());
    }
  }, [dispatch, token, canViewUsers]);

  const mapUserToFormData = (user: User): UserFormData => {
    const record = user as any;
    const profile = record.profile || {};
    const roleFromProfile =
      typeof profile.role === "object" && profile.role
        ? profile.role.id
        : profile.role;
    const roleFromRecord =
      typeof record.role === "object" && record.role
        ? record.role.id
        : record.roleId ?? record.role;

    return {
      firstName:
        profile.first_name || record.first_name || record.firstName || "",
      lastName: profile.last_name || record.last_name || record.lastName || "",
      gender: profile.gender || record.gender || "",
      dateOfJoining: profile.date_of_joining || record.date_of_joining || record.dateOfJoining
        ? dayjs(profile.date_of_joining || record.date_of_joining || record.dateOfJoining)
        : null,
      dateOfBirth: profile.date_of_birth || record.date_of_birth || record.dateOfBirth
        ? dayjs(profile.date_of_birth || record.date_of_birth || record.dateOfBirth)
        : null,
      userRole:
        roleFromProfile != null
          ? String(roleFromProfile)
          : roleFromRecord != null
            ? String(roleFromRecord)
            : "",
      userName: record.username || "",
      mobileNo: profile.mobile_no || record.mobile_no || record.mobileNumber || "",
      emailId: record.email || "",
      password: EDIT_PASSWORD_PLACEHOLDER,
      confirmPassword: EDIT_PASSWORD_PLACEHOLDER,
      profilePhoto: profile.photo || record.photo || null,
    };
  };

  const buildPayload = (data: UserFormData): UserCreateUpdatePayload => ({
    username: data.userName.trim() || undefined,
    email: data.emailId.trim().toLowerCase(),
    first_name: data.firstName.trim() || undefined,
    last_name: data.lastName.trim() || undefined,
    gender: data.gender || undefined,
    ...(data.dateOfJoining
      ? { date_of_joining: data.dateOfJoining.format("YYYY-MM-DD") }
      : {}),
    ...(data.dateOfBirth
      ? { date_of_birth: data.dateOfBirth.format("YYYY-MM-DD") }
      : {}),
    role:
      canAssignRoles && data.userRole && Number.isFinite(Number(data.userRole))
        ? Number(data.userRole)
        : undefined,
    mobile_no: data.mobileNo.trim() || undefined,
    ...(data.password.trim() && data.password !== EDIT_PASSWORD_PLACEHOLDER
      ? { password: data.password.trim() }
      : {}),
    ...(data.confirmPassword.trim() &&
    data.confirmPassword !== EDIT_PASSWORD_PLACEHOLDER
      ? { confirm_password: data.confirmPassword.trim() }
      : {}),
  });

  // const resolvedRoleOptions =
  //   roles.length > 0
  //     ? roles.map((role) => ({
  //         value: String(role.id),
  //         label: role.name,
  //       }))
  //     : FALLBACK_ROLE_OPTIONS;

  const handleSaveUser = async (data: UserFormData) => {
    if (isSubmitting) {
      return;
    }

    if (editingUser?.source === "client") {
      toast.error("This user belongs to client DB and cannot be updated here");
      return;
    }

    const normalizedUserName = normalizeText(data.userName);
    const normalizedEmail = normalizeText(data.emailId);
    const normalizedMobile = normalizeText(data.mobileNo);

    const duplicateUserName = users.some(
      (user) =>
        user.id !== editingUser?.id &&
        normalizedUserName &&
        normalizeText(user.username) === normalizedUserName,
    );

    if (duplicateUserName) {
      toast.error("Username already exists");
      return;
    }

    const duplicateEmail = users.some(
      (user) =>
        user.id !== editingUser?.id &&
        normalizedEmail &&
        normalizeText(user.email) === normalizedEmail,
    );

    if (duplicateEmail) {
      toast.error("Email already exists");
      return;
    }

    const duplicateMobile = users.some(
      (user) =>
        user.id !== editingUser?.id &&
        normalizedMobile &&
        normalizeText((user as any).profile?.mobile_no || "") ===
          normalizedMobile,
    );

    if (duplicateMobile) {
      toast.error("Mobile number already exists");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!canAssignRoles) {
        toast.info(
          "Role assignment is restricted. Login with Internal Super Admin to assign roles.",
        );
      }

      const payload = buildPayload(data);
      // const selectedRoleLabel =
      //   resolvedRoleOptions.find(
      //     (roleOption) => roleOption.value === data.userRole,
      //   )?.label ?? undefined;
      // const roleById = new Map(roles.map((role) => [role.id, role.name]));

      if (editingUser) {
        const updatedUser = await usersApi.update(editingUser.id, payload);
        // const roleName = resolveRoleLabel(
        //   updatedUser,
        //   roleById,
        //   selectedRoleLabel,
        // );
        // const patchedUser = { ...updatedUser, role: roleName };
        dispatch(fetchUsers());
        setPinnedUserId(updatedUser.id);
      } else {
        const newUser = await usersApi.create(payload);
        // const roleName = resolveRoleLabel(newUser, roleById, selectedRoleLabel);
        dispatch(fetchUsers());
        setPinnedUserId(newUser.id);
      }

      setEditingUser(null);
      setDetailsView("list");
      setActiveTab("details");
    } catch (error) {
      console.error("Failed to save user", error);
      const rawMessage =
        error instanceof Error ? error.message.toLowerCase() : "";
      if (rawMessage.includes("only super admin can assign roles")) {
        toast.error(
          "Current session cannot assign roles. Login with Internal Super Admin account.",
        );
      }
      const fallbackMessage =
        error instanceof Error && error.message
          ? error.message
          : "Request failed";
      const backendMessage =
        extractApiErrorMessage(error) === "Request failed"
          ? fallbackMessage
          : extractApiErrorMessage(error);
      toast.error(
        editingUser
          ? `Failed to update user: ${backendMessage}`
          : `Failed to create user: ${backendMessage}`,
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNewUser = () => {
    if (!canAddUsers) {
      toast.error("You do not have add permission for users");
      return;
    }
    setPinnedUserId(null);
    setEditingUser(null);
    setDetailsView("form");
    setActiveTab("details");
  };

  const handleEditUser = async (user: User) => {
    if (!canEditUsers) {
      toast.error("You do not have edit permission for users");
      return;
    }

    if (user.source === "client") {
      toast.error("Client DB users are read-only in this app");
      return;
    }

    setPinnedUserId(null);
    try {
      const fullUser = await usersApi.getById(user.id);
      setEditingUser({ ...user, ...fullUser });
    } catch (error) {
      console.error("Failed to fetch user details", error);
      toast.error("Failed to load user details");
      return;
    }

    setDetailsView("form");
    setActiveTab("details");
  };

  const handleToggleUserStatus = async (userId: number) => {
    if (!canEditUsers) {
      toast.error("You do not have edit permission for users");
      return;
    }

    const targetUser = users.find((user) => user.id === userId);
    if (!targetUser) {
      return;
    }

    if (targetUser.source === "client") {
      toast.error("Client DB users are read-only in this app");
      return;
    }

    const optimisticStatus = !targetUser.status;
    // setUsers((currentUsers) =>
    //   currentUsers.map((user) =>
    //     user.id === userId ? { ...user, status: optimisticStatus } : user,
    //   ),
    // );

    try {
      await usersApi.patchStatus(userId, optimisticStatus);
      dispatch(fetchUsers());
    } catch (error) {
      console.error("Failed to update user status", error);
      dispatch(fetchUsers());
      // setUsers((currentUsers) =>
      //   currentUsers.map((user) =>
      //     user.id === userId ? { ...user, status: targetUser.status } : user,
      //   ),
      // );
      toast.error("Failed to update user status");
    }
  };

  const handleCancelDetails = () => {
    setEditingUser(null);
    setDetailsView("list");
    setActiveTab("details");
  };

  const handleCancelRights = () => {
    setDetailsView("list");
    setActiveTab("details");
  };

  const handleSaveGrantAccess = () => {
    setDetailsView("list");
    setActiveTab("details");
  };

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", pt: 0 }}
    >
      {/* ── Top tab bar (matches the Figma tab header) ── */}
      <Tabs
        value={activeTab}
        onChange={(_, v: TabKey) => setActiveTab(v)}
        variant="fullWidth"
        sx={{
          borderBottom: "1px solid #E0E0E0",
          minHeight: 40,
          mx: -3,
          mt: -2,
          "& .MuiTabs-indicator": {
            backgroundColor: "#E17E61",
            height: 2.1,
          },

          "& .MuiTab-root": {
            textTransform: "none",
            fontSize: 15,
            fontWeight: 500,
            color: "#BBBBBB",
            minHeight: 40,
            p: 0,
          },

          "& .MuiTab-root.Mui-selected": {
            color: "#212121",
            fontWeight: 600,
          },
        }}
      >
        <Tab label="User Details" value="details" />
        <Tab label="User Rights" value="rights" />
      </Tabs>

      {/* ── Content area ── */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
        {/* Tab panels */}
        <Suspense fallback={<CircularProgress size={24} />}>
          {activeTab === "details" && detailsView === "list" && (
            <UsersList
              users={users}
              isLoading={isUsersLoading}
              onToggleUserStatus={handleToggleUserStatus}
              onNewUser={handleOpenNewUser}
              onEditUser={handleEditUser}
              canAddUsers={canAddUsers}
              canEditUsers={canEditUsers}
              canViewUsers={canViewUsers}
              pinnedUserId={pinnedUserId}
            />
          )}
          {activeTab === "details" && detailsView === "form" && (
            <UserDetailsForm
              key={editingUser ? `edit-${editingUser.id}` : "create-user"}
              mode={editingUser ? "edit" : "create"}
              initialData={editingUser ? mapUserToFormData(editingUser) : null}
              roleOptions={resolvedRoleOptions}
              requireRole={canAssignRoles}
              disableRoleSelection={!canAssignRoles}
              onSave={handleSaveUser}
              onCancel={handleCancelDetails}
              isSubmitting={isSubmitting}
            />
          )}
          {activeTab === "rights" && (
            <UserRightsForm
              onCancel={handleCancelRights}
              onSave={handleSaveGrantAccess}
            />
          )}
        </Suspense>
      </Box>
    </Box>
  );
};
export default UsersPage;
