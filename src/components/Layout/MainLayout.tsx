import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";

import styles from "../../styles/sidebar.module.css";

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
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Header />
        <Box className={styles.cardWrapper} m={0}>
<Box 
  className={styles.card} 
  sx={{ 
    flexGrow: 1, 
    overflowY: "auto", 
    height: "100%" ,
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
