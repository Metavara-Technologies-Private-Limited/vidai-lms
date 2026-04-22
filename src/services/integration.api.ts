import { http } from "./http";

export const integrationApi = {
  connectLinkedIn: () => http.redirect("/linkedin/login/"),
  connectFacebook: () => http.redirect("/facebook/login/"),
  connectGoogle: (customerId?: string) => {
    const base = "/google/login/";
    const url = customerId
      ? `${base}?customer_id=${encodeURIComponent(customerId)}`
      : base;
    http.redirect(url);
  },
  getLinkedInStatus: () =>
    http.get<{ connected: boolean }>("/linkedin/status/"),
  disconnectFacebook: () => http.post("/facebook/disconnect/"),
  disconnectLinkedIn: () => http.post("/linkedin/disconnect/"),

  getSocialAccounts: (clinicId: number) =>
    http.get(`/clinics/${clinicId}/social-accounts/`),
};