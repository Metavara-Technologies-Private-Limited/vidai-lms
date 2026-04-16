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
  selectReputationRequests,
} from "../../store/reputationSlice";
import { fetchLeads } from "../../store/leadSlice";
import { selectClinic } from "../../store/clinicSlice";
import { reputationApi } from "../../services/reputation.api";

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
  request_sent?: number;
  reviews_submitted?: number;
  review_submitted?: number;
  total_reviews?: number;
  avg_rating?: number;
  lead_ids?: string[];
  leads?: unknown[];
  mode?: string;
  created_at?: string;
};

type DashboardMetrics = {
  avgRating: number;
  reviewRequestsSent: number;
  reviewsSubmitted: number;
  totalReviews: number;
  conversionRate: number;
};

type RequestMetrics = {
  sent: number;
  submitted: number;
  totalReviews: number;
  avgRating: number;
  conversionRate: number;
};

type RequestRecord = Record<string, unknown>;

type RequestMetricOverrides = {
  sent?: number;
  submitted?: number;
  avgRating?: number;
};

type PersistedRequestMetric = RequestMetricOverrides & {
  requestId?: string;
  requestName?: string;
  updatedAt?: number;
};

const REQUEST_METRICS_CACHE_KEY = "reputation_request_metrics_cache_v1";

const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const asRecord = (value: unknown): RequestRecord => {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as RequestRecord;
};

const pickNumber = (source: RequestRecord, keys: string[]): number => {
  for (const key of keys) {
    const value = toNumber(source[key]);
    if (value > 0) {
      return value;
    }
  }

  return 0;
};

const pickArrayLength = (source: RequestRecord, keys: string[]): number => {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value) && value.length > 0) {
      return value.length;
    }
  }

  return 0;
};

const resolveSentCount = (record: RequestRecord): number => {
  const explicitSent = pickNumber(record, [
    "requests_sent",
    "request_sent",
    "requestsSent",
    "requestSent",
    "sent_count",
    "sentCount",
    "leads_count",
    "lead_count",
    "selected_leads_count",
    "total_recipients",
  ]);

  if (explicitSent > 0) {
    return explicitSent;
  }

  return pickArrayLength(record, ["lead_ids", "leads", "selected_leads"]);
};

const resolveSubmittedCount = (record: RequestRecord): number => {
  return pickNumber(record, [
    "reviews_submitted",
    "review_submitted",
    "reviewsSubmitted",
    "reviewSubmitted",
    "submitted_count",
    "submittedCount",
    "reviews_count",
    "review_count",
    "total_submitted",
  ]);
};

const resolveAvgRating = (record: RequestRecord): number => {
  return pickNumber(record, [
    "avg_rating",
    "average_rating",
    "avgRating",
    "rating_avg",
  ]);
};

const resolveTotalReviews = (record: RequestRecord): number => {
  return pickNumber(record, [
    "total_reviews",
    "reviews_count",
    "review_count",
    "total_submitted",
  ]);
};

const readPersistedRequestMetrics = (): PersistedRequestMetric[] => {
  try {
    const raw = localStorage.getItem(REQUEST_METRICS_CACHE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => typeof item === "object" && item !== null)
      .map((item) => item as PersistedRequestMetric);
  } catch {
    return [];
  }
};

const writePersistedRequestMetrics = (entries: PersistedRequestMetric[]) => {
  try {
    localStorage.setItem(REQUEST_METRICS_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage write failures.
  }
};

const resolveRequestMetrics = (
  req: ReviewRequestItem,
  overrides?: RequestMetricOverrides,
): RequestMetrics => {
  const reqRecord = asRecord(req);

  // Always take the MAX of live backend value and cached override so that
  // a fresh poll result is never blocked by a stale cached number, while
  // still using the cached value as fallback when backend returns 0/missing.
  const backendSent = resolveSentCount(reqRecord);
  const backendSubmitted = resolveSubmittedCount(reqRecord);
  const backendAvgRating = resolveAvgRating(reqRecord);

  const sent = Math.max(
    0,
    Math.round(Math.max(backendSent, overrides?.sent ?? 0)),
  );
  const submitted = Math.max(
    0,
    Math.round(Math.max(backendSubmitted, overrides?.submitted ?? 0)),
  );

  const totalReviews = Math.max(
    submitted,
    Math.round(resolveTotalReviews(reqRecord)),
  );

  const avgRatingFromOverride = overrides?.avgRating ?? 0;
  const resolvedAvgRating =
    backendAvgRating > 0 ? backendAvgRating : avgRatingFromOverride;

  const avgRating = Math.max(0, Math.min(5, resolvedAvgRating));
  const conversionRate = sent > 0 ? (submitted / sent) * 100 : 0;

  return {
    sent,
    submitted,
    totalReviews,
    avgRating,
    conversionRate,
  };
};

const ReputationDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();

  const requests = useSelector(selectReputationRequests) as ReviewRequestItem[];

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
  const [requestMetricOverrides, setRequestMetricOverrides] = useState<
    Record<string, RequestMetricOverrides>
  >({});

  const cachedRequestMetricOverrides = useMemo(() => {
    const persisted = readPersistedRequestMetrics();
    const byId = new Map<string, PersistedRequestMetric>();
    const byName = new Map<string, PersistedRequestMetric>();

    persisted.forEach((entry) => {
      const idKey = String(entry.requestId || "").trim();
      const nameKey = String(entry.requestName || "")
        .trim()
        .toLowerCase();

      if (idKey) {
        byId.set(idKey, entry);
      }

      if (nameKey) {
        byName.set(nameKey, entry);
      }
    });

    const resolved: Record<string, RequestMetricOverrides> = {};

    requests.forEach((request) => {
      const requestId = String(request.id);
      const requestNameKey = String(request.request_name || "")
        .trim()
        .toLowerCase();

      const fromId = byId.get(requestId);
      const fromName = requestNameKey ? byName.get(requestNameKey) : undefined;
      const entry = fromId || fromName;

      if (!entry) {
        return;
      }

      resolved[requestId] = {
        sent: entry.sent,
        submitted: entry.submitted,
        avgRating: entry.avgRating,
      };
    });

    return resolved;
  }, [requests]);

  useEffect(() => {
    if (!requests.length) {
      return;
    }

    let isMounted = true;

    const enrichRequestMetrics = async () => {
      const entries = await Promise.all(
        requests.map(async (request) => {
          const requestId = String(request.id);
          let sent = resolveSentCount(asRecord(request));
          let submitted = resolveSubmittedCount(asRecord(request));
          let avgRating = resolveAvgRating(asRecord(request));

          try {
            const detailResponse =
              await reputationApi.getRequestById(requestId);
            const detailRoot = asRecord(detailResponse);
            const detailData = asRecord(detailRoot.data ?? detailRoot);
            sent = Math.max(sent, resolveSentCount(detailData));
            submitted = Math.max(submitted, resolveSubmittedCount(detailData));
            avgRating = Math.max(avgRating, resolveAvgRating(detailData));
          } catch {
            // Keep best effort from list payload.
          }

          try {
            const reviewRows = await reputationApi.getReviews(requestId);
            if (Array.isArray(reviewRows)) {
              const validRatings = reviewRows
                .map((row) => toNumber(asRecord(row).rating))
                .filter((value) => value > 0);

              submitted = Math.max(submitted, reviewRows.length);

              if (validRatings.length > 0) {
                const ratingSum = validRatings.reduce(
                  (sum, value) => sum + value,
                  0,
                );
                avgRating = Math.max(
                  avgRating,
                  ratingSum / validRatings.length,
                );
              }
            }
          } catch {
            // Keep best effort from request payload/detail.
          }

          return [
            requestId,
            {
              sent,
              submitted,
              avgRating,
            } satisfies RequestMetricOverrides,
          ] as const;
        }),
      );

      if (!isMounted) {
        return;
      }

      const overrides = Object.fromEntries(entries);
      setRequestMetricOverrides(overrides);

      const persisted = readPersistedRequestMetrics();
      const nextById = new Map<string, PersistedRequestMetric>();

      persisted.forEach((entry) => {
        const idKey = String(entry.requestId || "").trim();
        if (idKey) {
          nextById.set(idKey, entry);
        }
      });

      requests.forEach((request) => {
        const requestId = String(request.id);
        const override = overrides[requestId];
        if (!override) {
          return;
        }

        const current = nextById.get(requestId);
        nextById.set(requestId, {
          ...current,
          requestId,
          requestName: request.request_name,
          sent: override.sent,
          submitted: override.submitted,
          avgRating: override.avgRating,
          updatedAt: Date.now(),
        });
      });

      const mergedEntries = Array.from(nextById.values())
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 300);

      writePersistedRequestMetrics(mergedEntries);
    };

    void enrichRequestMetrics();

    return () => {
      isMounted = false;
    };
  }, [requests]);

  const requestMetricsById = useMemo(() => {
    const metrics = new Map<string, RequestMetrics>();

    requests.forEach((request: ReviewRequestItem) => {
      const requestId = String(request.id);
      const mergedOverride: RequestMetricOverrides = {
        ...cachedRequestMetricOverrides[requestId],
        ...requestMetricOverrides[requestId],
      };

      metrics.set(requestId, resolveRequestMetrics(request, mergedOverride));
    });

    return metrics;
  }, [requests, requestMetricOverrides, cachedRequestMetricOverrides]);

  const dashboardMetrics = useMemo<DashboardMetrics>(() => {
    if (!requests.length) {
      return {
        avgRating: 0,
        reviewRequestsSent: 0,
        reviewsSubmitted: 0,
        totalReviews: 0,
        conversionRate: 0,
      };
    }

    let reviewRequestsSent = 0;
    let reviewsSubmitted = 0;
    let totalReviews = 0;
    let weightedRatingTotal = 0;

    requests.forEach((request: ReviewRequestItem) => {
      const metrics = requestMetricsById.get(String(request.id));
      if (!metrics) {
        return;
      }

      reviewRequestsSent += metrics.sent;
      reviewsSubmitted += metrics.submitted;
      totalReviews += metrics.totalReviews;
      weightedRatingTotal += metrics.avgRating * metrics.submitted;
    });

    const avgRating =
      reviewsSubmitted > 0 ? weightedRatingTotal / reviewsSubmitted : 0;
    const conversionRate =
      reviewRequestsSent > 0
        ? (reviewsSubmitted / reviewRequestsSent) * 100
        : 0;

    return {
      avgRating,
      reviewRequestsSent,
      reviewsSubmitted,
      totalReviews,
      conversionRate,
    };
  }, [requests, requestMetricsById]);

  const selectedRequestMetrics = useMemo<RequestMetrics>(() => {
    if (!selectedRequestId) {
      return {
        sent: 0,
        submitted: 0,
        totalReviews: 0,
        avgRating: 0,
        conversionRate: 0,
      };
    }

    return (
      requestMetricsById.get(String(selectedRequestId)) || {
        sent: 0,
        submitted: 0,
        totalReviews: 0,
        avgRating: 0,
        conversionRate: 0,
      }
    );
  }, [requestMetricsById, selectedRequestId]);

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

  const _reputationClinic = useSelector(selectClinic);

  useEffect(() => {
    dispatch(fetchLeads());
    dispatch(fetchReviewRequests());
  }, [dispatch, _reputationClinic?.id]);

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
            avgRating={dashboardMetrics.avgRating}
            reviewsSubmitted={dashboardMetrics.reviewsSubmitted}
            reviewRequestsSent={dashboardMetrics.reviewRequestsSent}
            totalReviews={dashboardMetrics.totalReviews}
            conversionRate={dashboardMetrics.conversionRate}
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
                request={{
                  ...req,
                  requests_sent:
                    requestMetricsById.get(String(req.id))?.sent ??
                    req.requests_sent ??
                    0,
                  reviews_submitted:
                    requestMetricsById.get(String(req.id))?.submitted ??
                    req.reviews_submitted ??
                    0,
                  avg_rating:
                    requestMetricsById.get(String(req.id))?.avgRating ??
                    req.avg_rating ??
                    0,
                }}
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
            avgRating={selectedRequestMetrics.avgRating}
            reviewsSubmitted={selectedRequestMetrics.submitted}
            reviewRequestsSent={selectedRequestMetrics.sent}
            totalReviews={selectedRequestMetrics.totalReviews}
            conversionRate={selectedRequestMetrics.conversionRate}
            showTotalReviews={false}
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
