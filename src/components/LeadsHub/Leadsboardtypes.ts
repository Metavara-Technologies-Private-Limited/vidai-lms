// Leadsboardtypes.ts
// Types, interfaces, column config, time slots, quality helper, raw→LeadItem mapper

import type { Department, Employee } from "../../services/leads.api";

// ====================== Core Lead Type ======================
// FIX: [key: string]: unknown added so LeadItem is assignable to
// LeadsMenuDialogs.LeadItem, Leadsboardcard.LeadItem, and any other
// component that uses an index-signature lead shape.
export interface LeadItem {
  id: string;
  full_name: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  phone_number: string;
  location: string;
  city: string;
  state: string;
  address: string;
  source: string;
  lead_source: string;
  campaign: string;
  status: string;
  lead_status: string;
  quality: "Hot" | "Warm" | "Cold";
  assigned: string;
  assigned_to_name: string;
  assigned_to_id: number | null;
  score: number;
  ai_score: number;
  department: string;
  department_id: number | null;
  department_name: string;
  created_at: string | null;
  updated_at: string | null;
  last_contacted: string | null;
  task: string;
  task_type: string;
  taskStatus: string;
  task_status: string;
  next_action_description: string;
  next_action_status?: string;
  next_action_due_date: string | null;
  activity: string;
  last_activity: string;
  activity_count: number;
  medical_history: string;
  treatment_type: string;
  consultation_date: string | null;
  notes: string;
  remarks: string;
  archived: boolean;
  is_active: boolean;
  tags: string[];
  priority: string;
  converted: boolean;
  conversion_date: string | null;
  estimated_value: number;
  actual_value: number;
  appointment_date: string | null;
  slot: string;
  remark: string;
  book_appointment: boolean;
  contact_no: string;
  treatment_interest: string;
  partner_inquiry: boolean;
  clinic_id: number | null;
  campaign_id: string | null;
  // FIX: index signature — allows this type to satisfy any interface that
  // also has [key: string]: unknown (LeadsMenuDialogs, Leadsboardcard, etc.)
  [key: string]: unknown;
}

// ====================== Raw Redux Shape ======================
export interface RawLead {
  id?: string;
  full_name?: string;
  name?: string;
  initials?: string;
  email?: string;
  email_address?: string;
  phone?: string;
  mobile?: string;
  phone_number?: string;
  location?: string;
  city?: string;
  state?: string;
  address?: string;
  source?: string;
  lead_source?: string;
  campaign?: string;
  status?: string;
  lead_status?: string;
  assigned_to_name?: string;
  assigned_to_id?: number | null;
  score?: number;
  ai_score?: number;
  lead_score?: number;
  department?: string;
  department_id?: number | null;
  department_name?: string;
  created_at?: string | null;
  created_date?: string | null;
  updated_at?: string | null;
  modified_date?: string | null;
  last_contacted?: string | null;
  last_contact_date?: string | null;
  next_action_type?: string;
  task_type?: string;
  task?: string;
  next_action_status?: string;
  task_status?: string;
  next_action_description?: string;
  next_action_due_date?: string | null;
  last_activity?: string;
  activity?: string;
  activity_count?: number;
  medical_history?: string;
  treatment_type?: string;
  consultation_date?: string | null;
  notes?: string;
  remarks?: string;
  is_active?: boolean;
  tags?: string[];
  priority?: string;
  converted?: boolean;
  conversion_date?: string | null;
  estimated_value?: number;
  actual_value?: number;
  appointment_date?: string | null;
  slot?: string;
  remark?: string;
  book_appointment?: boolean;
  contact_no?: string;
  treatment_interest?: string;
  partner_inquiry?: boolean;
  clinic_id?: number | null;
  campaign_id?: string | null;
}

// ====================== Appointment State ======================
// FIX: selectedDepartmentId / selectedEmployeeId changed from (number | "")
// to (string) so they stay consistent with HTML select values which are
// always strings. This also matches how they are used in LeadsBoard.tsx
// setAppointment calls: setSelectedDepartmentId / setSelectedEmployeeId.
export interface AppointmentState {
  departments: Department[];
  employees: Employee[];
  filteredEmployees: Employee[];
  selectedDepartmentId: string;
  selectedEmployeeId: string;
  date: Date | null;
  slot: string;
  remark: string;
  loadingDepartments: boolean;
  loadingEmployees: boolean;
  submitting: boolean;
  error: string | null;
  success: boolean;
}

// ====================== Column Config ======================
export interface ColumnConfig {
  label: string;
  statusKey: string[];
  color: string;
}

export const BOARD_COLUMNS: ColumnConfig[] = [
  {
    label: "NEW LEADS",
    statusKey: ["New", "new", "no status", ""],
    color: "#6366F1",
  },
  {
    label: "FOLLOW-UPS",
    statusKey: [
      "Follow-Ups",
      "Follow-up",
      "follow-ups",
      "follow-up",
      "Contacted",
      "contacted",
    ],
    color: "#F59E0B",
  },
  {
    label: "APPOINTMENT",
    statusKey: ["Appointment", "appointment", "Scheduled", "scheduled"],
    color: "#10B981",
  },
  {
    label: "CONVERTED LEADS",
    statusKey: ["Converted", "converted", "Won", "won"],
    color: "#8B5CF6",
  },
  {
    label: "CYCLE CONVERSION",
    statusKey: ["Cycle Conversion", "cycle conversion"],
    color: "#EC4899",
  },
  {
    label: "LOST LEADS",
    statusKey: ["Lost", "lost", "Disqualified", "disqualified"],
    color: "#64748B",
  },
];

// ====================== Time Slots ======================
export const TIME_SLOTS: string[] = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  "11:30 AM - 12:00 PM",
  "12:00 PM - 12:30 PM",
  "12:30 PM - 01:00 PM",
  "01:00 PM - 01:30 PM",
  "01:30 PM - 02:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:00 PM - 03:30 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
  "04:30 PM - 05:00 PM",
  "05:00 PM - 05:30 PM",
  "05:30 PM - 06:00 PM",
];

// ====================== Email Templates ======================
export interface EmailTemplate {
  id: string;
  title: string;
  desc: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "1",
    title: "IVF Next Steps Form Request",
    desc: "Requests the patient to fill out a form to share medical and contact details.",
  },
  {
    id: "2",
    title: "IVF Treatment Information",
    desc: "Provides an overview of IVF process, timelines, and general treatment details.",
  },
  {
    id: "3",
    title: "IVF Follow-Up Reminder",
    desc: "Gentle reminder for patients who have not responded or taken action.",
  },
  {
    id: "4",
    title: "New Consultation Confirmation",
    desc: "Confirms appointment date, time, and doctor details.",
  },
  {
    id: "5",
    title: "Welcome Email – Patient Inquiry",
    desc: "Introduces the clinic and builds trust after the first inquiry.",
  },
];

// ====================== Shared MUI Styles ======================
export const modalFieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FAFBFC",
    "& fieldset": { borderColor: "#E2E8F0", borderWidth: "1px" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#6366F1", borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": { fontSize: "0.85rem", py: 1 },
  "& .MuiSelect-select": { fontSize: "0.85rem" },
};

export const fieldLabelStyle = {
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "#64748B",
  letterSpacing: "0.4px",
  mb: 0.6,
  display: "block",
  textTransform: "uppercase" as const,
};

// ====================== Quality Deriver ======================
export const deriveQuality = (lead: RawLead): "Hot" | "Warm" | "Cold" => {
  const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
  const hasNextAction = Boolean(lead.next_action_description?.trim());
  const isPending = lead.next_action_status === "pending";
  if (hasAssignee && hasNextAction && isPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

// ====================== Raw → LeadItem Mapper ======================
export const mapRawToLeadItem = (lead: RawLead): LeadItem => ({
  id: lead.id ?? "",
  full_name: lead.full_name ?? lead.name ?? "",
  name: lead.full_name ?? lead.name ?? "",
  initials:
    lead.initials ??
    (lead.full_name ?? lead.name ?? "?").charAt(0).toUpperCase(),
  email: lead.email ?? lead.email_address ?? "",
  phone: lead.phone ?? lead.mobile ?? lead.phone_number ?? "",
  phone_number: lead.phone ?? lead.mobile ?? lead.phone_number ?? "",
  location:
    lead.location ?? lead.city ?? lead.state ?? lead.address ?? "Not specified",
  city: lead.city ?? "",
  state: lead.state ?? "",
  address: lead.address ?? "",
  source: lead.source ?? lead.lead_source ?? "Unknown",
  lead_source: lead.source ?? lead.lead_source ?? "",
  campaign: lead.campaign ?? "",
  status: lead.status ?? lead.lead_status ?? "New",
  lead_status: lead.status ?? lead.lead_status ?? "New",
  quality: deriveQuality(lead),
  assigned: lead.assigned_to_name ?? "Unassigned",
  assigned_to_name: lead.assigned_to_name ?? "",
  assigned_to_id: lead.assigned_to_id ?? null,
  score: lead.score ?? lead.ai_score ?? lead.lead_score ?? 0,
  ai_score: lead.score ?? lead.ai_score ?? 0,
  department: lead.department ?? lead.department_name ?? "",
  department_id: lead.department_id ?? null,
  department_name: lead.department ?? lead.department_name ?? "",
  created_at: lead.created_at ?? lead.created_date ?? null,
  updated_at: lead.updated_at ?? lead.modified_date ?? null,
  last_contacted: lead.last_contacted ?? lead.last_contact_date ?? null,
  task: lead.next_action_type ?? lead.task_type ?? lead.task ?? "N/A",
  task_type: lead.next_action_type ?? lead.task_type ?? "",
  taskStatus: lead.next_action_status ?? lead.task_status ?? "Pending",
  task_status: lead.next_action_status ?? lead.task_status ?? "",
  next_action_description: lead.next_action_description ?? "",
  next_action_status: lead.next_action_status,
  next_action_due_date: lead.next_action_due_date ?? null,
  activity: lead.last_activity ?? lead.activity ?? "View Activity",
  last_activity: lead.last_activity ?? lead.activity ?? "",
  activity_count: lead.activity_count ?? 0,
  medical_history: lead.medical_history ?? "",
  treatment_type: lead.treatment_type ?? "",
  consultation_date: lead.consultation_date ?? null,
  notes: lead.notes ?? lead.remarks ?? "",
  remarks: lead.notes ?? lead.remarks ?? "",
  archived: lead.is_active === false,
  is_active: lead.is_active !== false,
  tags: lead.tags ?? [],
  priority: lead.priority ?? "Medium",
  converted: lead.converted ?? false,
  conversion_date: lead.conversion_date ?? null,
  estimated_value: lead.estimated_value ?? 0,
  actual_value: lead.actual_value ?? 0,
  appointment_date: lead.appointment_date ?? null,
  slot: lead.slot ?? "",
  remark: lead.remark ?? "",
  book_appointment: lead.book_appointment ?? false,
  contact_no:
    lead.contact_no ?? lead.phone ?? lead.mobile ?? lead.phone_number ?? "",
  treatment_interest: lead.treatment_interest ?? "",
  partner_inquiry: lead.partner_inquiry ?? false,
  clinic_id: lead.clinic_id ?? null,
  campaign_id: lead.campaign_id ?? null,
});