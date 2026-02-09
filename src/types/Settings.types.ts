import type { Dayjs } from "dayjs";

// ===== Integration Types =====
export type IntegrationCardProps = {
  name: string;
  description: string;
  icon: string;
  headerBgColor: string;
};

// ===== Tickets Types =====
export type TicketStatus = "New" | "Pending" | "Resolved" | "Closed";
export type Priority = "Low" | "Medium" | "High";

export interface Ticket {
  ticketNo: string;
  labName: string;
  subject: string;
  createdDate: string;
  dueDate: string;
  requestedBy: string;
  department: string;
  priority: Priority;
  assignedTo: string;
  status: TicketStatus;
}

export interface CreateTicketProps {
  open: boolean;
  onClose: () => void;
}

export interface TicketFilters {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  priority: string;
  department: string;
}

export interface FilterTicketsProps {
  open: boolean;
  onClose: () => void;
  onApply?: (filters: TicketFilters | null) => void;
}