export const CAMPAIGN_NAME_ALLOWED_PATTERN = /^[A-Za-z][A-Za-z0-9_ \-–]*$/;

export const getCampaignNameValidationError = (
  value: string,
): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Campaign Name is mandatory";
  }

  if (!/^[A-Za-z]/.test(trimmed)) {
    return "Campaign Name must start with a letter";
  }

  if (!CAMPAIGN_NAME_ALLOWED_PATTERN.test(trimmed)) {
    return "Alphanumeric and underscore are allowed";
  }

  return null;
};

export const canTypeCampaignName = (value: string): boolean => {
  if (value === "") {
    return true;
  }

  if (!/^[A-Za-z]/.test(value)) {
    return false;
  }

  return /^[A-Za-z0-9_ \-–]*$/.test(value);
};
