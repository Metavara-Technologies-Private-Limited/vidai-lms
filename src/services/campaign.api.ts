import { http } from "./http";
import type { CampaignAPIType } from "../types/campaigns.types";
import type { SocialCampaignPayload } from "../types/campaigns.types";

const storedClinicId = (): number =>
  Number(localStorage.getItem("clinic_id") ?? 0);

export const CampaignAPI = {
  // clinicId can be passed explicitly (from Redux state) or falls back to localStorage
  list: (clinicId?: number) =>
    http.get<CampaignAPIType[]>("/campaigns/list/", {
      params: { clinic_id: clinicId ?? storedClinicId() },
    }),

  create: (data: unknown) =>
    http.post("/campaigns/", data, {
      params: { clinic_id: storedClinicId() },
    }),

  createEmail: (data: unknown) =>
    http.post("/campaigns/email/create/", data, {
      params: { clinic_id: storedClinicId() },
    }),

  createSocial: (data: SocialCampaignPayload) =>
    http.post("/social-media-campaign/create/", data, {
      params: { clinic_id: storedClinicId() },
    }),

  createGoogleAds: (data: {
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
    platform_data?: Record<string, unknown>;
  }) =>
    http.post("/google-ads/create/", data, {
      params: { clinic_id: data.clinic_id },
    }),

  getFacebookStatus: () => http.get("/facebook/status"),

  get: (id: string) =>
    http.get<CampaignAPIType>(`/campaigns/${id}/`, {
      params: { clinic_id: storedClinicId() },
    }),

  update: (id: string, data: unknown) =>
    http.put(`/campaigns/${id}/update/`, data, {
      params: { clinic_id: storedClinicId() },
    }),

  updateStatus: (id: string, status: string, fullData: CampaignAPIType) =>
    http.put(`/campaigns/${id}/update/`, { ...fullData, status }, {
      params: { clinic_id: storedClinicId() },
    }),

  getFacebookInsights: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/facebook-insights/`, {
      params: { clinic_id: storedClinicId() },
    }),

  // Add this after getFacebookInsights:
  getFBAdInsights: (fbCampaignId: string) =>
    http.get(`/fb/campaigns/${fbCampaignId}/insights/?date_preset=maximum`),

  getFacebookDebug: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/facebook-debug/`, {
      params: { clinic_id: storedClinicId() },
    }),

  // ✅ Fetches latest Mailchimp insights from Mailchimp API
  // and saves them to CampaignEmailConfig.insights JSONField in DB.
  // Called automatically when CampaignDashboard opens for email campaigns.
  getMailchimpInsights: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/mailchimp-insights/`, {
      params: { clinic_id: storedClinicId() },
    }),
};