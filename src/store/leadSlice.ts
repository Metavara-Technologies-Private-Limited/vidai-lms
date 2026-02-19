import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LeadAPI, type Lead } from "../services/leads.api";

// ====================== API Error Type ======================
type ApiError = {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
};

// ====================== Type Definitions ======================
interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  deletingIds: string[];
}

const initialState: LeadState = {
  leads: [],
  loading: false,
  error: null,
  deletingIds: [],
};

// ====================== Async Thunks ======================

/**
 * Fetch all leads
 */
export const fetchLeads = createAsyncThunk<
  Lead[],
  void,
  { rejectValue: string }
>("leads/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const leads = await LeadAPI.list();
    console.log("📊 Fetched leads from API:", leads.length);
    return leads;
  } catch (err) {
    const error = err as ApiError;
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch leads";
    return rejectWithValue(message);
  }
});

/**
 * Delete a lead (soft delete)
 * PATCH /leads/{lead_id}/delete/
 */
export const deleteLead = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("leads/delete", async (leadId, { rejectWithValue }) => {
  try {
    console.log("🗑️ Deleting lead:", leadId);
    await LeadAPI.delete(leadId);
    console.log("✅ Lead deleted successfully:", leadId);
    return leadId;
  } catch (err) {
    const error = err as ApiError;
    console.error("❌ Failed to delete lead:", error);
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete lead";
    return rejectWithValue(message);
  }
});

/**
 * Delete multiple leads at once
 */
export const deleteLeads = createAsyncThunk<
  string[],
  string[],
  { rejectValue: string }
>("leads/deleteMultiple", async (leadIds, { rejectWithValue }) => {
  try {
    console.log("🗑️ Deleting leads:", leadIds);
    await Promise.all(leadIds.map((id) => LeadAPI.delete(id)));
    console.log("✅ All leads deleted successfully");
    return leadIds;
  } catch (err) {
    const error = err as ApiError;
    console.error("❌ Failed to delete leads:", error);
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete leads";
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
      // ========== Fetch Leads ==========
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
      })
      
      // ========== Delete Single Lead ==========
      .addCase(deleteLead.pending, (state, action) => {
        state.deletingIds.push(action.meta.arg);
        state.error = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.deletingIds = state.deletingIds.filter(
          (id) => id !== action.payload
        );
        state.leads = state.leads.filter((lead) => lead.id !== action.payload);
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.deletingIds = state.deletingIds.filter(
          (id) => id !== action.meta.arg
        );
        state.error = action.payload ?? "Failed to delete lead";
      })
      
      // ========== Delete Multiple Leads ==========
      .addCase(deleteLeads.pending, (state, action) => {
        state.deletingIds.push(...action.meta.arg);
        state.error = null;
      })
      .addCase(deleteLeads.fulfilled, (state, action) => {
        state.deletingIds = state.deletingIds.filter(
          (id) => !action.payload.includes(id)
        );
        state.leads = state.leads.filter(
          (lead) => !action.payload.includes(lead.id)
        );
      })
      .addCase(deleteLeads.rejected, (state, action) => {
        state.deletingIds = state.deletingIds.filter(
          (id) => !action.meta.arg.includes(id)
        );
        state.error = action.payload ?? "Failed to delete leads";
      });
  },
});

export const { clearLeads, clearError } = leadSlice.actions;
export default leadSlice.reducer;

// ====================== Selectors ======================
export const selectLeads = (state: { leads: LeadState }) => state.leads.leads;
export const selectLeadsLoading = (state: { leads: LeadState }) =>
  state.leads.loading;
export const selectLeadsError = (state: { leads: LeadState }) =>
  state.leads.error;
export const selectDeletingIds = (state: { leads: LeadState }) =>
  state.leads.deletingIds;

export const selectIsLeadDeleting = (leadId: string) => (state: {
  leads: LeadState;
}) => state.leads.deletingIds.includes(leadId);