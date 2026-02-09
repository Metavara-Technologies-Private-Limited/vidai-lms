export type Status =
  | "New"
  | "Appointment"
  | "Follow-Ups"
  | "Converted"
  | "Lost"
  | "Cycle Conversion";

export type Quality = "Hot" | "Warm" | "Cold";

export type TaskStatus = "Pending" | "In Progress" | "Completed";

export type Lead = {
  initials: string;
  name: string;
  id: string;
  date: string;
  time: string;
  location: string;
  source: string;
  status: Status;
  quality: Quality;
  score: number;
  assigned: string;
  task: string;
  taskStatus: TaskStatus;
  activity: string;
  archived?: boolean;
};

/* ================= ACTIVITY ================= */

export type LeadActivity = {
  assignee: string;
  assigneeAvatar: string;

  leadName: string;
  leadId: string;

  leadStatus: Status;

  lastActivity: string;
  lastActivityTime: string;

  nextAction: string;
  nextActionHint: string;

  dueDate: string;

  taskStatus: TaskStatus;
};
