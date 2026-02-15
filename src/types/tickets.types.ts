import  dayjs, { Dayjs } from "dayjs";

// Ticket Types based on Swagger API documentation

export type TicketPriority = "low" | "medium" | "high";
export type TicketStatus = "new" | "pending" | "resolved" | "closed";

// Ticket Document
export interface TicketDocument {
  id?: string;
  file?: string;
  uploaded_at?: string;
}

export type FilterTicketsPayload = {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  priority: TicketPriority | null;
  department_id: number | null;
};


// Ticket Timeline
export interface TicketTimeline {
  id?: string;
  action: string;
  done_by?: number | null;
  done_by_name?: string;
  created_at?: string;
}

// Create Ticket Request
export interface CreateTicketRequest {
  subject: string;
  description: string;
  lab: string; // UUID format
  department: number;
  requested_by: string;
  assigned_to?: number | null;
  priority: TicketPriority;
  status?: TicketStatus;
  due_date?: string | null; // ISO date format (YYYY-MM-DD)
  documents?: TicketDocument[];
}

// Update Ticket Request
export interface UpdateTicketRequest {
  subject: string;
  description: string;
  lab: string;
  department: number;
  requested_by: string;
  assigned_to?: number | null;
  priority: TicketPriority;
  status?: TicketStatus;
  due_date?: string | null;
  documents?: TicketDocument[];
}

// Ticket List Item (for list view)
export interface TicketListItem {
  id: string;
  ticket_no: string;
  lab: string;
  lab_name: string;
  subject: string;
  created_at: string;
  due_date?: string | null;
  requested_by: string;
  department: number;
  department_name: string;
  priority: TicketPriority;
  assigned_to?: number | null;
  assigned_to_name?: string;
  status: TicketStatus;
}

// Ticket Detail (for single ticket view)
export interface TicketDetail {
  id: string;
  ticket_no: string;
  subject: string;
  description: string;
  lab: string;
  lab_name: string;
  department: number;
  department_name: string;
  requested_by: string;
  assigned_to?: number | null;
  assigned_to_name?: string;
  priority: TicketPriority;
  status: TicketStatus;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  documents?: TicketDocument[];
  timeline?: TicketTimeline[];
}

// Ticket Filters (for list API)
export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  lab_id?: string;
  department_id?: number;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}


// Assign Ticket Request
export interface AssignTicketRequest {
  assigned_to_id: string;
}

// Update Status Request
export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

// Upload Document Request
export interface UploadDocumentRequest {
  file: File;
}

// Dashboard Count Response
export interface TicketDashboardCount {
  new: number;
  pending: number;
  resolved: number;
  closed: number;
  total: number;
}

// Lab type (from your API)
export interface Lab {
  id: string;
  clinic_name?: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Department type (from your API)
export interface Department {
  id: number;
  name: string;
  is_active: boolean;
}

// Employee type (from your API)
export interface Employee {
  id: number;
  emp_name: string;
  emp_type: string;
  department_name?: string;
  created_at?: string;
  modified_at?: string;
  clinic_id?: number;
  dep_id?: number;
  user_id?: number;
}

// API Response wrapper (if your API uses pagination)
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}