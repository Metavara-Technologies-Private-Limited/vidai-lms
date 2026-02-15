import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, type JSX } from "react";
import MainLayout from "./components/Layout/MainLayout";
import { SIDEBAR_TABS } from "./config/sidebar.tabs";
import { EXTRA_ROUTES } from "./config/extra.routes";

type LoaderProps = { Comp: React.LazyExoticComponent<() => JSX.Element> };
function LoadedComponent({ Comp }: LoaderProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Comp />
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Sidebar routes */}
        {SIDEBAR_TABS.flatMap((tab) =>
          tab.menu.flatMap((item) => [
            item.page && (
              <Route
                key={item.key}
                path={item.path.replace(/^\//, "")}
                element={<LoadedComponent Comp={item.page} />}
              />
            ),
            // {/* Sidebar sub menu routes */}
            item.subMenu?.map((sub) =>
              sub.page ? (
                <Route
                  key={sub.key}
                  path={sub.path.replace(/^\//, "")}
                  element={<LoadedComponent Comp={sub.page} />}
                />
              ) : null,
            ),
          ]),
        )}

        {/* Extra routes */}
        {EXTRA_ROUTES.map((route) => (
          <Route
            key={route.key}
            path={route.path}
            element={<LoadedComponent Comp={route.page} />}
          />
        ))}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
