import { toast } from "react-toastify";

export const coralRadio = {
  color: "#D1D5DB",
  "&.Mui-checked": { color: "#E86A4A" },
};

export type FailedLead = {
  lead_id: string | number;
  lead?: string;
  category: string;
  user_message: string;
  recipient?: string;
  detail?: string;
  provider_code?: string;
};

export type DeliveryReport = {
  total_leads: number;
  success_count: number;
  queued_count?: number;
  failed_count: number;
  queued_leads?: FailedLead[];
  failed_leads: FailedLead[];
};

export type CreateRequestResponse = {
  status: "success" | "partial_success" | "error";
  message: string;
  data?: Record<string, unknown>;
  delivery_report?: DeliveryReport;
};

export const getBackendErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const networkError = error as {
      code?: string;
      message?: string;
      response?: unknown;
      request?: unknown;
    };

    const isNetworkFailure =
      !networkError.response &&
      !!networkError.request &&
      (networkError.code === "ERR_NETWORK" ||
        networkError.code === "ECONNREFUSED" ||
        /network error|failed to fetch|connection refused|unable to connect/i.test(
          networkError.message ?? "",
        ));

    if (isNetworkFailure) {
      return "Unable to reach the backend server. Please ensure the API is running and VITE_API_BASE_URL is correct.";
    }
  }

  if (typeof error === "object" && error !== null) {
    const axiosLikeError = error as {
      response?: {
        data?: unknown;
      };
    };

    const data = axiosLikeError.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      const record = data as Record<string, unknown>;

      const message = record.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }

      const fallbackError = record.error;
      if (typeof fallbackError === "string" && fallbackError.trim()) {
        const requestId =
          typeof record.request_id === "string" ? record.request_id : "";
        return requestId
          ? `${fallbackError} (request id: ${requestId})`
          : fallbackError;
      }

      const firstEntry = Object.values(record).find((value) => {
        if (typeof value === "string" && value.trim()) {
          return true;
        }
        return (
          Array.isArray(value) &&
          value.some((item) => typeof item === "string" && item.trim())
        );
      });

      if (typeof firstEntry === "string" && firstEntry.trim()) {
        return firstEntry;
      }

      if (Array.isArray(firstEntry)) {
        const firstString = firstEntry.find(
          (item) => typeof item === "string" && item.trim(),
        );
        if (typeof firstString === "string") {
          return firstString;
        }
      }
    }
  }

  return "Failed to create review request";
};

export const normalizeReviewLinkPlaceholder = (message: string) => {
  const brokenGoogleReviewUrlPattern =
    /https?:\/\/g\.page\/review\/your-clinic/gi;
  const legacyFeedbackLinkPattern =
    /https?:\/\/[^\s<>"']+\/feedback\?[^\s<>"']*/gi;
  const legacyReviewPathPattern =
    /https?:\/\/[^\s<>"']+\/(?:settings\/integration\/)?review\/[^\s<>"']+/gi;
  const flexibleReviewLinkTokenPattern =
    /(\{\{\s*review[_\s-]*link\s*\}\}|\{\s*review[_\s-]*link\s*\}|\[\s*review[_\s-]*link\s*\]|<\s*review[_\s-]*link\s*>)/gi;

  const normalized = message
    .replace(brokenGoogleReviewUrlPattern, "{review_link}")
    .replace(legacyFeedbackLinkPattern, "{review_link}")
    .replace(legacyReviewPathPattern, "{review_link}")
    .replace(flexibleReviewLinkTokenPattern, "{review_link}");

  if (normalized.includes("{review_link}")) {
    return normalized;
  }

  return `${normalized.trim()}\n\n{review_link}`;
};

export const ensureReviewLinkCallToAction = (
  message: string,
  mode: "email" | "sms" | "whatsapp",
) => {
  const normalized = normalizeReviewLinkPlaceholder(message);

  const hasShareReviewLine = /share\s*review\s*:/i.test(normalized);
  if (hasShareReviewLine) {
    return normalized;
  }

  const ctaLabel = mode === "email" ? "Share Review" : "Review Link";
  return `${normalized.trim()}\n\n${ctaLabel}: {review_link}`;
};

export const normalizeMessageForRequest = (message: string) => {
  return message
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const GOOGLE_REVIEW_PLACEHOLDER_URL = "https://g.page/review/your-clinic";

export const getConfiguredGoogleReviewUrl = () =>
  (import.meta.env.VITE_GOOGLE_REVIEW_URL ?? "").trim();

export const isGoogleReviewUrlConfigured = (url: string) => {
  if (!isValidWebUrl(url)) {
    return false;
  }

  return url.toLowerCase() !== GOOGLE_REVIEW_PLACEHOLDER_URL.toLowerCase();
};

export const isValidWebUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const isValidEmailAddress = (value?: string) => {
  const email = (value ?? "").trim();
  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const extractClinicEmails = (clinicData: unknown): string[] => {
  const record = asRecord(clinicData);
  const dataRecord = asRecord(record.data);

  const directCandidates = [
    getString(record.email),
    getString(record.clinic_email),
    getString(record.reply_email),
    getString(record.contact_email),
    getString(dataRecord.email),
    getString(dataRecord.clinic_email),
    getString(dataRecord.reply_email),
    getString(dataRecord.contact_email),
  ].filter((mail) => mail && isValidEmailAddress(mail));

  const nestedEmailArray = [record.emails, dataRecord.emails].find((emails) =>
    Array.isArray(emails),
  );

  const nestedCandidates = Array.isArray(nestedEmailArray)
    ? nestedEmailArray
        .map((item) => getString(item))
        .filter((mail) => mail && isValidEmailAddress(mail))
    : [];

  return Array.from(new Set([...directCandidates, ...nestedCandidates]));
};

export const isValidPhoneNumber = (value?: string) => {
  const phone = (value ?? "").trim();
  if (!phone) {
    return false;
  }

  const normalized = phone.replace(/[\s().-]/g, "");
  const isValid = /^\+?\d{7,15}$/.test(normalized);

  if (!isValid) {
    console.warn(
      `[Phone Validation] Invalid phone: "${phone}" (normalized: "${normalized}")`,
    );
  }

  return isValid;
};

const toPositiveNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  return 0;
};

const unwrapCreateRequestRecord = (
  response: unknown,
): Record<string, unknown> => {
  let current: unknown = response;

  for (let i = 0; i < 4; i += 1) {
    if (typeof current !== "object" || current === null) {
      return {};
    }

    const record = current as Record<string, unknown>;
    if (typeof record.id === "string" || typeof record.id === "number") {
      return record;
    }

    if (typeof record.data === "object" && record.data !== null) {
      current = record.data;
      continue;
    }

    return record;
  }

  return {};
};

export const buildOptimisticRequest = (
  response: unknown,
  payload: {
    request_name: string;
    mode: "email" | "sms" | "whatsapp";
    status: "draft" | "sent" | "scheduled";
    lead_ids: string[];
  },
  deliveryReport?: DeliveryReport,
) => {
  const record = unwrapCreateRequestRecord(response);
  const resolvedId =
    record.id ?? record.request_id ?? record.uuid ?? `temp-${Date.now()}`;

  const resolvedRequestSent = deliveryReport
    ? deliveryReport.success_count
    : toPositiveNumber(record.requests_sent) ||
      toPositiveNumber(record.request_sent) ||
      toPositiveNumber(record.selected_leads_count) ||
      toPositiveNumber(record.leads_count) ||
      payload.lead_ids.length;

  return {
    id: String(resolvedId),
    request_name:
      typeof record.request_name === "string"
        ? record.request_name
        : payload.request_name,
    status: typeof record.status === "string" ? record.status : payload.status,
    requests_sent: resolvedRequestSent,
    selected_leads_count: payload.lead_ids.length,
    lead_ids: payload.lead_ids,
    reviews_submitted:
      typeof record.reviews_submitted === "number"
        ? record.reviews_submitted
        : 0,
    avg_rating: typeof record.avg_rating === "number" ? record.avg_rating : 0,
    mode: typeof record.mode === "string" ? record.mode : payload.mode,
    created_at:
      typeof record.created_at === "string"
        ? record.created_at
        : new Date().toISOString(),
  };
};

const getCategoryToastMessage = (category: string): string => {
  const categoryMap: Record<string, string> = {
    invalid_number: "Invalid phone number",
    number_unreachable:
      "Phone number does not exist or cannot receive messages",
    missing_phone: "Phone number is missing",
    missing_email: "Email address is missing",
    provider_error:
      "Failed to send message. Please verify the number and try again.",
    configuration_error: "Review link configuration is missing",
    queued_external: "Delivery queued via external integration",
  };

  return categoryMap[category] || category;
};

export const handleDeliveryReport = (
  responseStatus: string,
  deliveryReport: DeliveryReport | undefined,
  showToast: (msg: string, type: "success" | "error" | "warning") => void,
) => {
  if (responseStatus === "success") {
    showToast("Review request created successfully", "success");
    return;
  }

  if (responseStatus === "partial_success" && deliveryReport) {
    const {
      failed_count,
      failed_leads,
      queued_count = 0,
      queued_leads = [],
    } = deliveryReport;

    if (queued_count > 0 && failed_count === 0) {
      showToast(
        `${queued_count} ${queued_count === 1 ? "email is" : "emails are"} queued for external delivery. Please verify recipient inbox.`,
        "warning",
      );

      queued_leads.slice(0, 2).forEach((queuedLead) => {
        const message =
          queuedLead.user_message ||
          getCategoryToastMessage(queuedLead.category);
        showToast(message, "warning");
      });

      return;
    }

    showToast(
      `${failed_count} ${failed_count === 1 ? "number" : "numbers"} failed`,
      "warning",
    );

    failed_leads.slice(0, 3).forEach((failedLead) => {
      const message =
        failedLead.user_message || getCategoryToastMessage(failedLead.category);
      showToast(message, "error");
    });

    return;
  }

  if (responseStatus === "error" && deliveryReport) {
    const { failed_leads } = deliveryReport;
    const firstFailure = failed_leads[0];

    if (firstFailure) {
      const message =
        firstFailure.user_message ||
        getCategoryToastMessage(firstFailure.category);
      showToast(message, "error");
    } else {
      showToast(
        "Review request created but no messages were delivered",
        "error",
      );
    }

    return;
  }

  showToast("Review request created successfully", "success");
};

export const dismissSavingToast = () => {
  toast.dismiss("review-request-saving");
};
