import * as React from "react";
import {
  Box, Button, Typography, Stack, Chip, CircularProgress,
  IconButton, Card, Divider, Avatar, Alert, Snackbar, TextField,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import EventNoteIcon from "@mui/icons-material/EventNote";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhoneIcon from "@mui/icons-material/Phone";
import SendIcon from "@mui/icons-material/Send";

import { TimelineItem } from "./LeadDetailSubComponents";
import { getCallStatusColor, getSMSStatusColor, formatDateTime } from "./LeadDetailHelpers";
import type { LeadRecord, TwilioCall, TwilioSMS, HistoryView } from "./LeadDetailTypes";
import type { LeadMailListItem } from "../../services/leads.api";
import { TwilioAPI } from "../../services/leads.api";
import CallDialog from "./CallDialog";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

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
  // ── Email history owned by parent so it survives dialog open/close ──
  emailHistory: LeadMailListItem[];
  emailHistoryLoading: boolean;
  onRefreshEmailHistory: () => void;
}

const decodeEntities = (str: string): string => {
  try {
    const el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  } catch {
    return str.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
              .replace(/&nbsp;/g," ").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  }
};

const stripHtml = (html: string): string => {
  if (!html) return "";
  let text = decodeEntities(html);
  text = decodeEntities(text);
  text = text.replace(/<\/p\s*>/gi,"\n").replace(/<\/div\s*>/gi,"\n")
             .replace(/<\/li\s*>/gi,"\n").replace(/<\/tr\s*>/gi,"\n")
             .replace(/<\/h[1-6]\s*>/gi,"\n").replace(/<br\s*\/?>/gi,"\n");
  text = text.replace(/<[^>]*>/g,"");
  text = text.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
             .replace(/&nbsp;/g," ").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  return text.replace(/\n{3,}/g,"\n\n").replace(/[ \t]+\n/g,"\n").replace(/\n[ \t]+/g,"\n").trim();
};

const getEmailStatusSx = (status: string) => {
  const s = (status || "").toUpperCase();
  if (s === "SENT")      return { bgcolor:"#ECFDF5", color:"#10B981", fontWeight:600, fontSize:"11px", height:20, textTransform:"capitalize" as const };
  if (s === "DRAFT")     return { bgcolor:"#F1F5F9", color:"#64748B", fontWeight:600, fontSize:"11px", height:20, textTransform:"capitalize" as const };
  if (s === "FAILED")    return { bgcolor:"#FEF2F2", color:"#EF4444", fontWeight:600, fontSize:"11px", height:20, textTransform:"capitalize" as const };
  if (s === "SCHEDULED") return { bgcolor:"#EFF6FF", color:"#3B82F6", fontWeight:600, fontSize:"11px", height:20, textTransform:"capitalize" as const };
  if (s === "CANCELLED") return { bgcolor:"#FFF7ED", color:"#F59E0B", fontWeight:600, fontSize:"11px", height:20, textTransform:"capitalize" as const };
  return { bgcolor:"#F1F5F9", color:"#64748B", fontWeight:600, fontSize:"11px", height:20, textTransform:"capitalize" as const };
};

const normalizePhone = (phone: string | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g,"").replace(/-/g,"");
  if (cleaned.startsWith("+")) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return `+${cleaned}`;
};

interface ApiErrorShape { response?: { data?: { detail?: string; message?: string } }; message?: string; }
const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  return e?.response?.data?.detail || e?.response?.data?.message || e?.message || fallback;
};

const getBotReply = (userText: string): string => {
  const lower = userText.toLowerCase();
  if (lower.includes("appointment")) return "I can help you with appointments. Please share your preferred date and time.";
  if (lower.includes("hello") || lower.includes("hi")) return "Hello! How can I assist you today?";
  if (lower.includes("treatment")) return "We offer a wide range of treatments. Could you let us know what you're interested in?";
  if (lower.includes("cost") || lower.includes("price") || lower.includes("fee")) return "Our team will get in touch with you shortly regarding pricing details.";
  if (lower.includes("doctor") || lower.includes("consultant")) return "Our experienced consultants are available Monday–Saturday. Would you like to book a slot?";
  if (lower.includes("contact") || lower.includes("phone") || lower.includes("call")) return "You can reach us at our clinic number. Alternatively, we can arrange a callback for you.";
  return "Thank you for your message! Our team will follow up with you shortly.";
};

const formatChatTime = (date: Date): string =>
  date.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });

const formatDateLabel = (date: Date): string =>
  date.toLocaleDateString("en-IN", { weekday:"short", day:"2-digit", month:"short", year:"numeric" }).toUpperCase();

const HistoryTab: React.FC<HistoryTabProps> = ({
  lead, historyView, setHistoryView, onComposeEmail,
  leadName, leadPhone, leadEmail, leadAssigned, leadCreatedAt,
  appointmentDate, appointmentSlot, appointmentDepartment, appointmentPersonnel,
  appointmentRemark, treatmentInterest, hasAppointment,
  callHistory, callHistoryLoading, callHistoryError, onRefreshCallHistory,
  smsHistory, smsHistoryLoading, smsHistoryError, onRefreshSmsHistory,
  emailHistory, emailHistoryLoading, onRefreshEmailHistory,
}) => {

  const [callDialogOpen, setCallDialogOpen] = React.useState(false);
  const [callSnackbar, setCallSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const handleCallOpen = async () => {
    const phone = normalizePhone(lead?.contact_no || leadPhone);
    if (!phone) { setCallSnackbar({ open: true, message: "No contact number for this lead." }); return; }
    if (!lead?.id) { setCallSnackbar({ open: true, message: "Lead ID is missing. Cannot initiate call." }); return; }
    setCallDialogOpen(true);
    try {
      await TwilioAPI.makeCall({ lead_uuid: lead.id, to: phone });
    } catch (err: unknown) {
      setCallDialogOpen(false);
      setCallSnackbar({ open: true, message: extractErrorMessage(err, "Failed to initiate call.") });
    }
  };

  // ── Chatbot state ──
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    { id: "welcome", role: "bot", text: "Hello! How can I help you today?", timestamp: new Date() },
  ]);
  const [chatInput, setChatInput] = React.useState("");
  const [botTyping, setBotTyping] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, botTyping]);

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { id:`user-${Date.now()}`, role:"user", text, timestamp:new Date() }]);
    setChatInput("");
    setBotTyping(true);
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { id:`bot-${Date.now()}`, role:"bot", text:getBotReply(text), timestamp:new Date() }]);
      setBotTyping(false);
    }, 900 + Math.random() * 600);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
  };

  const groupedMessages = React.useMemo(() => {
    const groups: { dateLabel: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";
    chatMessages.forEach((msg) => {
      const label = formatDateLabel(msg.timestamp);
      if (label !== currentDate) { currentDate = label; groups.push({ dateLabel: label, messages: [msg] }); }
      else groups[groups.length - 1].messages.push(msg);
    });
    return groups;
  }, [chatMessages]);

  return (
    <>
      <Stack direction="row" spacing={3}>

        {/* ── LEFT: Activity Timeline ── */}
        <Card sx={{ flex:1, p:3, borderRadius:"16px" }}>
          <Typography variant="subtitle1" fontWeight={700} mb={3}>Activity Timeline</Typography>
          <Stack spacing={0}>
            {hasAppointment && (
              <TimelineItem icon={<EventNoteIcon sx={{ fontSize:16, color:"#10B981" }} />}
                title={`Appointment Booked — ${appointmentDate} at ${appointmentSlot}`}
                time={leadCreatedAt} onClick={() => setHistoryView("appointment")} isClickable />
            )}
            <TimelineItem icon={<SmsOutlinedIcon sx={{ fontSize:16, color:"#8B5CF6" }} />}
              title={`SMS History (${smsHistory.length} messages)`}
              time={smsHistory.length > 0 ? formatDateTime(smsHistory[0].created_at) : leadCreatedAt}
              onClick={() => setHistoryView("sms")} isClickable />
            <TimelineItem icon={<CallOutlinedIcon sx={{ fontSize:16, color:"#10B981" }} />}
              title={`Call History (${callHistory.length} calls)`}
              time={callHistory.length > 0 ? formatDateTime(callHistory[0].created_at) : leadCreatedAt}
              onClick={() => setHistoryView("call")} isClickable />
            <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize:16, color:"#F59E0B" }} />}
              title="Patient shared contact number and email"
              time={leadCreatedAt} onClick={() => setHistoryView("email")} isClickable />
            <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize:16, color:"#3B82F6" }} />}
              title="Sent a Welcome Email" time={leadCreatedAt} onClick={() => setHistoryView("email")} isClickable />
            <TimelineItem isAvatar avatarInitial={leadAssigned.charAt(0)}
              title={`Assigned to ${leadAssigned}`} time={leadCreatedAt} />
            <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize:16, color:"#8B5CF6" }} />}
              title="Lead arrived from Website Chatbot" time={leadCreatedAt}
              onClick={() => setHistoryView("chatbot")} isClickable isLast />
          </Stack>
        </Card>

        {/* ── RIGHT: Detail Panel ── */}
        <Card sx={{ flex:2, borderRadius:"16px", display:"flex", flexDirection:"column", maxHeight:"600px" }}>

          {/* APPOINTMENT VIEW */}
          {historyView === "appointment" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EventNoteIcon sx={{ color:"#10B981", fontSize:20 }} />
                  <Typography variant="subtitle1" fontWeight={700}>Appointment Details</Typography>
                </Stack>
              </Box>
              <Box sx={{ flexGrow:1, p:3, overflowY:"auto", bgcolor:"#F8FAFC" }}>
                {hasAppointment ? (
                  <Card sx={{ p:3, borderRadius:"14px", border:"1px solid #D1FAE5", bgcolor:"#FFFFFF" }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                      <Box sx={{ p:1, bgcolor:"#ECFDF5", borderRadius:"8px" }}><EventNoteIcon sx={{ color:"#10B981", fontSize:22 }} /></Box>
                      <Box>
                        <Typography fontWeight={700} fontSize="15px">Appointment Booked</Typography>
                        <Chip label="Confirmed" size="small" sx={{ bgcolor:"#ECFDF5", color:"#10B981", fontWeight:600, fontSize:"11px", height:20, mt:0.5 }} />
                      </Box>
                    </Stack>
                    <Divider sx={{ mb:2.5 }} />
                    <Stack spacing={2.5}>
                      <Stack direction="row" spacing={4}>
                        <Box sx={{ flex:1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform:"uppercase", fontSize:"0.65rem", letterSpacing:"0.5px" }}>DATE</Typography>
                          <Typography fontWeight={700} fontSize="14px" mt={0.3}>{appointmentDate}</Typography>
                        </Box>
                        <Box sx={{ flex:1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform:"uppercase", fontSize:"0.65rem", letterSpacing:"0.5px" }}>TIME SLOT</Typography>
                          <Typography fontWeight={700} fontSize="14px" mt={0.3}>{appointmentSlot}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={4}>
                        <Box sx={{ flex:1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform:"uppercase", fontSize:"0.65rem", letterSpacing:"0.5px" }}>DEPARTMENT</Typography>
                          <Typography fontWeight={600} fontSize="14px" mt={0.3}>{appointmentDepartment}</Typography>
                        </Box>
                        <Box sx={{ flex:1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform:"uppercase", fontSize:"0.65rem", letterSpacing:"0.5px" }}>ASSIGNED TO</Typography>
                          <Stack direction="row" spacing={1} alignItems="center" mt={0.3}>
                            <Avatar sx={{ width:22, height:22, fontSize:"11px", bgcolor:"#EEF2FF", color:"#6366F1" }}>{appointmentPersonnel.charAt(0)}</Avatar>
                            <Typography fontWeight={600} fontSize="14px">{appointmentPersonnel}</Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      {appointmentRemark && appointmentRemark !== "N/A" && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform:"uppercase", fontSize:"0.65rem", letterSpacing:"0.5px" }}>REMARK</Typography>
                          <Box sx={{ mt:0.5, p:1.5, bgcolor:"#F8FAFC", borderRadius:"8px", border:"1px solid #E2E8F0" }}>
                            <Typography fontSize="13px" color="text.primary">{appointmentRemark}</Typography>
                          </Box>
                        </Box>
                      )}
                      {treatmentInterest.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform:"uppercase", fontSize:"0.65rem", letterSpacing:"0.5px" }}>TREATMENT INTEREST</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
                            {treatmentInterest.map((t, i) => <Chip key={i} label={t} size="small" sx={{ bgcolor:"#F5F3FF", color:"#7C3AED", fontWeight:500, mb:0.5 }} />)}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Card>
                ) : (
                  <Box sx={{ textAlign:"center", py:6 }}>
                    <EventNoteIcon sx={{ fontSize:48, color:"#CBD5E1", mb:1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Appointment Booked</Typography>
                    <Typography variant="caption" color="text.secondary">This lead has no appointment scheduled yet.</Typography>
                  </Box>
                )}
              </Box>
            </>
          )}

          {/* SMS VIEW */}
          {historyView === "sms" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SmsOutlinedIcon sx={{ color:"#8B5CF6", fontSize:20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>SMS History</Typography>
                    <Chip label={`${smsHistory.length} messages`} size="small" sx={{ bgcolor:"#F5F3FF", color:"#7C3AED", fontWeight:600, fontSize:"11px", height:20 }} />
                  </Stack>
                  <IconButton size="small" onClick={onRefreshSmsHistory} sx={{ bgcolor:"#F8FAFC", "&:hover":{ bgcolor:"#E2E8F0" } }}>
                    <Typography fontSize="11px" px={1}>Refresh</Typography>
                  </IconButton>
                </Stack>
              </Box>
              <Box sx={{ flexGrow:1, p:3, overflowY:"auto", bgcolor:"#F8FAFC" }}>
                {smsHistoryLoading ? (
                  <Box sx={{ display:"flex", justifyContent:"center", py:4 }}><Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading SMS history...</Typography></Stack></Box>
                ) : smsHistoryError ? (
                  <Alert severity="error" sx={{ borderRadius:"10px" }}>{smsHistoryError}</Alert>
                ) : smsHistory.length === 0 ? (
                  <Box sx={{ textAlign:"center", py:6 }}>
                    <SmsOutlinedIcon sx={{ fontSize:48, color:"#CBD5E1", mb:1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No SMS Sent Yet</Typography>
                    <Typography variant="caption" color="text.secondary">SMS messages sent to this lead will appear here.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {smsHistory.map((sms) => {
                      const ss = getSMSStatusColor(sms.status);
                      return (
                        <Card key={sms.id} sx={{ p:2.5, borderRadius:"12px", border:"1px solid #E2E8F0", bgcolor:"#FFFFFF" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ p:0.8, bgcolor:"#F5F3FF", borderRadius:"8px" }}><SmsOutlinedIcon sx={{ color:"#8B5CF6", fontSize:16 }} /></Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform:"uppercase", fontSize:"0.6rem" }}>{sms.direction === "outbound" ? "Sent To" : "Received From"}</Typography>
                                <Typography fontWeight={600} fontSize="13px">{sms.to_number}</Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip label={sms.status || "sent"} size="small" sx={{ bgcolor:ss.bg, color:ss.color, fontWeight:600, fontSize:"11px", height:20, textTransform:"capitalize" }} />
                              <Typography variant="caption" color="text.secondary" fontSize="11px">{formatDateTime(sms.created_at)}</Typography>
                            </Stack>
                          </Stack>
                          <Box sx={{ p:1.5, bgcolor:"#F8FAFC", borderRadius:"8px", border:"1px solid #F1F5F9" }}>
                            <Typography fontSize="13px" color="text.primary" sx={{ lineHeight:1.6 }}>{sms.body}</Typography>
                          </Box>
                          <Stack direction="row" justifyContent="space-between" mt={1}>
                            <Typography variant="caption" color="text.secondary">From: {sms.from_number}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily:"monospace", fontSize:"10px" }}>SID: {sms.sid.slice(0,20)}...</Typography>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {/* CALL VIEW */}
          {historyView === "call" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CallOutlinedIcon sx={{ color:"#10B981", fontSize:20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Call History</Typography>
                    <Chip label={`${callHistory.length} calls`} size="small" sx={{ bgcolor:"#F0FDF4", color:"#10B981", fontWeight:600, fontSize:"11px", height:20 }} />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={onRefreshCallHistory} sx={{ bgcolor:"#F8FAFC", "&:hover":{ bgcolor:"#E2E8F0" } }}>
                      <Typography fontSize="11px" px={1}>Refresh</Typography>
                    </IconButton>
                    <Button size="small" variant="outlined" startIcon={<PhoneIcon sx={{ fontSize:15 }} />} onClick={handleCallOpen}
                      sx={{ textTransform:"none", fontSize:"12px", fontWeight:600, borderRadius:"8px", borderColor:"#BBF7D0", color:"#10B981", bgcolor:"#F0FDF4", px:1.5, py:0.5, "&:hover":{ bgcolor:"#DCFCE7", borderColor:"#86EFAC" } }}>
                      Call
                    </Button>
                  </Stack>
                </Stack>
              </Box>
              <Box sx={{ flexGrow:1, p:3, overflowY:"auto", bgcolor:"#F8FAFC" }}>
                {callHistoryLoading ? (
                  <Box sx={{ display:"flex", justifyContent:"center", py:4 }}><Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading call history...</Typography></Stack></Box>
                ) : callHistoryError ? (
                  <Alert severity="error" sx={{ borderRadius:"10px" }}>{callHistoryError}</Alert>
                ) : callHistory.length === 0 ? (
                  <Box sx={{ textAlign:"center", py:6 }}>
                    <CallOutlinedIcon sx={{ fontSize:48, color:"#CBD5E1", mb:1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Calls Made Yet</Typography>
                    <Typography variant="caption" color="text.secondary">Calls made to this lead will appear here.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {callHistory.map((call) => {
                      const cs = getCallStatusColor(call.status);
                      return (
                        <Card key={call.id} sx={{ p:2.5, borderRadius:"12px", border:"1px solid #E2E8F0", bgcolor:"#FFFFFF" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ p:1, bgcolor:"#F0FDF4", borderRadius:"8px" }}><CallOutlinedIcon sx={{ color:"#10B981", fontSize:20 }} /></Box>
                              <Box>
                                <Typography fontWeight={700} fontSize="13px">Outbound Call</Typography>
                                <Typography variant="caption" color="text.secondary">To: {call.to_number}</Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip label={call.status || "initiated"} size="small" sx={{ bgcolor:cs.bg, color:cs.color, fontWeight:600, fontSize:"11px", height:20, textTransform:"capitalize" }} />
                              <Typography variant="caption" color="text.secondary" fontSize="11px">{formatDateTime(call.created_at)}</Typography>
                            </Stack>
                          </Stack>
                          <Divider sx={{ my:1.5 }} />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">From: {call.from_number}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily:"monospace", fontSize:"10px" }}>SID: {call.sid.slice(0,20)}...</Typography>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {/* CHATBOT VIEW */}
          {historyView === "chatbot" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0" bgcolor="#FFFFFF">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ p:0.8, bgcolor:"#F5F3FF", borderRadius:"8px" }}><ChatBubbleOutlineIcon sx={{ color:"#8B5CF6", fontSize:18 }} /></Box>
                  <Typography variant="subtitle1" fontWeight={700}>Chatbot</Typography>
                </Stack>
              </Box>
              <Box sx={{ flexGrow:1, px:3, py:2, overflowY:"auto", bgcolor:"#FFFFFF", display:"flex", flexDirection:"column" }}>
                {groupedMessages.map((group) => (
                  <Box key={group.dateLabel}>
                    <Box sx={{ display:"flex", justifyContent:"center", my:2 }}>
                      <Typography fontSize="11px" fontWeight={600} color="#94A3B8" sx={{ letterSpacing:"0.05em" }}>{group.dateLabel}</Typography>
                    </Box>
                    <Stack spacing={1.5}>
                      {group.messages.map((msg) => (
                        <Box key={msg.id} sx={{ display:"flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                          <Box sx={{ maxWidth:"70%" }}>
                            <Box sx={{ px:2, py:1.25, borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", bgcolor: msg.role === "user" ? "#EDE9FE" : "#F8FAFC", border:"1px solid", borderColor: msg.role === "user" ? "#DDD6FE" : "#E2E8F0" }}>
                              <Typography fontSize="13.5px" sx={{ color:"#1E293B", lineHeight:1.65 }}>{msg.text}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ display:"block", fontSize:"11px", color:"#94A3B8", mt:0.4, textAlign: msg.role === "user" ? "right" : "left" }}>{formatChatTime(msg.timestamp)}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
                {botTyping && (
                  <Box sx={{ display:"flex", mt:1.5 }}>
                    <Box sx={{ px:2, py:1.25, bgcolor:"#F8FAFC", borderRadius:"18px 18px 18px 4px", border:"1px solid #E2E8F0", display:"flex", alignItems:"center", gap:0.5 }}>
                      {[0,1,2].map((i) => <Box key={i} sx={{ width:6, height:6, bgcolor:"#94A3B8", borderRadius:"50%", animation:"bounce 1.2s ease-in-out infinite", animationDelay:`${i*0.2}s`, "@keyframes bounce": { "0%,80%,100%": { transform:"scale(0.8)", opacity:0.5 }, "40%": { transform:"scale(1.2)", opacity:1 } } }} />)}
                    </Box>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Box>
              <Box sx={{ p:1.5, borderTop:"1px solid #E2E8F0", bgcolor:"#FFFFFF", borderRadius:"0 0 16px 16px" }}>
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField fullWidth multiline maxRows={3} size="small" placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown} disabled={botTyping}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius:"10px", fontSize:"13px", bgcolor:"#F8FAFC", "& fieldset": { borderColor:"#E2E8F0" }, "&:hover fieldset": { borderColor:"#CBD5E1" }, "&.Mui-focused fieldset": { borderColor:"#94A3B8", borderWidth:"1.5px" } } }} />
                  <IconButton onClick={handleSendChat} disabled={!chatInput.trim() || botTyping}
                    sx={{ width:40, height:40, borderRadius:"10px", flexShrink:0, bgcolor: chatInput.trim() && !botTyping ? "#1E293B" : "#E2E8F0", color: chatInput.trim() && !botTyping ? "#FFFFFF" : "#94A3B8", transition:"all 0.15s", "&:hover": { bgcolor: chatInput.trim() && !botTyping ? "#0F172A" : "#E2E8F0" }, "&.Mui-disabled": { bgcolor:"#E2E8F0", color:"#94A3B8" } }}>
                    <SendIcon sx={{ fontSize:17 }} />
                  </IconButton>
                </Stack>
                <Typography variant="caption" color="text.secondary" fontSize="10px" sx={{ mt:0.5, display:"block" }}>Press Enter to send · Shift+Enter for new line</Typography>
              </Box>
            </>
          )}

          {/* EMAIL VIEW — data comes from parent, always fresh after send */}
          {historyView === "email" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailOutlinedIcon sx={{ color:"#3B82F6", fontSize:20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Email History</Typography>
                    {!emailHistoryLoading && (
                      <Chip label={`${emailHistory.length} email${emailHistory.length !== 1 ? "s" : ""}`} size="small" sx={{ bgcolor:"#EFF6FF", color:"#3B82F6", fontWeight:600, fontSize:"11px", height:20 }} />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton size="small" onClick={onRefreshEmailHistory} disabled={emailHistoryLoading} sx={{ bgcolor:"#F8FAFC", "&:hover":{ bgcolor:"#E2E8F0" }, width:30, height:30 }}>
                      {emailHistoryLoading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize:16, color:"#64748B" }} />}
                    </IconButton>
                    <Button onClick={onComposeEmail} size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize:15 }} />}
                      sx={{ textTransform:"none", fontSize:"12px", fontWeight:600, borderRadius:"8px", borderColor:"#BFDBFE", color:"#3B82F6", bgcolor:"#EFF6FF", px:1.5, py:0.5, "&:hover":{ bgcolor:"#DBEAFE", borderColor:"#93C5FD" } }}>
                      New Mail
                    </Button>
                  </Stack>
                </Stack>
              </Box>
              <Box sx={{ flexGrow:1, p:3, overflowY:"auto", bgcolor:"#F8FAFC" }}>
                {emailHistoryLoading && (
                  <Box sx={{ display:"flex", justifyContent:"center", py:4 }}>
                    <Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading email history...</Typography></Stack>
                  </Box>
                )}
                {!emailHistoryLoading && emailHistory.length === 0 && (
                  <Box sx={{ textAlign:"center", py:6 }}>
                    <EmailOutlinedIcon sx={{ fontSize:48, color:"#CBD5E1", mb:1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Emails Sent Yet</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Emails sent to this lead will appear here.</Typography>
                    <Button onClick={onComposeEmail} size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize:15 }} />}
                      sx={{ mt:2, textTransform:"none", fontSize:"13px", fontWeight:600, borderRadius:"8px", borderColor:"#BFDBFE", color:"#3B82F6", bgcolor:"#EFF6FF", "&:hover":{ bgcolor:"#DBEAFE", borderColor:"#93C5FD" } }}>
                      Send First Email
                    </Button>
                  </Box>
                )}
                {!emailHistoryLoading && emailHistory.length > 0 && (
                  <Stack spacing={2}>
                    {emailHistory.map((mail) => (
                      <Card key={mail.id} sx={{ p:2.5, borderRadius:"12px", border:"1px solid #E2E8F0", bgcolor:"#FFFFFF" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width:40, height:40, bgcolor:"#FEF2F2", color:"#EF4444" }}>CC</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>Crysta Clinic</Typography>
                              <Typography variant="caption" color="text.secondary">{mail.sender_email || "team@crystaivf.com"}</Typography>
                            </Box>
                          </Stack>
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip label={mail.status} size="small" sx={getEmailStatusSx(mail.status)} />
                            <Typography variant="caption" color="text.secondary" fontSize="11px">
                              {mail.created_at ? new Date(mail.created_at).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" }) : ""}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} mb={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform:"uppercase", fontSize:"0.6rem", minWidth:24 }}>To:</Typography>
                          <Typography variant="caption" color="#374151" fontWeight={500}>{leadName}{leadEmail && leadEmail !== "N/A" ? ` <${leadEmail}>` : ""}</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={700} color="#1E293B" mb={1}>{mail.subject}</Typography>
                        <Divider sx={{ mb:1.5 }} />
                        <Typography component="pre" sx={{ fontSize:"13px", color:"text.secondary", lineHeight:1.75, fontFamily:"inherit", whiteSpace:"pre-wrap", wordBreak:"break-word", margin:0 }}>
                          {stripHtml(mail.email_body || "")}
                        </Typography>
                        {mail.sent_at && (
                          <Box sx={{ mt:1.5, pt:1.5, borderTop:"1px solid #F1F5F9" }}>
                            <Typography variant="caption" color="text.secondary" fontSize="11px">
                              ✅ Sent at {new Date(mail.sent_at).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
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

      <CallDialog open={callDialogOpen} name={leadName || "Unknown"} onClose={() => setCallDialogOpen(false)} />

      <Snackbar open={callSnackbar.open} autoHideDuration={4000} onClose={() => setCallSnackbar((s) => ({ ...s, open:false }))} anchorOrigin={{ vertical:"top", horizontal:"center" }}>
        <Alert onClose={() => setCallSnackbar((s) => ({ ...s, open:false }))} severity="error" sx={{ borderRadius:"10px" }}>
          {callSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default HistoryTab;