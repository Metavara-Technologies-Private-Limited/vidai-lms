import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LeadAPI } from "../services/leads.api";
import type { Lead } from "../types/leads.types";

// ====================== Type Definitions ======================
interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  deletingIds: string[]; // Track which leads are being deleted
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
    
    // ✅ IMPORTANT: Filter out deleted leads from the response
    // The API returns leads with is_active and is_deleted fields
    const activeLeads = leads.filter((lead: any) => {
      // Keep leads that are:
      // 1. is_active === true (or undefined for backward compatibility)
      // 2. is_deleted === false (or undefined for backward compatibility)
      const isActive = lead.is_active !== false;
      const isNotDeleted = lead.is_deleted !== true;
      return isActive && isNotDeleted;
    });
    
    console.log("📊 Total leads from API:", leads.length);
    console.log("✅ Active leads (filtered):", activeLeads.length);
    console.log("🗑️ Deleted/inactive leads (filtered out):", leads.length - activeLeads.length);
    
    return activeLeads;
  } catch (err: any) {
    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch leads";
    return rejectWithValue(message);
  }
});

/**
 * Delete a lead (soft delete)
 * PATCH /leads/{lead_id}/delete/
 */
export const deleteLead = createAsyncThunk<
  string, // Returns the deleted lead ID
  string, // Takes lead ID as parameter
  { rejectValue: string }
>("leads/delete", async (leadId, { rejectWithValue }) => {
  try {
    console.log("🗑️ Deleting lead:", leadId);
    await LeadAPI.delete(leadId);
    console.log("✅ Lead deleted successfully:", leadId);
    return leadId;
  } catch (err: any) {
    console.error("❌ Failed to delete lead:", err);
    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to delete lead";
    return rejectWithValue(message);
  }
});

/**
 * Delete multiple leads at once
 */
export const deleteLeads = createAsyncThunk<
  string[], // Returns array of deleted lead IDs
  string[], // Takes array of lead IDs
  { rejectValue: string }
>("leads/deleteMultiple", async (leadIds, { rejectWithValue }) => {
  try {
    console.log("🗑️ Deleting leads:", leadIds);
    
    // Delete all leads in parallel
    await Promise.all(leadIds.map((id) => LeadAPI.delete(id)));
    
    console.log("✅ All leads deleted successfully");
    return leadIds;
  } catch (err: any) {
    console.error("❌ Failed to delete leads:", err);
    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
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
    // Optimistic delete - remove from UI immediately
    removeLeadLocally: (state, action: { payload: string }) => {
      state.leads = state.leads.filter((lead) => lead.id !== action.payload);
    },
    // Optimistic delete multiple - remove from UI immediately
    removeLeadsLocally: (state, action: { payload: string[] }) => {
      state.leads = state.leads.filter(
        (lead) => !action.payload.includes(lead.id)
      );
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
        // ✅ Payload is already filtered in the thunk
        state.leads = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch leads";
      })
      
      // ========== Delete Single Lead ==========
      .addCase(deleteLead.pending, (state, action) => {
        // Add to deletingIds to show loading state
        state.deletingIds.push(action.meta.arg);
        state.error = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        // Remove from deletingIds
        state.deletingIds = state.deletingIds.filter(
          (id) => id !== action.payload
        );
        // ✅ IMMEDIATELY remove from leads array (don't wait for refetch)
        state.leads = state.leads.filter((lead) => lead.id !== action.payload);
      })
      .addCase(deleteLead.rejected, (state, action) => {
        // Remove from deletingIds
        state.deletingIds = state.deletingIds.filter(
          (id) => id !== action.meta.arg
        );
        state.error = action.payload ?? "Failed to delete lead";
      })
      
      // ========== Delete Multiple Leads ==========
      .addCase(deleteLeads.pending, (state, action) => {
        // Add all IDs to deletingIds
        state.deletingIds.push(...action.meta.arg);
        state.error = null;
      })
      .addCase(deleteLeads.fulfilled, (state, action) => {
        // Remove from deletingIds
        state.deletingIds = state.deletingIds.filter(
          (id) => !action.payload.includes(id)
        );
        // ✅ IMMEDIATELY remove from leads array (don't wait for refetch)
        state.leads = state.leads.filter(
          (lead) => !action.payload.includes(lead.id)
        );
      })
      .addCase(deleteLeads.rejected, (state, action) => {
        // Remove from deletingIds
        state.deletingIds = state.deletingIds.filter(
          (id) => !action.meta.arg.includes(id)
        );
        state.error = action.payload ?? "Failed to delete leads";
      });
  },
});

export const { clearLeads, clearError, removeLeadLocally, removeLeadsLocally } =
  leadSlice.actions;
export default leadSlice.reducer;

// ====================== Selectors ======================
export const selectLeads = (state: { leads: LeadState }) => state.leads.leads;
export const selectLeadsLoading = (state: { leads: LeadState }) =>
  state.leads.loading;
export const selectLeadsError = (state: { leads: LeadState }) =>
  state.leads.error;
export const selectDeletingIds = (state: { leads: LeadState }) =>
  state.leads.deletingIds;

// Helper selector to check if a specific lead is being deleted
export const selectIsLeadDeleting = (leadId: string) => (state: {
  leads: LeadState;
}) => state.leads.deletingIds.includes(leadId);