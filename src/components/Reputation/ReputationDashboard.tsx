import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";

import {
  fetchReviewRequests,
  fetchReputationDashboard,
  selectReputationRequests,
  selectReputationDashboard,
} from "../../store/reputationSlice";

import Backward_icon from "../../assets/icons/Backward_icon.svg";

import ReputationHeaderCards from "./ReputationHeaderCards";
import ReviewRequestDialog from "./ReviewRequest.tsx";
import ReviewCard from "./ReviewCard";
import ReviewCardDetailedView from "./ReviewCardDetailedView";

type ReviewRequestItem = {
  id: string;
  request_name: string;
  status: string;
  requests_sent?: number;
  reviews_submitted?: number;
  avg_rating?: number;
  mode?: string;
  created_at?: string;
};

const ReputationDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();

  const requests = useSelector(selectReputationRequests) || [];
  const dashboard = useSelector(selectReputationDashboard);

  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openReviewDetails, setOpenReviewDetails] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [selectedRequestName, setSelectedRequestName] = useState<string>("");
  useEffect(() => {
    dispatch(fetchReviewRequests());
    dispatch(fetchReputationDashboard());
  }, [dispatch]);

  return (
    <Box sx={{ p: 0.5 }}>
      {/* Page Title */}
      {!openReviewDetails && (
        <Typography variant="h5" sx={{ mb: 3 }}>
          Reputation Management
        </Typography>
      )}

      {/* ================= NORMAL PAGE ================= */}
      {!openReviewDetails && (
        <>
          {/* Header Cards */}
          <ReputationHeaderCards
            avgRating={dashboard?.avg_rating || 0}
            reviewsSubmitted={dashboard?.reviews_submitted || 0}
            reviewRequestsSent={dashboard?.requests_sent || 0}
            totalReviews={dashboard?.total_reviews || 0}
            conversionRate={dashboard?.conversion_rate || 0}
          />

          {/* New Review Request action */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setOpenReviewDialog(true)}
              sx={{ textTransform: "none" }}
            >
              New Review Request
            </Button>
          </Box>

          {/* Review Request Dialog */}
          <ReviewRequestDialog
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
            {requests.map((req: ReviewRequestItem) => (
              <ReviewCard
                key={req.id}
                request={req}
                onOpen={() => {
                  setSelectedRequestId(req.id);
                  setSelectedRequestName(req.request_name);
                  setOpenReviewDetails(true);
                }}
              />
            ))}
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
            onClick={() => {
              setOpenReviewDetails(false);
              setSelectedRequestId(null);
            }}
          >
            <img src={Backward_icon} alt="Back" width={40} height={40} />

            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "#232323",
              }}
            >
              {selectedRequestName}
            </Typography>
          </Box>

          {/* Header Cards */}
          <ReputationHeaderCards
            avgRating={dashboard?.avg_rating || 0}
            reviewsSubmitted={dashboard?.reviews_submitted || 0}
            reviewRequestsSent={dashboard?.requests_sent || 0}
            totalReviews={dashboard?.total_reviews || 0}
            conversionRate={dashboard?.conversion_rate || 0}
          />

          {/* Reviews Table */}
          {selectedRequestId && (
            <ReviewCardDetailedView requestId={selectedRequestId} />
          )}
        </>
      )}
    </Box>
  );
};

export default ReputationDashboard;
