import { lazy } from "react";

export const EXTRA_ROUTES = [
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
];
