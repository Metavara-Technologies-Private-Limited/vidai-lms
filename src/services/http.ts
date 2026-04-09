import axios, { AxiosError, type AxiosInstance } from "axios";

// Base axios instance used everywhere in the app.
// Keep all network + auth related setup here.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
interface HttpInstance extends AxiosInstance {
  redirect: (path: string) => void;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
}) as HttpInstance;

const getAccessToken = (): string | null =>
  localStorage.getItem("auth_token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("auth_token") ||
  sessionStorage.getItem("authToken");

const getRefreshToken = (): string | null =>
  localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");

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
      refresh_token: refreshToken,
    });

    const nextToken = response.data?.data?.access_token;
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
http.interceptors.request.use((config) => {
  // Let Axios/browser set multipart boundary automatically for file uploads.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      const headers = (config.headers ?? {}) as Record<string, unknown>;
      delete headers["Content-Type"];
      delete headers["content-type"];
      config.headers = headers as typeof config.headers;
    }
  }

  const token = getAccessToken();

  if (token) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      const headers = (config.headers ?? {}) as Record<string, string>;
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers as typeof config.headers;
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

    if (!originalRequest || status !== 401 || originalRequest._retry || isAuthRoute) {
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
