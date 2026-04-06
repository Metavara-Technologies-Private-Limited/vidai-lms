import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from ".";
import type {
  AuthState,
  AuthUser,
  LoginType,
  Module,
  NormalizedLoginResponse,
} from "../types/auth.types";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";
const AUTH_MODE_KEY = "auth_mode";

interface Clinic {
  clinic__name: string;
  clinic_id: number;
  is_default: boolean;
}
interface Permission {
  access: "view" | "add" | "edit" | "print";
  male: boolean;
  female: boolean;
}
interface PermissionType {
  name: string;
  featureEnabled: boolean;
  permissions: Permission[];
  male: boolean;
  female: boolean;
}
interface Submodule {
  name: string;
  featureEnabled: boolean;
  type: PermissionType[];
}
interface Module {
  name: string;
  featureEnabled: boolean;
  submodules: Submodule[];
}

export interface AuthUser {
  access: string;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  designation: string;
  designation_label: string;
  tenant: string;
  tenant_id: number;
  is_staff: boolean;
  is_superuser: boolean;
  language_id: number;
  language_code: string;
  language_name: string;
  permissions: { modules: Module[] };
  clinics?: Clinic[];
  photo?: string;
  profile_loaded?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  authed: boolean;
}

const readPersistedUser = (): AuthUser | null => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

const persistedToken = localStorage.getItem(AUTH_TOKEN_KEY);
const persistedMode =
  (localStorage.getItem(AUTH_MODE_KEY) as LoginType) ?? "INT";
const persistedUser = (() => {
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    const hasClinics =
      Array.isArray(parsed.clinics) && parsed.clinics.length > 0;

    // Force one profile re-hydration when an older cache marked profile loaded
    // without clinic data.
    if (parsed.profile_loaded && !hasClinics) {
      return {
        ...parsed,
        profile_loaded: false,
      };
    }

    return parsed;
  } catch {
    return null;
  }
};

const persistedToken =
  localStorage.getItem(AUTH_TOKEN_KEY) ||
  localStorage.getItem(AUTH_TOKEN_ALT_KEY);

const initialState: AuthState = {
  user: persistedUser,
  token: persistedToken,
  authed: !!persistedToken,
  loginType: persistedMode,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.authed = true;
      state.loginType = action.payload.loginType;

      localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(action.payload.user));
      localStorage.setItem(AUTH_MODE_KEY, action.payload.loginType);
    },

    setUser(state, action) {
      state.user = action.payload;
      state.authed = true;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(action.payload));
    },

    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.authed = false;
      state.loginType = "INT";
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_MODE_KEY);
    },
  },
});

export const { setAuth, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuthed = (state: RootState) => state.auth.authed;
export const selectUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectLoginType = (state: RootState) => state.auth.loginType;