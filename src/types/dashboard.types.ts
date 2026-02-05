export type Severity = "high" | "medium";

export type KpiBreakdown = {
  label: string;
  value: number;
};

export interface KpiItem {
  id: string;
  label: string;
  value: number;
  breakdown?: KpiBreakdown[];
}

export interface SlaAlert {
  id: number;
  title: string;
  time: string;
  description: string;
  severity: Severity;
}

// Specific types for each Tab's performance metrics
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
  color?: string; // Optional color for highlighting specific bars
}

export interface TeamMember {
  name: string;
  role: string;
  img: string;
  growth: string;
  rank?: string; // For 1st (Top), 2nd, 3rd
}

export interface MockData {
  kpis: KpiItem[];
  slaAlerts: {
    new: SlaAlert[];
    earlier: SlaAlert[];
  };
<<<<<<< Updated upstream
overview: {
  activeTab: string;

  sourcePerformance: {
    name: string;
    campaign: string;
    hot: number;
    warm: number;
    cold: number;
    convRate: number;
    revenue: number;
    cost: number;
  }[];

  communicationPerformance: {
    platform: string;
    high: number;
    low: number;
    no: number;
  }[];

  conversionTrendPerformance: {
    month: string;
    rate: number;
  }[];

  pipelineData: {
    stage: string;
    value: number;
    color: string;
  }[];

  appointmentsPerformance: {
    status: string;
    value: number;
    color: string;
  }[];

  teamPerformance: {
    members: {
      name: string;
      role: string;
      img: string;
      growth: string;
      rank?: string;
    }[];
    overview: {
      calls: string;
      followUps: string;
      appointments: string;
      converted: string;
      rate: string;
      revenue: string;
      sla: string;
=======
  overview: {
    activeTab: string;
    sourcePerformance: SourcePerformance[];
    communicationPerformance: CommunicationPerformance[];
    conversionTrendPerformance: ConversionTrend[];
    pipelineData: PipelineStage[];
    appointmentsPerformance: AppointmentStatus[];
    teamPerformance: {
      members: TeamMember[];
      overview: Record<string, string>; // Flexible object for the stats card
>>>>>>> Stashed changes
    };
  };
};

}
  