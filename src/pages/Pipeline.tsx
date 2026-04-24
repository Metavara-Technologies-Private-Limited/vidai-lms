import Box from "@mui/material/Box";
import SalesPipelineDashboard from "../components/SalesPipeline/SalesPipelineDashboard";

const Pipeline = () => {
  return (
    <Box
      sx={{
        width: "auto",
        height: "100%",
        overflowY: "auto",
        pb: 2,
      }}
    >
      <SalesPipelineDashboard />
    </Box>
  );
};

export default Pipeline;
