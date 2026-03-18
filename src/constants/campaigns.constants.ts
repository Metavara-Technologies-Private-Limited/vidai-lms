import instagramIcon from "../components/Campaign/Icons/instagram.png";
import facebookIcon from "../components/Campaign/Icons/facebook.png";
import linkedinIcon from "../components/Campaign/Icons/linkedin.png";
import emailIcon from "../components/Campaign/Icons/Email.png";

export const PLATFORMS = {
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  LINKEDIN: "linkedin",
  GMAIL: "gmail",
} as const;

export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS];

export const CAMPAIGN_STATUS = {
  LIVE: "Live",
  DRAFT: "Draft",
  SCHEDULE: "Schedule",
  SCHEDULED: "Scheduled",
  PAUSED: "Paused",
  STOPPED: "Stopped",
  COMPLETED: "Completed",
  FAILED: "Failed",
} as const;

export type CampaignStatus =
  (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const STATUS_MAP: Record<string, CampaignStatus> = {
  live: CAMPAIGN_STATUS.LIVE,
  draft: CAMPAIGN_STATUS.DRAFT,
  schedule: CAMPAIGN_STATUS.SCHEDULE,
  scheduled: CAMPAIGN_STATUS.SCHEDULED,
  paused: CAMPAIGN_STATUS.PAUSED,
  stopped: CAMPAIGN_STATUS.STOPPED,
  completed: CAMPAIGN_STATUS.COMPLETED,
  failed: CAMPAIGN_STATUS.FAILED,
};

export const STATUS_TO_API: Record<CampaignStatus, string> = {
  [CAMPAIGN_STATUS.LIVE]: "live",
  [CAMPAIGN_STATUS.DRAFT]: "draft",
  [CAMPAIGN_STATUS.SCHEDULE]: "schedule",
  [CAMPAIGN_STATUS.SCHEDULED]: "scheduled",
  [CAMPAIGN_STATUS.PAUSED]: "paused",
  [CAMPAIGN_STATUS.STOPPED]: "stopped",
  [CAMPAIGN_STATUS.COMPLETED]: "completed",
  [CAMPAIGN_STATUS.FAILED]: "failed",
};
export const CAMPAIGN_TYPE = {
  SOCIAL: "social",
  EMAIL: "email",
} as const;

export type CampaignType = (typeof CAMPAIGN_TYPE)[keyof typeof CAMPAIGN_TYPE];

export const CAMPAIGN_TABS = {
  ALL: "all",
  SOCIAL: "social",
  EMAIL: "email",
} as const;

export type Tab = (typeof CAMPAIGN_TABS)[keyof typeof CAMPAIGN_TABS];

export const CAMPAIGN_MODE = {
  ORGANIC: 1,
  PAID: 2,
  EMAIL: 3,
} as const;

export type CampaignMode = (typeof CAMPAIGN_MODE)[keyof typeof CAMPAIGN_MODE];

export const platformIcons: Record<Platform, string> = {
  facebook: facebookIcon,
  instagram: instagramIcon,
  linkedin: linkedinIcon,
  gmail: emailIcon,
};

export const CAMPAIGN_OBJECTIVES = {
  awareness: "Brand Awareness",
  leads: "Lead Generation",
} as const;

export type CampaignObjective =
  (typeof CAMPAIGN_OBJECTIVES)[keyof typeof CAMPAIGN_OBJECTIVES];

export const CAMPAIGN_AUDIENCE = {
  all: "All Subscribers",
  active: "Active Users",
} as const;

export type CampaignAudience =
  (typeof CAMPAIGN_AUDIENCE)[keyof typeof CAMPAIGN_AUDIENCE];

export const SENDER_EMAIL = "noreply@clinic.com" as const;