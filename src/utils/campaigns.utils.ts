import dayjs from "dayjs";

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