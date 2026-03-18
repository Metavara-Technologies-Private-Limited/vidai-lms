import axios from "axios";



type CreateReviewRequestPayload = {
  clinic: number;
  request_name: string;
  description?: string;
  collect_on: "google" | "form" | "both";
  mode: "email" | "sms" | "whatsapp";
  subject?: string;
  message?: string;
  schedule_date?: string;
  schedule_time?: string;
  status?: string;
  lead_ids: string[];
};

type SubmitReviewPayload = {
  review_request: string;
  lead: string;
  rating: number;
  review_text: string;
};


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const reputationApi = {

  // Dashboard cards
  getDashboard: async () => {
    const response = await apiClient.get("/reputation/dashboard/");
    return response.data;
  },

  // List all review requests
  getRequests: async () => {
    const response = await apiClient.get("/reputation/requests/");
    return response.data?.data || [];
  },

  // Create review request
  createRequest: async (data: CreateReviewRequestPayload) => {
    const response = await apiClient.post("/reputation/requests/create/", data);
    return response.data;
  },

  // Get request detail
  getRequestById: async (requestId: string) => {
    const response = await apiClient.get(`/reputation/requests/${requestId}/`);
    return response.data;
  },

  // Get reviews for request
  getReviews: async (requestId: string) => {
    const response = await apiClient.get(
      `/reputation/requests/${requestId}/reviews/`
    );
    return response.data?.data || [];
  },

  // Submit review (PATIENT SIDE)
  submitReview: async (data: SubmitReviewPayload) => {
    const response = await apiClient.post("/reputation/reviews/create/", data);
    return response.data;
  },

};