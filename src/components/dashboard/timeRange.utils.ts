import type { TimeRange } from "./TimeRangeSelector";

export interface TimeRangeBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export interface TimeRangeBounds {
  start: Date;
  end: Date;
}

const MONTH_SHORT_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LONG_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const addHours = (date: Date, hours: number): Date => {
  const nextDate = new Date(date);
  nextDate.setHours(nextDate.getHours() + hours);
  return nextDate;
};

export const getChartRangeBounds = (
  range: Exclude<TimeRange, "all">,
  now: Date = new Date(),
): TimeRangeBounds => {
  switch (range) {
    case "today": {
      return { start: startOfDay(now), end: endOfDay(now) };
    }
    case "week": {
      const weekStart = startOfDay(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { start: weekStart, end: endOfDay(addDays(weekStart, 6)) };
    }
    case "month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: monthStart, end: monthEnd };
    }
    case "year": {
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    }
  }
};

export const getTimeRangeBounds = (range: TimeRange, now: Date = new Date()): TimeRangeBounds => {
  if (range === "all") {
    return {
      start: new Date(2020, 0, 1),
      end: new Date(2030, 11, 31, 23, 59, 59, 999),
    };
  }

  return getChartRangeBounds(range, now);
};

export const getTimeRangeBuckets = (range: TimeRange, now: Date = new Date()): TimeRangeBucket[] => {
  if (range === "all") {
    return Array.from({ length: 11 }, (_, index) => {
      const year = 2020 + index;
      return {
        key: `${year}`,
        label: `${year}`,
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31, 23, 59, 59, 999),
      };
    });
  }

  if (range === "today") {
    const dayStart = startOfDay(now);

    return Array.from({ length: 12 }, (_, index) => {
      const bucketStart = addHours(dayStart, index * 2);
      const bucketEnd = new Date(addHours(bucketStart, 2).getTime() - 1);
      const label = bucketStart.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });

      return {
        key: `${bucketStart.getHours()}`,
        label,
        start: bucketStart,
        end: bucketEnd,
      };
    });
  }

  if (range === "week") {
    const { start } = getChartRangeBounds(range, now);

    return Array.from({ length: 7 }, (_, index) => {
      const bucketStart = addDays(start, index);
      return {
        key: `${bucketStart.getFullYear()}-${bucketStart.getMonth()}-${bucketStart.getDate()}`,
        label: WEEKDAY_LONG_NAMES[bucketStart.getDay()],
        start: bucketStart,
        end: endOfDay(bucketStart),
      };
    });
  }

  if (range === "month") {
    const { start, end } = getChartRangeBounds(range, now);
    const daysInMonth = end.getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const bucketStart = addDays(start, index);
      return {
        key: `${bucketStart.getFullYear()}-${bucketStart.getMonth()}-${bucketStart.getDate()}`,
        label: `${MONTH_SHORT_NAMES[bucketStart.getMonth()]}-${bucketStart.getDate()}`,
        start: bucketStart,
        end: endOfDay(bucketStart),
      };
    });
  }

  return MONTH_SHORT_NAMES.map((month, index) => ({
    key: `${now.getFullYear()}-${index}`,
    label: month,
    start: new Date(now.getFullYear(), index, 1),
    end: new Date(now.getFullYear(), index + 1, 0, 23, 59, 59, 999),
  }));
};

export const findBucketIndex = (date: Date, buckets: TimeRangeBucket[]): number =>
  buckets.findIndex((bucket) => date >= bucket.start && date <= bucket.end);

export const isDateWithinBounds = (date: Date, bounds: TimeRangeBounds): boolean =>
  date >= bounds.start && date <= bounds.end;

export const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getRangeStartDate = (range: TimeRange): Date | null => {
  const now = new Date();

  switch (range) {
    case "today": {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    case "week": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - start.getDay());
      return start;
    }
    case "month": {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case "year": {
      return new Date(now.getFullYear(), 0, 1);
    }
    case "all":
    default:
      return null;
  }
};

export const isWithinTimeRange = (dateInput: string | Date | undefined, range: TimeRange): boolean => {
  if (!dateInput) {
    return false;
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return isDateWithinBounds(date, getTimeRangeBounds(range));
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
