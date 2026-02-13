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
  timeline: {
    type: "received" | "assigned" | "resolved" | "pending" | "closed";
    time: string;
    user?: string; 
  }[];
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

export type TicketTimelineItem = {
  title: string;
  time: string;
};
export interface Template {
  id: string;
  name: string;
  subject: string;
  useCase: string;
  lastUpdatedAt: string;
  createdBy: string;
  type: string;
}