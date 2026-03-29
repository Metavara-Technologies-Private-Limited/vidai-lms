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
  Tooltip,
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
import type { Lead } from "../../services/leads.api";
import { api } from "../../services/leads.api";
import { formatLeadId } from "./LeadDetailHelpers";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ActivityType = "call" | "sms" | "email" | "appointment";

interface BaseActivity {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO string used for sorting
  leadId?: string;
  leadName?: string;
  assigneeName?: string;
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
  leadStatus?: string;
}

type Activity = CallActivity | SmsActivity | EmailActivity | AppointmentActivity;

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ROWS_PER_PAGE = 10;

const TYPE_CONFIG: Record<
  ActivityType,
  { label: string; bg: string; color: string; border: string; Icon: React.ElementType }
> = {
  call: {
    label: "Call",
    bg: "#EEF4FF",
    color: "#2F6FFF",
    border: "#4C8DFF",
    Icon: PhoneIcon,
  },
  sms: {
    label: "SMS",
    bg: "#FFF6E5",
    color: "#FF9F0A",
    border: "#FFB020",
    Icon: SmsIcon,
  },
  email: {
    label: "Email",
    bg: "#F3F3FF",
    color: "#6C6CFF",
    border: "#7C7CFF",
    Icon: EmailIcon,
  },
  appointment: {
    label: "Appointment",
    bg: "#EAFBF1",
    color: "#16A34A",
    border: "#22C55E",
    Icon: CalendarMonthIcon,
  },
};

const EMAIL_STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  SENT:      { bg: "#EAFBF1", color: "#16A34A", border: "#22C55E" },
  FAILED:    { bg: "#FDECEC", color: "#E5484D", border: "#FF5A5F" },
  SCHEDULED: { bg: "#EEF4FF", color: "#2F6FFF", border: "#4C8DFF" },
  DRAFT:     { bg: "#F3F3FF", color: "#6C6CFF", border: "#7C7CFF" },
  CANCELLED: { bg: "#F5F5F5", color: "#6B7280", border: "#9CA3AF" },
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
    return `${days}d ago`;
  } catch {
    return "-";
  }
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

// ─────────────────────────────────────────────
// Row detail renderers
// ─────────────────────────────────────────────
const renderDetail = (activity: Activity) => {
  switch (activity.type) {
    case "call":
      return (
        <Stack>
          <Typography fontWeight={500} fontSize={13}>
            {activity.direction === "inbound" ? "Incoming" : "Outgoing"} call
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activity.fromNumber} → {activity.toNumber}
          </Typography>
        </Stack>
      );
    case "sms":
      return (
        <Stack>
          <Typography
            fontWeight={500}
            fontSize={13}
            sx={{
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {activity.body}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activity.direction === "inbound" ? "Received" : "Sent"} ·{" "}
            {activity.fromNumber}
          </Typography>
        </Stack>
      );
    case "email":
      return (
        <Stack>
          <Typography
            fontWeight={500}
            fontSize={13}
            sx={{
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {activity.subject}
          </Typography>
          {activity.senderEmail && (
            <Typography variant="caption" color="text.secondary">
              From: {activity.senderEmail}
            </Typography>
          )}
        </Stack>
      );
    case "appointment":
      return (
        <Stack>
          <Typography fontWeight={500} fontSize={13}>
            {formatDate(activity.appointmentDate)}
          </Typography>
          {activity.slot && (
            <Typography variant="caption" color="text.secondary">
              Slot: {activity.slot}
            </Typography>
          )}
        </Stack>
      );
  }
};

const renderStatus = (activity: Activity) => {
  switch (activity.type) {
    case "call": {
      const s = activity.status ?? "unknown";
      const isCompleted = ["completed", "answered"].includes(s.toLowerCase());
      return (
        <Chip
          label={s}
          size="small"
          sx={{
            bgcolor: isCompleted ? "#EAFBF1" : "#FDECEC",
            color: isCompleted ? "#16A34A" : "#E5484D",
            border: `1px solid ${isCompleted ? "#22C55E" : "#FF5A5F"}`,
            height: 22,
            fontSize: 11,
            textTransform: "capitalize",
          }}
        />
      );
    }
    case "sms": {
      const s = activity.status ?? "sent";
      const style =
        s.toLowerCase() === "delivered"
          ? { bg: "#EAFBF1", color: "#16A34A", border: "#22C55E" }
          : s.toLowerCase() === "failed"
          ? { bg: "#FDECEC", color: "#E5484D", border: "#FF5A5F" }
          : { bg: "#EEF4FF", color: "#2F6FFF", border: "#4C8DFF" };
      return (
        <Chip
          label={s}
          size="small"
          sx={{
            bgcolor: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`,
            height: 22,
            fontSize: 11,
            textTransform: "capitalize",
          }}
        />
      );
    }
    case "email": {
      const s = (activity.emailStatus ?? "DRAFT").toUpperCase();
      const style = EMAIL_STATUS_COLORS[s] ?? EMAIL_STATUS_COLORS["DRAFT"];
      return (
        <Chip
          label={s}
          size="small"
          sx={{
            bgcolor: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`,
            height: 22,
            fontSize: 11,
          }}
        />
      );
    }
    case "appointment":
      return (
        <Chip
          label="Booked"
          size="small"
          sx={{
            bgcolor: "#EAFBF1",
            color: "#16A34A",
            border: "1px solid #22C55E",
            height: 22,
            fontSize: 11,
          }}
        />
      );
  }
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const Activity = () => {
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState<ActivityType | "all">("all");
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const allLeads = useSelector(selectLeads);

  // Build a lookup: leadUuid → { leadName, assigneeName }
  const leadLookup = React.useMemo(() => {
    const map: Record<string, { leadName: string; assigneeName: string }> = {};
    allLeads.forEach((lead: Lead) => {
      map[lead.id] = {
        leadName: lead.full_name,
        assigneeName: lead.assigned_to_name ?? "Unassigned",
      };
    });
    return map;
  }, [allLeads]);

  React.useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const [callsRes, smsRes, emailRes] = await Promise.allSettled([
          api.get("/twilio/calls/"),
          api.get("/twilio/sms/"),
          api.get("/lead-mail/"),
        ]);

        const merged: Activity[] = [];

        // ── Calls ───────────────────────────────
        if (callsRes.status === "fulfilled") {
          const calls: Array<{
            id: number;
            lead_uuid?: string;
            sid: string;
            from_number: string;
            to_number: string;
            status?: string;
            direction?: string;
            created_at: string;
          }> = callsRes.value.data ?? [];

          calls.forEach((c) => {
            const info = c.lead_uuid ? leadLookup[c.lead_uuid] : undefined;
            merged.push({
              id: `call-${c.id}`,
              type: "call",
              timestamp: c.created_at,
              leadId: c.lead_uuid,
              leadName: info?.leadName,
              assigneeName: info?.assigneeName,
              fromNumber: c.from_number,
              toNumber: c.to_number,
              status: c.status,
              direction: c.direction,
            } as CallActivity);
          });
        }

        // ── SMS ─────────────────────────────────
        if (smsRes.status === "fulfilled") {
          const messages: Array<{
            id: number;
            lead_uuid?: string;
            from_number: string;
            to_number: string;
            body: string;
            status?: string;
            direction: "inbound" | "outbound";
            created_at: string;
          }> = smsRes.value.data ?? [];

          messages.forEach((m) => {
            const info = m.lead_uuid ? leadLookup[m.lead_uuid] : undefined;
            merged.push({
              id: `sms-${m.id}`,
              type: "sms",
              timestamp: m.created_at,
              leadId: m.lead_uuid,
              leadName: info?.leadName,
              assigneeName: info?.assigneeName,
              body: m.body,
              fromNumber: m.from_number,
              toNumber: m.to_number,
              status: m.status,
              direction: m.direction,
            } as SmsActivity);
          });
        }

        // ── Emails ──────────────────────────────
        if (emailRes.status === "fulfilled") {
          const emails: Array<{
            id: number;
            lead_uuid?: string;
            subject: string;
            sender_email?: string;
            status: string;
            sent_at?: string;
            created_at: string;
          }> = emailRes.value.data ?? [];

          emails.forEach((e) => {
            const info = e.lead_uuid ? leadLookup[e.lead_uuid] : undefined;
            merged.push({
              id: `email-${e.id}`,
              type: "email",
              timestamp: e.sent_at ?? e.created_at,
              leadId: e.lead_uuid,
              leadName: info?.leadName,
              assigneeName: info?.assigneeName,
              subject: e.subject,
              emailStatus: e.status,
              senderEmail: e.sender_email,
              sentAt: e.sent_at,
            } as EmailActivity);
          });
        }

        // ── Appointments (from Redux store) ─────
        allLeads.forEach((lead: Lead) => {
          if (lead.book_appointment && lead.appointment_date) {
            merged.push({
              id: `appt-${lead.id}`,
              type: "appointment",
              timestamp: lead.modified_at ?? lead.created_at,
              leadId: lead.id,
              leadName: lead.full_name,
              assigneeName: lead.assigned_to_name ?? "Unassigned",
              appointmentDate: lead.appointment_date,
              slot: lead.slot,
              leadStatus: lead.lead_status,
            } as AppointmentActivity);
          }
        });

        // Sort newest first
        merged.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setActivities(merged);
      } catch (err) {
        console.error("Activity fetch error:", err);
        setError("Failed to load activity data.");
      } finally {
        setLoading(false);
      }
    };

    fetch();
    // Refresh every 60 s
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadLookup]);

  // Reset page when filter or activities change
  React.useEffect(() => {
    setPage(1);
  }, [filter, activities.length]);

  const filtered = React.useMemo(
    () => (filter === "all" ? activities : activities.filter((a) => a.type === filter)),
    [activities, filter]
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));
  const visibleRows = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const start = total === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(page * ROWS_PER_PAGE, total);

  // Activity type counts for filter buttons
  const counts = React.useMemo(() => {
    const c = { call: 0, sms: 0, email: 0, appointment: 0 };
    activities.forEach((a) => c[a.type]++);
    return c;
  }, [activities]);

  return (
    <Card sx={{ p: 2, borderRadius: "16px", overflow: "visible" }}>
      {/* ─── Filter bar ─── */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Filter:
        </Typography>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => { if (v !== null) setFilter(v); }}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              border: "1px solid #E5E7EB",
              borderRadius: "8px !important",
              px: 1.5,
              py: 0.5,
              fontSize: 12,
              fontWeight: 500,
              textTransform: "none",
              gap: 0.5,
              mx: 0.25,
              "&.Mui-selected": {
                bgcolor: "#111",
                color: "#FFF",
                borderColor: "#111",
                "&:hover": { bgcolor: "#333" },
              },
            },
          }}
        >
          <ToggleButton value="all">
            <AllInclusiveIcon sx={{ fontSize: 14 }} />
            All&nbsp;
            <Box component="span" sx={{ opacity: 0.6, fontSize: 11 }}>
              ({activities.length})
            </Box>
          </ToggleButton>
          {(["call", "sms", "email", "appointment"] as ActivityType[]).map((t) => {
            const cfg = TYPE_CONFIG[t];
            return (
              <ToggleButton key={t} value={t}>
                <cfg.Icon sx={{ fontSize: 14 }} />
                {cfg.label}&nbsp;
                <Box component="span" sx={{ opacity: 0.6, fontSize: 11 }}>
                  ({counts[t]})
                </Box>
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>

        {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Stack>

      {error && (
        <Typography variant="caption" color="error" sx={{ mb: 1, display: "block" }}>
          {error}
        </Typography>
      )}

      {/* ─── Table ─── */}
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Lead</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Detail</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No activities found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((activity) => {
                const cfg = TYPE_CONFIG[activity.type];
                return (
                  <TableRow key={activity.id} hover>
                    {/* Type badge */}
                    <TableCell>
                      <Chip
                        icon={<cfg.Icon style={{ fontSize: 12, color: cfg.color }} />}
                        label={cfg.label}
                        size="small"
                        sx={{
                          bgcolor: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          height: 24,
                          fontSize: 11,
                          fontWeight: 600,
                          "& .MuiChip-icon": { ml: 0.5 },
                        }}
                      />
                    </TableCell>

                    {/* Lead */}
                    <TableCell>
                      {activity.leadName ? (
                        <Stack>
                          <Typography fontWeight={600} fontSize={13}>
                            {activity.leadName}
                          </Typography>
                          {activity.leadId && (
                            <Typography variant="caption" color="text.secondary">
                              {formatLeadId(activity.leadId)}
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography fontSize={13} color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Assignee */}
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                          {(activity.assigneeName ?? "?").charAt(0)}
                        </Avatar>
                        <Typography fontSize={13}>
                          {activity.assigneeName ?? "—"}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Detail */}
                    <TableCell>{renderDetail(activity)}</TableCell>

                    {/* Status */}
                    <TableCell>{renderStatus(activity)}</TableCell>

                    {/* Time */}
                    <TableCell>
                      <Tooltip title={formatDateTime(activity.timestamp)} arrow>
                        <Stack>
                          <Typography fontWeight={500} fontSize={13}>
                            {relativeTime(activity.timestamp)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(activity.timestamp)}
                          </Typography>
                        </Stack>
                      </Tooltip>
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
        sx={{ mt: 2 }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {start} to {end} of {total} entries
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeftIcon />
          </IconButton>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            // Windowed pagination for large page counts
            let p: number;
            if (totalPages <= 7) {
              p = i + 1;
            } else if (page <= 4) {
              p = i + 1;
            } else if (page >= totalPages - 3) {
              p = totalPages - 6 + i;
            } else {
              p = page - 3 + i;
            }
            return (
              <Box
                key={p}
                onClick={() => setPage(p)}
                sx={{
                  px: 1.2,
                  py: 0.4,
                  borderRadius: "6px",
                  cursor: "pointer",
                  bgcolor: page === p ? "#111" : "transparent",
                  color: page === p ? "#FFF" : "#6B7280",
                  fontSize: "13px",
                  userSelect: "none",
                  minWidth: 28,
                  textAlign: "center",
                  "&:hover": { bgcolor: page === p ? "#333" : "#F3F4F6" },
                }}
              >
                {p}
              </Box>
            );
          })}

          <IconButton
            size="small"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};

export default Activity;