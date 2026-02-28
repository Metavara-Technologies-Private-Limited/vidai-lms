import { http } from "./http";

export const integrationApi = {
  /**
   * Redirect user to LinkedIn OAuth
   * (This is NOT an axios call — browser redirect)
   */
  connectLinkedIn: () => {
    const baseURL =
      import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

    window.location.href = `${baseURL}/linkedin/login/`;
  },

  /**
   * Optional: Check LinkedIn connection status from backend
   * Useful later (production)
   */
  getLinkedInStatus: () =>
    http.get<{ connected: boolean }>("/linkedin/status/"),

  /**
   * Disconnect (future use)
   */
  disconnectLinkedIn: () => http.post("/linkedin/disconnect/"),

  connectFacebook: () => {
    const baseURL =
      import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

    window.location.href = `${baseURL}/facebook/login/`;
  },
};
