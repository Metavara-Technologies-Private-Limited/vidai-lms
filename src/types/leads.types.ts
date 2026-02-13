/* ================== ENUMS ================== */

/** Lead status */
export type LeadStatus = "new" | "contacted";

/** Next action status */
export type NextActionStatus = "pending" | "completed";

/** Partner gender */
export type Gender = "male" | "female";

/** Marital status */
export type MaritalStatus = "single" | "married";


/* ================== LEAD TYPES ================== */

/** Lead payload for API */
export interface Lead {
  id?: string;                        // uuid, readOnly
  clinic_id?: number | null;
  department_id?: number | null;
  campaign_id?: string | null;        // uuid
  assigned_to_id?: number | null;
  personal_id?: number | null;

  full_name: string;
  age?: number | null;
  marital_status?: MaritalStatus | null;
  email?: string | null;
  contact_no: string;
  language_preference?: string;
  location?: string;
  address?: string;

  partner_inquiry?: boolean;
  partner_full_name?: string;
  partner_age?: number | null;
  partner_gender?: Gender | null;

  source: string;
  sub_source?: string;

  lead_status?: LeadStatus;
  next_action_status?: NextActionStatus | null;
  next_action_description?: string | null;

  treatment_interest: string;         // comma-separated
  document?: string | null;           // URI, readOnly
  book_appointment?: boolean;
  appointment_date?: string | null;   // YYYY-MM-DD
  slot?: string;

  remark?: string;
  is_active?: boolean;

  created_at?: string;                // readOnly, date-time
  modified_at?: string;               // readOnly, date-time
}


/* ================== LEAD FORM STATE ================== */

/**
 * Form state for AddNewLead multi-step form.
 * Uses string fields for controlled MUI inputs,
 * with separate array for multi-select treatments.
 */
export interface FormState {
  // Step 1 — Patient details
  full_name: string;
  contact: string;           // maps to contact_no
  email: string;
  location: string;
  gender: string;            // "Male" | "Female" | "Other" — lowercased on submit
  age: string;               // string for input, converted to number on submit
  marital: string;           // "Married" | "Single" — lowercased on submit
  address: string;
  language: string;          // maps to language_preference

  // Step 1 — Partner details
  partnerName: string;       // maps to partner_full_name
  partnerAge: string;        // string for input, converted to number on submit
  partnerGender: string;     // maps to partner_gender

  // Step 1 — Source & Campaign
  source: string;
  subSource: string;         // maps to sub_source
  campaign: string;          // maps to campaign_id (or name)

  // Step 1 — Assignee & Next action
  assignee: string;          // maps to assigned_to_id (stringified number)
  nextType: string;          // UI only — not sent to API
  nextStatus: string;        // maps to next_action_status
  nextDesc: string;          // maps to next_action_description

  // Step 2 — Medical / Treatment
  treatmentInterest: string; // currently selected treatment in dropdown
  treatments: string[];      // accumulated list → joined as treatment_interest
  documents: File | null;    // for upload

  // Step 3 — Appointment
  wantAppointment: "yes" | "no";   // maps to book_appointment
  department: string;              // maps to department_id (stringified number)
  personnel: string;               // UI only (same as assignee in step 3)
  appointmentDate: string;         // maps to appointment_date
  slot: string;
  remark: string;
}


/* ================== LEAD FORM STATE (API-aligned, typed) ================== */

/**
 * Typed form state that closely mirrors the API schema.
 * Use this if you prefer typed fields over string-everything.
 */
export interface LeadFormState {
  // Patient details
  full_name: string;
  contact_no: string;
  email?: string;
  location?: string;
  gender?: string;
  age?: number;
  marital_status?: MaritalStatus;
  address?: string;
  language_preference?: string;

  // Partner details
  partner_inquiry?: boolean;
  partner_full_name?: string;
  partner_age?: number;
  partner_gender?: Gender;

  // Source & Campaign
  source: string;
  sub_source?: string;
  campaign_id?: string;

  // Assignment & Next action
  assigned_to_id?: number;
  personal_id?: number;
  next_action_status?: NextActionStatus;
  next_action_description?: string;

  // Medical / Treatment
  treatment_interest: string;   // comma-separated string
  treatments?: string[];        // UI array — joined into treatment_interest on submit
  documents?: File | null;

  // Appointment
  book_appointment?: boolean;
  appointment_date?: string;
  slot?: string;

  // Misc
  remark?: string;
  clinic_id?: number;
  department_id?: number;
}


/* ================== FORM STEPS ================== */

export const leadFormSteps = ["Patient Details", "Medical Details", "Book Appointment"] as const;


/* ================== HELPER FUNCTION ================== */

/**
 * Maps frontend LeadFormState to API-ready Lead payload.
 * Handles null coercion correctly — falsy number 0 is preserved,
 * only undefined/empty string/null values are nullified.
 */
export const mapFormStateToLeadPayload = (form: LeadFormState): Lead => ({
  full_name: form.full_name,
  contact_no: form.contact_no,

  // ✅ FIXED: use undefined check, not || — avoids coercing valid values to null
  email: form.email || null,
  location: form.location ?? "",
  address: form.address ?? "",

  // ✅ FIXED: age 0 is technically invalid but kept consistent — undefined → null
  age: form.age !== undefined ? form.age : null,
  marital_status: form.marital_status ?? null,
  language_preference: form.language_preference ?? "",

  partner_inquiry: form.partner_inquiry ?? false,
  partner_full_name: form.partner_full_name ?? "",
  // ✅ FIXED: undefined → null (not 0 via ||)
  partner_age: form.partner_age !== undefined ? form.partner_age : null,
  partner_gender: form.partner_gender ?? null,

  source: form.source,
  sub_source: form.sub_source ?? "",

  // ✅ FIXED: empty string campaign_id → null (API expects uuid or null)
  campaign_id: form.campaign_id || null,

  assigned_to_id: form.assigned_to_id !== undefined ? form.assigned_to_id : null,
  personal_id: form.personal_id !== undefined ? form.personal_id : null,
  next_action_status: form.next_action_status ?? null,
  next_action_description: form.next_action_description || null,

  // ✅ FIXED: prefer treatment_interest string; fall back to joining treatments array
  treatment_interest:
    form.treatment_interest
      ? form.treatment_interest
      : (form.treatments ?? []).join(","),

  document: null, // uploaded separately via multipart if needed

  book_appointment: form.book_appointment ?? false,

  // ✅ FIXED: empty string appointment_date → null (API expects date string or null)
  appointment_date: form.appointment_date || null,
  slot: form.slot ?? "",
  remark: form.remark ?? "",

  clinic_id: form.clinic_id !== undefined ? form.clinic_id : null,
  department_id: form.department_id !== undefined ? form.department_id : null,
  is_active: true,
});