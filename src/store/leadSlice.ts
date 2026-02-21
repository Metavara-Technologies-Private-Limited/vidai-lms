import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LeadAPI, api, type Lead } from "../services/leads.api";

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

// ====================== Status Normalizer ======================
// Maps whatever the backend returns → consistent display string
const normalizeStatus = (raw: string): string => {
  const map: Record<string, string> = {
    new:              "New",
    contacted:        "Contacted",
    appointment:      "Appointment",
    follow_up:        "Follow Up",
    converted:        "Converted",
    cycle_conversion: "Cycle Conversion",
    lost:             "Lost",
  };
  return map[raw?.toLowerCase()?.trim()] ?? "New";
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
 * Book Appointment
 * Sends lead_status: "appointment" — backend now accepts this value.
 */
export const bookAppointment = createAsyncThunk<
  { leadId: string; appointmentData: any },
  { leadId: string; payload: any },
  { rejectValue: string; state: { leads: LeadState } }
>("leads/bookAppointment", async ({ leadId, payload }, { rejectWithValue, getState }) => {
  const lead = getState().leads.leads.find((l) => l.id === leadId);
  if (!lead) return rejectWithValue("Lead not found in state");

  const apiPayload: any = {
    clinic_id: lead.clinic_id,
    department_id: lead.department_id,
    full_name: lead.full_name,
    contact_no: lead.contact_no,
    source: lead.source || "Unknown",
    treatment_interest: lead.treatment_interest || "N/A",
    book_appointment: true,
    appointment_date: payload.appointment_date,
    slot: payload.slot,
    is_active: lead.is_active !== false,
    partner_inquiry: lead.partner_inquiry || false,
    // ✅ Backend now accepts "appointment" — status will persist on refresh
    lead_status: "appointment",
    ...(payload.assigned_to_id && { assigned_to_id: payload.assigned_to_id }),
    ...(payload.remark && { remark: payload.remark }),
  };

  try {
    await api.put(`/leads/${leadId}/update/`, apiPayload);
    console.log("✅ Appointment saved to server:", leadId);
  } catch (err) {
    const error = err as ApiError;
    const message =
      error?.response?.data?.detail ||
      (error?.response?.data as any)?.non_field_errors?.[0] ||
      error?.message ||
      "Failed to book appointment";
    return rejectWithValue(message);
  }

  return { leadId, appointmentData: payload };
});

/**
 * Convert a lead — sends lead_status: "converted" to backend.
 */
export const convertLead = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: { leads: LeadState } }
>("leads/convert", async (leadUuid, { rejectWithValue, getState }) => {
  try {
    const lead = getState().leads.leads.find((l) => l.id === leadUuid);
    if (!lead) throw new Error("Lead not found in state");

    await api.put(`/leads/${leadUuid}/update/`, {
      clinic_id: lead.clinic_id,
      department_id: lead.department_id,
      full_name: lead.full_name,
      contact_no: lead.contact_no,
      source: lead.source || "Unknown",
      treatment_interest: lead.treatment_interest || "N/A",
      book_appointment: lead.book_appointment || false,
      appointment_date: lead.appointment_date || "",
      slot: lead.slot || "",
      is_active: lead.is_active !== false,
      partner_inquiry: lead.partner_inquiry || false,
      // ✅ Backend now accepts "converted"
      lead_status: "converted",
      next_action_status: "completed",
      next_action_description: "Lead converted to patient",
    });

    console.log("✅ Lead converted:", leadUuid);
    return leadUuid;
  } catch (err) {
    const error = err as ApiError;
    const message =
      error?.response?.data?.detail ||
      (error?.response?.data as any)?.lead_status?.[0] ||
      error?.message ||
      "Failed to convert lead";
    return rejectWithValue(message);
  }
});

/**
 * Delete a lead (soft delete)
 */
export const deleteLead = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("leads/delete", async (leadId, { rejectWithValue }) => {
  try {
    await LeadAPI.delete(leadId);
    return leadId;
  } catch (err) {
    const error = err as ApiError;
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
    await Promise.all(leadIds.map((id) => LeadAPI.delete(id)));
    return leadIds;
  } catch (err) {
    const error = err as ApiError;
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
        // ✅ Normalize status from backend into consistent display strings
        // Backend now stores "appointment", "converted" etc. correctly
        // so no localStorage tricks needed — just map the values cleanly
        state.leads = action.payload.map((lead) => ({
          ...lead,
          status: normalizeStatus(
            (lead as any).lead_status || (lead as any).status || "new"
          ),
        }));
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch leads";
      })

      // ========== Book Appointment ==========
      // Optimistic: patch status immediately on PENDING
      .addCase(bookAppointment.pending, (state, action) => {
        const { leadId, payload } = action.meta.arg;
        state.leads = state.leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                status: "Appointment" as any,
                lead_status: "appointment" as any,
                book_appointment: true,
                appointment_date: payload.appointment_date,
                slot: payload.slot,
                ...(payload.department_id && { department_id: payload.department_id }),
                ...(payload.assigned_to_id && { assigned_to_id: payload.assigned_to_id }),
                ...(payload.remark && { remark: payload.remark }),
              }
            : lead
        );
      })
      .addCase(bookAppointment.fulfilled, (_state, _action) => {
        // Already patched in pending — nothing extra needed
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        // API failed — revert optimistic update
        const { leadId } = action.meta.arg;
        state.leads = state.leads.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                status: "New" as any,
                lead_status: "new" as any,
                book_appointment: false,
              }
            : lead
        );
        state.error = action.payload ?? "Failed to book appointment";
      })

      // ========== Convert Lead ==========
      .addCase(convertLead.fulfilled, (state, action) => {
        state.leads = state.leads.map((lead) =>
          lead.id === action.payload
            ? { ...lead, status: "Converted" as any, lead_status: "converted" as any }
            : lead
        );
      })
      .addCase(convertLead.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to convert lead";
      })

      // ========== Delete Single Lead ==========
      .addCase(deleteLead.pending, (state, action) => {
        state.deletingIds.push(action.meta.arg);
        state.error = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.deletingIds = state.deletingIds.filter((id) => id !== action.payload);
        state.leads = state.leads.filter((lead) => lead.id !== action.payload);
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.deletingIds = state.deletingIds.filter((id) => id !== action.meta.arg);
        state.error = action.payload ?? "Failed to delete lead";
      })

      // ========== Delete Multiple Leads ==========
      .addCase(deleteLeads.pending, (state, action) => {
        state.deletingIds.push(...action.meta.arg);
        state.error = null;
      })
      .addCase(deleteLeads.fulfilled, (state, action) => {
        state.deletingIds = state.deletingIds.filter((id) => !action.payload.includes(id));
        state.leads = state.leads.filter((lead) => !action.payload.includes(lead.id));
      })
      .addCase(deleteLeads.rejected, (state, action) => {
        state.deletingIds = state.deletingIds.filter((id) => !action.meta.arg.includes(id));
        state.error = action.payload ?? "Failed to delete leads";
      });
  },
});

export const { clearLeads, clearError } = leadSlice.actions;
export default leadSlice.reducer;

// ====================== Selectors ======================
export const selectLeads = (state: { leads: LeadState }) => state.leads.leads;
export const selectLeadsLoading = (state: { leads: LeadState }) => state.leads.loading;
export const selectLeadsError = (state: { leads: LeadState }) => state.leads.error;
export const selectDeletingIds = (state: { leads: LeadState }) => state.leads.deletingIds;
export const selectIsLeadDeleting =
  (leadId: string) =>
  (state: { leads: LeadState }) =>
    state.leads.deletingIds.includes(leadId);