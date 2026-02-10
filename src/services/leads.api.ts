import type { Lead } from "../types/leads.types";
import { http } from "./http";

export const LeadAPI = {
  list: () => http.get<Lead[]>("/leads/list/"),
};
