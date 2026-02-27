// ====================== Task Type Config ======================
export const TASK_TYPES = [
  "Follow Up",
  "Call Patient",
  "Book Appointment",
  "Send Message",
  "Send Email",
  "Review Details",
  "No Action",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUS_FOR_TYPE: Record<
  string,
  { label: string; value: string }[]
> = {
  "Follow Up": [{ label: "To Do", value: "pending" }],
  "Call Patient": [{ label: "To Do", value: "pending" }],
  "Book Appointment": [{ label: "Done", value: "completed" }],
  "Send Message": [{ label: "To Do", value: "pending" }],
  "Send Email": [{ label: "To Do", value: "pending" }],
  "Review Details": [{ label: "To Do", value: "pending" }],
  "No Action": [{ label: "To Do", value: "pending" }],
};

export const getAutoNextActionStatus = (
  taskType: string,
): "pending" | "completed" | "" => {
  if (!taskType) return "";
  return taskType === "Book Appointment" ? "completed" : "pending";
};

// ====================== Payload Type ======================
export type LeadPayload = {
  clinic_id: number;
  department_id: number;
  campaign_id: string | null;
  assigned_to_id: number | null;
  personal_id: number | null;
  full_name: string;
  contact_no: string;
  age: number | null;
  marital_status: "single" | "married" | null;
  email: string | null;
  language_preference: string;
  location: string;
  address: string;
  partner_inquiry: boolean;
  partner_full_name: string;
  partner_age: number | null;
  partner_gender: "male" | "female" | null;
  source: string;
  sub_source?: string;
  lead_status?: "new" | "contacted";
  next_action_status?: "pending" | "completed" | null;
  next_action_description?: string;
  next_action_type?: string;
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark: string;
  is_active: boolean;
};

// ====================== Campaign Type ======================
export type CampaignData = {
  id: string;
  campaign_name?: string;
  campaign_mode?: number;
  social_media?: Array<{ platform_name?: string }>;
  is_active?: boolean;
};

// ====================== API Error Type ======================
export type ApiError = {
  response?: {
    status?: number;
    data?: {
      detail?: string;
      message?: string;
      error?: string;
      request_id?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
};

// ====================== Document Config ======================
export const ALLOWED_DOC_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_DOC_SIZE_MB = 10;

export const getDocColor = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "#EF4444",
    doc: "#3B82F6",
    docx: "#3B82F6",
    jpg: "#10B981",
    jpeg: "#10B981",
    png: "#10B981",
    webp: "#10B981",
  };
  return map[ext] ?? "#6366F1";
};

// ====================== Value Helpers ======================
export const strOrNull = (val: string | undefined | null): string | null =>
  val && val.trim() !== "" ? val.trim() : null;

export const intOrNull = (val: string | undefined | null): number | null => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) ? n : null;
};

export const intOrFallback = (
  val: string | undefined | null,
  fallback: number,
): number => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) && n > 0 ? n : fallback;
};

// ====================== Time Slots ======================
export const TIME_SLOTS = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  "11:30 AM - 12:00 PM",
  "12:00 PM - 12:30 PM",
  "12:30 PM - 01:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:00 PM - 03:30 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
  "04:30 PM - 05:00 PM",
  "05:00 PM - 05:30 PM",
  "05:30 PM - 06:00 PM",
];

// ====================== MUI Styles ======================
export const inputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#6366F1" },
  },
};

export const readOnlyStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    bgcolor: "#F1F5F9",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#E2E8F0" },
    "&.Mui-focused fieldset": { borderColor: "#E2E8F0" },
  },
};

export const labelStyle = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#475569",
  mb: 0.5,
  display: "block",
};
