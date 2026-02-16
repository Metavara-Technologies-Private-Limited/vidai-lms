import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ticketsApi } from "../services/tickets.api";
import type {
  TicketListItem,
  TicketDetail,
  TicketFilters,
  TicketDashboardCount,
} from "../types/tickets.types";
import type { RootState } from ".";

type TicketState = {
  list: TicketListItem[];
  selectedTicket: TicketDetail | null;
  dashboard: TicketDashboardCount | null;
  loading: boolean;
  error: string | null;
};

const initialState: TicketState = {
  list: [],
  selectedTicket: null,
  dashboard: null,
  loading: false,
  error: null,
};

// --- Async Thunks ---

export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (filters?: TicketFilters) => {
    return await ticketsApi.getTickets({
      page_size: 100,      // Default: fetch 100 items
      ordering: "-created_at", // Default: newest first
      ...filters,
    });
  }
);

export const fetchTicketDashboard = createAsyncThunk(
  "tickets/fetchDashboard",
  async () => {
    return await ticketsApi.getDashboardCount();
  }
);

// --- Slice ---

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearSelectedTicket: (state) => {
      state.selectedTicket = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        // Defensive Check: Ensure state.list is always an array
        // Django Rest Framework often returns { results: [] } for paginated views
        const payload = action.payload as any;
        state.list = Array.isArray(payload) ? payload : payload.results || [];
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load tickets";
      })
      .addCase(fetchTicketDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      });
  },
});

export default ticketSlice.reducer;
export const { clearSelectedTicket } = ticketSlice.actions;

// --- Simplified Selectors ---

export const selectAllTickets = (state: RootState): TicketListItem[] =>
  state.tickets?.list || [];

export const selectTicketDashboard = (state: RootState) =>
  state.tickets?.dashboard || null;

export const selectTicketsLoading = (state: RootState) =>
  state.tickets?.loading || false;

export const selectTicketsError = (state: RootState) =>
  state.tickets?.error || null;