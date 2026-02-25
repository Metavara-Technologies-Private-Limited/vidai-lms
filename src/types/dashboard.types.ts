/* =======================
   COMMON / SHARED TYPES
======================= */

export type Severity = "high" | "medium";

export interface KpiBreakdown {
  id: string;
  label: string;
  value: string | number;
}

export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  breakdown?: KpiBreakdown[];
}

/* KpiCard for Dashboard - Live Data Structure */
export interface KpiCardData {
  id: string;
  label: string;
  value: number | string;
  breakdown?: Array<{
    label: string;
    value: number | string;
  }>;
}

/* Live KPI Counts from Leads */
export interface LiveKpiCounts {
  totalLeads: number;
  newLeads: number;
  appointments: number;
  followUps: number;
  totalConverted: number;
  lostLeads: number;
  registered: number;
  treatment: number;
}

export interface SlaAlert {
  id: number;
  title: string;
  time: string;
  description: string;
  severity: Severity;
}

/* =======================
   PERFORMANCE TYPES
======================= */

export interface SourcePerformance {
  name: string;
  campaign: string;
  hot: number;
  warm: number;
  cold: number;
  convRate: number;
  revenue: number;
  cost: number;
}

export interface CommunicationPerformance {
  platform: string;
  high: number;
  low: number;
  no: number;
}

export interface ConversionTrend {
  month: string;
  rate: number;
}

export interface PipelineStage {
  stage: string;
  value: number;
  color: string;
}

export interface AppointmentStatus {
  status: string;
  value: number;
  color?: string;
}

/* Appointment Chart Data */
export interface AppointmentChartData {
  status: string;
  value: number;
  color: string;
}

export interface AppointmentCounts {
  appointmentsBooked: number;
  completed: number;
  noShows: number;
  cancelled: number;
}

/* =======================
   TEAM PERFORMANCE
======================= */

export type MedalType = "1st" | "2nd" | "3rd";

export interface TeamMember {
  name: string;
  role: string;
  img: string;
  growth: string;
  rank?: string;
}

export interface TeamOverviewStats {
  calls: string;
  followUps: string;
  appointments: string;
  converted: string;
  rate: string;
  revenue: string;
  sla: string;
}

export interface TeamPerformance {
  members: TeamMember[];
  overview: Record<string, string>;
}

/* =======================
   MEMBER DETAIL VIEW
======================= */

export interface MemberStats {
  assignedLeads: number;
  callsMade: number;
  followUps: number;
  appointments: number;
  leadConverted: number;
  revenueGenerated: string;
  slaCompliance: string;
}

export interface PerformanceChartPoint {
  month: string;
  value: number;
}

/* =======================
   ROOT MOCK DATA SHAPE
======================= */

export interface MockData {
  kpis: KpiItem[];
  slaAlerts: {
    new: SlaAlert[];
    earlier: SlaAlert[];
  };
  overview: {
    activeTab: string;
    sourcePerformance: SourcePerformance[];
    communicationPerformance: CommunicationPerformance[];
    conversionTrendPerformance: ConversionTrend[];
    pipelineData: PipelineStage[];
    appointmentsPerformance: AppointmentStatus[];
    teamPerformance: TeamPerformance;
  };
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
  }>;
  label?: string;
}