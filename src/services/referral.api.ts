// src/services/referral.api.ts
// (matches the import path used in AddNewLead.tsx and addNewLead.steps.tsx)

import { http } from "./http";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// fetchDashboardCounts
// GET /api/dashboard/
// Returns: { "Doctors": 12, "Corporate HR": 4, ... }
// ─────────────────────────────────────────────────────────────

export async function fetchDashboardCounts(
  clinicId?: number
): Promise<Record<string, number>> {
  const params: Record<string, number> = {};
  if (clinicId) params.clinic_id = clinicId;

  const response = await http.get("/dashboard/", { params });

  // Response shape: { success: true, data: { "Doctors": 12, ... } }
  if (response.data?.success && typeof response.data.data === "object") {
    return response.data.data as Record<string, number>;
  }

  // Fallback: plain dict returned directly
  if (typeof response.data === "object" && !Array.isArray(response.data)) {
    return response.data as Record<string, number>;
  }

  return {};
}

// ─────────────────────────────────────────────────────────────
// fetchReferralSources
// GET /api/sources/?referral_department_id=&search=
// Returns: ReferralSource[]
// ─────────────────────────────────────────────────────────────

export async function fetchReferralSources(
  params: ReferralSourcesParams = {}
): Promise<ReferralSource[]> {
  const queryParams: Record<string, string | number> = {};

  if (params.referral_department_id != null) {
    queryParams.referral_department_id = params.referral_department_id;
  }
  if (params.search?.trim()) {
    queryParams.search = params.search.trim();
  }

  const response = await http.get("/sources/", { params: queryParams });

  // { success: true, data: [...] }
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.results)) return response.data.results;

  return [];
}

// ─────────────────────────────────────────────────────────────
// fetchReferralDepartments
// GET /api/referral-departments/
// Returns: ReferralDepartment[]   e.g. [{ id: 1, name: "Doctors" }, ...]
//
// ⚠️  ONE-TIME BACKEND SETUP REQUIRED:
//     Your ReferralDepartmentListAPIView already exists in referral_view.py
//     but is NOT registered in urls.py — that's why you see "No departments available".
//
//     Add these two lines to your urls.py:
//
//     # import at the top (with the other referral imports):
//     from restapi.views.referral_view import ReferralDepartmentListAPIView
//
//     # inside urlpatterns:
//     path("referral-departments/", ReferralDepartmentListAPIView.as_view(), name="referral-departments"),
// ─────────────────────────────────────────────────────────────

export async function fetchReferralDepartments(): Promise<ReferralDepartment[]> {
  const response = await http.get("/referral-departments/");

  // { success: true, data: [...] }
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.results)) return response.data.results;

  return [];
}