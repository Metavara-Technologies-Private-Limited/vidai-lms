import React from "react";
import { Breadcrumbs, Typography, Link } from "@mui/material";
import { Link as RouterLink, useLocation, useParams } from "react-router-dom";
import {
  LEADS_MENU,
  DOCUMENTS_MENU,
  RISK_MENU,
  COMPLIANCE_MENU,
} from "../config/sidebar.menu";
import { LeadAPI } from "../services/leads.api";

const allMenus = [
  ...LEADS_MENU,
  ...DOCUMENTS_MENU,
  ...RISK_MENU,
  ...COMPLIANCE_MENU,
].flatMap((menu) => [menu, ...(menu.subMenu || [])]);

export const DynamicBreadcrumbs = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>(); // 👈 get id from route
  const [leadName, setLeadName] = React.useState<string>(""); // 👈 store lead name

  const pathnames = location.pathname.split("/").filter(Boolean);

  // 👇 Fetch lead name if id exists
// 👇 Fetch lead name ONLY for Leads module (skip Tickets and others)
React.useEffect(() => {
  if (!id) return;

  // 🚫 Skip API call when we are inside Tickets module
  if (location.pathname.includes("/settings/tickets")) {
    return;
  }

  // ✅ Existing behaviour for Leads stays untouched
  LeadAPI.getById(id)
    .then((lead) => {
      setLeadName(lead.full_name);
    })
    .catch(() => {
      setLeadName("");
    });
}, [id, location.pathname]);

  // Custom SVG separator
  const separator = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4L10 8L6 12"
        stroke="#666"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Start with fixed "VIDAI Leads"
  const fixedCrumbs = [{ label: "VIDAI Leads", path: "/admin" }];

  // Map current path to menu label if exists
  const dynamicCrumbs = pathnames.map((_, idx) => {
    const path = `/${pathnames.slice(0, idx + 1).join("/")}`;
    const menuItem = allMenus.find((m) => m.path === path);

    return {
      label:
        menuItem?.label ||
        (idx === pathnames.length - 1 && id
          ? leadName || "Loading..."
          : pathnames[idx]
              .replace(/-/g, " ")
              .replace(/^\w/, (c) => c.toUpperCase())),
      path,
    };
  });

  // Combine fixed + dynamic, but skip duplicates
  const breadcrumbs = [...fixedCrumbs, ...dynamicCrumbs].filter(
    (crumb, index, arr) =>
      index === 0 || crumb.label !== arr[index - 1].label,
  );

  return (
    <Breadcrumbs
      separator={separator}
      aria-label="breadcrumb"
      sx={{
        "& .MuiBreadcrumbs-ol": {
          flexWrap: "nowrap",
        },
        "& .MuiBreadcrumbs-li": {
          minWidth: 0,
        },
      }}
    >
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;

        return isLast ? (
          <Typography
            key={crumb.path}
            fontWeight={700}
            color="text.primary"
            noWrap
            sx={{
              fontSize: { xs: 11, sm: 12, md: 14 },
              maxWidth: { xs: 150, sm: 220, md: "none" },
            }}
          >
            {crumb.label}
          </Typography>
        ) : (
          <Link
            key={crumb.path}
            component={RouterLink}
            to={crumb.path}
            color="text.secondary"
            fontWeight={500}
            underline="none"
            sx={{
              fontSize: { xs: 10.5, sm: 11.5, md: 13 },
              maxWidth: { xs: 120, sm: 180, md: "none" },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "inline-block",
              verticalAlign: "bottom",
            }}
          >
            {crumb.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};