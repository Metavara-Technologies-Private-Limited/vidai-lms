
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import MainLayout from "./components/Layout/MainLayout";
import { SIDEBAR_TABS } from "./config/sidebar.tabs";

// 👇 import page directly (not sidebar-driven)
import AddNewLead from "./components/LeadsHub/AddNewLead";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* default */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* sidebar routes */}
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
          ))
        )}

        {/* 🔥 Add New Lead page */}
        <Route
          path="leads/add"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <AddNewLead />
            </Suspense>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
