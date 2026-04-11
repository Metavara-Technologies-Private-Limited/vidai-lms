/**
 * Upgrades http:// URLs to https:// when the page is served over HTTPS.
 * This prevents Mixed Content browser blocking on production servers.
 * No-op in local development (http://localhost stays http://).
 */
export const upgradeToHttpsIfNeeded = (url: string): string => {
  if (
    url.startsWith("http://") &&
    typeof window !== "undefined" &&
    window.location.protocol === "https:"
  ) {
    return url.replace(/^http:\/\//, "https://");
  }
  return url;
};

/**
 * Converts a raw photo value from the API into a safe, absolute URL.
 * - Absolute http/https URLs: upgraded to https on production.
 * - Relative paths: prefixed with the API origin.
 * - Null / empty: returns null.
 */
const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const toSafePhotoUrl = (value: unknown): string | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Already absolute
  if (/^(https?:\/\/|blob:|data:)/i.test(raw)) {
    return upgradeToHttpsIfNeeded(raw);
  }

  // Relative path — prefix with API origin
  const absolute = `${API_ORIGIN}${raw.startsWith("/") ? "" : "/"}${raw}`;
  return upgradeToHttpsIfNeeded(absolute);
};
