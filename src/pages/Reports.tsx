import Box from "@mui/material/Box";
import ReportsDashboard from "../components/Reports/ReportsDashboard";

const Reports = () => {
  return (
    <Box
      sx={{
        width: "auto",
        height: "100%",
        overflowY: "auto",
        paddingBottom: 4,
      }}
    >
      <ReportsDashboard />
    </Box>
  );
};

export default Reports;
