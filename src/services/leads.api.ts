// api/leads.ts
import type { Lead } from "../types/leads.types";
import type { LeadPayload } from "../components/LeadsHub/AddNewLead";
import { http } from "./http";

export const LeadAPI = {
  /**
   * Get all leads
   * GET /leads/list/
   */
  list: () => http.get<Lead[]>("/leads/list/"),

  /**
   * Create a new lead
   * POST /leads/
   * 
   * Required fields:
   * - clinic_id: number
   * - department_id: number
   * - full_name: string (max 255 chars)
   * - contact_no: string (max 20 chars)
   * - source: string (max 100 chars)
   * - treatment_interest: string (comma-separated values)
   * - appointment_date: string (YYYY-MM-DD format)
   * - slot: string (max 50 chars)
   */
  create: (data: LeadPayload) => http.post<Lead>("/leads/", data),

  /**
   * Get lead by ID
   * GET /leads/{lead_id}/
   */
  getById: (leadId: string) => http.get<Lead>(`/leads/${leadId}/`),

 
};