import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface MailInsightsData {
  leads_created: number;
  appointments_booked: number;
  leads_updated: number;
  last_synced: string | null;
}

interface MailInsightsState {
  data: MailInsightsData | null;
  loading: boolean;
  error: string | null;
}

const initialState: MailInsightsState = {
  data: null,
  loading: false,
  error: null,
};

// ── With the Vite proxy set up, just use a relative /api path ─────────────
// Vite dev server forwards  /api/*  →  http://localhost:8000/api/*
// No .env file or hardcoded Cloudflare URL needed ✅
export const fetchMailInsights = createAsyncThunk(
  "mailInsights/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/mail-insights/get/");

      // Handle both flat { leads_created: 1 } and nested { data: { ... } }
      const payload = res.data?.data ?? res.data;

      return {
        leads_created:       Number(payload?.leads_created       ?? 0),
        appointments_booked: Number(payload?.appointments_booked ?? 0),
        leads_updated:       Number(payload?.leads_updated       ?? 0),
        last_synced:         payload?.last_synced ?? null,
      } as MailInsightsData;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          `Server error ${err.response?.status ?? "unknown"}`
        );
      }
      return rejectWithValue("Failed to fetch mail insights");
    }
  }
);

const mailInsightsSlice = createSlice({
  name: "mailInsights",
  initialState,
  reducers: {
    setMailInsights(state, action) {
      state.data = action.payload;
    },
    clearMailInsights(state) {
      state.data    = null;
      state.error   = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMailInsights.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchMailInsights.fulfilled, (state, action) => {
        state.loading = false;
        state.data    = action.payload;
      })
      .addCase(fetchMailInsights.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });
  },
});

export const { setMailInsights, clearMailInsights } = mailInsightsSlice.actions;

export const selectMailInsights = (state: { mailInsights: MailInsightsState }) =>
  state.mailInsights.data;

export const selectMailInsightsLoading = (state: { mailInsights: MailInsightsState }) =>
  state.mailInsights.loading;

export const selectMailInsightsError = (state: { mailInsights: MailInsightsState }) =>
  state.mailInsights.error;

export default mailInsightsSlice.reducer;