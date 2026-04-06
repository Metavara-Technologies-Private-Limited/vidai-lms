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

export const mapLoginToAuthUser = (res: NormalizedLoginResponse): AuthUser => {
  return {
    id: res.user.id,
    username: res.user.username,
    email: res.user.email,
    role: res.role,
    permissions: res.permissions as { modules: Module[] },
    // Profile fields from external login
    first_name: res.user.first_name,
    last_name: res.user.last_name,
    designation: res.user.designation,
  };
};

const persistedToken = localStorage.getItem(AUTH_TOKEN_KEY);
const persistedMode =
  (localStorage.getItem(AUTH_MODE_KEY) as LoginType) ?? "INT";
const persistedUser = (() => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
})();

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