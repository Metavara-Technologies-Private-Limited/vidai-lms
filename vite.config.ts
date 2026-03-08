/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@mui/material",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
      "@reduxjs/toolkit",
      "react-redux",
      "react-toastify",
      "recharts",
      "dayjs",
      "date-fns",
    ],
  },
  server: {
    warmup: {
      clientFiles: [
        "./src/main.tsx",
        "./src/routes.tsx",
        "./src/pages/Dashboard.tsx",
        "./src/components/dashboard/DashboardLayout.tsx",
      ],
    },
    // ── API Proxy ──────────────────────────────────────────────────────────
    // All requests to /api/* are forwarded to Django (localhost:8000)
    // This means you NEVER need to update a URL when Cloudflare tunnel changes.
    // Your axios calls stay as:  axios.get("/api/mail-insights/get/")
    proxy: {
      "/api": {
        target: "http://localhost:8000",   // Django dev server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});