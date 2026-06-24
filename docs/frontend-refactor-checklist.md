# Frontend Refactor Checklist

## Core App Flow

1. App bootstraps from `src/main.tsx`.
2. Redux store, Material UI theme, React Router, global CSS, and toast container are mounted once.
3. `src/routes.tsx` restores authenticated user/profile context, resolves permissions, and renders public, auth, layout, sidebar, and extra routes.
4. `MainLayout` owns the app shell: responsive sidebar, header, and route outlet.
5. `Header` owns active clinic selection, clinic-scoped refreshes, notification polling, calendar dropdown, and user profile/photo menu.
6. `Sidebar` renders route navigation from `config/sidebar.tabs.ts` and `config/sidebar.menu.ts`, filtered by app mode and role permissions.
7. `services/http.ts` owns the shared Axios client, auth headers, clinic query context, external proxy token refresh, and access-token refresh.

## First-Pass Refactor Order

1. Core safety cleanup: remove stale comments, hardcoded values, debug-only code, and encoding artifacts where behavior is unchanged.
2. Configuration cleanup: centralize app mode, route/menu constants, env-backed values, and storage keys.
3. API cleanup: standardize service method naming, request cancellation, pagination response shapes, and token/clinic handling.
4. Store cleanup: standardize slice state shapes, selectors, thunk status handling, and persisted auth behavior.
5. Layout cleanup: split large header concerns into clinic selector, notification menu, calendar menu, and profile menu components.
6. Module cleanup in order: Dashboard, Leads Hub, Pipeline, Campaigns, Reputation, Referrals, Reports, Settings.

## Verification For Every Batch

1. Run TypeScript build.
2. Run relevant tests where available.
3. Manually verify the route/module touched.
4. Update this checklist when a lifecycle/flow is clarified.
