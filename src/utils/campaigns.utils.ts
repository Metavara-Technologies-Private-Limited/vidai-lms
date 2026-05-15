import dayjs from "dayjs";
import { CAMPAIGN_STATUS } from "../constants/campaigns.constants";
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
  const now = dayjs();

  const start = c.selected_start
    ? dayjs(c.selected_start.replace("Z", ""))
    : null;

  const end = c.end ? dayjs(c.end.replace("Z", "")) : null;

  // Terminal states remain untouched
  if (
    c.status === CAMPAIGN_STATUS.FAILED ||
    c.status === CAMPAIGN_STATUS.COMPLETED
  ) {
    return c.status;
  }

  // STOPPED from DB
  if (c.status === CAMPAIGN_STATUS.STOPPED) {
    if (end && now.isAfter(end)) {
      return CAMPAIGN_STATUS.STOPPED;
    }

    return CAMPAIGN_STATUS.PAUSED;
  }

  // SCHEDULED lifecycle
  if (c.status === CAMPAIGN_STATUS.SCHEDULED) {
    if (!start) {
      return CAMPAIGN_STATUS.SCHEDULED;
    }

    if (now.isBefore(start)) {
      return CAMPAIGN_STATUS.SCHEDULED;
    }

    if (end && now.isAfter(end)) {
      return CAMPAIGN_STATUS.COMPLETED;
    }

    return CAMPAIGN_STATUS.LIVE;
  }

  return c.status;
};