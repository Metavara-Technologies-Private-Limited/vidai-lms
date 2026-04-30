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

type PublicReviewRequestResponse = {
  status?: string;
  data?: {
    id?: string;
    request_name?: string;
    description?: string;
    collect_on?: "google" | "form" | "both";
    lead_id?: string | null;
    lead_name?: string | null;
    review_submitted?: boolean;
  };
};

const resolveApiBaseUrl = (): string => {
  const configured = (
    import.meta.env.VITE_API_BASE_URL as string | undefined
  )?.trim();
  if (configured) return configured;

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return "http://127.0.0.1:8000/api";
};

const API_BASE_URL = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("auth_token") || localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ NEW: A second axios instance with NO auth interceptor — used for public endpoints
// that leads access from their email without being logged in.
const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

type Dict = Record<string, unknown>;

const getStoredClinicId = (): number | null => {
  const parsed = Number(localStorage.getItem("clinic_id") || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const compactRecord = (value: Dict): Dict => {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry == null) {
        return false;
      }

      if (typeof entry === "string") {
        return entry.trim().length > 0;
      }

      if (Array.isArray(entry)) {
        return entry.length > 0;
      }

      return true;
    }),
  );
};

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
    const response = await apiClient.get("/reputation/dashboard/", {
      params: { clinic_id: getStoredClinicId() },
    });
    return response.data;
  },

  // List all review requests
  getRequests: async (clinicId?: number | null) => {
    const resolvedClinicId = clinicId ?? getStoredClinicId();
    const variants = resolvedClinicId
      ? [
          { params: { clinic: resolvedClinicId } },
          { params: { clinic_id: resolvedClinicId } },
          undefined,
        ]
      : [undefined];

    let lastError: unknown;

    for (let index = 0; index < variants.length; index += 1) {
      try {
        const response = await apiClient.get(
          "/reputation/requests/",
          variants[index],
        );
        return extractList(response.data);
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

  // Create review request
  createRequest: async (data: CreateReviewRequestPayload, attachments: File[] = []) => {
    const scheduleAt =
      data.schedule_date && data.schedule_time
        ? `${data.schedule_date}T${data.schedule_time}`
        : undefined;

    const primaryPayload = compactRecord({
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

    const alternatePayload = compactRecord({
      clinic_id: data.clinic,
      request_name: data.request_name,
      description: data.description,
      collect_on: data.collect_on,
      mode: data.mode,
      from_email: data.sender_email,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      message: data.message,
      schedule_at: scheduleAt,
      status: data.status,
      selected_leads: data.lead_ids,
    });

    const variants = [primaryPayload, alternatePayload];
    let lastError: unknown;

    if (attachments.length > 0) {
      const payload = new FormData();
      Object.entries(primaryPayload).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => payload.append(key, String(item)));
          return;
        }
        payload.append(key, String(value));
      });
      attachments.forEach((file) => payload.append("attachments", file));
      const response = await apiClient.post("/reputation/requests/create/", payload);
      return response.data;
    }

    for (let index = 0; index < variants.length; index += 1) {
      try {
        const response = await apiClient.post(
          "/reputation/requests/create/",
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

  // Get request detail (authenticated — used by the admin dashboard)
  getRequestById: async (requestId: string) => {
    const response = await apiClient.get(`/reputation/requests/${requestId}/`, {
      params: { clinic_id: getStoredClinicId() },
    });
    return response.data;
  },

  // ✅ NEW: Get request detail without auth — used by ReviewForm page
  // Leads open review links from email and are NOT logged in.
  // Hits /reputation/public/requests/<id>/ which has authentication_classes = [] permission_classes = []
  getPublicRequestById: async (requestId: string, leadId?: string) => {
    const response = await publicApiClient.get<PublicReviewRequestResponse>(
      `/reputation/public/requests/${requestId}/`,
      {
        params: leadId ? { lead: leadId } : undefined,
      },
    );
    return response.data;
  },

  // Get reviews for request
  getReviews: async (requestId: string) => {
    const response = await apiClient.get(
      `/reputation/requests/${requestId}/reviews/`,
      {
        params: { clinic_id: getStoredClinicId() },
      },
    );

    return extractList(response.data).map(normalizeReviewRow);
  },

  // Submit review (PUBLIC — no auth required, called by leads opening review link)
  submitReview: async (data: SubmitReviewPayload) => {
    const response = await publicApiClient.post("/reputation/reviews/create/", {
      review_request: data.review_request,
      lead: data.lead,
      rating: data.rating,
      review_text: data.review_text,
    });
    return response.data;
  },
};
