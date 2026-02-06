import { Breadcrumbs, Typography, Link } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  LEADS_MENU,
  DOCUMENTS_MENU,
  RISK_MENU,
  COMPLIANCE_MENU,
} from "../config/sidebar.menu";

const allMenus = [
  ...LEADS_MENU,
  ...DOCUMENTS_MENU,
  ...RISK_MENU,
  ...COMPLIANCE_MENU,
].flatMap((menu) => [menu, ...(menu.subMenu || [])]);

export const DynamicBreadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

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

  // Start with fixed "Admin > Referral MD"
  const fixedCrumbs = [
    { label: "Admin", path: "/admin" },
    { label: "Referral MD", path: "/admin/referral" },
  ];

  // Map current path to menu label if exists
  const dynamicCrumbs = pathnames.map((_, idx) => {
    const path = `/${pathnames.slice(0, idx + 1).join("/")}`;
    const menuItem = allMenus.find((m) => m.path === path);
    return {
label:
  menuItem?.label ||
  pathnames[idx]
    .replace(/-/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase()),
      path,
    };
  });

  // Combine fixed + dynamic, but skip duplicates
  const breadcrumbs = [...fixedCrumbs, ...dynamicCrumbs].filter(
    (crumb, index, arr) => index === 0 || crumb.label !== arr[index - 1].label,
  );

  return (
    <Breadcrumbs separator={separator} aria-label="breadcrumb">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return isLast ? (
          <Typography key={crumb.path} fontWeight={700} color="text.primary">
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
          >
            {crumb.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};
