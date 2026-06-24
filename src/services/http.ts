import axios, { AxiosError, type AxiosInstance } from "axios";
import { store, type AppDispatch, type RootState } from "../store";
import { setAuth, setExternalToken } from "../store/authSlice";

type HttpInstance = AxiosInstance & {
  redirect: (path: string) => void;
};

type RetryableRequestConfig = NonNullable<AxiosError["config"]> & {
  _retry?: boolean;
};

type HeaderBag = {
  set?: (name: string, value: string) => void;
  Authorization?: string;
};

const resolveApiBaseUrl = (): string => {
  const configured = (
    import.meta.env.VITE_API_BASE_URL as string | undefined
  )?.trim();
  if (configured) return configured;

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return "http://127.0.0.1:8000/api";
};

const readEnv = (key: string, fallback: string): string => {
  const value = (import.meta.env[key] as string | undefined)?.trim();
  return value || fallback;
};

const API_BASE_URL = resolveApiBaseUrl();
const EXT_PROXY_USERNAME = readEnv("VITE_EXT_PROXY_USERNAME", "");
const EXT_PROXY_PASSWORD = readEnv("VITE_EXT_PROXY_PASSWORD", "");

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
}) as HttpInstance;

const setAuthorizationHeader = (
  headers: RetryableRequestConfig["headers"],
  token: string,
): RetryableRequestConfig["headers"] => {
  if (typeof headers?.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
    return headers;
  }

  const nextHeaders = (headers ?? {}) as HeaderBag;
  nextHeaders.Authorization = `Bearer ${token}`;
  return nextHeaders as RetryableRequestConfig["headers"];
};

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

http.interceptors.request.use((config) => {
  if (isFormData(config.data)) {
    if (config.headers && typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
    }
  }

  return config;
});

export const getExtToken = async (
  dispatch: AppDispatch,
  getState: () => RootState,
  forceRefresh = false,
): Promise<string> => {
  const state = getState();
  const stored = localStorage.getItem("ext_token");

  if (!forceRefresh && state.auth.extToken) return state.auth.extToken;
  if (!forceRefresh && stored) return stored;

  if (!EXT_PROXY_USERNAME || !EXT_PROXY_PASSWORD) {
    throw new Error("External proxy credentials are not configured.");
  }

  const res = await http.post("/proxy/login/", {
    username: EXT_PROXY_USERNAME,
    password: EXT_PROXY_PASSWORD,
  });

  const token = res.data?.data?.ext_token;
  dispatch(setExternalToken(token));

  return token;
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
    const state = store.getState();

    if (state.auth.user) {
      store.dispatch(
        setAuth({
          user: state.auth.user,
          token: nextToken,
          refresh: refreshToken,
          loginType: state.auth.loginType,
        }),
      );
    }

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

http.interceptors.request.use(async (config) => {
  const state = store.getState();
  let token = state.auth.token;

  if (config.url?.includes("/users-search/")) {
    token = await getExtToken(store.dispatch, store.getState);
  }

  if (token) {
    config.headers = setAuthorizationHeader(config.headers, token);
  }

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

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    const isAuthRoute =
      url.includes("/auth/login/") ||
      url.includes("/proxy/login/") ||
      url.includes("/token/refresh/");

    if (
      !originalRequest ||
      (status !== 401 && status !== 403) ||
      originalRequest._retry ||
      isAuthRoute
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (url.includes("/users-search/")) {
      try {
        const newExtToken = await getExtToken(
          store.dispatch,
          store.getState,
          true,
        );
        originalRequest.headers = setAuthorizationHeader(
          originalRequest.headers,
          newExtToken,
        );

        return http.request(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      clearAuthTokens();

      store.dispatch({
        type: "auth/clearAuth",
      });

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }

      return new Promise(() => {});
    }

    originalRequest.headers = setAuthorizationHeader(
      originalRequest.headers,
      newToken,
    );

    return http.request(originalRequest);
  },
);
