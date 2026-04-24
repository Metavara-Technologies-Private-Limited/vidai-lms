import { lazy } from "react";

export const EXTRA_ROUTES = [
  {
    key: "reports-tab",
    path: "reports/:tab",
    page: lazy(() => import("../pages/Reports.tsx")),
  },
  {
    key: "ticket-view",
    path: "settings/tickets/:id",
    page: lazy(() => import("../components/Settings/Menus/TicketView")),
  },
  {
    key: "lead-add",
    path: "leads/add",
    page: lazy(() => import("../components/LeadsHub/AddNewLead")),
  },
  {
    key: "lead-edit",
    path: "leads/edit/:id",
    page: lazy(() => import("../components/LeadsHub/EditLead")),
  },
  {
    key: "lead-view",
    path: "leads/:id",
    page: lazy(() => import("../components/LeadsHub/LeadView")),
  },
  {
    key: "referral-doctors",
    path: "referrals/doctors",
    page: lazy(() =>
      import("../components/Referrals/ReferralsManager.tsx").then((m) => ({
        default: m.Doctors,
      })),
    ),
  },
  {
    key: "referral-doctor-detail",
    path: "referrals/doctors/:doctorId",
    page: lazy(() =>
      import("../components/Referrals/ReferralsManager.tsx").then((m) => ({
        default: m.DoctorReferrals,
      })),
    ),
  },
  {
    key: "referral-corporate",
    path: "referrals/corporate",
    page: lazy(() =>
      import("../components/Referrals/ReferralsManager.tsx").then((m) => ({
        default: m.Corporate,
      })),
    ),
  },
  {
    key: "referral-insurance",
    path: "referrals/insurance",
    page: lazy(() =>
      import("../components/Referrals/ReferralsManager.tsx").then((m) => ({
        default: m.Insurance,
      })),
    ),
  },
  {
    key: "referral-diagnostic",
    path: "referrals/diagnostic",
    page: lazy(() =>
      import("../components/Referrals/ReferralsManager.tsx").then((m) => ({
        default: m.Diagnostic,
      })),
    ),
  },
  {
    key: "referral-zoya",
    path: "referrals/zoya",
    page: lazy(() =>
      import("../components/Referrals/ReferralsManager.tsx").then((m) => ({
        default: m.Zoya,
      })),
    ),
  },
  {
    key: "referral-practo",
    path: "referrals/practo",
    page: lazy(() =>
      import("../components/Referrals/ReferralsManager.tsx").then((m) => ({
        default: m.Practo,
      })),
    ),
  },
  {
    key: "reputation",
    path: "reputation",
    page: lazy(() => import("../pages/Reputation.tsx")),
  },
];
