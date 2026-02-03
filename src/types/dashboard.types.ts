export type Severity = "high" | "medium";

export interface KpiItem {
  id: string;
  label: string;
  value: number;
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
  };
}