# A8. Frontend-To-API Mapping

Status: Draft mapping ready
Target: 24-Jun-2026

## Priority Screen Mapping

| Screen / Module | Frontend Files | API Service | Primary API Areas |
| --- | --- | --- | --- |
| Login / Auto Login | `src/pages/VidaiLogin.tsx`, `src/pages/AutoLogin.tsx`, `src/routes.tsx` | `src/services/auth.api.ts` | Login, profile restore, permissions |
| Dashboard | `src/components/dashboard/*` | `src/services/leads.api.ts`, `src/services/campaign.api.ts`, store slices | KPI, appointments, team performance, campaign summaries |
| Leads Hub | `src/pages/Leads.tsx`, `src/components/LeadsHub/*` | `src/services/leads.api.ts`, `src/services/employee.api.ts`, `src/services/pipeline.api.ts` | Lead list, lead create/edit/view, bulk import, appointment booking, communication history |
| Lead Detail | `src/components/LeadsHub/LeadView.tsx`, `Nextactiontab.tsx`, `HistoryTab.tsx` | `src/services/leads.api.ts`, `src/services/pipeline.api.ts` | Lead update, next action, call/SMS/email, notes, appointment state |
| Pipeline Configuration | `src/components/SalesPipeline/*` | `src/services/pipeline.api.ts` | Pipeline CRUD, stages, stage rules, stage data capture fields |
| Campaigns | `src/components/Campaign/*` | `src/services/campaign.api.ts`, `src/services/integration.api.ts` | Social/email campaigns, Meta, Google Ads, LinkedIn, Mailchimp/insights, campaign schedule/status |
| Referral | `src/components/Referrals/*` | `src/services/referral.api.ts` | Referral sources, departments, partner/referral flows |
| Reputation Management | `src/components/Reputation/*` | `src/services/reputation.api.ts`, `src/services/templates.api.ts` | Review requests, templates, review form and status |
| Communication / Tickets | `src/components/Settings/Menus/*` | `src/services/tickets.api.ts` | Tickets, replies, timeline, properties |
| User Permissions | `src/components/Settings/User/*`, `src/utils/roleAccess.ts` | `src/services/users.api.ts`, `src/services/role.api.ts`, `src/services/auth.api.ts` | Users, roles, page-wise permissions, profile permission restore |
| Clinic / Lab Context | `src/components/Layout/Header.tsx`, `src/store/clinicSlice.ts` | `src/services/clinic.api.ts`, `src/services/lab.api.ts` | Clinic selection, lab context, header notifications/calendar |

## Routing And Access Control

Routes are defined in `src/routes.tsx`, sidebar tabs in `src/config/sidebar.tabs.ts`, additional routes in `src/config/extra.routes.ts`, and menu visibility in `src/config/sidebar.menu.ts`.

Access checks flow through `src/utils/roleAccess.ts` and the authenticated user/permission payload restored in `src/routes.tsx`.

