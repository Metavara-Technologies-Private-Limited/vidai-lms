import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { reputationApi } from "../services/reputation.api";
import type { RootState } from ".";

type ReputationState = {
  requests: any[];
  dashboard: any | null;
  reviews: any[];
  loading: boolean;
  error: string | null;
};

const initialState: ReputationState = {
  requests: [],
  dashboard: null,
  reviews: [],
  loading: false,
  error: null,
};

const toPositiveNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  return 0;
};

const resolveSentCount = (request: any): number => {
  return (
    toPositiveNumber(request?.requests_sent) ||
    toPositiveNumber(request?.request_sent) ||
    toPositiveNumber(request?.selected_leads_count) ||
    toPositiveNumber(request?.leads_count) ||
    toPositiveNumber(request?.lead_count) ||
    toPositiveNumber(request?.total_recipients) ||
    (Array.isArray(request?.lead_ids) ? request.lead_ids.length : 0)
  );
};

const resolveSubmittedCount = (request: any): number => {
  return (
    toPositiveNumber(request?.reviews_submitted) ||
    toPositiveNumber(request?.review_submitted)
  );
};

const resolveAvgRating = (request: any): number => {
  return (
    toPositiveNumber(request?.avg_rating) ||
    toPositiveNumber(request?.average_rating)
  );
};

// Fetch review requests
export const fetchReviewRequests = createAsyncThunk(
  "reputation/fetchRequests",
  async () => {
    return await reputationApi.getRequests();
  },
);

// Fetch dashboard
export const fetchReputationDashboard = createAsyncThunk(
  "reputation/fetchDashboard",
  async () => {
    return await reputationApi.getDashboard();
  },
);

// Fetch reviews for a request
export const fetchReviews = createAsyncThunk(
  "reputation/fetchReviews",
  async (requestId: string) => {
    return await reputationApi.getReviews(requestId);
  },
);

const reputationSlice = createSlice({
  name: "reputation",
  initialState,
  reducers: {
    prependReviewRequest: (state, action) => {
      const request = action.payload;

      if (!request || request.id == null) {
        return;
      }

      state.requests = [
        request,
        ...state.requests.filter(
          (item) => String(item.id) !== String(request.id),
        ),
      ];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReviewRequests.fulfilled, (state, action) => {
        state.loading = false;

        const previousById = new Map(
          state.requests.map((item) => [String(item?.id), item]),
        );

        const previousByName = new Map<string, any>();
        state.requests.forEach((item) => {
          const nameKey = String(item?.request_name || "")
            .trim()
            .toLowerCase();
          if (!nameKey) {
            return;
          }

          const alreadyTracked = previousByName.get(nameKey);
          const candidateSent = resolveSentCount(item);
          const trackedSent = resolveSentCount(alreadyTracked);

          if (!alreadyTracked || candidateSent >= trackedSent) {
            previousByName.set(nameKey, item);
          }
        });

        state.requests = (action.payload || []).map((incoming: any) => {
          const existingById = previousById.get(String(incoming?.id));
          const nameKey = String(incoming?.request_name || "")
            .trim()
            .toLowerCase();
          const existingByName = nameKey ? previousByName.get(nameKey) : null;
          const existing = existingById || existingByName;

          if (!existing) {
            return incoming;
          }

          const merged = { ...incoming };

          if (resolveSentCount(merged) === 0) {
            const previousSent = resolveSentCount(existing);
            if (previousSent > 0) {
              merged.requests_sent = previousSent;
            }
          }

          if (resolveSubmittedCount(merged) === 0) {
            const previousSubmitted = resolveSubmittedCount(existing);
            if (previousSubmitted > 0) {
              merged.reviews_submitted = previousSubmitted;
            }
          }

          if (resolveAvgRating(merged) === 0) {
            const previousAvgRating = resolveAvgRating(existing);
            if (previousAvgRating > 0) {
              merged.avg_rating = previousAvgRating;
            }
          }

          return merged;
        });
      })
      .addCase(fetchReviewRequests.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load review requests";
      })

      .addCase(fetchReputationDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      })

      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
      });
  },
});

export default reputationSlice.reducer;

export const { prependReviewRequest } = reputationSlice.actions;

export const selectReputationRequests = (state: RootState) =>
  state.reputation.requests;

export const selectReputationDashboard = (state: RootState) =>
  state.reputation.dashboard;

export const selectReputationReviews = (state: RootState) =>
  state.reputation.reviews;
