// services/leads.api.ts
import axios from 'axios';

// ====================== Types ======================
export type Department = {
  id: number;
  name: string;
  is_active: boolean;
};

export type Clinic = {
  id: number;
  name: string;
  department: Department[];
};

export type Employee = {
  id: number;
  emp_name: string;
  emp_type: string;
  department_name: string;
};

// ── Document object shape returned by the API ──
export type LeadDocument = {
  id: string;
  file: string;          // relative path e.g. /media/lead_documents/file.pdf
  uploaded_at: string;
};

export type Lead = {
  id: string;
  clinic_id: number;
  clinic_name: string;
  department_id: number;
  department_name: string;
  full_name: string;
  contact_no: string;
  email?: string;
  age?: number;
  marital_status?: "single" | "married";
  location?: string;
  address?: string;
  partner_inquiry: boolean;
  partner_full_name?: string;
  partner_age?: number;
  partner_gender?: "male" | "female";
  source: string;
  sub_source?: string;
  lead_status?: "New" | "Contacted" | "Follow-Ups" | "Converted" | "Lost" | "Cycle Conversion" | "Appointment";
  next_action_type?: string;
  next_action_status?: string;
  next_action_description?: string;
  assigned_to_id?: number;
  assigned_to_name?: string;
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark?: string;
  documents?: LeadDocument[];   // ← FIXED: was string[], now object[]
  is_active: boolean;
  created_at: string;
  modified_at: string;
};

// Type for creating/updating leads
export type LeadPayload = {
  clinic_id: number;
  department_id: number;
  campaign_id?: string | null;
  assigned_to_id?: number | null;
  personal_id?: number | null;
  full_name: string;
  contact_no: string;
  age?: number | null;
  marital_status?: "single" | "married" | null;
  email?: string | null;
  language_preference?: string;
  location?: string;
  address?: string;
  partner_inquiry: boolean;
  partner_full_name?: string;
  partner_age?: number | null;
  partner_gender?: "male" | "female" | null;
  source: string;
  sub_source?: string;
  lead_status?: "new" | "contacted";
  next_action_status?: "pending" | "completed" | null;
  next_action_description?: string;
  next_action_type?: string;
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark?: string;
  is_active: boolean;
};

// ====================== Lead Email Types ======================
export type LeadEmailPayload = {
  lead: string;
  subject: string;
  email_body: string;
  sender_email?: string | null;
  scheduled_at?: string | null;
  send_now?: boolean;
};

export type LeadEmailStatus = "DRAFT" | "SCHEDULED" | "SENT" | "FAILED" | "CANCELLED";

export type LeadEmailResponse = {
  id: number;
  lead: string;
  subject: string;
  email_body: string;
  sender_email?: string | null;
  scheduled_at?: string | null;
  status: LeadEmailStatus;
  sent_at?: string | null;
  failed_reason?: string | null;
  created_at: string;
  send_now?: boolean;
};

export type LeadMailListItem = {
  id: number;
  lead_uuid: string;
  subject: string;
  sender_email?: string | null;
  email_body: string;
  status: LeadEmailStatus;
  scheduled_at?: string | null;
  sent_at?: string | null;
  created_at: string;
};

// ====================== Axios Instance ======================
const API_BASE_URL: string =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_BASE_URL ??
  'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    const detail = error?.response?.data?.detail || error?.response?.data || error?.message;
    console.error(`❌ API Error [${status}] ${url}:`, detail);
    return Promise.reject(error);
  }
);

// ====================== Lead API ======================
export const LeadAPI = {
  list: async (): Promise<Lead[]> => {
    const response = await api.get<Lead[]>('/leads/list/');
    return response.data;
  },

  create: async (data: LeadPayload): Promise<Lead> => {
    const response = await api.post<Lead>('/leads/', data);
    console.log("✅ Lead created:", response.data);
    return response.data;
  },

  createWithDocuments: async (data: LeadPayload, files: File[]): Promise<Lead> => {
    const formData = new FormData();
    (Object.keys(data) as (keyof LeadPayload)[]).forEach((key) => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    files.forEach((file) => {
      formData.append('documents', file);
    });
    const response = await api.post<Lead>('/leads/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log("✅ Lead + documents created:", response.data);
    return response.data;
  },

  getById: async (leadId: string): Promise<Lead> => {
    const response = await api.get<Lead>(`/leads/${leadId}/`);
    return response.data;
  },

  update: async (leadId: string, data: Partial<LeadPayload>): Promise<Lead> => {
    const response = await api.put<Lead>(`/leads/${leadId}/update/`, data);
    return response.data;
  },

  // ── Send lead fields + new documents together in ONE multipart PUT ──
  // This is the correct way to update a lead with new files.
  // Do NOT call update() then uploadDocuments() separately — the second
  // PUT would overwrite the lead with an incomplete payload.
  updateWithDocuments: async (
    leadId: string,
    data: Partial<LeadPayload>,
    files: File[]
  ): Promise<Lead> => {
    const formData = new FormData();
    (Object.keys(data) as (keyof Partial<LeadPayload>)[]).forEach((key) => {
      const value = data[key];
      if (value === null || value === undefined) return;
      // Booleans must be sent as "true"/"false" strings for Django multipart
      if (typeof value === "boolean") {
        formData.append(key, value ? "true" : "false");
      } else {
        formData.append(key, String(value));
      }
    });
    files.forEach((file) => formData.append('documents', file));
    const response = await api.put<Lead>(`/leads/${leadId}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log("✅ Lead + documents updated:", response.data);
    return response.data;
  },

  activate: async (leadId: string): Promise<void> => {
    await api.post(`/leads/${leadId}/activate/`);
  },

  inactivate: async (leadId: string): Promise<void> => {
    await api.patch(`/leads/${leadId}/inactivate/`);
  },

  delete: async (leadId: string): Promise<void> => {
    await api.patch(`/leads/${leadId}/delete/`);
  },

  // Returns embedded documents from the lead object (no extra API call)
  getDocuments: async (leadId: string): Promise<LeadDocument[]> => {
    const lead = await LeadAPI.getById(leadId);
    return lead.documents ?? [];
  },

  uploadDocument: async (leadId: string, file: File): Promise<Lead> => {
    const formData = new FormData();
    formData.append('documents', file);
    const response = await api.put<Lead>(`/leads/${leadId}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadDocuments: async (leadId: string, files: File[]): Promise<Lead> => {
    // First fetch the current lead so we can re-send all required fields.
    // A bare multipart PUT with only `documents` causes Django to reset other
    // fields (including is_active → false), archiving the lead.
    const current = await LeadAPI.getById(leadId);
    const formData = new FormData();

    // Re-send all required lead fields so nothing gets wiped
    const safeFields: Record<string, string> = {
      clinic_id:          String(current.clinic_id ?? 1),
      department_id:      String(current.department_id ?? 1),
      full_name:          current.full_name ?? "",
      contact_no:         current.contact_no ?? "",
      source:             current.source ?? "",
      treatment_interest: current.treatment_interest ?? "",
      book_appointment:   current.book_appointment ? "true" : "false",
      appointment_date:   current.appointment_date ?? "",
      slot:               current.slot ?? "",
      partner_inquiry:    current.partner_inquiry ? "true" : "false",
      is_active:          current.is_active ? "true" : "false",
    };
    Object.entries(safeFields).forEach(([k, v]) => formData.append(k, v));

    // Append new files
    files.forEach((file) => formData.append('documents', file));

    const response = await api.put<Lead>(`/leads/${leadId}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ====================== Lead Email API ======================
export const LeadEmailAPI = {
  create: async (data: LeadEmailPayload): Promise<LeadEmailResponse> => {
    const response = await api.post<LeadEmailResponse>('/lead-email/', data);
    console.log("✅ Lead email created:", response.data);
    return response.data;
  },

  sendNow: async (data: Omit<LeadEmailPayload, 'send_now'>): Promise<LeadEmailResponse> => {
    return LeadEmailAPI.create({ ...data, send_now: true });
  },

  saveAsDraft: async (data: Omit<LeadEmailPayload, 'send_now'>): Promise<LeadEmailResponse> => {
    return LeadEmailAPI.create({ ...data, send_now: false });
  },

  list: async (leadUuid?: string): Promise<LeadMailListItem[]> => {
    const params = leadUuid ? { lead_uuid: leadUuid } : {};
    const response = await api.get<LeadMailListItem[]>('/lead-mail/', { params });
    return response.data;
  },

  listByLead: async (leadId: string): Promise<LeadMailListItem[]> => {
    return LeadEmailAPI.list(leadId);
  },
};

// ====================== Email Template Types ======================
export type EmailTemplate = {
  id: string | number;
  name: string;
  subject: string;
  body: string;
  description?: string;
  use_case?: string;
  is_active?: boolean;
  created_at?: string;
};

export type EmailTemplatePayload = {
  clinic: number;
  name: string;
  subject: string;
  body: string;
  description?: string;
  use_case?: string;
  created_by: number;
  is_active?: boolean;
};

// ====================== Email Template API ======================
export const EmailTemplateAPI = {
  list: async (): Promise<EmailTemplate[]> => {
    const response = await api.get<EmailTemplate[]>('/templates/mail/');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'results' in (data as object)) {
      return (data as { results: EmailTemplate[] }).results ?? [];
    }
    return [];
  },

  create: async (payload: EmailTemplatePayload): Promise<EmailTemplate> => {
    const response = await api.post<EmailTemplate>('/templates/mail/create/', payload);
    console.log("✅ Email template created:", response.data);
    return response.data;
  },

  getById: async (templateId: string | number): Promise<EmailTemplate> => {
    const response = await api.get<EmailTemplate>(`/templates/mail/${templateId}/`);
    return response.data;
  },

  delete: async (templateId: string | number): Promise<void> => {
    await api.delete(`/templates/mail/${templateId}/delete/`);
  },
};

// ====================== Twilio API ======================
export const TwilioAPI = {
  makeCall: async (payload: { lead_uuid: string; to: string }): Promise<unknown> => {
    const response = await api.post('/twilio/make-call/', payload);
    console.log("📞 Call initiated:", response.data);
    return response.data;
  },

  sendSMS: async (payload: { lead_uuid: string; to: string; message: string }): Promise<unknown> => {
    const response = await api.post('/twilio/send-sms/', payload);
    console.log("💬 SMS sent:", response.data);
    return response.data;
  },
};

// ====================== Clinic API ======================
export const ClinicAPI = {
  getById: async (clinicId: number): Promise<Clinic> => {
    try {
      const response = await api.get<Clinic>(`/clinics/${clinicId}/detail/`);
      return response.data;
    } catch {
      const fallback = await api.get<Clinic>(`/get_clinic/${clinicId}/`);
      return fallback.data;
    }
  },

  create: async (data: { name: string; department: string[] }): Promise<Clinic> => {
    const response = await api.post<Clinic>("/clinics", data);
    return response.data;
  },

  update: async (clinicId: number, data: { name: string; department: string[] }): Promise<Clinic> => {
    const response = await api.put<Clinic>(`/clinics/${clinicId}/`, data);
    return response.data;
  },

  getEmployees: async (clinicId: number): Promise<Employee[]> => {
    const response = await api.get<Employee[] | { results: Employee[] }>(`/clinics/${clinicId}/employees/`);
    const data = response.data;
    if (!Array.isArray(data)) {
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
      }
      return [];
    }
    return data;
  },
};

// ====================== Department API ======================
export const DepartmentAPI = {
  listByClinic: async (clinicId: number): Promise<Department[]> => {
    const clinic = await ClinicAPI.getById(clinicId);
    return clinic.department || [];
  },

  listActiveByClinic: async (clinicId: number): Promise<Department[]> => {
    const departments = await DepartmentAPI.listByClinic(clinicId);
    return departments.filter((dept) => dept.is_active);
  },
};

// ====================== Employee API ======================
export const EmployeeAPI = {
  listByClinic: async (clinicId: number): Promise<Employee[]> => {
    return ClinicAPI.getEmployees(clinicId);
  },

  create: async (data: {
    user_id: number;
    clinic_id: number;
    department_id: number;
    emp_type: string;
    emp_name: string;
  }): Promise<Employee> => {
    const response = await api.post<Employee>("/employees/", data);
    return response.data;
  },
};

export { api };