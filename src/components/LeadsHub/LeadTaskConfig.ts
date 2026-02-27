// ====================== leadTaskConfig.ts ======================
// Shared task-type constants used by EditLead and AddNewLead.
// Kept separate to satisfy react-refresh/only-export-components.

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

/** Maps each task type to its only valid status option(s). */
export const TASK_STATUS_FOR_TYPE: Record<string, { label: string; value: string }[]> = {
  "Follow Up":        [{ label: "To Do", value: "pending"   }],
  "Call Patient":     [{ label: "To Do", value: "pending"   }],
  "Book Appointment": [{ label: "Done",  value: "completed" }],
  "Send Message":     [{ label: "To Do", value: "pending"   }],
  "Send Email":       [{ label: "To Do", value: "pending"   }],
  "Review Details":   [{ label: "To Do", value: "pending"   }],
  "No Action":        [{ label: "To Do", value: "pending"   }],
};

/** Auto-derives next_action_status for a given task type. */
export const getAutoNextActionStatus = (
  taskType: string
): "pending" | "completed" | "" => {
  if (!taskType) return "";
  return taskType === "Book Appointment" ? "completed" : "pending";
};