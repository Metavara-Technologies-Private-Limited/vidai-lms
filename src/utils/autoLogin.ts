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
