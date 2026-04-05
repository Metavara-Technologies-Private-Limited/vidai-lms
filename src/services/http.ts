import axios, { AxiosError, type AxiosInstance } from "axios";

// Base axios instance used everywhere in the app.
// Keep all network + auth related setup here.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

interface HttpInstance extends AxiosInstance {
  redirect: (path: string) => void;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
}) as HttpInstance;

const AUTH_BYPASS_PATHS = ["/login/", "/auth/login/"];
const AUTH_SOFT_FAIL_PATHS = ["/me/profile/", "/users-search/"];

const isAuthBypassRequest = (url?: string): boolean => {
  if (!url) return false;
  return AUTH_BYPASS_PATHS.some((path) => url.includes(path));
};

const isAuthSoftFailRequest = (url?: string): boolean => {
  if (!url) return false;
  return AUTH_SOFT_FAIL_PATHS.some((path) => url.includes(path));
};

http.redirect = (path: string): void => {
  const baseURL = http.defaults.baseURL ?? "";
  window.location.href = `${baseURL}${path}`;
};

// Add auth token to every request if it exists
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");

  if (token && !isAuthBypassRequest(config.url)) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// Handle auth errors in one place
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url;

    if (
      error.response?.status === 401 &&
      !isAuthBypassRequest(requestUrl) &&
      !isAuthSoftFailRequest(requestUrl)
    ) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("authToken");
      // App will decide what to do (redirect, logout, etc.)
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  },
);
