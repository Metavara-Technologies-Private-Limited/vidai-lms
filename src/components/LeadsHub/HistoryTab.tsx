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
} from "@mui/material";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SendIcon from "@mui/icons-material/Send";
import EventNoteIcon from "@mui/icons-material/EventNote";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import AddIcon from "@mui/icons-material/Add";

import { TimelineItem, ChatBubble } from "./LeadDetailSubComponents";
import { getCallStatusColor, getSMSStatusColor, formatDateTime } from "./LeadDetailHelpers";
import { CallButton } from "./LeadsMenuDialogs";
import type { LeadRecord, TwilioCall, TwilioSMS, HistoryView } from "./LeadDetailTypes";

interface HistoryTabProps {
  lead: LeadRecord;
  historyView: HistoryView;
  setHistoryView: (view: HistoryView) => void;
  onComposeEmail: () => void;
  leadName: string;
  leadInitials: string;
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
  selectedTemplate: { subject: string; content: string } | null;
  relatedEmails: Array<{
    id: string | number;
    to: string;
    subject: string;
    message: string;
    created_at: string;
    lead_id?: string | number;
  }>;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  lead,
  historyView,
  setHistoryView,
  onComposeEmail,
  leadName,
  leadInitials,
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
  selectedTemplate,
  relatedEmails,
}) => {
  return (
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
                  <CallButton lead={lead} />
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

        {/* ── EMAIL VIEW ── */}
        {historyView === "email" && (
          <>
            <Box p={2} borderBottom="1px solid #E2E8F0">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmailOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700}>Email History</Typography>
                </Stack>

                {/* ✅ CHANGED: "New Mail" button instead of bare icon */}
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
                    "&:hover": {
                      bgcolor: "#DBEAFE",
                      borderColor: "#93C5FD",
                    },
                  }}
                >
                  New Mail
                </Button>
              </Stack>
            </Box>

            <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
              <Stack spacing={3}>

                {/* Default lead email card */}
                <Card sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 40, height: 40, bgcolor: "#EEF2FF", color: "#6366F1" }}>
                        {leadInitials}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{leadName}</Typography>
                        <Typography variant="caption" color="text.secondary">{leadEmail}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString("en-US", {
                              weekday: "short", month: "short", day: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "Today"}
                      </Typography>
                      <IconButton size="small">
                        <ShortcutIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.primary" mb={1}>Hello,</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    I came across Crysta IVF while searching online and would like to know more about fertility check-up consultations.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Could you please let me know the consultation process and available appointment slots this week?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Looking forward to your response.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Regards,</Typography>
                  <Typography variant="body2" color="text.secondary">{leadName}</Typography>
                  <Typography variant="body2" color="text.secondary">{leadPhone}</Typography>
                </Card>

                {/* Selected template card */}
                {selectedTemplate && (
                  <Card sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <Stack direction="row" justifyContent="space-between" mb={2}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 40, height: 40, bgcolor: "#FEF2F2", color: "#EF4444" }}>CC</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>Crysta Clinic</Typography>
                          <Typography variant="caption" color="text.secondary">team@crystaivf.com</Typography>
                        </Box>
                      </Stack>
                    </Stack>
                    <Typography variant="body2" fontWeight={700} mb={1}>{selectedTemplate.subject}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                      {selectedTemplate.content}
                    </Typography>
                  </Card>
                )}

                {/* Related emails */}
                {relatedEmails.map((mail) => (
                  <Card key={mail.id} sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <Stack direction="row" justifyContent="space-between" mb={2}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 40, height: 40, bgcolor: "#FEF2F2", color: "#EF4444" }}>CC</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{mail.to}</Typography>
                          <Typography variant="caption" color="text.secondary">team@crystaivf.com</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(mail.created_at).toLocaleString()}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={700} mb={1}>{mail.subject}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                      {mail.message}
                    </Typography>
                  </Card>
                ))}

              </Stack>
            </Box>
          </>
        )}

      </Card>
    </Stack>
  );
};

export default HistoryTab;