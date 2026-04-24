# VIDAI LMS UI

React-based Lead Management dashboard for fertility care operations.

## Quick Start

```bash
npm install
npm run dev
```

Set `.env` file:

```env
VITE_API_BASE_URL=https://lms.xyz.in/api
```

## Tech Stack

* React 19 + TypeScript
* Material-UI (MUI)
* Redux Toolkit
* Vite
* Axios
* React Router
* Recharts

## Modules

### POC

* **Dashboard** – KPIs, analytics, SLA alerts
* **Leads Hub** – Lead board, table, activity, follow-ups
* **Campaigns** – Email & social campaign management
* **Settings** – Templates, tickets, integrations

### Planned (Upcoming)

* **Referral Management** – Partner & doctor referrals
* **Sales Pipeline** – Stage-wise lead tracking
* **Reputation Management** – Reviews & feedback monitoring
* **Role & Permission Management** – Access control
* **External Integrations** – CRM, Zapier, marketing tools

## Project Structure

```
src/
├── components/     # Feature components (Dashboard, Leads, Campaigns, Settings)
├── pages/          # Route pages
├── services/       # API services
├── store/          # Redux slices
├── types/          # TypeScript types
├── styles/         # Feature styles
├── config/         # Sidebar menus & tabs
└── utils/          # Utilities
```

## Backend Integration

API handled via `src/services/http.ts`

## Documentation

* [Task Templates and Dashboard Pages](docs/TASK_TEMPLATES_AND_DASHBOARD.md)

## Current Status

* ✅ Frontend UI: POC complete
* 🔄 API Integration: In progress
* 🔄 Zapier Integration: In progress
* ⏳ Authentication: Pending

## Scripts

* `npm run dev` – Development server
* `npm run build` – Production build
* `npm run preview` – Preview build
* `npm run test` – Run tests
* `npm run lint` – Lint code

---

**Version:** 0.1.0
