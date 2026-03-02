import type { SocialCampaignPayload } from "../types/campaigns.types";
import { http } from "./http";

export const CampaignAPI = {
  create: (data: any) => http.post("/campaigns/", data),

  list: () => http.get("/campaigns/list/"),

  createEmail: (data: any) => http.post("/campaigns/email/create/", data),

  createSocial: (data: SocialCampaignPayload) =>
    http.post("/social-media-campaign/create/", data),

  getFacebookStatus: () => http.get("/facebook/status"),

  get: (id: string) => http.get(`/campaigns/${id}/`),

  update: (id: string, data: any) => http.put(`/campaigns/${id}/update/`, data),

  delete: (id: string) => http.delete(`/campaigns/${id}/delete/`),
};
