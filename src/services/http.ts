import axios, { AxiosError } from "axios";

// Base axios instance used everywhere in the app.
// Keep all network + auth related setup here.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Add auth token to every request if it exists
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers?.set("Authorization", `Bearer ${token}`);
  return config;
});

// Handle auth errors in one place
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      // App will decide what to do (redirect, logout, etc.)
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  },
);
