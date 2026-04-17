// src/store/slices/referralSlice.ts

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import {
  fetchDashboardCounts,
  fetchReferralSources
} from "../services/referral.api";

import type {
  ReferralSource,
  ReferralSourcesParams
} from "../services/referral.api";

// ─────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────

interface ReferralState {
  // Dashboard card counts  { "Doctors": 12, "Corporate HR": 4, ... }
  counts: Record<string, number>;
  countsLoading: boolean;
  countsError: string | null;

  // Referral sources list (for detail pages)
  sources: ReferralSource[];
  sourcesLoading: boolean;
  sourcesError: string | null;
  sourcesTotal: number;

  // Which department is currently selected (by id)
  activeDepartmentId: number | null;
}

const initialState: ReferralState = {
  counts: {},
  countsLoading: false,
  countsError: null,

  sources: [],
  sourcesLoading: false,
  sourcesError: null,
  sourcesTotal: 0,

  activeDepartmentId: null,
};

// ─────────────────────────────────────────────────────────────
// Thunks
// ─────────────────────────────────────────────────────────────

/**
 * Fetches all referral sources and returns counts grouped by department.
 * GET /api/sources/?clinic_id=<id> then aggregates on frontend.
 * Dispatch once on the Referrals overview page, passing clinic ID.
 */
export const loadDashboardCounts = createAsyncThunk<
  Record<string, number>,
  number,
  { rejectValue: string }
>("referral/loadDashboardCounts", async (clinicId, { rejectWithValue }) => {
  try {
    return await fetchDashboardCounts(clinicId);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load dashboard counts"
    );
  }
});

/**
 * Fetches sources from GET /api/sources/?referral_department_id=&search=
 * Dispatch on department detail pages.
 */
export const loadReferralSources = createAsyncThunk<
  ReferralSource[],
  ReferralSourcesParams,
  { rejectValue: string }
>("referral/loadReferralSources", async (params, { rejectWithValue }) => {
  try {
    return await fetchReferralSources(params);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load referral sources"
    );
  }
});

// ─────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────

const referralSlice = createSlice({
  name: "referral",
  initialState,
  reducers: {
    // Set active department (for detail page routing context)
    setActiveDepartment(state, action: PayloadAction<number | null>) {
      state.activeDepartmentId = action.payload;
    },
    // Clear sources when leaving a detail page
    clearSources(state) {
      state.sources = [];
      state.sourcesError = null;
      state.sourcesTotal = 0;
    },
    // Reset everything (e.g. on logout)
    resetReferralState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // ── loadDashboardCounts ──────────────────────────────────
    builder
      .addCase(loadDashboardCounts.pending, (state) => {
        state.countsLoading = true;
        state.countsError = null;
      })
      .addCase(loadDashboardCounts.fulfilled, (state, action) => {
        state.countsLoading = false;
        state.counts = action.payload;
      })
      .addCase(loadDashboardCounts.rejected, (state, action) => {
        state.countsLoading = false;
        state.countsError = action.payload ?? "Unknown error";
      });

    // ── loadReferralSources ──────────────────────────────────
    builder
      .addCase(loadReferralSources.pending, (state) => {
        state.sourcesLoading = true;
        state.sourcesError = null;
      })
      .addCase(loadReferralSources.fulfilled, (state, action) => {
        state.sourcesLoading = false;
        state.sources = action.payload;
        state.sourcesTotal = action.payload.length;
      })
      .addCase(loadReferralSources.rejected, (state, action) => {
        state.sourcesLoading = false;
        state.sourcesError = action.payload ?? "Unknown error";
      });
  },
});

export const { setActiveDepartment, clearSources, resetReferralState } =
  referralSlice.actions;

export default referralSlice.reducer;

// ─────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────

import type { RootState } from "./index";

export const selectCounts = (state: RootState) => state.referral.counts;
export const selectCountsLoading = (state: RootState) => state.referral.countsLoading;
export const selectCountsError = (state: RootState) => state.referral.countsError;

export const selectSources = (state: RootState) => state.referral.sources;
export const selectSourcesLoading = (state: RootState) => state.referral.sourcesLoading;
export const selectSourcesError = (state: RootState) => state.referral.sourcesError;
export const selectSourcesTotal = (state: RootState) => state.referral.sourcesTotal;

export const selectActiveDepartmentId = (state: RootState) =>
  state.referral.activeDepartmentId;

/** Convenience: get the count for a specific department name */
export const selectCountByDepartment =
  (name: string) => (state: RootState) =>
    state.referral.counts[name] ?? 0;