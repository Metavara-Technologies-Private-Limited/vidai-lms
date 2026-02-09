import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import MainLayout from "./components/Layout/MainLayout";
import { SIDEBAR_TABS } from "./config/sidebar.tabs";

import Integration from "./components/Settings/Menus/Integration";
import Tickets from "./components/Settings/Menus/Tickets";

<<<<<<< Updated upstream
=======
// 🆕 Updated import for the new Templates modular page
import TemplatesPage from "./components/Settings/Templates/TemplatesPage";

// 👇 import page directly (not sidebar-driven)
>>>>>>> Stashed changes
import AddNewLead from "./components/LeadsHub/AddNewLead";
import LeadView from "./components/LeadsHub/LeadView";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>

        {/* default */}
        <Route index element={<Navigate to="/dashboard" replace />} />
<<<<<<< Updated upstream

<Route
  path="settings/tickets"
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <Tickets />
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
          element={<Suspense fallback={<div>Loading...</div>}><Tickets /></Suspense>}
        />

=======
        
        {/* Settings sub routes */}
        <Route
          path="settings/integration"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Integration />
            </Suspense>
          }
        />

        {/* 🔥 Main Templates Route */}
        <Route
          path="settings/templates"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <TemplatesPage />
            </Suspense>
          }
        />
>>>>>>> Stashed changes

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
          ))
        )}

        {/* Add New Lead */}
        <Route
          path="leads/add"
          element={<Suspense fallback={<div>Loading...</div>}><AddNewLead /></Suspense>}
        />

        {/* 🔥 Lead View Page */}
        <Route
          path="leads/:id"
          element={<Suspense fallback={<div>Loading...</div>}><LeadView /></Suspense>}
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Route>
    </Routes>
  );
}