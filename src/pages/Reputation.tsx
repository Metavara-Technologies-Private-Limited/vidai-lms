import Box from "@mui/material/Box";
import ReputationDashboard from "../components/Reputation/ReputationDashboard";

const Reputation = () => {
  return (
    <Box
      sx={{
        width: "auto",
        height: "100%",
        overflowY: "auto",
        pb: 2,
      }}
    >
      <ReputationDashboard />
    </Box>
  );
};

export default Reputation;
