// ====================== Shared Types ======================

export interface NoteData {
  id: string;
  uuid?: string;
  title: string;
  content: string;
  time: string;
}

export interface RawNote {
  id: string;
  title?: string;
  note?: string;
  created_at?: string;
  is_deleted?: boolean;
}

export interface TwilioCall {
  id: number;
  lead_uuid: string;
  sid: string;
  from_number: string;
  to_number: string;
  status?: string;
  created_at: string;
}

export interface TwilioSMS {
  id: number;
  lead_uuid: string;
  sid: string;
  from_number: string;
  to_number: string;
  body: string;
  status?: string;
  direction: "inbound" | "outbound";
  created_at: string;
}

export type DocumentEntry =
  | string
  | { url?: string; name?: string; file?: string; [key: string]: unknown };

export interface LeadRecord {
  id: string;
  full_name?: string;
  name?: string;
  assigned_to_name?: string;
  assigned?: string;
  status?: string;
  lead_status?: string;
  quality?: string;
  score?: number | string;
  source?: string;
  sub_source?: string;
  campaign_name?: string;
  campaign_duration?: string;
  phone?: string;
  contact_number?: string;
  contact_no?: string;
  email?: string;
  location?: string;
  gender?: string;
  age?: number | string;
  marital_status?: string;
  address?: string;
  language_preference?: string;
  created_at?: string;
  initials?: string;
  department?: string;
  department_name?: string;
  department_id?: number;
  clinic_id?: number;
  personnel?: string;
  appointment_date?: string;
  slot?: string;
  appointment_slot?: string;
  remark?: string;
  appointment_remark?: string;
  treatment_interest?: string;
  partner_name?: string;
  partner_full_name?: string;
  partner_age?: number | string;
  partner_gender?: string;
  next_action_type?: string;
  next_action_status?: string;
  next_action_description?: string;
  task?: string;
  taskStatus?: string;
  is_active?: boolean;
  book_appointment?: boolean;
  partner_inquiry?: boolean;
  phone_number?: string;
  documents?: DocumentEntry[];
}

export interface CallMessageProps {
  speaker: string;
  time: string;
  text: string;
}

export interface TimelineItemProps {
  icon?: React.ReactNode;
  title: string;
  time: string;
  isAvatar?: boolean;
  avatarInitial?: string;
  isLast?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}

export interface ChatBubbleProps {
  side: "left" | "right";
  text: string;
  time: string;
}

export interface InfoProps {
  label: string;
  value: string;
  isAvatar?: boolean;
}

export interface DocumentRowProps {
  name: string;
  size?: string;
  url?: string;
  sx?: object;
}

export type HistoryView = "chatbot" | "call" | "sms" | "email" | "appointment";