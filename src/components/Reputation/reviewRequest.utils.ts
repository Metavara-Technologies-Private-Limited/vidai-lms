import dayjs from "dayjs";

export type ReviewRequestFormData = {
  request_name: string;
  description: string;
  collect_on: "google" | "form" | "both";
  mode: "email" | "sms" | "whatsapp";
  subject: string;
  message: string;
  schedule_date: string;
  schedule_time: string;
  is_scheduled: "yes" | "no";
  status: "draft" | "sent" | "scheduled";
};

const getDefaultScheduledAt = () =>
  dayjs().add(2, "hour").second(0).millisecond(0);

export const formatDisplayDate = (value: dayjs.Dayjs) =>
  value.format("DD/MM/YYYY");

export const formatDisplayTime = (value: dayjs.Dayjs) =>
  value.format("hh:mm A");

export const createInitialReviewRequestFormData = (): ReviewRequestFormData => {
  const defaultScheduledAt = getDefaultScheduledAt();

  return {
    request_name: "",
    description: "",
    collect_on: "google",
    mode: "email",
    subject: "",
    message: "",
    schedule_date: formatDisplayDate(defaultScheduledAt),
    schedule_time: formatDisplayTime(defaultScheduledAt),
    is_scheduled: "yes",
    status: "draft",
  };
};

export const initialReviewRequestFormData =
  createInitialReviewRequestFormData();

const requestNamePattern = /^[A-Za-z][A-Za-z0-9 ]*$/;
const requestNameTypingPattern = /^[A-Za-z0-9 ]*$/;

export const isFieldFilled = (value: string) => value.trim().length > 0;

export const isRequestNameValid = (name: string) =>
  requestNamePattern.test(name.trim());

export const sanitizeRequestNameInput = (value: string): string | null => {
  if (value === "") {
    return "";
  }

  if (!requestNameTypingPattern.test(value)) {
    return null;
  }

  if (!/^[A-Za-z]/.test(value)) {
    return null;
  }

  return value;
};

export const parseDisplayDate = (date: string) => {
  const trimmed = date.trim();
  if (!trimmed) {
    return null;
  }

  const [dd, mm, yyyy] = trimmed.split("/");
  if (!dd || !mm || !yyyy) {
    return null;
  }

  const parsed = dayjs(`${yyyy}-${mm}-${dd}`);
  return parsed.isValid() ? parsed.startOf("day") : null;
};

export const parseDisplayTime = (time: string) => {
  const trimmed = time.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) {
    return null;
  }

  const [, hoursText, minutesText, meridiemText] = match;
  let hours = Number(hoursText);
  const minutes = Number(minutesText);
  const meridiem = meridiemText.toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
    return null;
  }

  if (hours < 1 || hours > 12) {
    return null;
  }

  if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
};

export const getScheduledDateTime = (date: string, time: string) => {
  const parsedDate = parseDisplayDate(date);
  const parsedTime = parseDisplayTime(time);

  if (!parsedDate || !parsedTime) {
    return null;
  }

  return parsedDate
    .hour(parsedTime.hours)
    .minute(parsedTime.minutes)
    .second(0)
    .millisecond(0);
};

export const formatDate = (date: string) => {
  const [dd, mm, yyyy] = date.split("/");
  return `${yyyy}-${mm}-${dd}`;
};

export const formatTime = (time: string) => {
  const [timePart, modifier] = time.split(" ");
  const [hourPart, minutePart] = timePart.split(":");

  let hours = hourPart;

  if (modifier === "PM" && hours !== "12") {
    hours = String(Number(hours) + 12);
  }

  if (modifier === "AM" && hours === "12") {
    hours = "00";
  }

  return `${hours.padStart(2, "0")}:${minutePart}:00`;
};
