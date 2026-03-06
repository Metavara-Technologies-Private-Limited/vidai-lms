/* eslint-disable @typescript-eslint/no-explicit-any */
export type CampaignStatus = "Live" | "Draft" | "Scheduled" | "Stopped";

export type CampaignType = "social" | "email";

export type Platform = "instagram" | "facebook" | "linkedin";

export interface Campaign {
  id: string;

  // Common
  name?: string;              // list view
  campaign_name?: string;     // backend full object
  campaign_description?: string;
  campaign_objective?: string;
  target_audience?: string;

  type?: "social" | "email";
  status?: string;

  start?: string;
  end?: string;
  start_date?: string;
  end_date?: string;

  scheduledAt?: string;

  // Email
  email?: {
    subject: string;
    email_body: string;
  }[];

  // Social
  campaign_content?: string;

  budget_data?: {
    total_budget: number;
    allocation: Record<string, number>;
  };

  performance_data?: any[];

  lead_generated?: number;
  total_spend?: number;
  cpc?: number;

  platforms?: string[];
  scheduledAt?: string | null;

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
  schedule_date_range: string;       // ✅ added

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
  image_url: string | null;          // ✅ added
}