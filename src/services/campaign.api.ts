import { http } from "./http";
import type { CampaignAPIType } from "../types/campaigns.types";
import type { SocialCampaignPayload } from "../types/campaigns.types";

const storedClinicId = (): number =>
  Number(localStorage.getItem("clinic_id") ?? 0);

const withClinicId = <T extends Record<string, unknown>>(
  payload: T,
): T & { clinic: number } => ({
  ...payload,
  clinic: Number(payload.clinic ?? storedClinicId()),
});

export const CampaignAPI = {
  // clinicId can be passed explicitly (from Redux state) or falls back to localStorage
  list: (clinicId?: number) =>
    http.get<CampaignAPIType[]>("/campaigns/list/", {
      params: { clinic_id: clinicId ?? storedClinicId() },
    }),

  create: (data: unknown) =>
    http.post(
      "/campaigns/",
      withClinicId((data as Record<string, unknown>) ?? {}),
      {
        params: { clinic_id: storedClinicId() },
      },
    ),

  createEmail: (data: unknown) =>
    http.post(
      "/campaigns/email/create/",
      withClinicId((data as Record<string, unknown>) ?? {}),
      {
        params: { clinic_id: storedClinicId() },
      },
    ),

  createSocial: (data: SocialCampaignPayload) =>
    http.post(
      "/social-media-campaign/create/",
      withClinicId(data as unknown as Record<string, unknown>),
      {
        params: { clinic_id: storedClinicId() },
      },
    ),

  getFacebookStatus: () => http.get("/facebook/status"),

  get: (id: string) =>
    http.get<CampaignAPIType>(`/campaigns/${id}/`, {
      params: { clinic_id: storedClinicId() },
    }),

  update: (id: string, data: unknown) =>
    http.put(
      `/campaigns/${id}/update/`,
      withClinicId((data as Record<string, unknown>) ?? {}),
      {
        params: { clinic_id: storedClinicId() },
      },
    ),

  updateStatus: (id: string, status: string, fullData: CampaignAPIType) =>
    http.put(
      `/campaigns/${id}/update/`,
      withClinicId({ ...fullData, status }),
      {
        params: { clinic_id: storedClinicId() },
      },
    ),

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
