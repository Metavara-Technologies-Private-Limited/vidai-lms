import Box from "@mui/material/Box";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const Dashboard = () => {
  return (
    <Box
      sx={{
<<<<<<< HEAD
        width: "100%",
        height: "auto",
        overflow: "hidden",
        mb: 1,
=======
        width: "auto",
        height: "700px",
        overflowY: "auto",   // ✅ THIS IS THE KEY
        paddingBottom: 4,    // ✅ ensures bottom edge is visible
>>>>>>> f20e4874b979c17906d33f13291fc627681cb265
      }}
    >
      <DashboardLayout />
    </Box>
  );
};

export default Dashboard;
