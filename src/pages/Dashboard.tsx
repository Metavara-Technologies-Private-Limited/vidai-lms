import Box from "@mui/material/Box";
import DashboardLayout from "../components/Dashboard/DashboardLayout";

const Dashboard = () => {
  return (
    <Box
      sx={{
        width: "auto",
        height: "700px",
        overflowY: "auto",   
        paddingBottom: 4,   
      }}
    >
      <DashboardLayout />
    </Box>
  );
};

export default Dashboard;
