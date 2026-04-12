import axios from "axios";

type CreateReviewRequestPayload = {
  clinic: number;
  request_name: string;
  description?: string;
  collect_on: "google" | "form" | "both";
  mode: "email" | "sms" | "whatsapp";
  sender_email?: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  message?: string;
  schedule_date?: string;
  schedule_time?: string;
  status?: "draft" | "sent" | "scheduled";
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
  const token =
    localStorage.getItem("auth_token") || localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type Dict = Record<string, unknown>;

const asRecord = (value: unknown): Dict =>
  typeof value === "object" && value !== null ? (value as Dict) : {};

const unwrapPrimaryData = (value: unknown): unknown => {
  const root = asRecord(value);

  if (Array.isArray(value)) {
    return value;
  }

  const candidates = [
    root.data,
    root.results,
    root.items,
    root.requests,
    root.reviews,
    root.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return value;
};

const extractList = (value: unknown): Dict[] => {
  const unwrapped = unwrapPrimaryData(value);
  if (!Array.isArray(unwrapped)) {
    return [];
  }

  return unwrapped
    .map((item) => asRecord(item))
    .filter((item) => Object.keys(item).length > 0);
};

const extractString = (source: Dict, keys: string[], fallback = ""): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
};

const extractNumber = (source: Dict, keys: string[], fallback = 0): number => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

const normalizeReviewRow = (raw: unknown): Dict => {
  const row = asRecord(raw);
  const leadRecord = asRecord(row.lead);

  const leadName =
    extractString(row, [
      "lead_name",
      "patient_name",
      "lead_full_name",
      "full_name",
      "name",
    ]) || extractString(leadRecord, ["full_name", "name", "lead_name"]);

  const submittedAt = extractString(row, [
    "submitted_at",
    "created_at",
    "updated_at",
    "date",
  ]);

  const reviewText = extractString(row, [
    "review_text",
    "review",
    "comment",
    "feedback",
  ]);

  return {
    ...row,
    id: String(
      row.id ??
        row.review_id ??
        `${row.review_request ?? "review"}-${row.lead ?? "lead"}-${Date.now()}`,
    ),
    lead_name: leadName,
    rating: extractNumber(row, ["rating", "stars", "score"], 0),
    review_text: reviewText,
    submitted_at: submittedAt || new Date().toISOString(),
  };
};

export const reputationApi = {
  // Dashboard cards
  getDashboard: async () => {
    const response = await apiClient.get("/reputation/dashboard/");
    return response.data;
  },

  // List all review requests
  getRequests: async () => {
    const response = await apiClient.get("/reputation/requests/");
    return extractList(response.data);
  },

  // Create review request
  createRequest: async (data: CreateReviewRequestPayload) => {
    const response = await apiClient.post("/reputation/requests/create/", {
      clinic: data.clinic,
      request_name: data.request_name,
      description: data.description,
      collect_on: data.collect_on,
      mode: data.mode,
      sender_email: data.sender_email,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      message: data.message,
      schedule_date: data.schedule_date,
      schedule_time: data.schedule_time,
      status: data.status,
      lead_ids: data.lead_ids,
    });

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
      `/reputation/requests/${requestId}/reviews/`,
    );

    return extractList(response.data).map(normalizeReviewRow);
  },

  // Submit review (PATIENT SIDE)
  submitReview: async (data: SubmitReviewPayload) => {
    const variants = [
      {
        review_request: data.review_request,
        lead: data.lead,
        rating: data.rating,
        review_text: data.review_text,
      },
      {
        review_request: data.review_request,
        lead_id: data.lead,
        rating: data.rating,
        review_text: data.review_text,
      },
      {
        request: data.review_request,
        lead: data.lead,
        rating: data.rating,
        comment: data.review_text,
      },
    ];

    let lastError: unknown;

    for (let index = 0; index < variants.length; index += 1) {
      try {
        const response = await apiClient.post(
          "/reputation/reviews/create/",
          variants[index],
        );
        return response.data;
      } catch (error) {
        lastError = error;

        const status = axios.isAxiosError(error)
          ? (error.response?.status ?? 0)
          : 0;
        const shouldRetry = status === 400 || status === 422 || status === 500;

        if (!shouldRetry || index === variants.length - 1) {
          throw error;
        }
      }
    }

    throw lastError;
  },
};
