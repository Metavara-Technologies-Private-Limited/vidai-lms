import Box from "@mui/material/Box";
import ReputationDashboard from "../components/Reputation/ReputationDashboard";

const Reputation = () => {
  return (
    <Box
      sx={{
        width: "auto",
        height: "auto",
        minHeight: 0,
        overflowY: "auto",
        pb: 2,
      }}
    >
      <ReputationDashboard />
    </Box>
  );
};

export default Reputation;
