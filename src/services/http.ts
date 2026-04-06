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

http.redirect = (path: string): void => {
  const baseURL = http.defaults.baseURL ?? "";
  window.location.href = `${baseURL}${path}`;
};

// Add auth token to every request if it exists
http.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("auth_token") || localStorage.getItem("authToken");

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
  (error: AxiosError) => Promise.reject(error),
);
