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

// ===== Template Types =====
export type TemplateType = "email" | "sms" | "whatsapp";

/**
 * Base template interface for UI display
 */
export interface Template {
  id: string;
  name: string;
  subject?: string;
  useCase?: string;
  lastUpdatedAt?: string;
  createdBy?: string;
  type: TemplateType;
  body?: string;
}

/**
 * Email Template API interface
 */
export interface EmailTemplate {
  id?: string;
  audience_name: string;
  subject: string;
  email_body: string;
  template_name?: string;
  sender_email?: string;
  scheduled_at?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * SMS Template API interface
 */
export interface SMSTemplate {
  id?: string;
  name: string;
  body: string;
  phone_number?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * WhatsApp Template API interface
 */
export interface WhatsAppTemplate {
  id?: string;
  name: string;
  body: string;
  phone_number?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Helper functions to convert API templates to UI format
 */
export const TemplateConverters = {
  emailToUI: (api: EmailTemplate): Template => ({
    id: api.id || '',
    name: api.audience_name,
    subject: api.subject,
    body: api.email_body,
    type: 'email',
    lastUpdatedAt: api.updated_at || api.created_at || '',
    createdBy: 'System',
  }),
  
  smsToUI: (api: SMSTemplate): Template => ({
    id: api.id || '',
    name: api.name,
    body: api.body,
    type: 'sms',
    lastUpdatedAt: api.updated_at || api.created_at || '',
    createdBy: 'System',
  }),
  
  whatsappToUI: (api: WhatsAppTemplate): Template => ({
    id: api.id || '',
    name: api.name,
    body: api.body,
    type: 'whatsapp',
    lastUpdatedAt: api.updated_at || api.created_at || '',
    createdBy: 'System',
  }),
};