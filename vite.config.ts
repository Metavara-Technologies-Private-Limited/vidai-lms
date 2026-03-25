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
    proxy: {
      // ✅ /stage-api → preview-api.vidaisolutions.com
      // Used by: VidaiLogin → /stage-api/api/login/
      //          ProfilePage → /stage-api/api/me/profile
      "/stage-api": {
        target: "https://99999.preview-api.vidaisolutions.com",  // ✅ correct URL
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/stage-api/, ""),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("[proxy /stage-api error]", err.message);
          });
        },
      },

      // ✅ /api → preview-api.vidaisolutions.com (demo mode — Django not running)
      // Switch target back to "http://localhost:8000" when Django is running locally.
      "/api": {
        target: "https://99999.preview-api.vidaisolutions.com",  // ✅ correct URL
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("[proxy /api error]", err.message);
          });
        },
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