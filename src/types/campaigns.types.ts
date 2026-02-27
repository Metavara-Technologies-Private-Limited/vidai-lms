export type CampaignStatus =
  | "Live"
  | "Draft"
  | "Scheduled"
  | "Stopped";

export type CampaignType = "social" | "email";

export interface Campaign {
  id: string;
  name: string;
  objective: string;

  type: CampaignType;     // social / email
  status: CampaignStatus;

  budget: number;

  start_date: string;
  end_date: string;
  created_at: string;

  lead_generated: number; // required by CampaignCard
}