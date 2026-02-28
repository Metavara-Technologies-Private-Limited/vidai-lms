export type ReportTabKey =
  | "facebook"
  | "gmail"
  | "instagram"
  | "google-ads"
  | "linkedin"
  | "email"
  | "call";

export interface ReportSummaryCard {
  id: string;
  label: string;
  value: string;
}

export interface ReportTableRow {
  id: string;
  campaignName: string;
  totalImpressions: number;
  totalClicks: number;
  conversions: number;
  totalSpend: string;
  ctr: string;
  conversionRate: string;
  cpc: string;
  cpa: string;
}

export interface ReportChannelData {
  cards: ReportSummaryCard[];
  rows: ReportTableRow[];
}

export type ReportsMockData = Record<ReportTabKey, ReportChannelData>;

export type CallViewMode = "attempted" | "received";

export interface CallReportCard {
  label: string;
  value: string;
  icon: string;
  bg: string;
  border: string;
}

export interface CallReportRow {
  id: number;
  name: string;
  dateTime: string;
  phoneNumber: string;
  callDuration: string;
  callsReceivedBy: string;
  status: "Connected" | "Not-Connected";
  mode: CallViewMode;
}

export interface CallTranscriptLine {
  time: string;
  speaker: string;
  text: string;
}
