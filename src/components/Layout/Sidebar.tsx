import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  IconButton,
} from "@mui/material";

import { SHOW_ICONS, SIDEBAR_TABS } from "../../config/sidebar.tabs";
import ClinicLogo from "../../assets/icons/Clinic-Logo.svg";
import VidaiLogo from "../../assets/icons/Vidai-logo.svg";
import DashboardCardBg from "../../assets/icons/dashboard_card_bg.svg";

import styles from "../../styles/sidebar.module.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(0);
  const tab = SIDEBAR_TABS[activeTab];

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
        <img src={ClinicLogo} width={134} height={40} alt="Clinic Logo" />
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
        {/* SUBTRACT BACKGROUND */}
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

        {/* ICONS */}
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
                  <img
                    src={t.icon.src}
                    alt={t.label}
                    width={size}
                    height={size}
                  />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* MAIN CARD */}
      <Box className={styles.cardWrapper}>
        <Box className={styles.card}>
          {/* CARD HEADER */}
          <Typography color="primary.main" sx={{ fontWeight: 700 }}>
            {tab.label}
          </Typography>

          {/* MENU */}
          <List>
            {tab.menu.map((item) => {
              const active = location.pathname === item.path;

              return (
                <ListItemButton
                  key={item.key}
                  onClick={() => navigate(item.path)}
                >
                  <Typography
                    variant="inherit"
                    sx={{
                      fontWeight: active ? 600 : 500,
                      color: active ? "#232323" : "#9e9e9e",
                    }}
                  >
                    {item.label}
                  </Typography>
                </ListItemButton>
              );
            })}
          </List>

          {/* BACKGROUND DECOR */}
          <img src={DashboardCardBg} className={styles.cardBg} alt="" />

          {/* FOOTER */}
          <Box className={styles.footer}>
            <img src={VidaiLogo} width="70%" alt="Vidai Logo" />
            <Typography
              sx={{
                fontSize: 10,
                color: "grey.400",
                fontWeight: 400,
                py: "5px",
              }}
            >
              Updated Version 2.0
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
