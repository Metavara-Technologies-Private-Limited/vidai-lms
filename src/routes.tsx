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
import {
  selectAuthed,
  selectToken,
  selectUser,
  setUser,
} from "./store/authSlice";
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
import type { AuthUser } from "./types/auth.types";
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

type ProfileClinic = {
  clinic_id: number;
  clinic__name: string;
  is_default: boolean;
};

const getClinicId = (clinic: unknown): number | null => {
  if (!clinic || typeof clinic !== "object") {
    return typeof clinic === "number" ? clinic : null;
  }

  const record = clinic as Record<string, unknown>;
  const id = record.clinic_id ?? record.id;
  return typeof id === "number" ? id : null;
};

const getClinicName = (
  clinic: unknown,
  fallbackName?: string,
): string | null => {
  if (!clinic || typeof clinic !== "object") {
    return fallbackName || null;
  }

  const record = clinic as Record<string, unknown>;
  const name =
    record.clinic__name ?? record.clinic_name ?? record.name ?? fallbackName;

  return typeof name === "string" && name.trim() ? name.trim() : null;
};

const normalizeClinics = (
  profile: Record<string, unknown>,
): ProfileClinic[] => {
  const nestedUser =
    profile.user && typeof profile.user === "object"
      ? (profile.user as Record<string, unknown>)
      : null;

  const fallbackName =
    (typeof profile.clinic__name === "string" && profile.clinic__name) ||
    (typeof profile.clinic_name === "string" && profile.clinic_name) ||
    undefined;

  const rawClinics =
    profile.clinics ??
    nestedUser?.clinics ??
    profile.clinic ??
    nestedUser?.clinic ??
    profile.clinic_id ??
    nestedUser?.clinic_id;

  const asArray = Array.isArray(rawClinics)
    ? rawClinics
    : rawClinics != null
      ? [rawClinics]
      : [];

  return asArray
    .map((entry) => {
      const clinicId = getClinicId(entry);
      const clinicName = getClinicName(entry, fallbackName);
      if (!clinicId || !clinicName) return null;

      const isDefault =
        typeof entry === "object" &&
        entry !== null &&
        (entry as Record<string, unknown>).is_default === true;

      return {
        clinic_id: clinicId,
        clinic__name: clinicName,
        is_default: isDefault,
      };
    })
    .filter((clinic): clinic is ProfileClinic => clinic !== null);
};

type LoaderProps = { Comp: LazyExoticComponent<ComponentType<object>> };
function LoadedComponent({ Comp }: LoaderProps) {
  return (
    <Suspense fallback={<Spinner />}>
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

      // Skip profile call only when we've explicitly hydrated profile before.
      if (user && typeof user === "object" && user.profile_loaded) return;

      try {
        const profile = await authApi.getProfile();
        if (!profile || typeof profile !== "object") return;

        const normalizedClinics = normalizeClinics(
          profile as Record<string, unknown>,
        );

        dispatch(
          setUser({
            ...(user as AuthUser | null),
            ...(profile as AuthUser),
            clinics: normalizedClinics,
            profile_loaded: true,
          } as AuthUser),
        );

        if (normalizedClinics.length > 0) {
          const defaultClinic =
            normalizedClinics.find((clinic) => clinic.is_default) ??
            normalizedClinics[0];

          if (defaultClinic?.clinic_id) {
            await dispatch(fetchClinic(defaultClinic.clinic_id));
          }

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
