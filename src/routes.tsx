import { Routes, Route, Navigate } from "react-router-dom";
import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { SIDEBAR_TABS } from "./config/sidebar.tabs";
import { EXTRA_ROUTES } from "./config/extra.routes";

const MainLayout = lazy(() => import("./components/Layout/MainLayout"));
const ReviewFormPage = lazy(() => import("./components/Reputation/ReviewForm"));
const VidaiLogin = lazy(() => import("./pages/VidaiLogin"));

const UI_AUTH_KEY = "vidai_ui_logged_in";

const isAuthenticated = () => localStorage.getItem(UI_AUTH_KEY) === "1";

type LoaderProps = { Comp: LazyExoticComponent<ComponentType<object>> };
function LoadedComponent({ Comp }: LoaderProps) {
  return (
    <Suspense fallback={<div style={{ padding: 12 }}>Loading...</div>}>
      <Comp />
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoadedComponent Comp={VidaiLogin} />
            )
          }
        />

        <Route
          path="/review/:requestId/:leadId"
          element={<LoadedComponent Comp={ReviewFormPage} />}
        />
        <Route
          path="/review/:requestId/:leadId/:channel"
          element={<LoadedComponent Comp={ReviewFormPage} />}
        />
        <Route
          path="/review/*"
          element={<LoadedComponent Comp={ReviewFormPage} />}
        />
        <Route
          path="/settings/integration/review/:requestId/:leadId"
          element={<LoadedComponent Comp={ReviewFormPage} />}
        />
        <Route
          path="/settings/integration/review/:requestId/:leadId/:channel"
          element={<LoadedComponent Comp={ReviewFormPage} />}
        />
        <Route
          path="/settings/integration/review/*"
          element={<LoadedComponent Comp={ReviewFormPage} />}
        />

        <Route
          path="/"
          element={
            isAuthenticated() ? (
              <Suspense
                fallback={<div style={{ padding: 12 }}>Loading app...</div>}
              >
                <MainLayout />
              </Suspense>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
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
