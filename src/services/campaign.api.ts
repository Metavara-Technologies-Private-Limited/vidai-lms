// import type { Campaign } from "../../src/types/campaigns.types";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { http } from "./http";

export const CampaignAPI = {
  create: (data: any) => http.post("/campaigns/", data),

  list: () => http.get("/campaigns/list/"),

  get: (id: string) => http.get(`/campaigns/${id}/`),

  update: (id: string, data: any) =>
    http.put(`/campaigns/${id}/update/`, data),

  delete: (id: string) =>
    http.delete(`/campaigns/${id}/delete/`),
};

