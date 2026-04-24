import axios from "axios";
import type {
  TicketListItem,
  TicketDetail,
  CreateTicketRequest,
  UpdateTicketRequest,
  UpdateTicketStatusPayload,
  TicketFilters,
  TicketDashboardCount,
  Lab,
  Employee,
  TicketReplyRequest,
  TicketReplyResponse,
} from "../types/tickets.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("auth_token") || localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const storedClinicId = (): number =>
  Number(localStorage.getItem("clinic_id") ?? 0);

export const ticketsApi = {
  getTickets: async (filters?: TicketFilters): Promise<TicketListItem[]> => {
    const response = await apiClient.get("/tickets/", {
      params: {
        ...(filters ?? {}),
        clinic_id: storedClinicId(),
      },
    });
    // Defensive check for Django Rest Framework pagination
    return response.data?.results || response.data || [];
  },

  createTicket: async (data: CreateTicketRequest): Promise<TicketDetail> => {
    const response = await apiClient.post("/tickets/create/", data, {
      params: { clinic_id: storedClinicId() },
    });
    return response.data;
  },

  getTicketById: async (ticketId: string): Promise<TicketDetail> => {
    const response = await apiClient.get(`/tickets/${ticketId}/`, {
      params: { clinic_id: storedClinicId() },
    });
    return response.data;
  },

  updateTicket: async (
    ticketId: string,
    data: UpdateTicketRequest,
  ): Promise<TicketDetail> => {
    const response = await apiClient.put(`/tickets/${ticketId}/update/`, data, {
      params: { clinic_id: storedClinicId() },
    });
    return response.data;
  },

  assignTicket: async (
    ticketId: string,
    assignedToId: string | number,
  ): Promise<TicketDetail> => {
    // Note: Swagger definition says assigned_to_id is a string property in the body
    const response = await apiClient.post(
      `/tickets/${ticketId}/assign/`,
      {
        assigned_to_id: String(assignedToId),
      },
      {
        params: { clinic_id: storedClinicId() },
      },
    );
    return response.data;
  },

  updateTicketStatus: async (
    ticketId: string,
    payload: UpdateTicketStatusPayload,
  ): Promise<TicketDetail> => {
    const response = await apiClient.post(
      `/tickets/${ticketId}/status/`,
      payload,
      {
        params: { clinic_id: storedClinicId() },
      },
    );
    return response.data;
  },

  uploadDocument: async (ticketId: string, file: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(
      `/tickets/${ticketId}/documents/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        params: { clinic_id: storedClinicId() },
      },
    );
    return response.data;
  },

  getDashboardCount: async (): Promise<TicketDashboardCount> => {
    const response = await apiClient.get("/tickets/dashboard-count/", {
      params: { clinic_id: storedClinicId() },
    });
    return response.data;
  },

  sendTicketReply: async (
    ticketId: string,
    payload: TicketReplyRequest,
  ): Promise<TicketReplyResponse> => {
    const response = await apiClient.post(
      `/tickets/${ticketId}/reply/`,
      payload,
      {
        params: { clinic_id: storedClinicId() },
      },
    );
    return response.data;
  },
};

export const labsApi = {
  getLabs: async (): Promise<Lab[]> => {
    const response = await apiClient.get("/labs/");
    // Always return the results array if it exists (for paginated endpoints)
    return response.data?.results || response.data || [];
  },
};

export const clinicsApi = {
  getClinicDetail: async (clinicId: string | number) => {
    const response = await apiClient.get(`/clinics/${clinicId}/detail/`);
    return response.data;
  },

  getClinicEmployees: async (
    clinicId: string | number,
  ): Promise<Employee[]> => {
    const response = await apiClient.get(`/clinics/${clinicId}/employees/`);
    return response.data?.results || response.data || [];
  },
};
