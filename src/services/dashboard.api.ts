import { http } from "./http";
import type { TimeRange } from "../components/dashboard/TimeRangeSelector";

export type TeamPerformanceEvent = {
  at: string;
  converted: boolean;
};

export type TeamPerformanceMember = {
  employee_id: number;
  user_id: number;
  name: string;
  role: string;
  assigned_leads: number;
  calls_made: number;
  follow_ups: number;
  appointments: number;
  converted: number;
  lost: number;
  conversion_rate: number;
  growth: number;
  performance_events: TeamPerformanceEvent[];
};

export type TeamPerformanceResponse = {
  clinic_id: number;
  time_range: TimeRange;
  scope: "self" | "clinic";
  overview: {
    calls: number;
    follow_ups: number;
    appointments: number;
    converted: number;
    assigned_leads: number;
    conversion_rate: number;
  };
  members: TeamPerformanceMember[];
  unavailable_metrics: string[];
};

export const dashboardApi = {
  getTeamPerformance: async (
    clinicId: number,
    timeRange: TimeRange,
  ): Promise<TeamPerformanceResponse> => {
    const response = await http.get<TeamPerformanceResponse>(
      "/dashboard/team-performance/",
      { params: { clinic_id: clinicId, time_range: timeRange } },
    );
    return response.data;
  },
};
