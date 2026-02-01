// src/config/sidebar.menu.ts
import { lazy, type JSX } from "react";

export type MenuItem = {
  key: string;
  label: string;
  path: string;
  page: React.LazyExoticComponent<() => JSX.Element>;
};

export const LEADS_MENU: MenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    page: lazy(() => import("../pages/Dashboard")),
  },
  {
    key: "leads",
    label: "Leads Hub",
    path: "/leads",
    page: lazy(() => import("../pages/Leads")),
  },
  {
    key: "referrals",
    label: "Referral Management",
    path: "/referrals",
    page: lazy(() => import("../pages/Referrals")),
  },
  {
    key: "campaigns",
    label: "Campaigns",
    path: "/campaigns",
    page: lazy(() => import("../pages/Campaigns")),
  },
  {
    key: "pipeline",
    label: "Sales Pipeline Configuration",
    path: "/pipeline",
    page: lazy(() => import("../pages/Pipeline")),
  },
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    page: lazy(() => import("../pages/Settings")),
  },
];

export const DOCUMENTS_MENU: MenuItem[] = [
  {
    key: "documents",
    label: "All Documents",
    path: "/documents",
    page: lazy(() => import("../pages/Dashboard")),
  },
  {
    key: "reports",
    label: "Reports",
    path: "/documents/reports",
    page: lazy(() => import("../pages/Dashboard")),
  },
];

export const RISK_MENU: MenuItem[] = [
  {
    key: "risk-dashboard",
    label: "Risk Dashboard",
    path: "/risk",
    page: lazy(() => import("../pages/Dashboard")),
  },
];

export const COMPLIANCE_MENU: MenuItem[] = [
  {
    key: "compliance-dashboard",
    label: "Compliance Dashboard",
    path: "/compliance",
    page: lazy(() => import("../pages/Dashboard")),
  },
];
