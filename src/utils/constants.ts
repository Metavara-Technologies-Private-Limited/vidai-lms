export const LEAD_STATUS = {
  NEW: "New",
  APPOINTMENT: "Appointment",
  FOLLOW_UPS: "Follow-Ups",
  CONVERTED: "Converted",
  CYCLE_CONVERSION: "Cycle Conversion",
  LOST: "Lost",
} as const;

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];
