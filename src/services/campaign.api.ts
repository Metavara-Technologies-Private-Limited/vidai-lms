import { http } from "./http";
import type { CampaignAPIType } from "../types/campaigns.types";
import type { SocialCampaignPayload } from "../types/campaigns.types";

export const CampaignAPI = {
  list: () => http.get<CampaignAPIType[]>("/campaigns/list/"),

  create: (data: unknown) => http.post("/campaigns/", data),

  createEmail: (data: unknown) => http.post("/campaigns/email/create/", data),

  createSocial: (data: SocialCampaignPayload) =>
    http.post("/social-media-campaign/create/", data),

  getFacebookStatus: () => http.get("/facebook/status"),

  get: (id: string) => http.get<CampaignAPIType>(`/campaigns/${id}/`),

  update: (id: string, data: unknown) =>
    http.put(`/campaigns/${id}/update/`, data),

  updateStatus: (id: string, status: string, fullData: CampaignAPIType) =>
    http.put(`/campaigns/${id}/update/`, { ...fullData, status }),

  getFacebookInsights: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/facebook-insights/`),

  // Add this after getFacebookInsights:
  getFBAdInsights: (fbCampaignId: string) =>
  http.get(`/fb/campaigns/${fbCampaignId}/insights/?date_preset=maximum`),

  getFacebookDebug: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/facebook-debug/`),

  // ✅ Fetches latest Mailchimp insights from Mailchimp API
  // and saves them to CampaignEmailConfig.insights JSONField in DB.
  // Called automatically when CampaignDashboard opens for email campaigns.
  getMailchimpInsights: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/mailchimp-insights/`),
};