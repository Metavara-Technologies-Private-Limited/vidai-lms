import Box from "@mui/material/Box";
import DashboardLayout from "../components/Dashboard/DashboardLayout";

const Dashboard = () => {
  return (
    <Box
      sx={{
        width: "auto",
        height: "700px",
        overflowY: "auto",   // ✅ THIS IS THE KEY
        paddingBottom: 4,    // ✅ ensures bottom edge is visible
      }}
    >
      <DashboardLayout />
    </Box>
  );
};

export default Dashboard;
