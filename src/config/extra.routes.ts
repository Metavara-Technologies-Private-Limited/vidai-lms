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
    page: lazy(() => import("../components/Referrals/Doctors")),
  },
  {
  key: "referral-corporate",
  path: "referrals/corporate",
  page: lazy(() => import("../components/Referrals/Corporate")),
},
{
  key: "referral-insurance",
  path: "referrals/insurance",
  page: lazy(() => import("../components/Referrals/Insurance")),
},
{
  key: "referral-diagnostic",
  path: "referrals/diagnostic",
  page: lazy(() => import("../components/Referrals/Daignostic")),
},
{
  key: "referral-zoya",
  path: "referrals/zoya",
  page: lazy(() => import("../components/Referrals/Zoya")),
},
{
  key: "referral-practo",
  path: "referrals/practo",
  page: lazy(() => import("../components/Referrals/Practo")),
}
];
