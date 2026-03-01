import type { RawLead, ApiErrorShape, ProcessedLead } from "./LeadsTable.types";
import { VALID_TASK_TYPES } from "./LeadsTable.types";

// ====================== Error extractor ======================
export const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  return (
    e?.response?.data?.detail ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

// ====================== Phone normalizer ======================
export const normalizePhone = (phone: string | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return `+${cleaned}`;
};

// ====================== Lead field formatters ======================
export const deriveQuality = (lead: RawLead): "Hot" | "Warm" | "Cold" => {
  const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
  const hasNextAction = Boolean(lead.next_action_description?.trim());
  const nextActionPending = lead.next_action_status === "pending";
  if (hasAssignee && hasNextAction && nextActionPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

export const formatLeadId = (id: string): string => {
  if (id.match(/^#?LN-\d+$/i)) return id.startsWith("#") ? id : `#${id}`;
  const lnMatch = id.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = id.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#LN-${(hash % 900) + 100}`;
};

export const formatStatus = (status: string): string => {
  if (!status) return "New";
  const lower = status.toLowerCase().trim();
  const map: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    converted: "Converted",
    "follow up": "Follow Up",
    "follow-up": "Follow Up",
    "follow-ups": "Follow Up",
    follow_up: "Follow Up",
    appointment: "Appointment",
    lost: "Lost",
    "cycle conversion": "Cycle Conversion",
    cycle_conversion: "Cycle Conversion",
  };
  return map[lower] ?? lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const formatTaskStatus = (
  nextActionStatus: string | null | undefined,
  taskType: string | null | undefined,
): string => {
  if (taskType === "Book Appointment") return "Done";
  const s = (nextActionStatus || "").toLowerCase();
  if (s === "completed") return "Done";
  if (s === "pending") return "To Do";
  return "";
};

export const formatTaskType = (raw: string | null | undefined): string => {
  if (!raw || raw.trim() === "") return "";
  const trimmed = raw.trim();
  if (VALID_TASK_TYPES.includes(trimmed)) return trimmed;
  const found = VALID_TASK_TYPES.find(
    (p) => p.toLowerCase() === trimmed.toLowerCase(),
  );
  return found ?? trimmed;
};

// ====================== Lead processor ======================
export const processLead = (lead: RawLead): ProcessedLead => {
  const rawTaskType =
    lead.next_action_type ||
    lead.task_type ||
    lead.nextActionType ||
    lead.taskType ||
    lead.action_type ||
    "";
  const taskType = formatTaskType(rawTaskType);
  const taskStatus = formatTaskStatus(lead.next_action_status, taskType);
  return {
    ...lead,
    assigned: lead.assigned_to_name || "Unassigned",
    status: formatStatus(lead.status || lead.lead_status || "New"),
    name: lead.full_name || lead.name || "",
    quality: deriveQuality(lead),
    displayId: formatLeadId(lead.id),
    taskType,
    taskStatus,
  };
};