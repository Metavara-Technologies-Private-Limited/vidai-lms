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
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: {
    modules: Module[];
  };
  // Profile fields (populated after getProfile())
  first_name?: string;
  last_name?: string;
  photo?: string;
  designation?: string;
  designation_label?: string;
  clinics?: UserClinic[];
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  authed: boolean;
  loginType: LoginType;
}

export type LoginType = "INT" | "EXT";
