import { http } from "./http";

export const integrationApi = {
  connectLinkedIn: (clinicId: number) =>
    http.redirect(`/linkedin/login/?clinic_id=${clinicId}`),

  connectFacebook: (clinicId: number) =>
    http.redirect(`/facebook/login/?clinic_id=${clinicId}`),

  connectGoogle: (clinicId: number, customerId?: string) => {
    const base = `/google/login/?clinic_id=${clinicId}`;
    const url = customerId
      ? `${base}&customer_id=${encodeURIComponent(customerId)}`
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