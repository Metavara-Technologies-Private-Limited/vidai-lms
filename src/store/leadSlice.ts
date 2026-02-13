import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LeadAPI } from "../services/leads.api";
import type { Lead } from "../types/leads.types";

// ====================== Type Definitions ======================
interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
}

const initialState: LeadState = {
  leads: [],
  loading: false,
  error: null,
};

// ====================== Async Thunk ======================
export const fetchLeads = createAsyncThunk<
  Lead[],
  void,
  { rejectValue: string }
>("leads/fetchAll", async (_, { rejectWithValue }) => {
  try {
    // ✅ FIXED: LeadAPI.list() already returns Lead[] directly — no .data needed
    const leads = await LeadAPI.list();
    return leads;
  } catch (err: any) {
    // ✅ FIXED: also handle axios errors which aren't instanceof Error
    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch leads";
    return rejectWithValue(message);
  }
});

// ====================== Slice ======================
const leadSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    clearLeads: (state) => {
      state.leads = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch leads";
      });
  },
});

export const { clearLeads, clearError } = leadSlice.actions;
export default leadSlice.reducer;

// ====================== Selectors ======================
export const selectLeads = (state: { leads: LeadState }) => state.leads.leads;
export const selectLeadsLoading = (state: { leads: LeadState }) => state.leads.loading;
export const selectLeadsError = (state: { leads: LeadState }) => state.leads.error;