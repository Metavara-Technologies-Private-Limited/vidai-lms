import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  IconButton,
  Collapse,
} from "@mui/material";

import { SHOW_ICONS, SIDEBAR_TABS } from "../../config/sidebar.tabs";
import ClinicLogoLMS from "../../assets/icons/Clinic-Logo-LMS.svg";
import VidaiLogo from "../../assets/icons/Vidai-logo.svg";
import DashboardCardBg from "../../assets/icons/dashboard_card_bg.svg";

import styles from "../../styles/sidebar.module.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
const [openSettings, setOpenSettings] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const tab = SIDEBAR_TABS[activeTab];
const isSettingsRoute = location.pathname.startsWith("/settings/");
const showSettingsMenu = isSettingsRoute || openSettings;

  // keep sidebar in sync with URL


  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 312,
        "& .MuiDrawer-paper": {
          width: 320,
          bgcolor: "background.default",
          borderRight: "none",
        },
      }}
    >
      {/* LOGO */}
      <Box sx={{ pl: "24px", pt: "20px" }}>
        <img src={ClinicLogoLMS} width={134} height={40} alt="Clinic Logo LMS" />
      </Box>

      {/* TOP ICON ROW */}
      <Box
        sx={{
          position: "relative",
          height: 56,
          mx: 1,
          display: SHOW_ICONS ? "flex" : "none",
        }}
      >
        <Box
          component="img"
          src={tab.bg}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        <Box className={styles.iconrowbox}>
          {SIDEBAR_TABS.map((t, idx) => {
            const size = 35 * t.icon.baseScale;

            return (
              <Box key={t.key}>
                <IconButton
                  onClick={() => {
                    setActiveTab(idx);
                    navigate(t.defaultPath);
                  }}
                  sx={{ width: 40, height: 40 }}
                >
                  <img src={t.icon.src} alt={t.label} width={size} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* MAIN CARD */}
      <Box className={styles.cardWrapper}>
        <Box className={styles.card}>
          <Typography color="primary.main" sx={{ fontWeight: 700 }}>
            {tab.label}
          </Typography>

          {/* MENU */}
          <List>
            {tab.menu.map((item) => {
              const isSettings = item.key === "settings";

              // CORRECT place for isActive
              const isActive =
                location.pathname === item.path ||
                (item.subMenu &&
                  item.subMenu.some(
                    (sub) => sub.path === location.pathname,
                  ));

              return (
                <Box key={item.key}>
                  <ListItemButton
onClick={() => {
  if (isSettings) {
    setOpenSettings((prev) => !prev);
  } else {
    setOpenSettings(false); 
    navigate(item.path);
  }
}}

                  >
                    <Typography
                      sx={{
                        color: isActive ? "#232323" : "#9e9e9e",
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {item.label}
                    </Typography>
                  </ListItemButton>

{isSettings && item.subMenu && (
<Collapse in={showSettingsMenu}>
    {item.subMenu.map((sub) => {
      const isSubActive = location.pathname === sub.path;

      return (
        <ListItemButton
          key={sub.key}
          onClick={() => navigate(sub.path)}
          sx={{
            pl: 4,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* Custom radio circle */}
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: isSubActive
                  ? "#E17E61"
                  : "#CFD1D4",
              }}
            />
          </Box>

          {/* Label */}
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: isSubActive ? "#232323" : "#9e9e9e",
            }}
          >
            {sub.label}
          </Typography>
        </ListItemButton>
      );
    })}
  </Collapse>
)}

                </Box>
              );
            })}
          </List>

          <img src={DashboardCardBg} className={styles.cardBg} alt="" />

          <Box className={styles.footer}>
            <img src={VidaiLogo} width="70%" alt="Vidai Logo" />
            <Typography fontSize={10} color="grey.400">
              Updated Version 2.0
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
