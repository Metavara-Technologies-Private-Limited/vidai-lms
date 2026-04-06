import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from ".";
import type {
  AuthState,
  AuthUser,
  LoginType,
} from "../types/auth.types";

export type { AuthUser };

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";
const AUTH_MODE_KEY = "auth_mode";

// ✅ FIX: extracted type (important for older TS)
type SetAuthPayload = {
  user: AuthUser;
  token: string;
  loginType: LoginType;
};

const readPersistedUser = (): AuthUser | null => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    const hasClinics =
      Array.isArray(parsed.clinics) && parsed.clinics.length > 0;

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

const persistedToken = localStorage.getItem(AUTH_TOKEN_KEY);
const persistedMode =
  (localStorage.getItem(AUTH_MODE_KEY) as LoginType) ?? "INT";
const persistedUser = readPersistedUser();

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
    // ✅ FIX: use extracted type instead of inline
    setAuth(state, action: PayloadAction<SetAuthPayload>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.authed = true;
      state.loginType = action.payload.loginType;

      localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(action.payload.user));
      localStorage.setItem(AUTH_MODE_KEY, action.payload.loginType);
    },

    setUser(state, action: PayloadAction<AuthUser>) {
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