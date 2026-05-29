/**
 * leadFieldValidation.ts
 * Shared field-level validation helpers for Lead forms (Add + Edit flows).
 * Each helper returns the sanitized value and an optional error message.
 * The caller is responsible for showing the toast.
 */

export interface FieldSanitizeResult {
  value: string;
  error: string | null;
}

// ── Phone / Contact Number ─────────────────────────────────────────────────
/**
 * Rules:
 *  - Allowed chars: digits 0-9, '+' (only at position 0 as country-code prefix),
 *    space ' ', and hyphen '-' (as separators).
 *  - Without country code (no '+'): at most 10 digits.
 *  - With country code (starts with '+'): at most 15 digits total (ITU-T E.164).
 * Extra digits beyond the limit are silently dropped and an error message is set.
 */
export function sanitizePhoneInput(raw: string): FieldSanitizeResult {
  let value = "";
  let error: string | null = null;
  let digitCount = 0;
  const hasCountryCode = raw.startsWith("+");
  const maxDigits = hasCountryCode ? 15 : 10;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (/[0-9]/.test(ch)) {
      if (digitCount >= maxDigits) {
        error = hasCountryCode
          ? "Max 15 digits with country code"
          : "Max 10 digits without country code";
        continue;
      }
      digitCount++;
      value += ch;
    } else if (ch === "+" && i === 0) {
      value += ch;
    } else if ((ch === " " || ch === "-") && value.length > 0) {
      value += ch;
    } else {
      error = "Only digits, + (prefix), spaces and hyphens allowed";
    }
  }

  return { value, error };
}

// ── Email ──────────────────────────────────────────────────────────────────
/**
 * Rules:
 *  - First character must be a letter or digit.
 *  - Allowed chars: a-z A-Z 0-9 @ . _ % + -
 *    (covers RFC 5321 common address characters and most real-world emails)
 */
export function sanitizeEmailFieldInput(raw: string): FieldSanitizeResult {
  if (raw.length === 0) return { value: "", error: null };

  let error: string | null = null;

  // First character must be alphanumeric
  if (!/[A-Za-z0-9]/.test(raw[0])) {
    error = "Email must start with a letter or number";
    const rest = raw.slice(1);
    if (rest.length === 0) return { value: "", error };
    // Recursively sanitize the rest (without invalid leading char)
    const { value: restSanitized, error: restError } =
      sanitizeEmailFieldInput(rest);
    return { value: restSanitized, error: error ?? restError };
  }

  let sanitized = "";
  for (const ch of raw) {
    if (/[A-Za-z0-9@._+%\-]/.test(ch)) {
      sanitized += ch;
    } else {
      error = "Invalid email character";
    }
  }

  return { value: sanitized, error };
}

// ── Location ───────────────────────────────────────────────────────────────
/**
 * Rules:
 *  - First character must be a letter (A-Z / a-z).
 *  - Allowed chars: letters, digits, space, hyphen -, underscore _, dot ., comma ,
 */
export function sanitizeLocationInput(raw: string): FieldSanitizeResult {
  if (raw.length === 0) return { value: "", error: null };

  let error: string | null = null;

  if (!/[A-Za-z]/.test(raw[0])) {
    error = "Location must start with a letter";
    return { value: "", error };
  }
  let sanitized = "";
  for (const ch of raw) {
    if (/[A-Za-z0-9 \-_.,]/.test(ch)) {
      sanitized += ch;
    } else {
      error = "Invalid location character";
    }
  }

  return { value: sanitized, error };
}

// ── Address ────────────────────────────────────────────────────────────────
/**
 * Rules:
 *  - First character must be a letter or digit.
 *  - Allowed chars: letters, digits, space, comma , dot . slash / hash # hyphen -
 *    underscore _ ampersand & parentheses ( )
 *    (covers "123 Main St, Apt #4B", "C/O Someone", "#45 2nd Cross" etc.)
 */
export function sanitizeAddressInput(raw: string): FieldSanitizeResult {
  if (raw.length === 0) return { value: "", error: null };

  let error: string | null = null;

  if (!/[A-Za-z0-9]/.test(raw[0])) {
    error = "Address must start with a letter or number";
    return { value: "", error };
  }

  let sanitized = "";
  for (const ch of raw) {
    if (/[A-Za-z0-9 ,./#\-_&()]/.test(ch)) {
      sanitized += ch;
    } else {
      error = "Invalid address character";
    }
  }

  return { value: sanitized, error };
}
