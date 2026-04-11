export const getAvatarLetter = (
  ...values: Array<string | null | undefined>
): string => {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      return normalized.charAt(0).toUpperCase();
    }
  }

  return "?";
};
