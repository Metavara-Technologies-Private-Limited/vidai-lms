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

/* ================= NEXT ACTION STATUS ================= */
export type NextActionStatus = "pending" | "completed";

/*=====================Add New Lead=====================*/
export type FormState = {
  full_name: string;
  contact: string;
  email: string;
  location: string;
  gender: string;
  age: string;
  marital: string;
  address: string;
  language: string;

  partnerName: string;
  partnerAge: string;
  partnerGender: string;

  source: string;
  subSource: string;
  campaign: string;
  campaignName: string;

  assignee: string;
  nextType: string;
  nextStatus: string;
  nextDesc: string;

  treatmentInterest: string;
  treatments: string[];
  // ✅ REMOVED: documents: File | null
  // Files are now managed via pendingFiles state (File[]) in AddNewLead.tsx
  // using the multi-file drop zone — no longer part of FormState

  wantAppointment: "yes" | "no";
  department: string;
  personnel: string;
  appointmentDate: string;
  slot: string;
  remark: string;
};

export const steps = ["Patient Details", "Medical Details", "Book Appointment"];

/* ================= FILTER VALUES ================= */

export interface FilterValues {
  department: string;
  assignee: string;
  status: string;
  quality: string;
  source: string;
  dateFrom: string | null;
  dateTo: string | null;
}