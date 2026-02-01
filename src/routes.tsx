// src/app.routes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import MainLayout from "./components/Layout/MainLayout";
import { SIDEBAR_TABS } from "./config/sidebar.tabs";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {SIDEBAR_TABS.flatMap((tab) =>
          tab.menu.map((item) => (
            <Route
              key={item.key}
              path={item.path.replace("/", "")}
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <item.page />
                </Suspense>
              }
            />
          )),
        )}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
