import type {
  CampaignAudience,
  CampaignMode,
  CampaignObjective,
  CampaignStatus,
  CampaignType,
  Platform,
} from "../constants/campaigns.constants";

// UI
export interface Campaign {
  id: string;

  name: string;
  description: string;
  objective?: CampaignObjective;
  audience?: CampaignAudience;

  type: CampaignType;
  status: CampaignStatus;

  start: string;
  end: string;

  platforms: Platform[];

  leads: number;
  lead_generated: number;

  scheduledAt: string;
  selected_start?: string | null;
  enter_time?: string | null;

  budget_data: Record<string, number>;

  platform_data?: Record<string, { is_active?: boolean }>;

  campaign_content: string;

  image_url?: string | null;

  total_spend?: number;
  cpc?: number;

  // Mailchimp insights (from insights JSONField in CampaignEmailConfig)
  // Populated when GET /api/campaigns/<id>/mailchimp-insights/ is called
  impressions?: number;      // = opens count from Mailchimp
  clicks?: number;           // unique clicks count
  emails_sent?: number;      // total emails sent
  bounces?: number;          // hard + soft bounces
  unsubscribes?: number;     // unsubscribe count
  open_rate?: number;        // open rate percentage e.g. 25.0 means 25%
  click_rate?: number;       // click rate percentage e.g. 12.3 means 12.3%
  last_open?: string | null; // ISO datetime string of last open
  last_click?: string | null;// ISO datetime string of last click
  insights_synced_at?: string | null; // when insights were last synced
  conversion_rate?: number;
}

// API TYPE
export interface CampaignAPIType {
  id: string;

  campaign_name: string;
  campaign_description: string;
  campaign_objective: CampaignObjective;
  target_audience: string;

  social_media: {
    id: number;
    platform_name: Platform;
    is_active: boolean;
  }[];

  email: {
    id: number;
    subject: string;
    email_body: string;
    scheduled_at: string;
    is_active: boolean;
  }[];

  adv_accounts: unknown | null;

  campaign_mode: CampaignMode;

  campaign_content: string;
  post_id: string | null;

  start_date: string;
  end_date: string;

  selected_start: string;
  selected_end: string;

  enter_time: string;

  platform_data?: Record<string, { is_active?: boolean }>;
  budget_data: Record<string, number>;

  status: CampaignStatus;

  is_active: boolean;
  is_deleted: boolean;

  lead_generated: number;

  image_url: string | null;

  created_at: string;
  modified_at: string;
  converted_at: string | null;
  select_ad_accounts?: Platform[];
  total_spend?: number;
  cpc?: number;

  clinic: number;

  // Mailchimp insights (from insights JSONField in CampaignEmailConfig)
  // Populated when GET /api/campaigns/<id>/mailchimp-insights/ is called
  impressions?: number;      // = opens count from Mailchimp
  clicks?: number;           // unique clicks count
  emails_sent?: number;      // total emails sent
  bounces?: number;          // hard + soft bounces
  unsubscribes?: number;     // unsubscribe count
  open_rate?: number;        // open rate percentage e.g. 25.0 means 25%
  click_rate?: number;       // click rate percentage e.g. 12.3 means 12.3%
  last_open?: string | null; // ISO datetime string of last open
  last_click?: string | null;// ISO datetime string of last click
  insights_synced_at?: string | null; // when insights were last synced
  conversion_rate?: number;

  // FB Insights
  fb_likes?: number;
  fb_comments?: number;
  fb_shares?: number;
  fb_impressions?: number;
  fb_reach?: number;
  fb_clicks?: number;
}

// Payloads
export interface EmailCampaignPayload {
  clinic: number;
  campaign_name: string;
  campaign_description: string;
  campaign_objective: string;
  target_audience: string;
  start_date: string;
  end_date: string;
  campaign_mode: number;

  selected_start: string | null;
  selected_end: string | null;
  enter_time: string | null;

  email: {
    audience_name: string;
    subject: string;
    email_body: string;
    template_name: string;
    template_id: string | null;
    sender_email: string;
    scheduled_at: string | null;
    is_active: boolean;
  }[];
}


export interface SocialCampaignPayload {
  clinic: number;

  campaign_name: string;
  campaign_description: string;
  campaign_objective: string;
  target_audience: string;

  start_date: string;
  end_date: string;

  enter_time: string | null;

  campaign_mode: ("organic_posting" | "paid_advertising")[];

  select_ad_accounts: Platform[];

  campaign_content: string;

  platform_data: Partial<Record<Platform, string>>;

  image_url: string | null;

  budget_data: Partial<Record<Platform, number>> & { total?: number };

  selected_start?: string | null;
  selected_end?: string | null;

  status?: string;
  is_active?: boolean;

  schedule_date_range?: string;
}