import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Avatar,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import CloseIcon from "@mui/icons-material/Close";

import { useSelector } from "react-redux";
import { selectLeads } from "../../store/leadSlice";
import type { Lead } from "../../services/leads.api";
import { LeadEmailAPI, EmailTemplateAPI, TwilioAPI } from "../../services/leads.api";
import type { LeadMailListItem, EmailTemplate } from "../../services/leads.api";
import type { TwilioCall, TwilioSMS } from "./LeadDetailTypes";
import { formatDateTime, getCallStatusColor, getSMSStatusColor } from "./LeadDetailHelpers";

/* ── Strip HTML to plain text ─────────────────────────────────────── */
const decodeEntities = (str: string): string => {
  try {
    const el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  } catch {
    return str
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }
};

const stripHtml = (html: string): string => {
  if (!html) return "";
  let text = decodeEntities(html);
  text = decodeEntities(text);
  text = text
    .replace(/<\/p\s*>/gi, "\n").replace(/<\/div\s*>/gi, "\n")
    .replace(/<\/li\s*>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]\s*>/gi, "\n").replace(/<\/tr\s*>/gi, "\n");
  text = text.replace(/<[^>]*>/g, "");
  text = text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim();
};

/* ─────────────────────────── helpers ─────────────────────────── */

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase();

const statusMap: Record<string, { bg: string; color: string; border: string }> = {
  New:                { bg: "#F3F3FF", color: "#6C6CFF", border: "#7C7CFF" },
  Appointment:        { bg: "#EEF4FF", color: "#2F6FFF", border: "#4C8DFF" },
  "Follow-Ups":       { bg: "#FFF6E5", color: "#FF9F0A", border: "#FFB020" },
  Converted:          { bg: "#EAFBF1", color: "#16A34A", border: "#22C55E" },
  Lost:               { bg: "#FDECEC", color: "#E5484D", border: "#FF5A5F" },
  Contacted:          { bg: "#EAFBF1", color: "#16A34A", border: "#22C55E" },
  "Cycle Conversion": { bg: "#FFF6E5", color: "#FF9F0A", border: "#FFB020" },
};

const getEmailStatusSx = (status: string) => {
  const s = (status || "").toUpperCase();
  if (s === "SENT")      return { bgcolor: "#ECFDF5", color: "#10B981" };
  if (s === "DRAFT")     return { bgcolor: "#F1F5F9", color: "#64748B" };
  if (s === "FAILED")    return { bgcolor: "#FEF2F2", color: "#EF4444" };
  if (s === "SCHEDULED") return { bgcolor: "#EFF6FF", color: "#3B82F6" };
  if (s === "CANCELLED") return { bgcolor: "#FFF7ED", color: "#F59E0B" };
  return { bgcolor: "#F1F5F9", color: "#64748B" };
};

type TabType = "email" | "sms" | "call";

/* ─────────────────────────── compose dialog ─────────────────────────── */

interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onSent: () => void;
}

const ComposeDialog: React.FC<ComposeDialogProps> = ({ open, onClose, lead, onSent }) => {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>("");
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" as "success" | "error" });

  React.useEffect(() => {
    if (!open) return;
    setTemplatesLoading(true);
    EmailTemplateAPI.list()
      .then((data) => setTemplates(data))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [open]);

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id);
    const tpl = templates.find((t) => String(t.id) === id);
    if (tpl) {
      setSubject(tpl.subject);
      setBody(stripHtml(tpl.body || "")); // strip HTML from template body
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      await LeadEmailAPI.sendNow({
        lead: lead.id,
        subject,
        email_body: body.trim(), // plain text
        sender_email: null,
        scheduled_at: null,
      });
      setSnackbar({ open: true, message: "Email sent successfully!", severity: "success" });
      setTimeout(() => { onSent(); onClose(); setSubject(""); setBody(""); setSelectedTemplate(""); }, 800);
    } catch {
      setSnackbar({ open: true, message: "Failed to send email. Please try again.", severity: "error" });
    } finally { setSending(false); }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
              <Typography fontWeight={700}>New Email</Typography>
            </Stack>
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>TO</Typography>
              <Typography fontSize={13} fontWeight={600} mt={0.3}>
                {lead.full_name}{lead.email ? ` <${lead.email}>` : ""}
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: 13 }}>
                {templatesLoading ? "Loading templates…" : "Use Email Template (optional)"}
              </InputLabel>
              <Select
                value={selectedTemplate}
                label={templatesLoading ? "Loading templates…" : "Use Email Template (optional)"}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                disabled={templatesLoading}
                sx={{ borderRadius: "10px", fontSize: 13 }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {templates.map((t) => (
                  <MenuItem key={t.id} value={String(t.id)} sx={{ fontSize: 13 }}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth size="small" label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
            <TextField fullWidth multiline rows={6} label="Message" value={body} onChange={(e) => setBody(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={onClose} size="small" sx={{ textTransform: "none", borderRadius: "10px", color: "#64748B", border: "1px solid #E2E8F0", px: 2 }}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} size="small"
                startIcon={sending ? <CircularProgress size={13} /> : <SendRoundedIcon sx={{ fontSize: 14 }} />}
                sx={{ textTransform: "none", borderRadius: "10px", bgcolor: "#2f2f2f", color: "#fff", px: 2, fontWeight: 600, "&:hover": { bgcolor: "#111" }, "&.Mui-disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
                {sending ? "Sending…" : "Send Now"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: "10px" }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

/* ─────────────────────────── SMS dialog ─────────────────────────── */

interface SMSDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onSent: () => void;
}

const SMSDialog: React.FC<SMSDialogProps> = ({ open, onClose, lead, onSent }) => {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const handleClose = () => { if (sending) return; setMessage(""); onClose(); };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await TwilioAPI.sendSMS({ lead_uuid: lead.id, to: lead.contact_no, message: message.trim() });
      setSnackbar({ open: true, message: "SMS sent successfully!", severity: "success" });
      setTimeout(() => { onSent(); onClose(); setMessage(""); }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send SMS. Please try again.";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally { setSending(false); }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <SmsOutlinedIcon sx={{ color: "#8B5CF6", fontSize: 20 }} />
              <Typography fontWeight={700}>New SMS</Typography>
            </Stack>
            <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>TO</Typography>
              <Typography fontSize={13} fontWeight={600} mt={0.3}>
                {lead.full_name}
                {lead.contact_no && <Typography component="span" fontSize={12} color="text.secondary" fontWeight={400} ml={1}>{lead.contact_no}</Typography>}
              </Typography>
            </Box>
            <TextField fullWidth multiline rows={5} label="Message" value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} inputProps={{ maxLength: 1600 }} helperText={`${message.length}/1600`} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={handleClose} size="small" sx={{ textTransform: "none", borderRadius: "10px", color: "#64748B", border: "1px solid #E2E8F0", px: 2 }}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending || !message.trim()} size="small"
                startIcon={sending ? <CircularProgress size={13} /> : <SendRoundedIcon sx={{ fontSize: 14 }} />}
                sx={{ textTransform: "none", borderRadius: "10px", bgcolor: "#2f2f2f", color: "#fff", px: 2, fontWeight: 600, "&:hover": { bgcolor: "#111" }, "&.Mui-disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
                {sending ? "Sending…" : "Send SMS"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: "10px" }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

/* ─────────────────────────── main component ─────────────────────────── */

export default function LeadsConversation() {
  const allLeads = useSelector(selectLeads);
  const leads = React.useMemo(() => allLeads.filter((l) => l.is_active !== false), [allLeads]);

  const [search, setSearch] = React.useState("");
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>("email");

  const [emailHistory, setEmailHistory] = React.useState<LeadMailListItem[]>([]);
  const [emailLoading, setEmailLoading] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [composeOpen, setComposeOpen] = React.useState(false);

  const [smsHistory, setSmsHistory] = React.useState<TwilioSMS[]>([]);
  const [smsLoading, setSmsLoading] = React.useState(false);
  const [smsError, setSmsError] = React.useState<string | null>(null);
  const [smsComposeOpen, setSmsComposeOpen] = React.useState(false);

  const [callHistory, setCallHistory] = React.useState<TwilioCall[]>([]);
  const [callLoading, setCallLoading] = React.useState(false);
  const [callError, setCallError] = React.useState<string | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (leads.length > 0 && !activeLead) setActiveLead(leads[0]);
  }, [leads, activeLead]);

  React.useEffect(() => {
    if (!activeLead) return;
    if (activeTab === "email") fetchEmails(activeLead.id);
    if (activeTab === "sms")   fetchSMS(activeLead.id);
    if (activeTab === "call")  fetchCalls(activeLead.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLead?.id, activeTab]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [emailHistory, smsHistory, callHistory]);

  const fetchEmails = async (id: string) => {
    setEmailLoading(true); setEmailError(null);
    try {
      const data = await LeadEmailAPI.listByLead(id);
      setEmailHistory(Array.isArray(data) ? data : []);
    } catch { setEmailError("Failed to load email history."); }
    finally { setEmailLoading(false); }
  };

  const fetchSMS = async (id: string) => {
    setSmsLoading(true); setSmsError(null);
    try {
      const res = await fetch(
        `${(import.meta as unknown as { env: Record<string,string> }).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"}/twilio/sms/?lead_uuid=${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` } }
      );
      const data = await res.json();
      setSmsHistory(Array.isArray(data) ? data : []);
    } catch { setSmsError("Failed to load SMS history."); }
    finally { setSmsLoading(false); }
  };

  const fetchCalls = async (id: string) => {
    setCallLoading(true); setCallError(null);
    try {
      const res = await fetch(
        `${(import.meta as unknown as { env: Record<string,string> }).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"}/twilio/calls/?lead_uuid=${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` } }
      );
      const data = await res.json();
      setCallHistory(Array.isArray(data) ? data : []);
    } catch { setCallError("Failed to load call history."); }
    finally { setCallLoading(false); }
  };

  const handleCompose = () => {
    if (activeTab === "sms") setSmsComposeOpen(true);
    else setComposeOpen(true);
  };

  const filteredLeads = React.useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(
      (l) => l.full_name.toLowerCase().includes(q) || l.contact_no.includes(q) || l.id.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const activeStyle = statusMap[activeLead?.lead_status ?? "New"] ?? statusMap["New"];

  const tabBadge: Record<TabType, number> = {
    email: emailHistory.length,
    sms: smsHistory.length,
    call: callHistory.length,
  };

  const TAB_CONFIG: { key: TabType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { key: "email", label: "Email", icon: <EmailOutlinedIcon sx={{ fontSize: 15 }} />, color: "#3B82F6", bg: "#EFF6FF" },
    { key: "sms",   label: "SMS",   icon: <SmsOutlinedIcon  sx={{ fontSize: 15 }} />, color: "#8B5CF6", bg: "#F5F3FF" },
    { key: "call",  label: "Calls", icon: <CallOutlinedIcon sx={{ fontSize: 15 }} />, color: "#10B981", bg: "#F0FDF4" },
  ];

  return (
    <Box sx={{ display: "flex", gap: 2, height: "78vh" }}>

      {/* SIDEBAR */}
      <Paper sx={{ width: 300, flexShrink: 0, p: 2, borderRadius: "20px", border: "1px solid #f1f1f1", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Typography fontWeight={700} mb={2}>Leads ({filteredLeads.length})</Typography>
        <TextField fullWidth size="small" placeholder="Search name / number / ID" value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "14px", height: 40 }, "& fieldset": { borderColor: "#e5e7eb" } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#9aa0b4", fontSize: 16 }} /></InputAdornment> }}
        />
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {filteredLeads.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 4 }}>No leads found.</Typography>
          ) : (
            filteredLeads.map((lead) => {
              const isActive = activeLead?.id === lead.id;
              const style = statusMap[lead.lead_status ?? "New"] ?? statusMap["New"];
              return (
                <Box key={lead.id} onClick={() => { setActiveLead(lead); setActiveTab("email"); }}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, mb: 1, borderRadius: "14px", cursor: "pointer", background: "#fff", border: isActive ? "1px solid #ff9c6b" : "1px solid transparent", boxShadow: isActive ? "0 4px 12px rgba(255,140,90,0.2)" : "none", transition: "all 0.15s", "&:hover": { border: "1px solid #e5e7eb" } }}>
                  <Avatar sx={{ width: 38, height: 38, fontSize: 12, fontWeight: 700, flexShrink: 0, bgcolor: isActive ? "#7b61ff" : "#ede9fe", color: isActive ? "#fff" : "#7b61ff" }}>
                    {getInitials(lead.full_name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={13} fontWeight={600} noWrap sx={{ flex: 1, mr: 0.5 }}>{lead.full_name}</Typography>
                      <Chip label={lead.lead_status ?? "New"} size="small" sx={{ bgcolor: style.bg, color: style.color, border: `1px solid ${style.border}`, height: 17, fontSize: 10, flexShrink: 0 }} />
                    </Stack>
                    <Typography fontSize={11} color="#8b8fa3" noWrap>{lead.contact_no}</Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Paper>

      {/* MAIN PANEL */}
      {activeLead ? (
        <Paper sx={{ flex: 1, borderRadius: "20px", border: "1px solid #eee", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header */}
          <Box sx={{ p: 2, borderBottom: "1px solid #f4f5f9", flexShrink: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: "#7b61ff", width: 42, height: 42, fontSize: 13, fontWeight: 700 }}>{getInitials(activeLead.full_name)}</Avatar>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={700} fontSize={15}>{activeLead.full_name}</Typography>
                    <Chip label={activeLead.lead_status ?? "New"} size="small" sx={{ bgcolor: activeStyle.bg, color: activeStyle.color, border: `1px solid ${activeStyle.border}`, height: 20, fontSize: 11 }} />
                  </Stack>
                  <Typography fontSize={12} color="#8b8fa3">{activeLead.contact_no}{activeLead.email ? ` · ${activeLead.email}` : ""}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {activeLead.department_name && <Chip label={activeLead.department_name} size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151", fontSize: 11 }} />}
                {activeLead.treatment_interest && <Chip label={activeLead.treatment_interest} size="small" sx={{ bgcolor: "#ede9fe", color: "#7b61ff", fontSize: 11 }} />}
                {activeLead.source && <Chip label={`Source: ${activeLead.source}`} size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontSize: 11 }} />}
                {activeLead.assigned_to_name && <Chip label={`Assigned: ${activeLead.assigned_to_name}`} size="small" sx={{ bgcolor: "#fff7ed", color: "#ea580c", fontSize: 11 }} />}
              </Stack>
            </Stack>
          </Box>

          {/* Tab bar */}
          <Box sx={{ px: 2, pt: 1.5, pb: 0, borderBottom: "1px solid #f4f5f9", flexShrink: 0 }}>
            <Stack direction="row" spacing={1}>
              {TAB_CONFIG.map((t) => (
                <Box key={t.key} onClick={() => setActiveTab(t.key)}
                  sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.8, py: 0.8, borderRadius: "10px 10px 0 0", cursor: "pointer", fontSize: 13, fontWeight: 600, borderBottom: activeTab === t.key ? `2px solid ${t.color}` : "2px solid transparent", color: activeTab === t.key ? t.color : "#6B7280", bgcolor: activeTab === t.key ? t.bg : "transparent", transition: "all 0.15s" }}>
                  {t.icon} {t.label}
                  {tabBadge[t.key] > 0 && (
                    <Box sx={{ ml: 0.5, px: 0.8, py: 0.1, borderRadius: "6px", bgcolor: t.bg, color: t.color, fontSize: 11, border: `1px solid ${t.color}22` }}>
                      {tabBadge[t.key]}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Content area */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, bgcolor: "#F8FAFC" }}>

            {/* EMAIL TAB */}
            {activeTab === "email" && (
              <>
                {emailLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading emails…</Typography></Stack></Box>}
                {!emailLoading && emailError && <Alert severity="error" sx={{ borderRadius: "10px" }} action={<Button size="small" onClick={() => fetchEmails(activeLead.id)}>Retry</Button>}>{emailError}</Alert>}
                {!emailLoading && !emailError && emailHistory.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No emails yet</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Emails sent to this lead will appear here.</Typography>
                  </Box>
                )}
                {!emailLoading && !emailError && emailHistory.length > 0 && (
                  <Stack spacing={2}>
                    {emailHistory.map((mail) => (
                      <Paper key={mail.id} elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: "1px solid #E2E8F0", bgcolor: "#fff" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 38, height: 38, bgcolor: "#FEF2F2", color: "#EF4444", fontSize: 12, fontWeight: 700 }}>CC</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>Crysta Clinic</Typography>
                              <Typography variant="caption" color="text.secondary">{mail.sender_email || "team@crystaivf.com"}</Typography>
                            </Box>
                          </Stack>
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip label={mail.status} size="small" sx={{ ...getEmailStatusSx(mail.status), fontWeight: 600, fontSize: 11, height: 20 }} />
                            <Typography variant="caption" color="text.secondary" fontSize={11}>
                              {mail.created_at ? new Date(mail.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} mb={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.6rem", textTransform: "uppercase", minWidth: 20 }}>To:</Typography>
                          <Typography variant="caption" color="#374151" fontWeight={500}>{activeLead.full_name}{activeLead.email ? ` <${activeLead.email}>` : ""}</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={700} color="#1E293B" mb={1}>{mail.subject}</Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        {/* ── FIX: was dangerouslySetInnerHTML — now plain text ── */}
                        <Typography
                          component="pre"
                          sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.75, fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}
                        >
                          {stripHtml(mail.email_body || "")}
                        </Typography>
                        {mail.sent_at && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
                            <Typography variant="caption" color="text.secondary" fontSize={11}>
                              ✅ Sent at {new Date(mail.sent_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                )}
                <div ref={bottomRef} />
              </>
            )}

            {/* SMS TAB */}
            {activeTab === "sms" && (
              <>
                {smsLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading SMS…</Typography></Stack></Box>}
                {!smsLoading && smsError && <Alert severity="error" sx={{ borderRadius: "10px" }} action={<Button size="small" onClick={() => fetchSMS(activeLead.id)}>Retry</Button>}>{smsError}</Alert>}
                {!smsLoading && !smsError && smsHistory.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <SmsOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No SMS yet</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>SMS messages sent to this lead will appear here.</Typography>
                  </Box>
                )}
                {!smsLoading && !smsError && smsHistory.length > 0 && (
                  <Stack spacing={2}>
                    {smsHistory.map((sms) => {
                      const statusStyle = getSMSStatusColor(sms.status ?? "");
                      return (
                        <Paper key={sms.id} elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: "1px solid #E2E8F0", bgcolor: "#fff" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ p: 0.8, bgcolor: "#F5F3FF", borderRadius: "8px" }}><SmsOutlinedIcon sx={{ color: "#8B5CF6", fontSize: 16 }} /></Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.6rem", textTransform: "uppercase" }}>{sms.direction === "outbound" ? "Sent To" : "Received From"}</Typography>
                                <Typography fontWeight={600} fontSize={13}>{sms.to_number}</Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip label={sms.status || "sent"} size="small" sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: 11, height: 20, textTransform: "capitalize" }} />
                              <Typography variant="caption" color="text.secondary" fontSize={11}>{formatDateTime(sms.created_at)}</Typography>
                            </Stack>
                          </Stack>
                          <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                            <Typography fontSize={13} sx={{ lineHeight: 1.6 }}>{sms.body}</Typography>
                          </Box>
                          <Stack direction="row" justifyContent="space-between" mt={1}>
                            <Typography variant="caption" color="text.secondary">From: {sms.from_number}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: 10 }}>SID: {sms.sid.slice(0, 20)}…</Typography>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
                <div ref={bottomRef} />
              </>
            )}

            {/* CALL TAB */}
            {activeTab === "call" && (
              <>
                {callLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading calls…</Typography></Stack></Box>}
                {!callLoading && callError && <Alert severity="error" sx={{ borderRadius: "10px" }} action={<Button size="small" onClick={() => fetchCalls(activeLead.id)}>Retry</Button>}>{callError}</Alert>}
                {!callLoading && !callError && callHistory.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <CallOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No calls yet</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Calls made to this lead will appear here.</Typography>
                  </Box>
                )}
                {!callLoading && !callError && callHistory.length > 0 && (
                  <Stack spacing={2}>
                    {callHistory.map((call) => {
                      const statusStyle = getCallStatusColor(call.status ?? "");
                      return (
                        <Paper key={call.id} elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: "1px solid #E2E8F0", bgcolor: "#fff" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ p: 1, bgcolor: "#F0FDF4", borderRadius: "8px" }}><CallOutlinedIcon sx={{ color: "#10B981", fontSize: 20 }} /></Box>
                              <Box>
                                <Typography fontWeight={700} fontSize={13}>Outbound Call</Typography>
                                <Typography variant="caption" color="text.secondary">To: {call.to_number}</Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip label={call.status || "initiated"} size="small" sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: 11, height: 20, textTransform: "capitalize" }} />
                              <Typography variant="caption" color="text.secondary" fontSize={11}>{formatDateTime(call.created_at)}</Typography>
                            </Stack>
                          </Stack>
                          <Divider sx={{ my: 1.5 }} />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">From: {call.from_number}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: 10 }}>SID: {call.sid.slice(0, 20)}…</Typography>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </Box>

          {/* Bottom action bar */}
          <Box sx={{ p: 2, borderTop: "1px solid #f1f2f6", flexShrink: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton onClick={handleCompose} title={activeTab === "sms" ? "New SMS" : "New Email"}
                sx={{ bgcolor: "#f3f4f6", borderRadius: "12px", width: 40, height: 40, "&:hover": { bgcolor: "#e5e7eb" } }}>
                <AddIcon sx={{ fontSize: 20, color: "#374151" }} />
              </IconButton>
              <IconButton onClick={() => { if (activeTab === "email") fetchEmails(activeLead.id); if (activeTab === "sms") fetchSMS(activeLead.id); if (activeTab === "call") fetchCalls(activeLead.id); }} title="Refresh"
                sx={{ bgcolor: "#f3f4f6", borderRadius: "12px", width: 40, height: 40, "&:hover": { bgcolor: "#e5e7eb" } }}>
                <RefreshIcon sx={{ fontSize: 18, color: "#374151" }} />
              </IconButton>
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", bgcolor: "#f6f7fb", borderRadius: "14px", px: 2, py: 1, cursor: "pointer", gap: 1 }} onClick={handleCompose}>
                {activeTab === "sms" ? <SmsOutlinedIcon sx={{ color: "#9ca3af", fontSize: 16 }} /> : <EmailOutlinedIcon sx={{ color: "#9ca3af", fontSize: 16 }} />}
                <Typography fontSize={13} color="#9ca3af">
                  {activeTab === "sms" ? `Send an SMS to ${activeLead.full_name}…` : `Send an email to ${activeLead.full_name}…`}
                </Typography>
              </Box>
              <IconButton onClick={handleCompose} sx={{ bgcolor: "#2f2f2f", color: "#fff", borderRadius: "12px", width: 40, height: 40, "&:hover": { bgcolor: "#111" } }}>
                <SendRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ flex: 1, borderRadius: "20px", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
          <Typography fontSize={36}>💬</Typography>
          <Typography fontWeight={600} color="text.secondary">Select a lead to view conversations</Typography>
        </Paper>
      )}

      {activeLead && (
        <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} lead={activeLead} onSent={() => fetchEmails(activeLead.id)} />
      )}
      {activeLead && (
        <SMSDialog open={smsComposeOpen} onClose={() => setSmsComposeOpen(false)} lead={activeLead} onSent={() => fetchSMS(activeLead.id)} />
      )}
    </Box>
  );
}