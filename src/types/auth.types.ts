export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    user: {
      id: number;
      username: string;
      email: string;
    };
    role: string;
    permissions: Record<string, unknown>;
  };
};

export type ExternalLoginResponse = {
  token: string;
  user: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    designation: string;
  };
};

export type NormalizedLoginResponse = {
  token: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    designation?: string;
  };
  role: string;
  permissions: Record<string, unknown>;
};

export type UserSearchParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

type PermissionAction = "view" | "add" | "edit" | "print";

interface Permission {
  access: PermissionAction;
  male?: boolean;
  female?: boolean;
}
interface PermissionType {
  name: string;
  featureEnabled: boolean;
  permissions: Permission[];
}

interface Submodule {
  name: string;
  featureEnabled: boolean;
  types: PermissionType[];
}

export interface Module {
  name: string;
  featureEnabled: boolean;
  submodules: Submodule[];
}

export interface UserClinic {
  clinic_id: number;
  clinic__name: string;
  is_default: boolean;
}

export interface AuthUser {
  // Core identity
  id?: number;
  user_id?: number;
  username: string;
  email: string;
  // Role / designation
  role?: string;
  designation?: string;
  designation_label?: string;
  // Names
  first_name?: string;
  last_name?: string;
  // Legacy auth token field
  access?: string;
  // Tenant
  tenant?: string;
  tenant_id?: number;
  // Staff flags
  is_staff?: boolean;
  is_superuser?: boolean;
  // Language
  language_id?: number;
  language_code?: string;
  language_name?: string;
  // Permissions & clinics
  permissions: { modules: Module[] };
  clinics?: UserClinic[];
  photo?: string;
  // Profile hydration state
  profile_loaded?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  extToken: string | null;
  authed: boolean;
  loginType: LoginType;
}

export type LoginType = "INT" | "EXT";
