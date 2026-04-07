import { http } from "./http";

export const integrationApi = {
  connectLinkedIn: () => http.redirect("/linkedin/login/"),
  connectFacebook: () => http.redirect("/facebook/login/"),
  connectGoogle: () => http.redirect("/google/login/"),
  getLinkedInStatus: () =>
    http.get<{ connected: boolean }>("/linkedin/status/"),
  disconnectFacebook: () => http.post("/facebook/disconnect/"),
  disconnectLinkedIn: () => http.post("/linkedin/disconnect/"),

  getSocialAccounts: (clinicId: number) =>
    http.get(`/clinics/${clinicId}/social-accounts/`),
};