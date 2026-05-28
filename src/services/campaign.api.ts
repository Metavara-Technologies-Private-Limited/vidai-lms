import { http } from "./http";
import type { CampaignAPIType } from "../types/campaigns.types";
import type { SocialCampaignPayload } from "../types/campaigns.types";

const storedClinicId = (): number =>
  Number(localStorage.getItem("clinic_id") ?? 0);

let campaignListController: AbortController | null = null;

export const CampaignAPI = {
  list: async (clinicId?: number, page = 1, pageSize = 20) => {
    // Cancel previous request
    campaignListController?.abort();

    // Create new controller
    campaignListController = new AbortController();

    try {
      return await http.get<CampaignAPIType[]>("/campaigns/list/", {
        params: {
          clinic_id: clinicId ?? storedClinicId(),
          page,
          page_size: pageSize,
        },
        signal: campaignListController.signal,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.name === "CanceledError" || error.message.includes("cancel"))
      ) {
        console.log("Previous campaign request cancelled");
        return { data: [] };
      }
      throw error;
    }
  },

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

  createSocialOrganic: (data: SocialCampaignPayload) =>
    http.post("/social-media-campaign/organic/create/", data, {
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
    schedule_datetime?: string | null;
  }) =>
    http.post("/google-ads/create/", data, {
      params: { clinic_id: data.clinic_id },
    }),

  updateGoogleAdsCampaign: (
    campaignId: string,
    data: {
      // ── Campaign identity ──────────────────────────────────────
      name?: string;
      // ── Status: "draft"|"paused"|"live"|"active"
      //    BE maps "draft"|"paused" → PAUSED, anything else → ENABLED
      status?: string;
      // ── Budget — BE checks both keys; use whichever your view reads
      budget?: number;
      budget_data?: Record<string, number>; // { google: <amount> }
      // ── Bidding
      bidding_strategy?: string;
      // ── Objective
      campaign_objective?: string;
      // ── Ad content — BE reads both keys
      content?: string;
      campaign_content?: string;
      // ── Full platform_data so BE can resolve resource_names
      platform_data?: Record<string, unknown>;
    },
  ) =>
    http.put(`/google-ads/campaigns/${campaignId}/update/`, data),

  updateGoogleAdsStatus: (campaignId: string, action: "pause" | "enable") =>
    http.post("/google-ads/status/", {
      campaign_id: campaignId,
      action,
    }),

  // ── LinkedIn ──────────────────────────────────────────────────

  /**
   * Trigger LinkedIn campaign insights fetch via Zapier.
   * POST /api/social/campaign/insights/
   */

  createLinkedInCampaign: (campaignId: string) =>
    http.post("/social/campaign/create/", {
      campaign_id: campaignId,
      platform: "linkedin",
    }),

  triggerLinkedInInsights: (campaignId: string) =>
    http.post("/social/campaign/insights/", {
      campaign_id: campaignId,
      platform: "linkedin",
    }),

  /**
   * Trigger LinkedIn campaign status sync via Zapier.
   * POST /api/social/campaign/status/
   */
  getLinkedInStatus: (campaignId: string) =>
    http.post("/social/campaign/status/", {
      campaign_id: campaignId,
      platform: "linkedin",
    }),

  /**
   * Update LinkedIn campaign status (ACTIVE | PAUSED).
   * POST /api/social/campaign/update/
   */
  updateLinkedInStatus: (
    campaignId: string,
    desiredStatus: "ACTIVE" | "PAUSED",
  ) =>
    http.post("/social/campaign/update/", {
      campaign_id: campaignId,
      desired_status: desiredStatus,
    }),

  /**
   * Check whether the clinic's LinkedIn SocialAccount has all required
   * fields (account_id, org_urn, campaign_group) set.
   * GET /api/webhooks/linkedin-account-status/<clinic_id>/
   *
   * Response shape:
   * {
   *   connected: boolean;
   *   setup_complete: boolean;
   *   missing: string[];       // e.g. ["account_id", "org_urn"]
   *   account_id?: string;
   *   org_urn?: string;
   *   has_campaign_group?: boolean;
   * }
   */
  getLinkedInAccountStatus: (clinicId: number) =>
    http.get<{
      connected: boolean;
      setup_complete: boolean;
      missing: string[];
      account_id?: string;
      org_urn?: string;
      has_campaign_group?: boolean;
    }>(`/webhooks/linkedin-account-status/${clinicId}/`),

  // ─────────────────────────────────────────────────────────────

  getFacebookStatus: () => http.get("/facebook/status"),

  // ✅ FIX (clinic_id): accepts explicit clinicId so GET /campaigns/:id/ is
  //    scoped to the correct clinic. Without this the BE was returning all-clinic
  //    data because clinic_id was missing from the query params.
  get: (id: string, clinicId?: number) =>
    http.get<CampaignAPIType>(`/campaigns/${id}/`, {
      params: { clinic_id: clinicId ?? storedClinicId() },
    }),

  update: (id: string, data: unknown) =>
    http.put(`/campaigns/${id}/update/`, data, {
      params: { clinic_id: storedClinicId() },
    }),

  updateStatus: (id: string, status: string, fullData: CampaignAPIType) =>
    http.put(
      `/campaigns/${id}/update/`,
      { ...fullData, status },
      { params: { clinic_id: storedClinicId() } },
    ),

  getFacebookInsights: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/facebook-insights/`, {
      params: { clinic_id: storedClinicId() },
    }),

  getFBAdInsights: (campaignId: string, platform: "facebook" | "instagram") =>
    http.get(`/fb/campaigns/${campaignId}/insights/`, {
      params: {
        date_preset: "maximum",
        platform,
      },
    }),

  updateFacebookStatus: (
    campaignId: string,
    action: "enable" | "disable",
    platform: "facebook" | "instagram",
  ) =>
    http.post(`/fb/campaigns/${campaignId}/status/`, {
      action,
      platform,
    }),

  getFacebookDebug: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/facebook-debug/`, {
      params: { clinic_id: storedClinicId() },
    }),

  getMailchimpInsights: (campaignId: string) =>
    http.get(`/campaigns/${campaignId}/mailchimp-insights/`, {
      params: { clinic_id: storedClinicId() },
    }),

  // triggerGoogleAdsInsights: (campaignId: string) =>
  //   http.post(`/campaign/insights/trigger/`, {
  //     campaign_id: campaignId,
  //   }),

  getGoogleAdsInsights: (campaignId: string) =>
    http.get(`/google-ads/insights/`, {
      params: { campaign_id: campaignId, clinic_id: storedClinicId() },
    }),

  // ✅ FIX (clinic_id): accepts explicit clinicId so Google Ads insights are
  //    filtered by the correct clinic on the BE. Previously clinic_id was
  //    always storedClinicId() which could be stale or 0 on first render.
  // getGoogleAdsInsightsFromApi: (campaignId: string, clinicId?: number) =>
  //   http.get(`/google-ads/insights/`, {
  //     params: {
  //       campaign_id: campaignId,
  //       clinic_id: clinicId ?? storedClinicId(),
  //     },
  //   }),

  // ✅ FIX: Use existing /upload/image/ endpoint instead of non-existent /campaigns/upload/
  uploadCampaignDocument: (formData: FormData) =>
    http.post(`/upload/image/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateFacebookCampaign: (campaignId: string, data: unknown) =>
    http.put(`/fb/campaigns/${campaignId}/update/`, data),

  updateInstagramCampaign: (campaignId: string, data: unknown) =>
    http.put(`/instagram/campaigns/${campaignId}/update/`, data),
};