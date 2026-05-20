import dayjs from "dayjs";
import { CAMPAIGN_STATUS, type CampaignStatus } from "../constants/campaigns.constants";
import type { Campaign } from "../types/campaigns.types";

export const formatScheduleTime = (
  selected_start?: string | null,
  enter_time?: string | null,
): string => {
  if (!selected_start || !enter_time) return "-";
  return (
    dayjs(selected_start).format("DD MMM YYYY") +
    ", " +
    dayjs("2000-01-01T" + enter_time).format("hh:mm A")
  );
};

/**
 * Status rules:
 *
 * STOPPED from DB:
 * - end date passed   -> STOPPED
 * - else              -> PAUSED
 *
 * SCHEDULED from DB:
 * - before start      -> SCHEDULED
 * - between start/end -> LIVE
 * - after end         -> COMPLETED
 */
export const getComputedCampaignStatus = (c: Campaign) => {
  if (c.status === CAMPAIGN_STATUS.DRAFT) {
    return CAMPAIGN_STATUS.DRAFT;
  }
  const now = dayjs();

  const start = c.selected_start
    ? dayjs(c.selected_start.replace("Z", ""))
    : null;

    const end = c.end ? dayjs(c.end) : null;

  // Terminal states
  if (
    c.status === CAMPAIGN_STATUS.FAILED ||
    c.status === CAMPAIGN_STATUS.COMPLETED
  ) {
    return c.status;
  }

  // Scheduled
  if (start && now.isBefore(start)) {
    return CAMPAIGN_STATUS.SCHEDULED;
  }

  // Platform statuses
  const platformStatuses = Object.entries(c.platform_data || {})
    .filter(([, value]) => value && typeof value === "object")
    .map(([, value]) => String(value.status || "").toLowerCase())
    .filter(Boolean);

  const activeCount = platformStatuses.filter((s) => s === "active").length;

  const pausedCount = platformStatuses.filter((s) => s === "paused").length;

  const allPaused =
    platformStatuses.length > 0 && pausedCount === platformStatuses.length;

  const hasEnded = end && now.isAfter(end.endOf("day"));

  if (hasEnded) {
    if (allPaused) {
      return CAMPAIGN_STATUS.STOPPED;
    }

    return CAMPAIGN_STATUS.COMPLETED;
  }

  if (activeCount > 0 && pausedCount > 0) {
    return CAMPAIGN_STATUS.PARTIALLY_ACTIVE;
  }

  if (allPaused) {
    return CAMPAIGN_STATUS.PAUSED;
  }

  return CAMPAIGN_STATUS.LIVE;
};

export const getPersistedCampaignStatus = (campaign: Campaign): CampaignStatus => {
  const computed = getComputedCampaignStatus(campaign);

  if (computed === CAMPAIGN_STATUS.PARTIALLY_ACTIVE) {
    return CAMPAIGN_STATUS.LIVE;
  }

  return computed;
};