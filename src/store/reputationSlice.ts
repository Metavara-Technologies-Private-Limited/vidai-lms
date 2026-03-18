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

// Fetch review requests
export const fetchReviewRequests = createAsyncThunk(
  "reputation/fetchRequests",
  async () => {
    return await reputationApi.getRequests();
  }
);

// Fetch dashboard
export const fetchReputationDashboard = createAsyncThunk(
  "reputation/fetchDashboard",
  async () => {
    return await reputationApi.getDashboard();
  }
);

// Fetch reviews for a request
export const fetchReviews = createAsyncThunk(
  "reputation/fetchReviews",
  async (requestId: string) => {
    return await reputationApi.getReviews(requestId);
  }
);

const reputationSlice = createSlice({
  name: "reputation",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReviewRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
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

export const selectReputationRequests = (state: RootState) =>
  state.reputation.requests;

export const selectReputationDashboard = (state: RootState) =>
  state.reputation.dashboard;

export const selectReputationReviews = (state: RootState) =>
  state.reputation.reviews;