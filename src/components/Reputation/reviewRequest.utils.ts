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

export const initialReviewRequestFormData: ReviewRequestFormData = {
  request_name: "",
  description: "",
  collect_on: "google",
  mode: "email",
  subject: "",
  message: "",
  schedule_date: "04/02/2026",
  schedule_time: "12:30 PM",
  is_scheduled: "yes",
  status: "draft",
};

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
