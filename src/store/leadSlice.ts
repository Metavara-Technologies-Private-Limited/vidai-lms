import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LeadAPI } from "../services/leads.api";
import type { Lead } from "../types/leads.types";

// Slice state
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

// Async thunk to fetch leads
export const fetchLeads = createAsyncThunk<
  Lead[],
  void,
  { rejectValue: string }
>("leads/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await LeadAPI.list();
    return res.data;
  } catch (err: unknown) {
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Failed to fetch leads");
  }
});

// Slice
const leadSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {},
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
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default leadSlice.reducer;

// Selectors
export const selectLeads = (state: { leads: LeadState }) => state.leads.leads;
export const selectLeadsLoading = (state: { leads: LeadState }) =>
  state.leads.loading;
export const selectLeadsError = (state: { leads: LeadState }) =>
  state.leads.error;
