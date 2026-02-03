import Box from "@mui/material/Box";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const Dashboard = () => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflowY: "auto",   // ✅ THIS IS THE KEY
        paddingBottom: 4,    // ✅ ensures bottom edge is visible
      }}
    >
      <DashboardLayout />
    </Box>
  );
};

export default Dashboard;
