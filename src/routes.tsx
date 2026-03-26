import { Routes, Route, Navigate } from "react-router-dom";
import {
  lazy,
  Suspense,
  useEffect,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { SIDEBAR_TABS } from "./config/sidebar.tabs";
import { EXTRA_ROUTES } from "./config/extra.routes";
import { APP_CONDITION, DEMO_ALLOWED_KEYS } from "./config/sidebar.menu";
import { useDispatch, useSelector } from "react-redux";
import { selectAuthed, selectToken, setAuth } from "./store/authSlice";
import type { AppDispatch } from "./store";
import { authApi } from "./services/auth.api";
import { Box, CircularProgress } from "@mui/material";
import { syncClinic } from "./store/clinicSlice";

const MainLayout = lazy(() => import("./components/Layout/MainLayout"));
const ReviewFormPage = lazy(() => import("./components/Reputation/ReviewForm"));
const VidaiLogin = lazy(() => import("./pages/VidaiLogin"));

const Spinner = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <CircularProgress />
  </Box>
);

type LoaderProps = { Comp: LazyExoticComponent<ComponentType<object>> };
function LoadedComponent({ Comp }: LoaderProps) {
  return (
    <Suspense fallback={<Spinner/>}>
      <Comp />
    </Suspense>
  );
}

export default function AppRoutes() {
  const dispatch = useDispatch<AppDispatch>();
  const authed = useSelector(selectAuthed);
  const token = useSelector(selectToken);

  useEffect(() => {
    const restoreUser = async () => {
      if (!token) return;

      try {
        const profile = await authApi.getProfile();

        dispatch(
          setAuth({
            access: token,
            ...profile,
          }),
        );
        if (profile?.clinics?.length) {
          await syncClinic(profile.clinics[0], profile.email);
        }
      } catch (err: unknown) {
        console.error("Failed to restore user", err);
      }
    };

    restoreUser();
  }, [token, authed, dispatch]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authed ? (
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
          authed ? (
            <Suspense fallback={<Spinner />}>
              <MainLayout />
            </Suspense>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* ✅ Sidebar routes — filtered by demo condition */}
        {SIDEBAR_TABS.flatMap((tab) =>
          tab.menu.flatMap((item) => {
            // In demo mode, skip routes not in allowed list
            if (
              APP_CONDITION === "demo" &&
              !DEMO_ALLOWED_KEYS.includes(item.key)
            ) {
              return [];
            }

            return [
              item.page && (
                <Route
                  key={item.key}
                  path={item.path.replace(/^\//, "")}
                  element={<LoadedComponent Comp={item.page} />}
                />
              ),
              item.subMenu?.map((sub) =>
                sub.page ? (
                  <Route
                    key={sub.key}
                    path={sub.path.replace(/^\//, "")}
                    element={<LoadedComponent Comp={sub.page} />}
                  />
                ) : null,
              ),
            ];
          }),
        )}

        {/* Extra routes — always available */}
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