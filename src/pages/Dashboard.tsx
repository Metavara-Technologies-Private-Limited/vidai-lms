import Box from "@mui/material/Box";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const Dashboard = () => {
  return (
    <Box
      sx={{
        width: "auto",
        height: "auto",
        minHeight: 0,
        overflowY: "auto",
        paddingBottom: 4,
      }}
    >
      <DashboardLayout />
    </Box>
  );
};

export default Dashboard;
