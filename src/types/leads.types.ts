export type Status =
  | "New"
  | "Appointment"
  | "Follow-Ups"
  | "Converted"
  | "Lost"
  | "Cycle Conversion";

export type Quality = "Hot" | "Warm" | "Cold";

export type Lead = {
  initials: string;
  name: string;
  id: string;
  date: string;
  time: string;
  location: string;
  source: string;
  status: Status;
  quality: Quality;
  score: string;
  assigned: string;
  task: string;
};
