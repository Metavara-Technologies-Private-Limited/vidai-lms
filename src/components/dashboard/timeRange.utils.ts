import type { TimeRange } from "./TimeRangeSelector";

export const getRangeStartDate = (range: TimeRange): Date | null => {
  const now = new Date();

  switch (range) {
    case "today": {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    case "week": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - 6);
      return start;
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - 29);
      return start;
    }
    case "year": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - 364);
      return start;
    }
    case "all":
    default:
      return null;
  }
};

export const isWithinTimeRange = (dateInput: string | Date | undefined, range: TimeRange): boolean => {
  if (!dateInput) {
    return range === "all";
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const rangeStart = getRangeStartDate(range);
  if (!rangeStart) {
    return true;
  }

  return date >= rangeStart;
};

export const getRangeMultiplier = (range: TimeRange): number => {
  switch (range) {
    case "today":
      return 0.12;
    case "week":
      return 0.28;
    case "month":
      return 0.55;
    case "year":
      return 1;
    case "all":
    default:
      return 1;
  }
};

export const scaleValueByRange = (value: number, range: TimeRange): number => {
  const scaled = value * getRangeMultiplier(range);
  return Number(scaled.toFixed(1));
};
