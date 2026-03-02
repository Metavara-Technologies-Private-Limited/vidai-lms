export type CampaignStatus = "Live" | "Draft" | "Scheduled" | "Stopped";

export type CampaignType = "social" | "email";

export type Platform = "instagram" | "facebook" | "linkedin";

export interface Campaign {
  id: string;
  name: string;
  objective?: string;

  type: CampaignType;
  status: CampaignStatus;

  budget?: number;
  total_spend?: number;
  cpc?: number;

  start_date?: string;
  end_date?: string;
  created_at?: string;
  start: string;
  end: string;
  platforms?: string[];
  scheduledAt?:string | null;

  lead_generated: number;
  leads?: number;
}

export interface SocialCampaignPayload {
  clinic: number;

  campaign_name: string;
  campaign_description: string;
  campaign_objective: string;
  target_audience: string;

  start_date: string;
  end_date: string;

  campaign_content: string;
  campaign_mode: ("paid_advertising" | "organic_posting")[];
  select_ad_accounts: ("instagram" | "facebook" | "linkedin")[];

  enter_time: string;

  platform_data: {
    instagram: string;
    facebook: string;
    linkedin: string;
  };

  budget_data: {
    instagram: number;
    facebook: number;
    linkedin: number;
    total: number;
  };

  status: "live" | "scheduled" | "draft";
  is_active: boolean;
}