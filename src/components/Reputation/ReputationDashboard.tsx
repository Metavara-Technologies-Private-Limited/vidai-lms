import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import Backward_icon from "../../assets/icons/Backward_icon.svg";

import ReputationHeaderCards from "./ReputationHeaderCards";
import ReputationFilter from "./ReputationFilter";
import ReviewRequest from "./ReviewRequest";
import ReviewCard from "./ReviewCard";
import ReviewCardDetailedView from "./ReviewCardDetailedView";

const ReputationDashboard = () => {

  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openReviewDetails, setOpenReviewDetails] = useState(false);

  return (
    <Box sx={{ p: 0.5 }}>

{!openReviewDetails && (
  <Typography variant="h5" sx={{ mb: 3 }}>
    Reputation Management
  </Typography>
)}

      {/* ================= NORMAL PAGE ================= */}
      {!openReviewDetails && (
        <>
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
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
          </Box>
        </>
      )}

      {/* ================= DETAILED VIEW PAGE ================= */}
      {openReviewDetails && (
        <>
          {/* Back Button */}
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              width: "fit-content",
            }}
            onClick={() => setOpenReviewDetails(false)}
          >
            <img src={Backward_icon} alt="Back" width={40} height={40} />

  <Typography
    sx={{
      fontSize: 18,
      fontWeight: 600,
      color: "#232323",
    }}
  >
    Post-Consultation Feedback
  </Typography>
          </Box>

          {/* Header Cards with row related values */}
          <ReputationHeaderCards
            avgRating={4.7}
            reviewsSubmitted={5}
            reviewRequestsSent={10}
          />

          {/* Detailed Table */}
          <ReviewCardDetailedView />
        </>
      )}

    </Box>
  );
};

export default ReputationDashboard;