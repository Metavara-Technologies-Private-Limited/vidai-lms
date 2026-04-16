import axios, { AxiosError, type AxiosInstance } from "axios";
import { store, type AppDispatch } from "../store";
import { setExternalToken } from "../store/authSlice";

// Base axios instance used everywhere in the app.
// Keep all network + auth related setup here.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
interface HttpInstance extends AxiosInstance {
  redirect: (path: string) => void;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
}) as HttpInstance;

let extTokenPromise: Promise<string> | null = null;

// Add interceptor to handle FormData properly
// When FormData is sent, remove the Content-Type header to allow browser/axios
// to automatically set multipart/form-data with the correct boundary
http.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Remove Content-Type header for FormData - let the browser set it automatically
    if (config.headers && typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getExtToken = async (dispatch: AppDispatch, getState: any) => {
  const state = getState();

  if (state.auth.extToken) {
    return state.auth.extToken;
  }

  if (!extTokenPromise) {
    extTokenPromise = (async () => {
      const res = await http.post("/proxy/login/", {
        username: "Admin",
        password: "vidai_admin@2023",
      });

      const token = res.data.token;
      dispatch(setExternalToken(token));

      extTokenPromise = null;
      return token;
    })();
  }

  return extTokenPromise;
};

export const getAccessToken = (): string | null =>
  localStorage.getItem("auth_token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("auth_token") ||
  sessionStorage.getItem("authToken");

const getRefreshToken = (): string | null =>
  localStorage.getItem("refresh_token") ||
  sessionStorage.getItem("refresh_token");

const setAccessToken = (token: string): void => {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("authToken", token);
  sessionStorage.setItem("auth_token", token);
  sessionStorage.setItem("authToken", token);
};

const clearAuthTokens = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("refresh_token");
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
      refresh: refreshToken,
      refresh_token: refreshToken,
    });

    const nextToken =
      response.data?.data?.access_token ||
      response.data?.data?.access ||
      response.data?.access_token ||
      response.data?.access;
    if (!nextToken || typeof nextToken !== "string") {
      return null;
    }

    setAccessToken(nextToken);
    return nextToken;
  } catch {
    clearAuthTokens();
    return null;
  }
};

http.redirect = (path: string): void => {
  const baseURL = http.defaults.baseURL ?? "";
  window.location.href = `${baseURL}${path}`;
};

// Add auth token to every request if it exists
http.interceptors.request.use(async (config) => {
  const state = store.getState();

  let token = state.auth.token; // default INT

  // 🔥 Detect external API
  if (config.url?.includes("/users-search/")) {
    token = await getExtToken(store.dispatch, store.getState);
  }

  if (token) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      const headers = (config.headers ?? {}) as Record<string, string>;
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers as typeof config.headers;
    }
  }

  // Ensure active clinic context is sent across all clinic-scoped modules.
  // Skip auth/proxy endpoints where clinic is not relevant.
  const clinicId = Number(localStorage.getItem("clinic_id") ?? 0);
  const shouldAttachClinic =
    Number.isFinite(clinicId) &&
    clinicId > 0 &&
    !config.url?.includes("/auth/login/") &&
    !config.url?.includes("/proxy/login/") &&
    !config.url?.includes("/token/refresh/") &&
    !config.url?.includes("/me/profile/") &&
    !config.url?.includes("/me/photo/") &&
    !config.url?.includes("/users-search/");

  if (shouldAttachClinic) {
    const params = (config.params ?? {}) as Record<string, unknown>;
    if (params.clinic_id == null && params.clinic == null) {
      config.params = {
        ...params,
        clinic_id: clinicId,
      };
    }
  }

  return config;
});

// Handle auth errors in one place
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    const isAuthRoute =
      url.includes("/auth/login/") ||
      url.includes("/proxy/login/") ||
      url.includes("/token/refresh/");

    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry ||
      isAuthRoute
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    if (typeof originalRequest.headers?.set === "function") {
      originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
    } else {
      const headers = (originalRequest.headers ?? {}) as Record<string, string>;
      headers.Authorization = `Bearer ${newToken}`;
      originalRequest.headers = headers as typeof originalRequest.headers;
    }

    return http.request(originalRequest);
  },
);
