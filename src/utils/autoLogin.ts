export type LoginThemeMode = "normal" | "auto";

export const AUTO_LOGIN_CONFIG = {
  storage: {
    themeModeKey: "lms_login_theme_mode",
    displayNameOverrideKey: "lms_display_name",
  },
  modes: {
    normal: "normal" as LoginThemeMode,
    auto: "auto" as LoginThemeMode,
  },
} as const;

// Backward-compatible named exports used across the app.
export const LOGIN_THEME_MODE_KEY = AUTO_LOGIN_CONFIG.storage.themeModeKey;
export const DISPLAY_NAME_OVERRIDE_KEY =
  AUTO_LOGIN_CONFIG.storage.displayNameOverrideKey;

export const readLoginThemeMode = (): LoginThemeMode => {
  const saved = sessionStorage.getItem(LOGIN_THEME_MODE_KEY);
  return saved === AUTO_LOGIN_CONFIG.modes.auto
    ? AUTO_LOGIN_CONFIG.modes.auto
    : AUTO_LOGIN_CONFIG.modes.normal;
};

export const setLoginThemeMode = (mode: LoginThemeMode): void => {
  sessionStorage.setItem(LOGIN_THEME_MODE_KEY, mode);
  // Cleanup legacy persistence to avoid stale mode across browser restarts.
  localStorage.removeItem(LOGIN_THEME_MODE_KEY);
};

export const readDisplayNameOverrideForAutoMode = (): string | null => {
  if (readLoginThemeMode() !== "auto") {
    return null;
  }
  return sessionStorage.getItem(DISPLAY_NAME_OVERRIDE_KEY);
};

export const setDisplayNameOverride = (displayName: string): void => {
  sessionStorage.setItem(DISPLAY_NAME_OVERRIDE_KEY, displayName);
};

export const clearDisplayNameOverride = (): void => {
  sessionStorage.removeItem(DISPLAY_NAME_OVERRIDE_KEY);
  localStorage.removeItem(DISPLAY_NAME_OVERRIDE_KEY);
};

export const decodeBase64 = (value: string | null): string | null => {
  if (!value) return null;
  try {
    return atob(value);
  } catch {
    return null;
  }
};

// --- Secure auto-login token (single obfuscated param `t`) ---

const TOKEN_KEY = "vL9$xQ2m";

function xorCipher(input: string, key: string): string {
  let result = "";
  for (let i = 0; i < input.length; i++) {
    result += String.fromCharCode(
      input.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    );
  }
  return result;
}

function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): string {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return atob(b64);
}

/** Encode credentials into a single opaque token for URL use. */
export const encodeAutoLoginToken = (
  username: string,
  password: string,
  displayName?: string,
): string => {
  const payload = [username, password, displayName ?? ""].join("\x01");
  return toBase64Url(xorCipher(payload, TOKEN_KEY));
};

/** Decode the opaque token back into credentials. Returns null on failure. */
export const decodeAutoLoginToken = (
  token: string,
): { username: string; password: string; displayName: string } | null => {
  try {
    const raw = fromBase64Url(token);
    const decrypted = xorCipher(raw, TOKEN_KEY);
    const parts = decrypted.split("\x01");
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    return {
      username: parts[0],
      password: parts[1],
      displayName: parts[2] ?? "",
    };
  } catch {
    return null;
  }
};

/**
 * Parse auto-login credentials from URL search params.
 * Supports: ?t=<token> (new) or ?u=&p=&name= (legacy).
 * Returns null if no valid auto-login params found.
 */
export const parseAutoLoginParams = (
  searchParams: URLSearchParams,
): { username: string; password: string; displayName: string } | null => {
  // New format: single token
  const token = searchParams.get("t");
  if (token) {
    return decodeAutoLoginToken(token);
  }
  // Legacy format: base64 params
  const encodedUser = searchParams.get("u");
  const encodedPass = searchParams.get("p");
  if (encodedUser && encodedPass) {
    const username = decodeBase64(encodedUser);
    const password = decodeBase64(encodedPass);
    if (!username || !password) return null;
    const rawName = searchParams.get("name");
    const displayName = decodeBase64(rawName)?.trim() ?? "";
    return { username, password, displayName };
  }
  return null;
};

export const splitDisplayName = (
  displayName: string,
): { first: string; last: string } => {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return { first: "", last: "" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { first: trimmed, last: "" };
  }

  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1],
  };
};
