import Box from "@mui/material/Box";
import ReportsDashboard from "../components/Reports/ReportsDashboard";

const Reports = () => {
  return (
    <Box
      sx={{
        width: "auto",
        height: "100%",
        overflowY: "auto",
        pb: 2,
      }}
    >
      <ReportsDashboard />
    </Box>
  );
};

export default Reports;
