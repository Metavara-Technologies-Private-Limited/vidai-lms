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

// ===== Form & Component Types =====

/**
 * Unified form template interface for handling all template types
 * Combines fields from Email, SMS, and WhatsApp templates for flexibility
 */
export interface FormTemplate {
  id?: string;
  // Email fields
  audience_name?: string;
  subject?: string;
  email_body?: string;
  // SMS/WhatsApp fields
  name?: string;
  body?: string;
  // Common fields
  use_case?: string;
  useCase?: string;
  phone_number?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  clinic?: number;
  lastUpdatedAt?: string;
  createdBy?: string;
  created_by_name?: string;
  modified_at?: string;
}

/**
 * New Email Template Form Props
 */
export interface NewEmailTemplateFormProps {
  onClose: () => void;
  onSave: (template: FormTemplate | EmailTemplate) => void;
  initialData?: FormTemplate | EmailTemplate;
  mode: 'create' | 'edit' | 'view';
}

/**
 * New SMS Template Form Props
 */
export interface NewSMSTemplateFormProps {
  onClose: () => void;
  onSave: (template: FormTemplate | SMSTemplate) => void;
  initialData?: FormTemplate | SMSTemplate;
  mode: 'create' | 'edit' | 'view';
}

/**
 * New WhatsApp Template Form Props
 */
export interface NewWhatsAppTemplateFormProps {
  onClose: () => void;
  onSave: (template: FormTemplate | WhatsAppTemplate) => void;
  initialData?: FormTemplate | WhatsAppTemplate;
  mode: 'create' | 'edit' | 'view';
}

/**
 * Copy Details Modal Props
 */
export interface CopyDetailsModalProps {
  open: boolean;
  onClose: () => void;
  template: Template;
}

/**
 * Selection Card Props for New Template Modal
 */
export interface SelectionCardProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
  bgClass: string;
}

/**
 * New Template Modal Props
 */
export interface NewTemplateModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: EmailTemplate | SMSTemplate | WhatsAppTemplate;
  onSave?: (template: EmailTemplate | SMSTemplate | WhatsAppTemplate) => void;
}

/**
 * Template Filters - can be extended based on actual filtering needs
 */
export interface TemplateFilters {
  searchText?: string;
  templateType?: TemplateType;
  dateFrom?: Dayjs | null;
  dateTo?: Dayjs | null;
  useCase?: string;
}

/**
 * Template State Structure
 */
export interface TemplatesState {
  mail: EmailTemplate[];
  sms: SMSTemplate[];
  whatsapp: WhatsAppTemplate[];
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