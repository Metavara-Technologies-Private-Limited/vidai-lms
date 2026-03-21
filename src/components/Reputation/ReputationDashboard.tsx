import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";

import {
  fetchReviewRequests,
  fetchReputationDashboard,
  selectReputationRequests,
  selectReputationDashboard,
} from "../../store/reputationSlice";
import { fetchLeads } from "../../store/leadSlice";

import BackwardIcon from "../../assets/icons/Backward_icon.svg";
import FilterLeadsIcon from "../../assets/icons/Filter_Leads.svg";

import ReputationHeaderCards from "./ReputationHeaderCards";
import ReviewRequestDialog from "./ReviewRequest";
import ReviewCard from "./ReviewCard";
import ReviewCardDetailedView from "./ReviewCardDetailedView";
import ReviewRequestFilterDialog, {
  type ReviewRequestFilters,
} from "./ReviewRequestFilterDialog";

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
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestFilters, setRequestFilters] = useState<ReviewRequestFilters>({
    fromDate: null,
    toDate: null,
    mode: "",
    status: "",
  });
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [selectedRequestName, setSelectedRequestName] = useState<string>("");

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const fromDate = requestFilters.fromDate?.startOf("day") || null;
    const toDate = requestFilters.toDate?.endOf("day") || null;

    return requests.filter((req: ReviewRequestItem) => {
      const matchesName =
        !query || req.request_name?.toLowerCase().includes(query);

      const requestMode = (req.mode || "").toLowerCase();
      const selectedMode = requestFilters.mode.toLowerCase();
      const matchesMode = !selectedMode || requestMode === selectedMode;

      const requestStatus = (req.status || "").toLowerCase();
      const normalizedFilterStatus =
        requestFilters.status === "schedule"
          ? "scheduled"
          : requestFilters.status;
      const matchesStatus =
        !normalizedFilterStatus || requestStatus === normalizedFilterStatus;

      const requestDate = req.created_at ? dayjs(req.created_at) : null;
      const matchesFromDate =
        !fromDate ||
        !!requestDate?.isAfter(fromDate) ||
        !!requestDate?.isSame(fromDate);
      const matchesToDate =
        !toDate ||
        !!requestDate?.isBefore(toDate) ||
        !!requestDate?.isSame(toDate);

      return (
        matchesName &&
        matchesMode &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [requests, searchQuery, requestFilters]);

  useEffect(() => {
    dispatch(fetchLeads());
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

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              Review Requests
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                ml: "auto",
              }}
            >
              <TextField
                size="small"
                placeholder="Search by Request name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  width: { xs: "100%", sm: 260 },
                  minWidth: { xs: 220, sm: 260 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#fff",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#9CA3AF", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <IconButton
                sx={{ p: 0 }}
                onClick={() => setOpenFilterDialog(true)}
              >
                <img
                  src={FilterLeadsIcon}
                  alt="Filter"
                  style={{ width: 40, height: 40 }}
                />
              </IconButton>

              <Button
                variant="contained"
                onClick={() => setOpenReviewDialog(true)}
                startIcon={<AddCircleOutlineIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 2.25,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: "#505050",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: "#232323",
                  },
                }}
              >
                New Review Request
              </Button>
            </Box>
          </Box>

          {/* Review Request Dialog */}
          <ReviewRequestDialog
            open={openReviewDialog}
            onClose={() => setOpenReviewDialog(false)}
            onOpenChange={setOpenReviewDialog}
          />

          <ReviewRequestFilterDialog
            open={openFilterDialog}
            initialFilters={requestFilters}
            onClose={() => setOpenFilterDialog(false)}
            onApply={(filters) => setRequestFilters(filters)}
            onClear={() =>
              setRequestFilters({
                fromDate: null,
                toDate: null,
                mode: "",
                status: "",
              })
            }
          />

          {/* Review Cards Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 2,
            }}
          >
            {filteredRequests.map((req: ReviewRequestItem) => (
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
            <img src={BackwardIcon} alt="Back" width={40} height={40} />

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
