const NON_ALPHANUMERIC_WITH_SPACE = /[^A-Za-z0-9 ]+/g;
const LEADING_NON_LETTER = /^[^A-Za-z]+/;

// Keeps only alphanumeric characters/spaces and ensures first char is alphabetic.
export const sanitizeNameInput = (value: string): string =>
  value
    .replace(NON_ALPHANUMERIC_WITH_SPACE, "")
    .replace(LEADING_NON_LETTER, "");
