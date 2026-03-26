import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from ".";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_TOKEN_ALT_KEY = "authToken";
const UI_AUTH_KEY = "vidai_ui_logged_in";

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
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  authed: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  authed: !!localStorage.getItem(AUTH_TOKEN_KEY),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.token = action.payload.access;
      state.authed = true;
      localStorage.setItem(AUTH_TOKEN_KEY, action.payload.access);
      localStorage.setItem(AUTH_TOKEN_ALT_KEY, action.payload.access);
      localStorage.setItem(UI_AUTH_KEY, "1");
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.authed = false;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_ALT_KEY);
      localStorage.removeItem(UI_AUTH_KEY);
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuthed = (state: RootState) => state.auth.authed;
export const selectUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
