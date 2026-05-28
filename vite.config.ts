/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import type { Plugin } from "vite";

/**
 * Copies index.html into every known SPA route directory so that
 * S3/CloudFront can serve the file for direct-navigation URLs.
 */
function spaFallbackPlugin(): Plugin {
  const routes = [
    "login",
    "dashboard",
    "leads",
    "leads/add",
    "pipeline",
    "campaigns",
    "referrals",
    "referrals/doctors",
    "reports",
    "reputation",
    "settings",
    "documents",
    "risk",
    "compliance",
    "profile",
  ];

  return {
    name: "spa-fallback-copies",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const indexHtml = path.join(outDir, "index.html");
      if (!fs.existsSync(indexHtml)) return;

      const content = fs.readFileSync(indexHtml);
      for (const route of routes) {
        const dir = path.join(outDir, route);
        fs.mkdirSync(dir, { recursive: true });
        const target = path.join(dir, "index.html");
        if (!fs.existsSync(target)) {
          fs.writeFileSync(target, content);
        }
      }
    },
  };
}

// const backendTarget = "http://localhost:8000";
// const backendTarget = "http://192.168.10.156:8010";
// const backendTarget = "https://lms-usw-api.vidaisolutions.com";
const backendTarget = "https://prod-refera-usw-api.vidaisolutions.com";

const getPackageNameFromId = (id: string): string | null => {
  const marker = "node_modules/";
  const nodeModulesIndex = id.lastIndexOf(marker);
  if (nodeModulesIndex === -1) {
    return null;
  }

  const afterNodeModules = id.slice(nodeModulesIndex + marker.length);
  const segments = afterNodeModules.split("/");
  if (!segments.length) {
    return null;
  }

  if (segments[0].startsWith("@") && segments.length > 1) {
    return `${segments[0]}/${segments[1]}`;
  }

  return segments[0] || null;
};

const isPackageMatch = (pkg: string, names: string[]): boolean =>
  names.some((name) => pkg === name || pkg.startsWith(`${name}/`));

const apiProxy = {
  "/api": {
    target: backendTarget,
    changeOrigin: true,
    secure: false,
  },
  // Profile/user photos are served by Django from /media/*.
  // Without this proxy, /media URLs resolve to Vite dev server and 404.
  "/media": {
    target: backendTarget,
    changeOrigin: true,
    secure: false,
  },
  // Backward-compat for any legacy /api/media/* URLs persisted in old sessions.
  "/api/media": {
    target: backendTarget,
    changeOrigin: true,
    secure: false,
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          const pkg = getPackageNameFromId(id);
          if (!pkg) {
            return;
          }

          if (pkg === "exceljs") {
            return "vendor-exceljs";
          }

          if (pkg === "emoji-picker-react") {
            return "vendor-emoji-picker";
          }

          if (pkg === "@mui/x-date-pickers") {
            return "vendor-mui-date-pickers";
          }

          if (
            pkg === "recharts" ||
            pkg === "chart.js" ||
            pkg.startsWith("d3") ||
            isPackageMatch(pkg, ["victory-vendor"])
          ) {
            return "vendor-charts";
          }

          if (
            isPackageMatch(pkg, [
              "@tiptap/core",
              "@tiptap/pm",
              "@tiptap/react",
              "@tiptap/starter-kit",
              "@tiptap/extension-link",
              "@tiptap/extension-list",
              "@tiptap/extension-text-style",
              "prosemirror-model",
              "prosemirror-state",
              "prosemirror-view",
              "prosemirror-transform",
              "prosemirror-commands",
            ])
          ) {
            return "vendor-editor";
          }

          return;
        },
      },
    },
  },
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
    host: true,
    port: 5173,
    strictPort: true,
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
    proxy: apiProxy,
  },
  preview: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
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
