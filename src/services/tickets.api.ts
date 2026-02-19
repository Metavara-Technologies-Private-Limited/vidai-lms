import axios from "axios";
import type {
  TicketListItem,
  TicketDetail,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilters,
  TicketDashboardCount,
  Lab,
  Employee,
} from "../types/tickets.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const ticketsApi = {
  getTickets: async (filters?: TicketFilters): Promise<TicketListItem[]> => {
    const response = await apiClient.get("/tickets/", { params: filters });
    // Defensive check for Django Rest Framework pagination
    return response.data?.results || response.data || [];
  },
  
  createTicket: async (data: CreateTicketRequest): Promise<TicketDetail> => {
    const response = await apiClient.post("/tickets/create/", data);
    return response.data;
  },
  
  getTicketById: async (ticketId: string): Promise<TicketDetail> => {
    const response = await apiClient.get(`/tickets/${ticketId}/`);
    return response.data;
  },
  
  updateTicket: async (ticketId: string, data: UpdateTicketRequest): Promise<TicketDetail> => {
    const response = await apiClient.put(`/tickets/${ticketId}/update/`, data);
    return response.data;
  },
  
  assignTicket: async (ticketId: string, assignedToId: string | number): Promise<TicketDetail> => {
    // Note: Swagger definition says assigned_to_id is a string property in the body
    const response = await apiClient.post(`/tickets/${ticketId}/assign/`, {
      assigned_to_id: String(assignedToId)
    });
    return response.data;
  },
  
  updateTicketStatus: async (ticketId: string, status: string): Promise<TicketDetail> => {
    const response = await apiClient.post(`/tickets/${ticketId}/status/`, { status });
    return response.data;
  },
  
  uploadDocument: async (ticketId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(`/tickets/${ticketId}/documents/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  
  getDashboardCount: async (): Promise<TicketDashboardCount> => {
    const response = await apiClient.get("/tickets/dashboard-count/");
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
  
  getClinicEmployees: async (clinicId: string | number): Promise<Employee[]> => {
    const response = await apiClient.get(`/clinics/${clinicId}/employees/`);
    return response.data?.results || response.data || [];
  },
};