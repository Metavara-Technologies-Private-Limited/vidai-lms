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

  // ✅ Facebook Ad Campaign ID
  fb_campaign_id?: string | null;

  // Mailchimp insights
  impressions?: number;
  clicks?: number;
  emails_sent?: number;
  bounces?: number;
  unsubscribes?: number;
  open_rate?: number;
  click_rate?: number;
  last_open?: string | null;
  last_click?: string | null;
  insights_synced_at?: string | null;
  conversion_rate?: number;
  // ✅ ADD LINKEDIN FIELDS
  linkedin_live_status?: string | null;
  linkedin_external_campaign_id?: string | null;
  linkedin_account_id?: string | null;
  linkedin_ads_manager_url?: string | null;

  last_synced_metrics?: {
    campaign_metrics?: {
      impressions?: number;
      clicks?: number;
      spend?: number;
      ctr?: number;
      conversions?: number;
    };
  } | null;

  last_metrics_synced_at?: string | null;
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

  // ✅ Facebook Ad Campaign ID
  fb_campaign_id?: string | null;

  clinic: number;

  // Mailchimp insights
  impressions?: number;
  clicks?: number;
  emails_sent?: number;
  bounces?: number;
  unsubscribes?: number;
  open_rate?: number;
  click_rate?: number;
  last_open?: string | null;
  last_click?: string | null;
  insights_synced_at?: string | null;
  conversion_rate?: number;

  // FB Insights
  fb_likes?: number;
  fb_comments?: number;
  fb_shares?: number;
  fb_impressions?: number;
  fb_reach?: number;
  fb_clicks?: number;

  linkedin_live_status?: string | null;
  linkedin_external_campaign_id?: string | null;
  linkedin_account_id?: string | null;
  linkedin_ads_manager_url?: string | null;

  last_synced_metrics?: {
    campaign_metrics?: {
      impressions?: number;
      clicks?: number;
      spend?: number;
      ctr?: number;
      conversions?: number;
    };
  } | null;

  last_metrics_synced_at?: string | null;
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
  status: string;

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
  clinic?: number;

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

  // ✅ FIX: Changed from 'string' to 'any' to allow JSON objects (LinkedIn/Instagram data)
  platform_data: Partial<Record<Platform, any>>;

  image_url: string | null;

  budget_data: Partial<Record<Platform, number>> & { total?: number };

  selected_start?: string | null;
  selected_end?: string | null;

  status?: string;
  is_active?: boolean;

  schedule_date_range?: string;
}

// ✅ Google Ads campaign creation payload
export interface GoogleAdsCampaignPayload {
  clinic_id: number;
  customer_id: string;
  campaign_name: string;
  budget?: number;
  bidding_strategy?: string;
  locations?: string[];
  keywords?: string[];
  cpc_bid?: number;
  ad_group_name?: string;
  final_url?: string;
  headline_1?: string;
  headline_2?: string;
  headline_3?: string;
  description?: string;
  description_2?: string;
  image_url?: string | null;
  platform_data?: Record<string, string>;
  login_customer_id?: string;
  // ✅ FIX: controls which campaign type Zapier creates (prevents duplicate Search + Display)
  campaign_type?: string;
  // ✅ FIX: links Zapier callback response back to our internal campaign DB record
  internal_campaign_id?: string;
  // ✅ NEW: campaign objective, target audience, schedule dates & time
  campaign_objective?: string;
  target_audience?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  // ✅ FIX: campaign status — "live" → ENABLED in Google Ads, else → PAUSED
  campaign_status?: string;
}