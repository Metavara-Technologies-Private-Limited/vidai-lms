import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  Chip,
  Divider,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SendIcon from "@mui/icons-material/Send";
import EventNoteIcon from "@mui/icons-material/EventNote";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhoneIcon from "@mui/icons-material/Phone";

import { TimelineItem, ChatBubble } from "./LeadDetailSubComponents";
import { getCallStatusColor, getSMSStatusColor, formatDateTime } from "./LeadDetailHelpers";
import type { LeadRecord, TwilioCall, TwilioSMS, HistoryView } from "./LeadDetailTypes";
import { LeadEmailAPI, TwilioAPI } from "../../services/leads.api";
import type { LeadMailListItem } from "../../services/leads.api";
import CallDialog from "./CallDialog";

interface HistoryTabProps {
  lead: LeadRecord;
  historyView: HistoryView;
  setHistoryView: (view: HistoryView) => void;
  onComposeEmail: () => void;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  leadAssigned: string;
  leadCreatedAt: string;
  appointmentDate: string;
  appointmentSlot: string;
  appointmentDepartment: string;
  appointmentPersonnel: string;
  appointmentRemark: string;
  treatmentInterest: string[];
  hasAppointment: boolean;
  callHistory: TwilioCall[];
  callHistoryLoading: boolean;
  callHistoryError: string | null;
  onRefreshCallHistory: () => void;
  smsHistory: TwilioSMS[];
  smsHistoryLoading: boolean;
  smsHistoryError: string | null;
  onRefreshSmsHistory: () => void;
}

// ── Email status chip colors ──
const getEmailStatusSx = (status: string) => {
  const s = (status || "").toUpperCase();
  if (s === "SENT")
    return { bgcolor: "#ECFDF5", color: "#10B981", fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" as const };
  if (s === "DRAFT")
    return { bgcolor: "#F1F5F9", color: "#64748B", fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" as const };
  if (s === "FAILED")
    return { bgcolor: "#FEF2F2", color: "#EF4444", fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" as const };
  if (s === "SCHEDULED")
    return { bgcolor: "#EFF6FF", color: "#3B82F6", fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" as const };
  if (s === "CANCELLED")
    return { bgcolor: "#FFF7ED", color: "#F59E0B", fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" as const };
  return { bgcolor: "#F1F5F9", color: "#64748B", fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" as const };
};

// ── Phone normalizer (same as LeadsTable) ──
const normalizePhone = (phone: string | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return `+${cleaned}`;
};

interface ApiErrorShape {
  response?: { data?: { detail?: string; message?: string } };
  message?: string;
}
const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  return (
    e?.response?.data?.detail ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

const HistoryTab: React.FC<HistoryTabProps> = ({
  lead,
  historyView,
  setHistoryView,
  onComposeEmail,
  leadName,
  leadPhone,
  leadEmail,
  leadAssigned,
  leadCreatedAt,
  appointmentDate,
  appointmentSlot,
  appointmentDepartment,
  appointmentPersonnel,
  appointmentRemark,
  treatmentInterest,
  hasAppointment,
  callHistory,
  callHistoryLoading,
  callHistoryError,
  onRefreshCallHistory,
  smsHistory,
  smsHistoryLoading,
  smsHistoryError,
  onRefreshSmsHistory,
}) => {

  // ── Call state (mirrors LeadsTable) ──
  const [callDialogOpen, setCallDialogOpen] = React.useState(false);
  const [callSnackbar, setCallSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const handleCallOpen = async () => {
    const phone = normalizePhone(lead?.contact_no || leadPhone);
    if (!phone) {
      setCallSnackbar({ open: true, message: "No contact number for this lead." });
      return;
    }
    if (!lead?.id) {
      setCallSnackbar({ open: true, message: "Lead ID is missing. Cannot initiate call." });
      return;
    }
    setCallDialogOpen(true);
    try {
      await TwilioAPI.makeCall({ lead_uuid: lead.id, to: phone });
    } catch (err: unknown) {
      setCallDialogOpen(false);
      setCallSnackbar({ open: true, message: extractErrorMessage(err, "Failed to initiate call.") });
    }
  };

  // ── Email history state (fetched from GET /lead-mail/?lead_uuid=) ──
  const [emailHistory, setEmailHistory] = React.useState<LeadMailListItem[]>([]);
  const [emailLoading, setEmailLoading] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const fetchEmailHistory = React.useCallback(async () => {
    if (!lead?.id) return;
    setEmailLoading(true);
    setEmailError(null);
    try {
      const data = await LeadEmailAPI.listByLead(lead.id);
      setEmailHistory(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setEmailError(
        e?.response?.data?.detail || e?.message || "Failed to load email history."
      );
    } finally {
      setEmailLoading(false);
    }
  }, [lead?.id]);

  // Fetch when switching to email view
  React.useEffect(() => {
    if (historyView === "email") {
      fetchEmailHistory();
    }
  }, [historyView, fetchEmailHistory]);

  return (
    <>
      <Stack direction="row" spacing={3}>

        {/* ── LEFT: Activity Timeline ── */}
        <Card sx={{ flex: 1, p: 3, borderRadius: "16px" }}>
          <Typography variant="subtitle1" fontWeight={700} mb={3}>
            Activity Timeline
          </Typography>
          <Stack spacing={0}>
            {hasAppointment && (
              <TimelineItem
                icon={<EventNoteIcon sx={{ fontSize: 16, color: "#10B981" }} />}
                title={`Appointment Booked — ${appointmentDate} at ${appointmentSlot}`}
                time={leadCreatedAt}
                onClick={() => setHistoryView("appointment")}
                isClickable
              />
            )}
            <TimelineItem
              icon={<SmsOutlinedIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />}
              title={`SMS History (${smsHistory.length} messages)`}
              time={smsHistory.length > 0 ? formatDateTime(smsHistory[0].created_at) : leadCreatedAt}
              onClick={() => setHistoryView("sms")}
              isClickable
            />
            <TimelineItem
              icon={<CallOutlinedIcon sx={{ fontSize: 16, color: "#10B981" }} />}
              title={`Call History (${callHistory.length} calls)`}
              time={callHistory.length > 0 ? formatDateTime(callHistory[0].created_at) : leadCreatedAt}
              onClick={() => setHistoryView("call")}
              isClickable
            />
            <TimelineItem
              icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: "#F59E0B" }} />}
              title="Patient shared contact number and email"
              time={leadCreatedAt}
              onClick={() => setHistoryView("email")}
              isClickable
            />
            <TimelineItem
              icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: "#3B82F6" }} />}
              title="Sent a Welcome Email"
              time={leadCreatedAt}
              onClick={() => setHistoryView("email")}
              isClickable
            />
            <TimelineItem
              isAvatar
              avatarInitial={leadAssigned.charAt(0)}
              title={`Assigned to ${leadAssigned}`}
              time={leadCreatedAt}
            />
            <TimelineItem
              icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />}
              title="Lead arrived from Website Chatbot"
              time={leadCreatedAt}
              onClick={() => setHistoryView("chatbot")}
              isClickable
              isLast
            />
          </Stack>
        </Card>

        {/* ── RIGHT: Detail Panel ── */}
        <Card
          sx={{
            flex: 2,
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            maxHeight: "600px",
          }}
        >

          {/* ── APPOINTMENT VIEW ── */}
          {historyView === "appointment" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EventNoteIcon sx={{ color: "#10B981", fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700}>Appointment Details</Typography>
                </Stack>
              </Box>
              <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                {hasAppointment ? (
                  <Card sx={{ p: 3, borderRadius: "14px", border: "1px solid #D1FAE5", bgcolor: "#FFFFFF" }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                      <Box sx={{ p: 1, bgcolor: "#ECFDF5", borderRadius: "8px" }}>
                        <EventNoteIcon sx={{ color: "#10B981", fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={700} fontSize="15px">Appointment Booked</Typography>
                        <Chip label="Confirmed" size="small"
                          sx={{ bgcolor: "#ECFDF5", color: "#10B981", fontWeight: 600, fontSize: "11px", height: 20, mt: 0.5 }}
                        />
                      </Box>
                    </Stack>
                    <Divider sx={{ mb: 2.5 }} />
                    <Stack spacing={2.5}>
                      <Stack direction="row" spacing={4}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}
                            sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                            DATE
                          </Typography>
                          <Typography fontWeight={700} fontSize="14px" mt={0.3}>{appointmentDate}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}
                            sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                            TIME SLOT
                          </Typography>
                          <Typography fontWeight={700} fontSize="14px" mt={0.3}>{appointmentSlot}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={4}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}
                            sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                            DEPARTMENT
                          </Typography>
                          <Typography fontWeight={600} fontSize="14px" mt={0.3}>{appointmentDepartment}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}
                            sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                            ASSIGNED TO
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" mt={0.3}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: "11px", bgcolor: "#EEF2FF", color: "#6366F1" }}>
                              {appointmentPersonnel.charAt(0)}
                            </Avatar>
                            <Typography fontWeight={600} fontSize="14px">{appointmentPersonnel}</Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      {appointmentRemark && appointmentRemark !== "N/A" && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}
                            sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                            REMARK
                          </Typography>
                          <Box sx={{ mt: 0.5, p: 1.5, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                            <Typography fontSize="13px" color="text.primary">{appointmentRemark}</Typography>
                          </Box>
                        </Box>
                      )}
                      {treatmentInterest.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}
                            sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                            TREATMENT INTEREST
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
                            {treatmentInterest.map((t, i) => (
                              <Chip key={i} label={t} size="small"
                                sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 500, mb: 0.5 }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Card>
                ) : (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <EventNoteIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Appointment Booked</Typography>
                    <Typography variant="caption" color="text.secondary">
                      This lead has no appointment scheduled yet.
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}

          {/* ── SMS VIEW ── */}
          {historyView === "sms" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SmsOutlinedIcon sx={{ color: "#8B5CF6", fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>SMS History</Typography>
                    <Chip label={`${smsHistory.length} messages`} size="small"
                      sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 600, fontSize: "11px", height: 20 }}
                    />
                  </Stack>
                  <IconButton size="small" onClick={onRefreshSmsHistory}
                    sx={{ bgcolor: "#F8FAFC", "&:hover": { bgcolor: "#E2E8F0" } }}>
                    <Typography fontSize="11px" px={1}>Refresh</Typography>
                  </IconButton>
                </Stack>
              </Box>
              <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                {smsHistoryLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" color="text.secondary">Loading SMS history...</Typography>
                    </Stack>
                  </Box>
                ) : smsHistoryError ? (
                  <Alert severity="error" sx={{ borderRadius: "10px" }}>{smsHistoryError}</Alert>
                ) : smsHistory.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <SmsOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No SMS Sent Yet</Typography>
                    <Typography variant="caption" color="text.secondary">
                      SMS messages sent to this lead will appear here.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {smsHistory.map((sms) => {
                      const statusStyle = getSMSStatusColor(sms.status);
                      return (
                        <Card key={sms.id} sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ p: 0.8, bgcolor: "#F5F3FF", borderRadius: "8px" }}>
                                <SmsOutlinedIcon sx={{ color: "#8B5CF6", fontSize: 16 }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}
                                  sx={{ textTransform: "uppercase", fontSize: "0.6rem" }}>
                                  {sms.direction === "outbound" ? "Sent To" : "Received From"}
                                </Typography>
                                <Typography fontWeight={600} fontSize="13px">{sms.to_number}</Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip label={sms.status || "sent"} size="small"
                                sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" }}
                              />
                              <Typography variant="caption" color="text.secondary" fontSize="11px">
                                {formatDateTime(sms.created_at)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                            <Typography fontSize="13px" color="text.primary" sx={{ lineHeight: 1.6 }}>{sms.body}</Typography>
                          </Box>
                          <Stack direction="row" justifyContent="space-between" mt={1}>
                            <Typography variant="caption" color="text.secondary">From: {sms.from_number}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "10px" }}>
                              SID: {sms.sid.slice(0, 20)}...
                            </Typography>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {/* ── CALL VIEW ── */}
          {historyView === "call" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CallOutlinedIcon sx={{ color: "#10B981", fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Call History</Typography>
                    <Chip label={`${callHistory.length} calls`} size="small"
                      sx={{ bgcolor: "#F0FDF4", color: "#10B981", fontWeight: 600, fontSize: "11px", height: 20 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={onRefreshCallHistory}
                      sx={{ bgcolor: "#F8FAFC", "&:hover": { bgcolor: "#E2E8F0" } }}>
                      <Typography fontSize="11px" px={1}>Refresh</Typography>
                    </IconButton>
                    {/* Working Call Button — same logic as LeadsTable */}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PhoneIcon sx={{ fontSize: 15 }} />}
                      onClick={handleCallOpen}
                      sx={{
                        textTransform: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "8px",
                        borderColor: "#BBF7D0",
                        color: "#10B981",
                        bgcolor: "#F0FDF4",
                        px: 1.5,
                        py: 0.5,
                        "&:hover": { bgcolor: "#DCFCE7", borderColor: "#86EFAC" },
                      }}
                    >
                      Call
                    </Button>
                  </Stack>
                </Stack>
              </Box>
              <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                {callHistoryLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" color="text.secondary">Loading call history...</Typography>
                    </Stack>
                  </Box>
                ) : callHistoryError ? (
                  <Alert severity="error" sx={{ borderRadius: "10px" }}>{callHistoryError}</Alert>
                ) : callHistory.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <CallOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Calls Made Yet</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Calls made to this lead will appear here.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {callHistory.map((call) => {
                      const statusStyle = getCallStatusColor(call.status);
                      return (
                        <Card key={call.id} sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ p: 1, bgcolor: "#F0FDF4", borderRadius: "8px" }}>
                                <CallOutlinedIcon sx={{ color: "#10B981", fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography fontWeight={700} fontSize="13px">Outbound Call</Typography>
                                <Typography variant="caption" color="text.secondary">To: {call.to_number}</Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip label={call.status || "initiated"} size="small"
                                sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" }}
                              />
                              <Typography variant="caption" color="text.secondary" fontSize="11px">
                                {formatDateTime(call.created_at)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Divider sx={{ my: 1.5 }} />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">From: {call.from_number}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "10px" }}>
                              SID: {call.sid.slice(0, 20)}...
                            </Typography>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {/* ── CHATBOT VIEW ── */}
          {historyView === "chatbot" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Typography variant="subtitle1" fontWeight={700}>Chatbot</Typography>
              </Box>
              <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                <Stack spacing={3}>
                  <Typography variant="caption" align="center" color="text.secondary" display="block">
                    {lead.created_at
                      ? new Date(lead.created_at)
                          .toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" })
                          .toUpperCase()
                      : "TODAY"}
                  </Typography>
                  <ChatBubble side="left" text="Hello! How can I help you today?" time="9:41 AM" />
                  <ChatBubble side="right" text="I'm looking for a general health check-up" time="9:42 AM" />
                  <ChatBubble side="left" text="Great! I can help you schedule that." time="9:43 AM" />
                  <ChatBubble side="right" text="Sometime this week, preferably in the morning" time="9:44 AM" />
                  <ChatBubble side="right" text={`My name is ${leadName}, and my number is ${leadPhone}`} time="9:46 AM" />
                </Stack>
              </Box>
              <Box p={2} borderTop="1px solid #E2E8F0">
                <TextField
                  fullWidth placeholder="Type your message..." size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton color="primary">
                          <SendIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </>
          )}

          {/* ── EMAIL VIEW — fetched from GET /lead-mail/?lead_uuid= ── */}
          {historyView === "email" && (
            <>
              {/* Header */}
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Email History</Typography>
                    {!emailLoading && (
                      <Chip
                        label={`${emailHistory.length} email${emailHistory.length !== 1 ? "s" : ""}`}
                        size="small"
                        sx={{ bgcolor: "#EFF6FF", color: "#3B82F6", fontWeight: 600, fontSize: "11px", height: 20 }}
                      />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {/* Refresh button */}
                    <IconButton
                      size="small"
                      onClick={fetchEmailHistory}
                      disabled={emailLoading}
                      sx={{ bgcolor: "#F8FAFC", "&:hover": { bgcolor: "#E2E8F0" }, width: 30, height: 30 }}
                    >
                      {emailLoading
                        ? <CircularProgress size={14} />
                        : <RefreshIcon sx={{ fontSize: 16, color: "#64748B" }} />
                      }
                    </IconButton>
                    {/* New Mail button */}
                    <Button
                      onClick={onComposeEmail}
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                      sx={{
                        textTransform: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "8px",
                        borderColor: "#BFDBFE",
                        color: "#3B82F6",
                        bgcolor: "#EFF6FF",
                        px: 1.5,
                        py: 0.5,
                        "&:hover": { bgcolor: "#DBEAFE", borderColor: "#93C5FD" },
                      }}
                    >
                      New Mail
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              {/* Body */}
              <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>

                {/* Loading */}
                {emailLoading && (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" color="text.secondary">Loading email history...</Typography>
                    </Stack>
                  </Box>
                )}

                {/* Error */}
                {!emailLoading && emailError && (
                  <Alert
                    severity="error"
                    sx={{ borderRadius: "10px", mb: 2 }}
                    action={
                      <Button size="small" onClick={fetchEmailHistory} sx={{ textTransform: "none" }}>
                        Retry
                      </Button>
                    }
                  >
                    {emailError}
                  </Alert>
                )}

                {/* Empty state */}
                {!emailLoading && !emailError && emailHistory.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Emails Sent Yet</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Emails sent to this lead will appear here.
                    </Typography>
                    <Button
                      onClick={onComposeEmail}
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                      sx={{
                        mt: 2,
                        textTransform: "none",
                        fontSize: "13px",
                        fontWeight: 600,
                        borderRadius: "8px",
                        borderColor: "#BFDBFE",
                        color: "#3B82F6",
                        bgcolor: "#EFF6FF",
                        "&:hover": { bgcolor: "#DBEAFE", borderColor: "#93C5FD" },
                      }}
                    >
                      Send First Email
                    </Button>
                  </Box>
                )}

                {/* Email list from API */}
                {!emailLoading && !emailError && emailHistory.length > 0 && (
                  <Stack spacing={2}>
                    {emailHistory.map((mail) => (
                      <Card key={mail.id} sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                        {/* Card header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 40, height: 40, bgcolor: "#FEF2F2", color: "#EF4444" }}>CC</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>Crysta Clinic</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {mail.sender_email || "team@crystaivf.com"}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip
                              label={mail.status}
                              size="small"
                              sx={getEmailStatusSx(mail.status)}
                            />
                            <Typography variant="caption" color="text.secondary" fontSize="11px">
                              {mail.created_at
                                ? new Date(mail.created_at).toLocaleDateString("en-US", {
                                    weekday: "short", month: "short", day: "2-digit",
                                    hour: "2-digit", minute: "2-digit",
                                  })
                                : ""}
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* To field */}
                        <Stack direction="row" spacing={1} mb={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary" fontWeight={600}
                            sx={{ textTransform: "uppercase", fontSize: "0.6rem", minWidth: 24 }}>
                            To:
                          </Typography>
                          <Typography variant="caption" color="#374151" fontWeight={500}>
                            {leadName}{leadEmail && leadEmail !== "N/A" ? ` <${leadEmail}>` : ""}
                          </Typography>
                        </Stack>

                        {/* Subject */}
                        <Typography variant="body2" fontWeight={700} color="#1E293B" mb={1}>
                          {mail.subject}
                        </Typography>

                        {/* Divider */}
                        <Divider sx={{ mb: 1.5 }} />

                        {/* Body */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ whiteSpace: "pre-line", lineHeight: 1.75, fontSize: "13px" }}
                        >
                          {mail.email_body}
                        </Typography>

                        {/* Sent time footer */}
                        {mail.sent_at && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
                            <Typography variant="caption" color="text.secondary" fontSize="11px">
                              ✅ Sent at{" "}
                              {new Date(mail.sent_at).toLocaleString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </Typography>
                          </Box>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}

              </Box>
            </>
          )}

        </Card>
      </Stack>

      {/* ── Call Dialog (same as LeadsTable) ── */}
      <CallDialog
        open={callDialogOpen}
        name={leadName || "Unknown"}
        onClose={() => setCallDialogOpen(false)}
      />

      {/* ── Call Error Snackbar ── */}
      <Snackbar
        open={callSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))} severity="error" sx={{ borderRadius: "10px" }}>
          {callSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default HistoryTab;