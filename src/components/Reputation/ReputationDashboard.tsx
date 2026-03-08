import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import ReputationHeaderCards from "./ReputationHeaderCards";
import ReputationFilter from "./ReputationFilter";
import ReviewRequest from "./ReviewRequest";
import ReviewCard from "./ReviewCard";

const ReputationDashboard = () => {

  const [openReviewDialog, setOpenReviewDialog] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Reputation Management
      </Typography>

      {/* Header Cards */}
      <ReputationHeaderCards />

      {/* Filter + New Review Request */}
      <ReputationFilter onOpen={() => setOpenReviewDialog(true)} />

      {/* Review Request Dialog */}
      <ReviewRequest
        open={openReviewDialog}
        onClose={() => setOpenReviewDialog(false)}
      />

      {/* Review Cards Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 2,
        }}
      >
        <ReviewCard />
        <ReviewCard />
        <ReviewCard />
      </Box>
    </Box>
  );
};

export default ReputationDashboard;