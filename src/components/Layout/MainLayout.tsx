import { Outlet } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { lazy, Suspense, useState } from "react";

import styles from "../../styles/sidebar.module.css";

const Header = lazy(() => import("./Header"));
const Sidebar = lazy(() => import("./Sidebar"));

const MainLayout = () => {
  const theme = useTheme();
  const isWideSidebarLayout = useMediaQuery(theme.breakpoints.up("xl"));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        height: "100dvh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Suspense
        fallback={
          <Box
            sx={{
              width: isWideSidebarLayout ? 320 : 0,
              bgcolor: "background.default",
              flexShrink: 0,
            }}
          />
        }
      >
        <Sidebar
          isDesktop={isWideSidebarLayout}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </Suspense>
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Suspense
          fallback={<Box sx={{ height: 88, bgcolor: "background.default" }} />}
        >
          <Header
            showSidebarToggle={!isWideSidebarLayout}
            onSidebarToggle={() => setMobileSidebarOpen((open) => !open)}
          />
        </Suspense>
        <Box className={styles.cardWrapper} sx={{ m: 0, pb: 2, minWidth: 0 }}>
          <Box
            className={styles.card}
            sx={{
              flexGrow: 1,
              minWidth: 0,
              overflowY: "auto",
              overflowX: "auto",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
