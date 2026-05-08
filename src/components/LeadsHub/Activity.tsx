import * as React from "react";
import {
  Box,
  Card,
  Chip,
  Stack,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PhoneIcon from "@mui/icons-material/Phone";
import SmsIcon from "@mui/icons-material/Sms";
import EmailIcon from "@mui/icons-material/Email";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import { useSelector } from "react-redux";
import { selectLeads } from "../../store/leadSlice";
import { selectUser } from "../../store/authSlice";
import { selectClinic } from "../../store/clinicSlice";
import type { Lead } from "../../services/leads.api";
import { api, LeadAPI } from "../../services/leads.api";
import { formatLeadId } from "./LeadDetailHelpers";
import { resolveUserRole } from "../../utils/roleAccess";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ActivityType = "call" | "sms" | "email" | "appointment";

interface BaseActivity {
  id: string;
  type: ActivityType;
  timestamp: string;
  leadId?: string;
  actorUserId?: number | null;
  actorEmail?: string;
  actorName?: string;
  leadName?: string;
  assigneeId?: number;
  assigneeName?: string;
  assigneeAvatar?: string;
  leadStatus?: string;
}

interface CallActivity extends BaseActivity {
  type: "call";
  fromNumber: string;
  toNumber: string;
  status?: string;
  direction?: string;
}

interface SmsActivity extends BaseActivity {
  type: "sms";
  body: string;
  fromNumber: string;
  toNumber: string;
  status?: string;
  direction?: "inbound" | "outbound";
}

interface EmailActivity extends BaseActivity {
  type: "email";
  subject: string;
  emailStatus: string;
  senderEmail?: string;
  sentAt?: string;
}

interface AppointmentActivity extends BaseActivity {
  type: "appointment";
  appointmentDate: string;
  slot?: string;
}

type Activity = CallActivity | SmsActivity | EmailActivity | AppointmentActivity;

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ROWS_PER_PAGE = 10;

const TYPE_CONFIG: Record<ActivityType, { label: string; bg: string; color: string; border: string; Icon: React.ElementType }> = {
  call:        { label: "Call",        bg: "#EEF4FF", color: "#2F6FFF", border: "#4C8DFF", Icon: PhoneIcon },
  sms:         { label: "SMS",         bg: "#FFF6E5", color: "#FF9F0A", border: "#FFB020", Icon: SmsIcon },
  email:       { label: "Email",       bg: "#F3F3FF", color: "#6C6CFF", border: "#7C7CFF", Icon: EmailIcon },
  appointment: { label: "Appointment", bg: "#EAFBF1", color: "#16A34A", border: "#22C55E", Icon: CalendarMonthIcon },
};

const LEAD_STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  new:              { bg: "#E0E7FF", color: "#4338CA", border: "#A5B4FC" },
  appointment:      { bg: "#DBEAFE", color: "#1E40AF", border: "#93C5FD" },
  "follow-ups":     { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  converted:        { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7" },
  lost:             { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  "cycle conversion": { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7" },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const relativeTime = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  } catch {
    return "-";
  }
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const getLastActivity = (activity: Activity): string => {
  switch (activity.type) {
    case "call":
      return `Call — ${activity.direction === "inbound" ? "Incoming" : "Connected"}`;
    case "sms":
      return `SMS — ${activity.direction === "inbound" ? "Received" : "Sent"}`;
    case "email":
      return `Email — ${activity.emailStatus === "SENT" ? "Sent" : activity.emailStatus}`;
    case "appointment":
      return "Appointment — Booked";
  }
};

const getNextAction = (activity: Activity): string => {
  switch (activity.type) {
    case "call":        return "Send Message";
    case "sms":         return "Call Patient";
    case "email":       return "Send Message";
    case "appointment": return "Book Appointment";
  }
};

const getNextActionDesc = (activity: Activity): string => {
  switch (activity.type) {
    case "call":        return "Send appointment confirmation message via...";
    case "sms":         return "Call patient to confirm preferred consultation t...";
    case "email":       return "Send appointment confirmation message via...";
    case "appointment": return "Book initial IVF consultation with available do...";
  }
};

const initials = (name?: string): string => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
};

const avatarColor = (name?: string): string => {
  const colors = ["#4F46E5", "#0891B2", "#16A34A", "#EA580C", "#9333EA", "#DB2777"];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
};

const normalizePhone = (value?: string | null): string =>
  (value ?? "").replace(/\D/g, "");

const normalizeLeadKey = (value: unknown): string => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  const compact = raw.replace(/^#/, "").replace(/^ln-/, "");
  const digits = compact.replace(/\D/g, "");
  if (digits) return digits;
  return compact;
};

const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveActorUserId = (record: Record<string, unknown>): number | null => {
  const candidates = [
    record.user_id,
    record.created_by_id,
    record.created_by,
    record.employee_id,
    record.owner_id,
    record.assigned_to_id,
    record.assignee_id,
  ];
  for (const candidate of candidates) {
    const id = asNumberOrNull(candidate);
    if (id != null) return id;
  }
  return null;
};

const normalizeIdentity = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase();

const resolveActorFromIdentity = (
  record: Record<string, unknown>,
  currentUserId: number | null,
  currentUserEmail: string,
  currentUserName: string,
): number | null => {
  if (currentUserId == null) return null;

  const emailCandidates = [
    record.user_email,
    record.created_by_email,
    record.sender_email,
    record.employee_email,
    record.owner_email,
  ];
  if (
    currentUserEmail &&
    emailCandidates.some((value) => normalizeIdentity(value) === currentUserEmail)
  ) {
    return currentUserId;
  }

  const nameCandidates = [
    record.user_name,
    record.created_by_name,
    record.employee_name,
    record.owner_name,
  ];
  if (
    currentUserName &&
    nameCandidates.some((value) => normalizeIdentity(value) === currentUserName)
  ) {
    return currentUserId;
  }

  return null;
};

const resolveIdCandidates = (source: Record<string, unknown> | null): number[] => {
  if (!source) return [];

  const nested =
    source.user && typeof source.user === "object"
      ? (source.user as Record<string, unknown>)
      : null;

  const candidates = [
    source.id,
    source.user_id,
    source.employee_id,
    source.profile_id,
    source.owner_id,
    nested?.id,
    nested?.user_id,
    nested?.employee_id,
    nested?.profile_id,
  ];

  const uniq = new Set<number>();
  for (const value of candidates) {
    const parsed = asNumberOrNull(value);
    if (parsed != null) uniq.add(parsed);
  }

  return Array.from(uniq);
};

const firstNonEmptyString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return undefined;
};

const extractList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const asRecord = payload as Record<string, unknown>;
  const alternateKeys = ["items", "rows", "calls", "messages", "sms", "emails", "mail"];
  for (const key of alternateKeys) {
    const value = asRecord[key];
    if (Array.isArray(value)) return value as T[];
  }

  const directResults = asRecord.results;
  if (Array.isArray(directResults)) return directResults as T[];

  const nestedData = asRecord.data;
  if (Array.isArray(nestedData)) return nestedData as T[];
  if (nestedData && typeof nestedData === "object") {
    const nestedResults = (nestedData as Record<string, unknown>).results;
    if (Array.isArray(nestedResults)) return nestedResults as T[];
  }

  return [];
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const Activity = () => {
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState<ActivityType | "all">("all");
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const cachedLeads = useSelector(selectLeads);
  const user = useSelector(selectUser);
  const selectedClinic = useSelector(selectClinic);

  const currentUserId = React.useMemo(() => {
    return asNumberOrNull(user?.id ?? user?.user_id);
  }, [user?.id, user?.user_id]);

  const currentUserIdCandidates = React.useMemo(() => {
    return resolveIdCandidates((user as unknown as Record<string, unknown>) ?? null);
  }, [user]);

  const currentUserEmail = React.useMemo(
    () => String(user?.email ?? "").trim().toLowerCase(),
    [user?.email],
  );

  const currentUserName = React.useMemo(() => {
    const first = String(user?.first_name ?? "").trim();
    const last = String(user?.last_name ?? "").trim();
    const full = `${first} ${last}`.trim().toLowerCase();
    if (full) return full;
    return String(user?.username ?? "").trim().toLowerCase();
  }, [user?.first_name, user?.last_name, user?.username]);

  const clinicId = React.useMemo(() => {
    const selectedClinicId = asNumberOrNull(selectedClinic?.id);
    if (selectedClinicId != null) return selectedClinicId;

    const storedClinicId = asNumberOrNull(localStorage.getItem("clinic_id"));
    if (storedClinicId != null) return storedClinicId;

    return asNumberOrNull(user?.clinics?.[0]?.clinic_id);
  }, [selectedClinic?.id, user?.clinics]);

  const userForRole = React.useMemo<Record<string, unknown> | null>(
    () => (user ? ({ ...user } as Record<string, unknown>) : null),
    [user],
  );

  const isSuperAdmin = React.useMemo(
    () => resolveUserRole(userForRole) === "super_admin",
    [userForRole],
  );

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [callsRes, smsRes, emailRes, leadsRes] = await Promise.allSettled([
          clinicId != null
            ? api.get("/twilio/calls/", { params: { clinic_id: clinicId } })
            : api.get("/twilio/calls/"),
          clinicId != null
            ? api.get("/twilio/sms/", { params: { clinic_id: clinicId } })
            : api.get("/twilio/sms/"),
          clinicId != null
            ? api.get("/lead-mail/", { params: { clinic_id: clinicId } })
            : api.get("/lead-mail/"),
          clinicId != null ? LeadAPI.list(clinicId) : Promise.resolve([]),
        ]);

        const apiLeads: Lead[] =
          leadsRes.status === "fulfilled" ? extractList<Lead>(leadsRes.value) : [];
        const freshLeads: Lead[] =
          apiLeads.length > 0
            ? apiLeads
            : (Array.isArray(cachedLeads) ? (cachedLeads as Lead[]) : []);

        type LeadInfo = { leadName: string; assigneeId: number | null; assigneeName: string; leadStatus: string };
        const leadLookup: Record<string, LeadInfo> = {};
        const leadLookupByPhone: Record<string, LeadInfo> = {};
        const leadLookupByEmail: Record<string, LeadInfo> = {};
        const visibleLeadKeys = new Set<string>();

        freshLeads.forEach((lead: Lead) => {
          const info: LeadInfo = {
            leadName: lead.full_name,
            assigneeId: asNumberOrNull(lead.assigned_to_id),
            assigneeName: lead.assigned_to_name ?? "Unassigned",
            leadStatus: lead.lead_status ?? "new",
          };
          const rawLeadId = String(lead.id ?? "").trim();
          const normalizedLeadId = normalizeLeadKey(rawLeadId);
          if (rawLeadId) {
            leadLookup[rawLeadId.toLowerCase()] = info;
            leadLookup[rawLeadId.replace(/^#/, "").toLowerCase()] = info;
            visibleLeadKeys.add(rawLeadId.toLowerCase());
            visibleLeadKeys.add(rawLeadId.replace(/^#/, "").toLowerCase());
          }
          if (normalizedLeadId) {
            leadLookup[normalizedLeadId] = info;
            leadLookup[`ln-${normalizedLeadId}`] = info;
            leadLookup[`#ln-${normalizedLeadId}`] = info;
            visibleLeadKeys.add(normalizedLeadId);
            visibleLeadKeys.add(`ln-${normalizedLeadId}`);
            visibleLeadKeys.add(`#ln-${normalizedLeadId}`);
          }
          const phone = normalizePhone(lead.contact_no);
          if (phone) leadLookupByPhone[phone] = info;
          const email = String(lead.email ?? "").trim().toLowerCase();
          if (email) leadLookupByEmail[email] = info;
        });

        const merged: Activity[] = [];

        if (callsRes.status === "fulfilled") {
          const calls: Array<{
            id: number; lead_uuid?: string; sid: string;
            from_number: string; to_number: string;
            status?: string; direction?: string; created_at: string;
          }> = extractList(callsRes.value.data);
          calls.forEach((c) => {
            const toPhone = normalizePhone(c.to_number);
            const fromPhone = normalizePhone(c.from_number);
            const callRecord = c as unknown as Record<string, unknown>;
            const leadKeyCandidates = [
              c.lead_uuid,
              callRecord.lead_id,
              callRecord.lead,
              callRecord.lead_number,
            ]
              .map((value) => String(value ?? "").trim())
              .filter(Boolean);
            const info =
              leadKeyCandidates
                .map((key) =>
                  leadLookup[key.toLowerCase()] ??
                  leadLookup[key.replace(/^#/, "").toLowerCase()] ??
                  leadLookup[normalizeLeadKey(key)],
                )
                .find(Boolean) ??
              (toPhone ? leadLookupByPhone[toPhone] : undefined) ??
              (fromPhone ? leadLookupByPhone[fromPhone] : undefined);
            const actorUserId =
              resolveActorUserId(callRecord) ??
              resolveActorFromIdentity(
                callRecord,
                currentUserId,
                currentUserEmail,
                currentUserName,
              );
            merged.push({
              id: `call-${c.id}`, type: "call", timestamp: c.created_at,
              leadId: leadKeyCandidates[0],
              leadName: firstNonEmptyString(info?.leadName, callRecord.lead_name, callRecord.full_name),
              actorUserId,
              actorEmail: firstNonEmptyString(callRecord.user_email, callRecord.created_by_email, callRecord.employee_email, callRecord.owner_email),
              actorName: firstNonEmptyString(callRecord.user_name, callRecord.created_by_name, callRecord.employee_name, callRecord.owner_name),
              assigneeId: info?.assigneeId ?? null,
              assigneeName: firstNonEmptyString(info?.assigneeName, callRecord.assigned_to_name, callRecord.assignee_name, "Unassigned"),
              leadStatus: firstNonEmptyString(info?.leadStatus, callRecord.lead_status),
              fromNumber: c.from_number, toNumber: c.to_number,
              status: c.status, direction: c.direction,
            } as CallActivity);
          });
        }

        if (smsRes.status === "fulfilled") {
          const messages: Array<{
            id: number; lead_uuid?: string; from_number: string;
            to_number: string; body: string; status?: string;
            direction: "inbound" | "outbound"; created_at: string;
          }> = extractList(smsRes.value.data);
          messages.forEach((m) => {
            const toPhone = normalizePhone(m.to_number);
            const fromPhone = normalizePhone(m.from_number);
            const smsRecord = m as unknown as Record<string, unknown>;
            const leadKeyCandidates = [
              m.lead_uuid,
              smsRecord.lead_id,
              smsRecord.lead,
              smsRecord.lead_number,
            ]
              .map((value) => String(value ?? "").trim())
              .filter(Boolean);
            const info =
              leadKeyCandidates
                .map((key) =>
                  leadLookup[key.toLowerCase()] ??
                  leadLookup[key.replace(/^#/, "").toLowerCase()] ??
                  leadLookup[normalizeLeadKey(key)],
                )
                .find(Boolean) ??
              (toPhone ? leadLookupByPhone[toPhone] : undefined) ??
              (fromPhone ? leadLookupByPhone[fromPhone] : undefined);
            const actorUserId =
              resolveActorUserId(smsRecord) ??
              resolveActorFromIdentity(
                smsRecord,
                currentUserId,
                currentUserEmail,
                currentUserName,
              );
            merged.push({
              id: `sms-${m.id}`, type: "sms", timestamp: m.created_at,
              leadId: leadKeyCandidates[0],
              leadName: firstNonEmptyString(info?.leadName, smsRecord.lead_name, smsRecord.full_name),
              actorUserId,
              actorEmail: firstNonEmptyString(smsRecord.user_email, smsRecord.created_by_email, smsRecord.employee_email, smsRecord.owner_email),
              actorName: firstNonEmptyString(smsRecord.user_name, smsRecord.created_by_name, smsRecord.employee_name, smsRecord.owner_name),
              assigneeId: info?.assigneeId ?? null,
              assigneeName: firstNonEmptyString(info?.assigneeName, smsRecord.assigned_to_name, smsRecord.assignee_name, "Unassigned"),
              leadStatus: firstNonEmptyString(info?.leadStatus, smsRecord.lead_status),
              body: m.body, fromNumber: m.from_number, toNumber: m.to_number,
              status: m.status, direction: m.direction,
            } as SmsActivity);
          });
        }

        if (emailRes.status === "fulfilled") {
          const emails: Array<{
            id: number; lead_uuid?: string; subject: string;
            sender_email?: string; receiver_email?: string; to_email?: string;
            status: string; sent_at?: string; created_at: string;
          }> = extractList(emailRes.value.data);
          emails.forEach((e) => {
            const emailRecord = e as unknown as Record<string, unknown>;
            const receiverEmail = String(
              e.receiver_email ?? e.to_email ?? "",
            )
              .trim()
              .toLowerCase();
            const leadKeyCandidates = [
              e.lead_uuid,
              emailRecord.lead_id,
              emailRecord.lead,
              emailRecord.lead_number,
            ]
              .map((value) => String(value ?? "").trim())
              .filter(Boolean);
            const info =
              leadKeyCandidates
                .map((key) =>
                  leadLookup[key.toLowerCase()] ??
                  leadLookup[key.replace(/^#/, "").toLowerCase()] ??
                  leadLookup[normalizeLeadKey(key)],
                )
                .find(Boolean) ??
              (receiverEmail ? leadLookupByEmail[receiverEmail] : undefined);
            const actorFromRecord =
              resolveActorUserId(emailRecord) ??
              resolveActorFromIdentity(
                emailRecord,
                currentUserId,
                currentUserEmail,
                currentUserName,
              );
            const senderEmail = String(e.sender_email ?? "").trim().toLowerCase();
            const actorUserId =
              actorFromRecord ??
              (currentUserEmail && senderEmail && senderEmail === currentUserEmail
                ? currentUserId
                : null);
            merged.push({
              id: `email-${e.id}`, type: "email",
              timestamp: e.sent_at ?? e.created_at,
              leadId: leadKeyCandidates[0],
              leadName: firstNonEmptyString(info?.leadName, emailRecord.lead_name, emailRecord.full_name),
              actorUserId,
              actorEmail: firstNonEmptyString(emailRecord.user_email, emailRecord.created_by_email, emailRecord.sender_email, emailRecord.employee_email, emailRecord.owner_email),
              actorName: firstNonEmptyString(emailRecord.user_name, emailRecord.created_by_name, emailRecord.employee_name, emailRecord.owner_name),
              assigneeId: info?.assigneeId ?? null,
              assigneeName: firstNonEmptyString(info?.assigneeName, emailRecord.assigned_to_name, emailRecord.assignee_name, "Unassigned"),
              leadStatus: firstNonEmptyString(info?.leadStatus, emailRecord.lead_status),
              subject: e.subject, emailStatus: e.status,
              senderEmail: e.sender_email, sentAt: e.sent_at,
            } as EmailActivity);
          });
        }

        freshLeads.forEach((lead: Lead) => {
          if (lead.book_appointment && lead.appointment_date) {
            merged.push({
              id: `appt-${lead.id}`, type: "appointment",
              timestamp: lead.modified_at ?? lead.created_at,
              leadId: String(lead.id), leadName: lead.full_name,
              actorUserId: asNumberOrNull(lead.created_by_id),
              actorName: firstNonEmptyString(lead.created_by_name),
              assigneeId: asNumberOrNull(lead.assigned_to_id),
              assigneeName: lead.assigned_to_name ?? "Unassigned",
              leadStatus: lead.lead_status ?? "appointment",
              appointmentDate: lead.appointment_date, slot: lead.slot,
            } as AppointmentActivity);
          }
        });

        const userScoped =
          isSuperAdmin || currentUserId == null
            ? merged
            : merged.filter((activity) => {
                const idCandidates = new Set<number>(currentUserIdCandidates);
                if (currentUserId != null) idCandidates.add(currentUserId);

                if (activity.actorUserId != null) {
                  return idCandidates.has(activity.actorUserId);
                }

                if (activity.assigneeId != null && idCandidates.has(activity.assigneeId)) {
                  return true;
                }

                const actorEmail = String(activity.actorEmail ?? "").trim().toLowerCase();
                if (currentUserEmail && actorEmail && actorEmail === currentUserEmail) {
                  return true;
                }

                const actorName = String(activity.actorName ?? "").trim().toLowerCase();
                if (currentUserName && actorName && actorName === currentUserName) {
                  return true;
                }

                const assigneeName = String(activity.assigneeName ?? "").trim().toLowerCase();
                if (currentUserName && assigneeName && assigneeName === currentUserName) {
                  return true;
                }

                const rawLeadId = String(activity.leadId ?? "").trim().toLowerCase();
                const normalizedLeadId = normalizeLeadKey(activity.leadId);
                if (
                  (rawLeadId &&
                    (visibleLeadKeys.has(rawLeadId) ||
                      visibleLeadKeys.has(rawLeadId.replace(/^#/, "")))) ||
                  (normalizedLeadId &&
                    (visibleLeadKeys.has(normalizedLeadId) ||
                      visibleLeadKeys.has(`ln-${normalizedLeadId}`) ||
                      visibleLeadKeys.has(`#ln-${normalizedLeadId}`)))
                ) {
                  return true;
                }

                return false;
              });

        userScoped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(userScoped);
      } catch (err) {
        console.error("Activity fetch error:", err);
        setError("Failed to load activity data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cachedLeads,
    clinicId,
    currentUserEmail,
    currentUserId,
    currentUserName,
    isSuperAdmin,
  ]);

  React.useEffect(() => { setPage(1); }, [filter, activities.length]);

  const filtered = React.useMemo(
    () => filter === "all" ? activities : activities.filter((a) => a.type === filter),
    [activities, filter]
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));
  const visibleRows = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const start = total === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(page * ROWS_PER_PAGE, total);

  const counts = React.useMemo(() => {
    const c = { call: 0, sms: 0, email: 0, appointment: 0 };
    activities.forEach((a) => c[a.type]++);
    return c;
  }, [activities]);

  return (
    <Card sx={{ borderRadius: "16px", overflow: "visible", boxShadow: "none", border: "1px solid #E5E7EB" }}>
      {/* ─── Filter bar ─── */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: "1px solid #F3F4F6" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, v) => { if (v !== null) setFilter(v); }}
            size="small"
            sx={{
              gap: 0.5,
              "& .MuiToggleButtonGroup-grouped": {
                border: "1px solid #E5E7EB !important",
                borderRadius: "10px !important",
              },
              "& .MuiToggleButton-root": {
                px: 1.6,
                py: 0.6,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Nunito', sans-serif",
                textTransform: "none",
                gap: 0.5,
                color: "#6B7280",
                bgcolor: "#FFFFFF",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "#F9FAFB",
                  borderColor: "#D1D5DB !important",
                },
                "&.Mui-selected": {
                  bgcolor: "#FFF7ED",
                  color: "#EA580C",
                  borderColor: "#FB923C !important",
                  "&:hover": { bgcolor: "#FFF7ED" },
                },
              },
            }}
          >
            <ToggleButton value="all">
              <AllInclusiveIcon sx={{ fontSize: 14 }} />
              All&nbsp;
              <Box component="span" sx={{ fontSize: 12, opacity: 0.85 }}>({activities.length})</Box>
            </ToggleButton>

            {(["call", "sms", "email", "appointment"] as ActivityType[]).map((t) => {
              const cfg = TYPE_CONFIG[t];
              return (
                <ToggleButton key={t} value={t}>
                  <cfg.Icon sx={{ fontSize: 14 }} />
                  {cfg.label}&nbsp;
                  <Box component="span" sx={{ fontSize: 12, opacity: 0.85 }}>({counts[t]})</Box>
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>

          {loading && <CircularProgress size={16} sx={{ ml: 1, color: "#FB923C" }} />}
        </Stack>
      </Box>

      {error && (
        <Typography variant="caption" color="error" sx={{ px: 2, pt: 1, display: "block" }}>
          {error}
        </Typography>
      )}

      {/* ─── Table ─── */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
              {["Assignees", "Lead Name | No.", "Lead Status", "Last Activity", "Next Action", "Due Date", "Status"].map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6B7280",
                    fontFamily: "'Nunito', sans-serif",
                    borderBottom: "1px solid #E5E7EB",
                    py: 1.5,
                    px: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={24} sx={{ color: "#FB923C" }} />
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No activities found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((activity) => {
                const statusKey = (activity.leadStatus ?? "new").toLowerCase();
                const statusStyle = LEAD_STATUS_STYLES[statusKey] ?? LEAD_STATUS_STYLES["new"];
                const lastActivity = getLastActivity(activity);
                const nextAction = getNextAction(activity);
                const nextActionDesc = getNextActionDesc(activity);

                return (
                  <TableRow
                    key={activity.id}
                    sx={{
                      "&:hover": { bgcolor: "#FAFAFA" },
                      "& td": {
                        borderBottom: "1px solid #F3F4F6",
                        py: 1.5,
                        px: 2,
                        fontFamily: "'Nunito', sans-serif",
                      },
                    }}
                  >
                    {/* Assignees */}
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: 12,
                            fontWeight: 700,
                            bgcolor: avatarColor(activity.assigneeName),
                          }}
                        >
                          {initials(activity.assigneeName)}
                        </Avatar>
                        <Typography fontSize={13} fontWeight={500} color="#374151" noWrap>
                          {activity.assigneeName ?? "—"}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Lead Name | No. */}
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: 12,
                            fontWeight: 700,
                            bgcolor: avatarColor(activity.leadName),
                          }}
                        >
                          {initials(activity.leadName)}
                        </Avatar>
                        <Stack>
                          <Typography fontSize={13} fontWeight={700} color="#0F172A">
                            {activity.leadName ?? "—"}
                          </Typography>
                          {activity.leadId && (
                            <Typography fontSize={12} color="#64748B">
                              {formatLeadId(activity.leadId)}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>

                    {/* Lead Status */}
                    <TableCell>
                      <Chip
                        label={activity.leadStatus ?? "New"}
                        size="small"
                        sx={{
                          bgcolor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          height: 22,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "capitalize",
                          borderRadius: "12px",
                        }}
                      />
                    </TableCell>

                    {/* Last Activity */}
                    <TableCell>
                      <Typography fontSize={13} fontWeight={500} color="#374151">
                        {lastActivity}
                      </Typography>
                      <Typography fontSize={12} color="#6B7280">
                        {relativeTime(activity.timestamp)}
                      </Typography>
                    </TableCell>

                    {/* Next Action */}
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography fontSize={13} fontWeight={600} color="#111827" noWrap>
                        {nextAction}
                      </Typography>
                      <Typography
                        fontSize={12}
                        color="#6B7280"
                        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}
                      >
                        {nextActionDesc}
                      </Typography>
                    </TableCell>

                    {/* Due Date */}
                    <TableCell>
                      <Typography fontSize={13} fontWeight={500} color="#374151">
                        {activity.type === "appointment"
                          ? formatDate((activity as AppointmentActivity).appointmentDate)
                          : formatDate(activity.timestamp)}
                      </Typography>
                    </TableCell>

                    {/* Status (To Do chip) */}
                    <TableCell>
                      <Chip
                        label="To Do"
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#6B7280",
                          borderColor: "#D1D5DB",
                          borderRadius: "12px",
                          bgcolor: "#FFFFFF",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Pagination ─── */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2, py: 1.5, borderTop: "1px solid #F3F4F6" }}
      >
        <Typography variant="caption" color="text.secondary" fontFamily="'Nunito', sans-serif">
          Showing {start} to {end} of {total} entries
        </Typography>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton size="small" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p: number;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
            return (
              <Box
                key={p}
                onClick={() => setPage(p)}
                sx={{
                  px: 1.2, py: 0.4,
                  borderRadius: "6px",
                  cursor: "pointer",
                  bgcolor: page === p ? "#1F2937" : "transparent",
                  color: page === p ? "#FFF" : "#6B7280",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif",
                  userSelect: "none",
                  minWidth: 28,
                  textAlign: "center",
                  "&:hover": { bgcolor: page === p ? "#111827" : "#F3F4F6" },
                }}
              >
                {p}
              </Box>
            );
          })}

          <IconButton size="small" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};

export default Activity;