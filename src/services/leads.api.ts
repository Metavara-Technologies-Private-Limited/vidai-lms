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
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark?: string;
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
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark?: string;
  is_active: boolean;
};

// ====================== Axios Instance ======================
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
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

  getById: async (leadId: string): Promise<Lead> => {
    const response = await api.get<Lead>(`/leads/${leadId}/`);
    return response.data;
  },

  update: async (leadId: string, data: Partial<LeadPayload>): Promise<Lead> => {
    const response = await api.put<Lead>(`/leads/${leadId}/update/`, data);
    return response.data;
  },

  delete: async (leadId: string): Promise<void> => {
    await api.patch(`/leads/${leadId}/delete/`);
  },

  // ✅ ARCHIVE: POST /leads/{lead_id}/activate/
  activate: async (leadId: string): Promise<void> => {
    await api.post(`/leads/${leadId}/activate/`);
  },

  // ✅ UNARCHIVE: PATCH /leads/{lead_id}/inactivate/
  inactivate: async (leadId: string): Promise<void> => {
    await api.patch(`/leads/${leadId}/inactivate/`);
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

    console.log("=== EMPLOYEES FROM API ===");
    data.forEach(e =>
      console.log(`  id=${e.id} | emp_name="${e.emp_name}" | department_name="${e.department_name}"`)
    );

    return data;
  },
};

// ====================== Department API ======================
export const DepartmentAPI = {
  listByClinic: async (clinicId: number): Promise<Department[]> => {
    const clinic = await ClinicAPI.getById(clinicId);

    console.log("=== DEPARTMENTS FROM API ===");
    (clinic.department || []).forEach(d =>
      console.log(`  id=${d.id} | name="${d.name}" | is_active=${d.is_active}`)
    );

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