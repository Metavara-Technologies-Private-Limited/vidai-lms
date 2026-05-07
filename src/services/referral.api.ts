// src/services/referral.api.ts

import { http } from "./http";

// const REFERRAL_DEPARTMENTS_UNSUPPORTED_SESSION_KEY =
//   "referral_departments_endpoint_unsupported";

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

export interface ReferralSource {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  referral_department_id: number | null;
  referral_department_name: string | null;
  external_clinic_id: number | null;
  external_clinic_name: string | null;
  referral_count: number;
}

export interface ReferralDepartment {
  id: number;
  name: string;
}

export interface ReferralSourcesParams {
  referral_department_id?: number | null;
  search?: string;
}

// const isReferralDepartmentsEndpointUnsupported = (): boolean =>
//   sessionStorage.getItem(REFERRAL_DEPARTMENTS_UNSUPPORTED_SESSION_KEY) === "1";

// const markReferralDepartmentsEndpointUnsupported = (): void => {
//   sessionStorage.setItem(REFERRAL_DEPARTMENTS_UNSUPPORTED_SESSION_KEY, "1");
// };

// const mapSourcesToDepartments = (
//   sources: ReferralSource[],
// ): ReferralDepartment[] => {
//   const seen = new Set<string>();
//   const departments: ReferralDepartment[] = [];

//   sources.forEach((source) => {
//     const id = Number(source.referral_department_id ?? 0);
//     const name = (source.referral_department_name ?? "").trim();
//     if (!name) return;

//     const key = `${id}::${name.toLowerCase()}`;
//     if (seen.has(key)) return;

//     seen.add(key);
//     departments.push({ id, name });
//   });

//   return departments;
// };

// -------------------------------------------------------------
// fetchDashboardCounts
// GET /api/dashboard/?clinic_id=<id>
// Returns: { "Doctors": 12, "Corporate HR": 4, ... }
// Counts leads per referral department, scoped to the clinic.
// -------------------------------------------------------------
export async function fetchDashboardCounts(
  clinicId?: number,
): Promise<Record<string, number>> {
  const params: Record<string, number> = {};
  if (clinicId) params.clinic_id = clinicId;

  const response = await http.get("/dashboard/", { params });

  if (response.data?.success && typeof response.data.data === "object") {
    return response.data.data as Record<string, number>;
  }
  if (typeof response.data === "object" && !Array.isArray(response.data)) {
    return response.data as Record<string, number>;
  }

  return {};
}

// -------------------------------------------------------------
// fetchReferralSources
// GET /api/sources/?referral_department_id=&search=
// Returns: ReferralSource[]
// -------------------------------------------------------------
export async function fetchReferralSources(
  params: ReferralSourcesParams = {},
): Promise<ReferralSource[]> {
  const queryParams: Record<string, string | number> = {};

  if (params.referral_department_id != null) {
    queryParams.referral_department_id = params.referral_department_id;
  }
  if (params.search?.trim()) {
    queryParams.search = params.search.trim();
  }

  const response = await http.get("/sources/", { params: queryParams });

  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.results)) return response.data.results;

  return [];
}

// -------------------------------------------------------------
// STATIC_REFERRAL_DEPARTMENTS
// Fallback used when /api/referral-departments/ returns empty or fails.
// Names must exactly match what is seeded in the DB per clinic.
// -------------------------------------------------------------
export const STATIC_REFERRAL_DEPARTMENTS: ReferralDepartment[] = [
  { id: 0, name: "Doctors" },
  { id: 0, name: "Corporate HR" },
  { id: 0, name: "Diagnostic Labs" },
  { id: 0, name: "Insurance Partners" },
  { id: 0, name: "Practo" },
  { id: 0, name: "Zoya" },
];

// -------------------------------------------------------------
// fetchReferralDepartments
// GET /api/referral-departments/?clinic_id=<id>
// Returns clinic-scoped ReferralDepartment[].
// Falls back to STATIC_REFERRAL_DEPARTMENTS when unavailable.
// -------------------------------------------------------------
export async function fetchReferralDepartments(
  clinicId?: number,
): Promise<ReferralDepartment[]> {
  try {
    const params: Record<string, number> = {};

    if (clinicId) {
      params.clinic_id = clinicId;
    }

    const response = await http.get("/referral-departments/", { params });

    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data?.results)) {
      return response.data.results;
    }

    return [];
  } catch {
    return [];
  }
}
