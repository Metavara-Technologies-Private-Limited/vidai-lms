import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { lazy, Suspense } from "react";

import styles from "../../styles/sidebar.module.css";

const Header = lazy(() => import("./Header"));
const Sidebar = lazy(() => import("./Sidebar"));

const MainLayout = () => {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Suspense fallback={<Box sx={{ width: 320, bgcolor: "background.default" }} />}>
        <Sidebar />
      </Suspense>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Suspense fallback={<Box sx={{ height: 88, bgcolor: "background.default" }} />}>
          <Header />
        </Suspense>
        <Box
          className={styles.cardWrapper}
          sx={{m:0, pb:2}}
        >
          <Box
            className={styles.card}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
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
