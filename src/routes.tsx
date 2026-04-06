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
import { selectAuthed, selectToken, selectUser, setUser } from "./store/authSlice";
import type { AppDispatch } from "./store";
import { authApi } from "./services/auth.api";
import { Box, CircularProgress } from "@mui/material";
import { fetchClinic, syncClinic } from "./store/clinicSlice";
import {
  canAccessMenuKey,
  canAccessSubMenuKey,
  defaultPathForUser,
  resolveUserRole,
} from "./utils/roleAccess";
import type { AuthUser, UserClinic } from "./types/auth.types";
import { fetchLeads } from "./store/leadSlice";
// import type { Clinic } from "./types/clinic.types";

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
  const user = useSelector(selectUser);
  // const loginType = useSelector(selectLoginType);
  const roleContext =
    (user as Record<string, unknown> | null) ??
    (token ? ({ access: token } as Record<string, unknown>) : null);
  const role = resolveUserRole(roleContext);
  const roleDefaultPath = defaultPathForUser(role, roleContext);

  useEffect(() => {
    const restoreUser = async () => {
      if (!token) return;

      try {
        const profile = await authApi.getProfile();
        if (!profile || typeof profile !== "object") return;

        const clinics: UserClinic[] = Array.isArray(profile.clinics)
          ? profile.clinics
          : [];

        const authUser: AuthUser = {
          id: profile.id ?? user?.id ?? 0,
          username: profile.username ?? user?.username ?? "",
          email: profile.email ?? user?.email ?? "",
          role: profile.role ?? user?.role ?? "",
          permissions: profile.permissions ??
            user?.permissions ?? { modules: [] },
          first_name: profile.first_name ?? user?.first_name,
          last_name: profile.last_name ?? user?.last_name,
          designation: profile.designation ?? user?.designation,
          designation_label:
            profile.designation_label ?? user?.designation_label,
          clinics: clinics.length > 0 ? clinics : undefined,
        };

        dispatch(setUser(authUser));

        if (clinics.length > 0) {
          const defaultClinic = clinics.find((c) => c.is_default) ?? clinics[0];
          const clinicId = defaultClinic?.clinic_id ?? 1;
          await dispatch(fetchClinic(clinicId));
          if (
            defaultClinic?.clinic__name &&
            typeof profile.email === "string"
          ) {
            await syncClinic(defaultClinic, profile.email);
          }
        } else {
          // EXT users or INT users with no clinics
          await dispatch(fetchClinic(1));
        }

        await dispatch(fetchLeads());
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status !== 401 && status !== 403) {
          console.error("Failed to restore user", err);
        }
      }
    };

    restoreUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Route index element={<Navigate to={roleDefaultPath} replace />} />

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

            if (!canAccessMenuKey(role, item.key, roleContext)) {
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
              item.subMenu
                ?.filter((sub) =>
                  canAccessSubMenuKey(role, item.key, sub.key, roleContext),
                )
                .map((sub) =>
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

        <Route path="*" element={<Navigate to={roleDefaultPath} replace />} />
      </Route>
    </Routes>
  );
}