# Task Templates and Dashboard Pages

This document describes how the **Templates** page (Settings module) and **Dashboard** page are implemented in the current frontend codebase.

## 1) Routes and Navigation

### Dashboard
- Main route: `/dashboard`
- Route registration: `src/config/sidebar.menu.ts` (`dashboard` item)
- Page component: `src/pages/Dashboard.tsx`
- Primary layout component: `src/components/dashboard/DashboardLayout.tsx`

### Task Templates (Settings)
- Main route: `/settings/templates`
- Route registration: `src/config/sidebar.menu.ts` (`settings -> templates` submenu)
- Parent settings page: `src/pages/Settings.tsx` (redirects `/settings` to `/settings/integration`)
- Templates page component: `src/components/Settings/Templates/TemplatesPage.tsx`

### Global Routing Notes
- All menu-driven routes are resolved by `src/routes.tsx` using `SIDEBAR_TABS` and `EXTRA_ROUTES`.
- Unknown routes currently redirect to `/dashboard`.

---

## 2) Dashboard Page

### Component Structure
- `Dashboard.tsx` wraps `DashboardLayout` in a scrollable container.
- `DashboardLayout.tsx` renders a 2-column responsive grid:
  - **Left column**: title, KPI cards, and an overview card.
  - **Right column**: SLA alerts card.

### Main Dashboard Widgets
From `src/components/dashboard/DashboardLayout.tsx`:
- `KpiCards`
- `TimeRangeSelector`
- `OverviewTabs`
- Tab content widgets:
  - `SourcePerformanceChart`
  - `CommunicationChart`
  - `ConversionTrendChart`
  - `LeadPipelineFunnel`
  - `AppointmentsChart`
  - `TeamPerformanceTab`
- `SlaAlerts`

### Local State
- `timeRange` (`month` default) controls the time selector UI.
- `activeTab` (`source` default) controls which overview widget is rendered.

### Data Source
- Dashboard widgets currently consume mock/static data from:
  - `src/components/dashboard/mockData.ts`
- This includes KPI values, SLA alerts, source performance, communication, conversion trends, pipeline, appointments, and team performance.

### Styling & Types
- Type contracts: `src/types/dashboard.types.ts`
- Styles are primarily under `src/styles/dashboard/`

---

## 3) Task Templates Page

### Page Purpose
`TemplatesPage.tsx` provides management for Email, SMS, and WhatsApp templates with:
- Tabbed views
- Search and use-case filtering
- Create/Edit/View modal
- Copy details modal
- Delete confirmation modal

### Component Structure
Key components under `src/components/Settings/Templates/`:
- `TemplateHeader` (tabs, search, filters, create action)
- `EmailTemplateTable`
- `SmsTemplateTable`
- `WhatsAppTemplateTable`
- `NewTemplateModal`
- `DeleteConfirmModal`
- `CopyDetailsModal`

### State & Behavior (TemplatesPage)
- `activeTab`: selected channel (`Email`, `SMS`, `WhatsApp`)
- `templates`: grouped state (`mail`, `sms`, `whatsapp`)
- `searchQuery`: free-text search
- `activeFilters`: currently used for use-case filter
- `loading`: page loader state
- modal and action states (`isModalOpen`, `viewMode`, `templateInAction`, etc.)

### Fetch Strategy
- On load, page fetches all template types in parallel via `Promise.all`:
  - `TemplateService.getTemplates('mail')`
  - `TemplateService.getTemplates('sms')`
  - `TemplateService.getTemplates('whatsapp')`
- Counts in header are shown from preloaded data.

### Filtering Logic
Current filtered table data is based on:
- Search text across template name/audience and subject
- `useCase` equality filter

### Actions
Supported table actions:
- `view` -> opens `NewTemplateModal` in view mode
- `edit` -> opens `NewTemplateModal` in edit mode
- `copy` -> opens `CopyDetailsModal`
- `delete` -> opens `DeleteConfirmModal` and calls API on confirm

### API Integration
Service layer: `src/services/templates.api.ts`

Implemented endpoints by type (`mail | sms | whatsapp`):
- `GET /templates/{type}/`
- `GET /templates/{type}/{templateId}/`
- `POST /templates/{type}/create/`
- `PUT /templates/{type}/{templateId}/update/`
- `DELETE /templates/{type}/{templateId}/delete/`

### Types
Template-related contracts are in:
- `src/types/templates.types.ts`

Includes:
- API template shapes (`EmailTemplate`, `SMSTemplate`, `WhatsAppTemplate`)
- UI shape (`Template`)
- filters (`TemplateFilters`)
- grouped page state (`TemplatesState`)

### Redux Note
- `src/store/emailTemplateSlice.ts` exists for selected email template state.
- Current `TemplatesPage.tsx` mainly uses component-local state for template listing/actions.

---

## 4) Operational Notes

### Toast Notifications
- Toast container is mounted in `src/routes.tsx` (`ToastContainer`).
- Templates page uses `react-toastify` for success/error notifications.

### Testing Coverage
- Dashboard and Templates pages currently have no dedicated page-level test files in `src/pages` (as of current workspace snapshot).
- Existing tests are concentrated in Leads Hub and Campaign modules.

---

## 5) Quick Maintenance Checklist

When changing either page, verify:
1. Route path and menu mapping (`src/config/sidebar.menu.ts`) are still correct.
2. Component contracts still match the type definitions in `src/types/`.
3. Template API shape changes are reflected in `src/services/templates.api.ts` and table/modal mappers.
4. Dashboard visual widgets still align with expected data shape in `mockData.ts` (or real API contracts if migrated).
5. Toast and modal flows still provide clear success/error states.
