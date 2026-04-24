import QualityIcon from "../assets/icons/Quality_control.svg";
import DocumentIcon from "../assets/icons/Documentation_control.svg";
import RiskIcon from "../assets/icons/Riskmanagement.svg";
import ComplianceIcon from "../assets/icons/Compliance.svg";
import Subtract1 from "../assets/icons/Subtract_1.svg";
import Subtract2 from "../assets/icons/Subtract_2.svg";
import Subtract3 from "../assets/icons/Subtract_3.svg";
import Subtract4 from "../assets/icons/Subtract_4.svg";

import {
  LEADS_MENU,
  DOCUMENTS_MENU,
  RISK_MENU,
  COMPLIANCE_MENU,
} from "./sidebar.menu";

export type SidebarTabKey = "leads" | "documents" | "risk" | "compliance";

export type SidebarTabConfig = {
  key: SidebarTabKey;
  label: string;
  bg: string;
  icon: {
    src: string;
    baseScale: number;
  };
  defaultPath: string;
  menu: typeof LEADS_MENU;
};

export const SIDEBAR_TABS: SidebarTabConfig[] = [
  {
    key: "leads",
    label: "VIDAI Leads",
    bg: Subtract1,
    icon: { src: QualityIcon, baseScale: 1.2 },
    defaultPath: "/dashboard",
    menu: LEADS_MENU,
  },
  {
    key: "documents",
    label: "Documents",
    bg: Subtract2,
    icon: { src: DocumentIcon, baseScale: 1 },
    defaultPath: "/documents",
    menu: DOCUMENTS_MENU,
  },
  {
    key: "risk",
    label: "Risk",
    bg: Subtract3,
    icon: { src: RiskIcon, baseScale: 1 },
    defaultPath: "/risk",
    menu: RISK_MENU,
  },
  {
    key: "compliance",
    label: "Compliance",
    bg: Subtract4,
    icon: { src: ComplianceIcon, baseScale: 1.7 },
    defaultPath: "/compliance",
    menu: COMPLIANCE_MENU,
  },
];

export const SHOW_ICONS = false;
