import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import MainLayout from "./components/Layout/MainLayout";
import { SIDEBAR_TABS } from "./config/sidebar.tabs";

import Integration from "./components/Settings/Menus/Integration";
import Templates from "./components/Settings/Menus/Templates";
import Tickets from "./components/Settings/Menus/Tickets";

// 👇 import page directly (not sidebar-driven)
import AddNewLead from "./components/LeadsHub/AddNewLead";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* default */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        {/* Settings sub routes */}
        <Route
          path="settings/integration"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Integration />
            </Suspense>
          }
        />

        <Route
          path="settings/templates"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Templates />
            </Suspense>
          }
        />

        <Route
          path="settings/tickets"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Tickets />
            </Suspense>
          }
        />

        {/* sidebar routes */}
        {SIDEBAR_TABS.flatMap((tab) =>
          tab.menu.map((item) => (
            <Route
              key={item.key}
              path={item.path.replace("/", "")}
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  {item.page && <item.page />}
                </Suspense>
              }
            />
          )),
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
