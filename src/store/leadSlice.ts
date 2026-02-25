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
  // ✅ Document state
  documentsUploading: boolean;
  documentsError: string | null;
}

const initialState: LeadState = {
  leads: [],
  loading: false,
  error: null,
  deletingIds: [],
  documentsUploading: false,
  documentsError: null,
};

// ====================== Status Normalizer ======================
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

/** Fetch all leads */
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

/** Book Appointment */
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

/** Convert Lead */
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

/** Delete a lead (soft delete) */
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

/** Delete multiple leads */
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

// ====================== Document Thunks ======================

/**
 * Upload a single document file to a lead.
 * PUT /leads/{lead_id}/update/ with multipart/form-data
 * Updates the lead's documents array in the store on success.
 */
export const uploadLeadDocument = createAsyncThunk<
  { leadId: string; updatedLead: Lead },
  { leadId: string; file: File },
  { rejectValue: string }
>("leads/uploadDocument", async ({ leadId, file }, { rejectWithValue }) => {
  try {
    const updatedLead = await LeadAPI.uploadDocument(leadId, file);
    return { leadId, updatedLead };
  } catch (err) {
    const error = err as ApiError;
    return rejectWithValue(
      error?.response?.data?.detail || error?.message || "Failed to upload document"
    );
  }
});

/**
 * Upload multiple document files to a lead sequentially.
 * Each file calls PUT /leads/{lead_id}/update/ with multipart/form-data.
 * Updates the lead's documents array in the store on success.
 */
export const uploadLeadDocuments = createAsyncThunk<
  { leadId: string; updatedLead: Lead },
  { leadId: string; files: File[] },
  { rejectValue: string }
>("leads/uploadDocuments", async ({ leadId, files }, { rejectWithValue }) => {
  try {
    const updatedLead = await LeadAPI.uploadDocuments(leadId, files);
    return { leadId, updatedLead };
  } catch (err) {
    const error = err as ApiError;
    return rejectWithValue(
      error?.response?.data?.detail || error?.message || "Failed to upload documents"
    );
  }
});

/**
 * Fetch the documents list for a specific lead from the API.
 * GET /leads/{lead_id}/ → returns lead.documents[]
 * Refreshes the lead's documents in the store.
 */
export const fetchLeadDocuments = createAsyncThunk<
  { leadId: string; documents: string[] },
  string,
  { rejectValue: string }
>("leads/fetchDocuments", async (leadId, { rejectWithValue }) => {
  try {
    const documents = await LeadAPI.getDocuments(leadId);
    return { leadId, documents };
  } catch (err) {
    const error = err as ApiError;
    return rejectWithValue(
      error?.response?.data?.detail || error?.message || "Failed to fetch documents"
    );
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
    clearDocumentsError: (state) => {
      state.documentsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch Leads ────────────────────────────────────────────
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
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

      // ── Book Appointment ───────────────────────────────────────
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
        // already patched optimistically
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        const { leadId } = action.meta.arg;
        state.leads = state.leads.map((lead) =>
          lead.id === leadId
            ? { ...lead, status: "New" as any, lead_status: "new" as any, book_appointment: false }
            : lead
        );
        state.error = action.payload ?? "Failed to book appointment";
      })

      // ── Convert Lead ───────────────────────────────────────────
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

      // ── Delete Single Lead ─────────────────────────────────────
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

      // ── Delete Multiple Leads ──────────────────────────────────
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
      })

      // ── Upload Single Document ─────────────────────────────────
      .addCase(uploadLeadDocument.pending, (state) => {
        state.documentsUploading = true;
        state.documentsError = null;
      })
      .addCase(uploadLeadDocument.fulfilled, (state, action) => {
        state.documentsUploading = false;
        const { leadId, updatedLead } = action.payload;
        // Patch the lead's documents array with the fresh server response
        state.leads = state.leads.map((lead) =>
          lead.id === leadId
            ? { ...lead, documents: updatedLead.documents ?? lead.documents }
            : lead
        );
      })
      .addCase(uploadLeadDocument.rejected, (state, action) => {
        state.documentsUploading = false;
        state.documentsError = action.payload ?? "Failed to upload document";
      })

      // ── Upload Multiple Documents ──────────────────────────────
      .addCase(uploadLeadDocuments.pending, (state) => {
        state.documentsUploading = true;
        state.documentsError = null;
      })
      .addCase(uploadLeadDocuments.fulfilled, (state, action) => {
        state.documentsUploading = false;
        const { leadId, updatedLead } = action.payload;
        state.leads = state.leads.map((lead) =>
          lead.id === leadId
            ? { ...lead, documents: updatedLead.documents ?? lead.documents }
            : lead
        );
      })
      .addCase(uploadLeadDocuments.rejected, (state, action) => {
        state.documentsUploading = false;
        state.documentsError = action.payload ?? "Failed to upload documents";
      })

      // ── Fetch Documents ────────────────────────────────────────
      .addCase(fetchLeadDocuments.fulfilled, (state, action) => {
        const { leadId, documents } = action.payload;
        state.leads = state.leads.map((lead) =>
          lead.id === leadId ? { ...lead, documents } : lead
        );
      });
  },
});

export const { clearLeads, clearError, clearDocumentsError } = leadSlice.actions;
export default leadSlice.reducer;

// ====================== Selectors ======================
export const selectLeads = (state: { leads: LeadState }) => state.leads.leads;
export const selectLeadsLoading = (state: { leads: LeadState }) => state.leads.loading;
export const selectLeadsError = (state: { leads: LeadState }) => state.leads.error;
export const selectDeletingIds = (state: { leads: LeadState }) => state.leads.deletingIds;
export const selectIsLeadDeleting =
  (leadId: string) => (state: { leads: LeadState }) =>
    state.leads.deletingIds.includes(leadId);

// ✅ Document selectors
export const selectDocumentsUploading = (state: { leads: LeadState }) =>
  state.leads.documentsUploading;
export const selectDocumentsError = (state: { leads: LeadState }) =>
  state.leads.documentsError;
export const selectLeadDocuments =
  (leadId: string) => (state: { leads: LeadState }) =>
    state.leads.leads.find((l) => l.id === leadId)?.documents ?? [];