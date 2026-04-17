// src/api/referral.api.ts

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

// Shape returned by /api/dashboard/
// { success: true, data: { "Doctors": 12, "Corporate HR": 4, ... } }
export interface DashboardCountsResponse {
  success: boolean;
  message: string;
  data: Record<string, number>;
}

// Shape returned by /api/sources/
// { success: true, count: 10, data: [...] }
export interface ReferralSourcesResponse {
  success: boolean;
  message: string;
  count: number;
  data: ReferralSource[];
}

export interface ReferralSourcesParams {
  referral_department_id?: number | null;
  search?: string;
}

// ─────────────────────────────────────────────────────────────
// API Calls
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/sources/?clinic_id=<id>
 * Fetches referral sources/leads and returns counts grouped by referral department.
 * Aggregates on frontend: { "Doctors": 12, "Corporate HR": 4, ... }
 * 
 * Note: /sources/ returns leads. We filter for those with referral_department set
 * and count them by referral_department_name.
 */
export async function fetchDashboardCounts(clinicId: number): Promise<Record<string, number>> {
  const response = await http.get("/sources/", {
    params: { clinic_id: clinicId },
  });
  
  console.log("📊 fetchDashboardCounts /sources/ response:", response.data);
  
  // Handle both wrapped and unwrapped response formats
  let items: ReferralSource[] = [];
  
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data?.results && Array.isArray(response.data.results)) {
    items = response.data.results;
  } else if (response.data?.data && Array.isArray(response.data.data)) {
    items = response.data.data;
  }

  console.log(`📊 Extracted ${items.length} items from /sources/`);

  // Group and count items by referral_department_name
  // Filter only items that have a referral_department_name (not null/empty)
  const counts: Record<string, number> = {};
  
  for (const item of items) {
    // Check for referral_department_name field (for referral sources)
    const deptName = item.referral_department_name;
    
    // If not a referral source (no department), skip it
    if (!deptName) {
      continue;
    }
    
    console.log(`  - ${item.name} → referral department: "${deptName}"`);
    counts[deptName] = (counts[deptName] ?? 0) + 1;
  }
  
  console.log("📊 Final aggregated counts by referral_department_name:", counts);
  
  return counts;
}

/**
 * GET /api/sources/?referral_department_id=&search=
 * Returns list of referral sources for a department.
 */
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
  
  const response = await http.get("/sources/", {
    params: queryParams,
  });

  // Handle both wrapped and unwrapped response formats
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data?.results && Array.isArray(response.data.results)) {
    return response.data.results;
  } else if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  return [];
}