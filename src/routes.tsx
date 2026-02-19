import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, type JSX } from "react";
import MainLayout from "./components/Layout/MainLayout";
import { SIDEBAR_TABS } from "./config/sidebar.tabs";
import { EXTRA_ROUTES } from "./config/extra.routes";

// --- Added for Toast Notifications ---
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// -------------------------------------

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
    <>
      {/* This container must exist for the toast.success() and toast.error() 
          calls in your logic files to actually show up on the UI.
      */}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
              />

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
    </>
  );
}