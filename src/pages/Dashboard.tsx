import Box from "@mui/material/Box";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const Dashboard = () => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "auto",
        overflow: "hidden",
        mb: 1,
      }}
    >
      <DashboardLayout />
    </Box>
  );
};

export default Dashboard;
