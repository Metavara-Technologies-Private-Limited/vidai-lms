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

export interface MockData {
  kpis: KpiItem[];
  slaAlerts: {
    new: SlaAlert[];
    earlier: SlaAlert[];
  };
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
    };
  };
};

}
  