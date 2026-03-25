import * as React from "react";
import {
  Box, Button, Typography, Stack, Chip, CircularProgress,
  IconButton, Card, Divider, Avatar, Alert, Snackbar, TextField,
  Dialog, DialogContent, DialogActions, Paper,
  Radio, MenuItem, InputBase, Checkbox, Popover,
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
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

import { TimelineItem } from "./LeadDetailSubComponents";
import { getCallStatusColor, getSMSStatusColor, formatDateTime } from "./LeadDetailHelpers";
import type { LeadRecord, TwilioCall, TwilioSMS, HistoryView } from "./LeadDetailTypes";
import type { LeadMailListItem, EmailTemplate } from "../../services/leads.api";
import { TwilioAPI, LeadEmailAPI, EmailTemplateAPI } from "../../services/leads.api";
import { clinicsApi } from "../../services/tickets.api";
import CallDialog from "./CallDialog";
import { toast } from "react-toastify";

// ── Constants ─────────────────────────────────────────────────────────────────
const CLINIC_ID = 1;
const toastOptions = { position: "top-right" as const, autoClose: 3000, theme: "colored" as const };

/* ── Pure helpers ────────────────────────────────────────────────────────────── */

const isValidEmail = (val: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

const normalizeEmailAddr = (v: string) => v.trim().toLowerCase();

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

const getUseCaseSx = (useCase?: string) => {
  const map: Record<string, { bgcolor: string; color: string }> = {
    appointment:     { bgcolor: "#ECFDF5", color: "#10B981" },
    feedback:        { bgcolor: "#FEF2F2", color: "#EF4444" },
    reminder:        { bgcolor: "#EFF6FF", color: "#3B82F6" },
    "follow-up":     { bgcolor: "#FFF7ED", color: "#F59E0B" },
    followup:        { bgcolor: "#FFF7ED", color: "#F59E0B" },
    "re-engagement": { bgcolor: "#F5F3FF", color: "#7C3AED" },
    "no-show":       { bgcolor: "#FFF1F2", color: "#F43F5E" },
    general:         { bgcolor: "#F1F5F9", color: "#64748B" },
    promotional:     { bgcolor: "#F5F3FF", color: "#7C3AED" },
    welcome:         { bgcolor: "#ECFDF5", color: "#10B981" },
  };
  return map[(useCase ?? "").toLowerCase()] ?? { bgcolor: "#F1F5F9", color: "#64748B" };
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

// ── Clinic email extraction helpers ──────────────────────────────────────────
const getString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const extractClinicEmails = (clinicData: unknown): string[] => {
  const record = asRecord(clinicData);
  const direct = [
    getString(record.email),
    getString(record.clinic_email),
    getString(record.reply_email),
    getString(record.contact_email),
  ].filter((mail) => mail && isValidEmail(mail));
  const nested = Array.isArray(record.emails)
    ? (record.emails as unknown[]).map((item) => getString(item)).filter((mail) => mail && isValidEmail(mail))
    : [];
  return Array.from(new Set([...direct, ...nested].map((e) => e.toLowerCase())));
};

// ── Chatbot helpers ───────────────────────────────────────────────────────────
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

/* ── Lead suggestion shape ───────────────────────────────────────────────────── */
interface LeadSuggestion { id: number | string; name: string; email: string; }

const fetchLeadSuggestions = async (query: string): Promise<LeadSuggestion[]> => {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `/api/leads/?search=${encodeURIComponent(query)}&limit=10`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results ?? data;
    return results
      .filter((l: { email?: string }) => l.email)
      .map((l: { id: string | number; full_name?: string; name?: string; email: string }) => ({
        id: l.id, name: l.full_name || l.name || "Unknown", email: l.email,
      }));
  } catch { return []; }
};

/* ══════════════════════════════════════════════════════════════════════════════
   RecipientField — chip row + lead-search dropdown (for Cc/Bcc search)
══════════════════════════════════════════════════════════════════════════════ */
interface RecipientFieldProps {
  label?: string;
  chips: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
  chipColor?: { bg: string; text: string; border: string };
  placeholder?: string;
  onDismiss?: () => void;
  disabled?: boolean;
}

const RecipientField: React.FC<RecipientFieldProps> = ({
  label, chips, onAdd, onRemove,
  placeholder = "Search name or email...",
  onDismiss, disabled = false,
}) => {
  const [inputValue, setInputValue]     = React.useState("");
  const [suggestions, setSuggestions]   = React.useState<LeadSuggestion[]>([]);
  const [loading, setLoading]           = React.useState(false);
  const [open, setOpen]                 = React.useState(false);
  const [highlightIdx, setHighlightIdx] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef     = React.useRef<HTMLInputElement>(null);
  const debounceRef  = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // suppress unused-var warning — containerRef is attached to DOM for future use
  void containerRef;

  const search = React.useCallback(async (val: string) => {
    if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    const results = await fetchLeadSuggestions(val);
    const filtered = results.filter((s) => !chips.includes(s.email));
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
    setHighlightIdx(-1);
    setLoading(false);
  }, [chips]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 280);
  };

  const commit = (val: string) => {
    const trimmed = val.trim().replace(/,$/, "");
    if (trimmed && isValidEmail(trimmed) && !chips.includes(trimmed)) onAdd(trimmed);
    setInputValue(""); setSuggestions([]); setOpen(false); setHighlightIdx(-1);
  };

  const pick = (s: LeadSuggestion) => {
    if (!chips.includes(s.email)) onAdd(s.email);
    setInputValue(""); setSuggestions([]); setOpen(false); setHighlightIdx(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (highlightIdx >= 0 && suggestions[highlightIdx]) pick(suggestions[highlightIdx]); else commit(inputValue); }
    else if (["Tab", ","].includes(e.key)) { e.preventDefault(); commit(inputValue); }
    else if (e.key === "Backspace" && !inputValue && chips.length) { onRemove(chips[chips.length - 1]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, position: "relative" }}>
      {label && (
        <Typography fontSize="14px" color="#7A7A7A" minWidth={48} mt="6px" flexShrink={0}>
          {label}
        </Typography>
      )}
      <Box sx={{ flex: 1, position: "relative" }}>
        <Box
          onClick={() => inputRef.current?.focus()}
          sx={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center", minHeight: 30, cursor: "text", py: "2px" }}
        >
          {loading && <CircularProgress size={11} sx={{ color: "#94A3B8", flexShrink: 0 }} />}
          <InputBase
            inputRef={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => { commit(inputValue); setOpen(false); }, 160)}
            onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
            placeholder={chips.length === 0 ? placeholder : ""}
            disabled={disabled}
            sx={{ fontSize: "14px", flex: 1, minWidth: 120, "& input": { padding: 0 } }}
          />
        </Box>
        {open && suggestions.length > 0 && (
          <Paper elevation={0} sx={{
            position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
            zIndex: 2100, borderRadius: "10px", border: "1px solid #E2E8F0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.09)", overflow: "hidden", maxHeight: 200, overflowY: "auto",
          }}>
            <Box sx={{ px: 2, py: 0.75, bgcolor: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <Typography fontSize="11px" color="#94A3B8" fontWeight={600} letterSpacing="0.04em" textTransform="uppercase">Leads</Typography>
            </Box>
            {suggestions.map((s, idx) => (
              <Box key={s.id}
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                onMouseEnter={() => setHighlightIdx(idx)}
                sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1, cursor: "pointer", bgcolor: idx === highlightIdx ? "#F0F7FF" : "#fff", borderBottom: "1px solid #F8FAFC", "&:last-child": { borderBottom: "none" }, transition: "background 0.1s" }}
              >
                <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: idx === highlightIdx ? "#DBEAFE" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Typography fontSize="10px" fontWeight={700} color="#2563EB">
                    {s.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontSize="13px" fontWeight={600} color="#1E293B" noWrap>{s.name}</Typography>
                  <Typography fontSize="11.5px" color="#64748B" noWrap>{s.email}</Typography>
                </Box>
                {idx === highlightIdx && <Typography fontSize="10px" color="#93C5FD" fontWeight={500}>↵</Typography>}
              </Box>
            ))}
          </Paper>
        )}
      </Box>
      {onDismiss && (
        <IconButton size="small" onClick={onDismiss} sx={{ color: "#CBD5E1", mt: "2px", flexShrink: 0 }}>
          <CloseIcon sx={{ fontSize: 13 }} />
        </IconButton>
      )}
    </Box>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   EmailChipRow — avatar-style chip (matches BulkActionBar To row chips)
══════════════════════════════════════════════════════════════════════════════ */
const EmailChipRow: React.FC<{
  email: string;
  onRemove: () => void;
}> = ({ email, onRemove }) => (
  <Box display="flex" alignItems="center" gap={1} px={1.2} py={0.5} borderRadius="16px" bgcolor="#F1F3F5">
    <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>{email.charAt(0).toUpperCase()}</Avatar>
    <Typography fontSize={13} fontWeight={500}>{email}</Typography>
    <Box component="span" onClick={onRemove}
      sx={{ cursor: "pointer", fontSize: 16, color: "#7A7A7A", "&:hover": { color: "#000" } }}>×</Box>
  </Box>
);

/* ══════════════════════════════════════════════════════════════════════════════
   Extended payload type to support cc / bcc / additional_to
══════════════════════════════════════════════════════════════════════════════ */
type SendNowPayload = Parameters<typeof LeadEmailAPI.sendNow>[0] & {
  cc?: string[];
  bcc?: string[];
  additional_to?: string[];
};

/* ══════════════════════════════════════════════════════════════════════════════
   ComposeEmailDialog — two-step flow matching BulkActionBar exactly
   Step 1 (selector): choose template or compose from scratch
   Step 2 (composer): full Gmail-style compose with From/To/Cc/Bcc + toolbar
══════════════════════════════════════════════════════════════════════════════ */
interface ComposeEmailDialogProps {
  open: boolean;
  onClose: () => void;
  lead: LeadRecord;
  leadEmail: string;
  leadName: string;
  onSent: () => void;
}

const ComposeEmailDialog: React.FC<ComposeEmailDialogProps> = ({
  open, onClose, lead, leadEmail, leadName, onSent,
}) => {

  /* ── Step ──────────────────────────────────────────────────────────────── */
  const [step, setStep] = React.useState<"selector" | "composer">("selector");

  /* ── Email content state ───────────────────────────────────────────────── */
  const [subject, setSubject]         = React.useState("");
  const [messageBody, setMessageBody] = React.useState("");
  const [sending, setSending]         = React.useState(false);
  const [sendError, setSendError]     = React.useState<string | null>(null);

  /* ── From ──────────────────────────────────────────────────────────────── */
  const [fromEmail, setFromEmail]     = React.useState("");
  const [fromOptions, setFromOptions] = React.useState<string[]>([]);
  const [loadingFrom, setLoadingFrom] = React.useState(false);

  /* ── To / CC / BCC ─────────────────────────────────────────────────────── */
  const [toEmails, setToEmails]   = React.useState<string[]>([]);
  const [ccEmails, setCcEmails]   = React.useState<string[]>([]);
  const [bccEmails, setBccEmails] = React.useState<string[]>([]);
  const [showCc, setShowCc]       = React.useState(false);
  const [showBcc, setShowBcc]     = React.useState(false);

  /* ── To popover (for selecting this lead from a quick list) ───────────── */
  const toRowRef         = React.useRef<HTMLDivElement | null>(null);
  const toPickerPaperRef = React.useRef<HTMLDivElement | null>(null);
  const [toAnchorEl, setToAnchorEl] = React.useState<HTMLElement | null>(null);
  const [toInput, setToInput]       = React.useState("");
  const openToPicker = Boolean(toAnchorEl);

  /* ── Templates ─────────────────────────────────────────────────────────── */
  const [templates, setTemplates]               = React.useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  const [templatesError, setTemplatesError]     = React.useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate]   = React.useState<EmailTemplate | null>(null);

  /* ── Reset + load data on open ─────────────────────────────────────────── */
  React.useEffect(() => {
    if (!open) return;
    setStep("selector");
    setSubject(""); setMessageBody(""); setSendError(null);
    setSelectedTemplate(null); setPreviewTemplate(null);
    setToEmails(leadEmail && leadEmail !== "N/A" ? [leadEmail] : []);
    setCcEmails([]); setBccEmails([]);
    setShowCc(false); setShowBcc(false);
    setToInput("");

    // Load clinic from-emails
    setLoadingFrom(true);
    (async () => {
      try {
        const clinicData = await clinicsApi.getClinicDetail(CLINIC_ID);
        const emails = extractClinicEmails(clinicData);
        if (emails.length > 0) { setFromOptions(emails); setFromEmail(emails[0]); }
        else { setFromOptions(["noreply@fertility.com"]); setFromEmail("noreply@fertility.com"); }
      } catch {
        setFromOptions(["noreply@fertility.com"]); setFromEmail("noreply@fertility.com");
      } finally { setLoadingFrom(false); }
    })();

    // Load email templates
    setTemplatesLoading(true); setTemplatesError(null);
    EmailTemplateAPI.list()
      .then((data) => setTemplates(data.filter((t) => t.is_active !== false)))
      .catch((err) => setTemplatesError(extractErrorMessage(err, "Failed to load email templates.")))
      .finally(() => setTemplatesLoading(false));
  }, [open, leadEmail]);

  /* ── Close-outside-click handler for To popover ────────────────────────── */
  React.useEffect(() => {
    if (!openToPicker) return;
    const handler = (e: PointerEvent) => {
      if (!toPickerPaperRef.current?.contains(e.target as Node)) setToAnchorEl(null);
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [openToPicker]);

  /* ── Template selection ─────────────────────────────────────────────────── */
  const handleSelectTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t);
    setSubject(t.subject || "");
    const name = leadName || "Patient";
    const rawBody = (t.body || "")
      .replace(/\{\{name\}\}/g, name).replace(/\{\{lead_name\}\}/g, name)
      .replace(/\{\{lead_first_name\}\}/g, name.split(" ")[0]);
    setMessageBody(stripHtml(rawBody));
  };

  /* ── Input helpers ──────────────────────────────────────────────────────── */
  const addEmailsFromInput = (value: string, list: string[], setList: (v: string[]) => void) => {
    const chunks = value.split(/[;,\n]/).map((i) => i.trim()).filter(Boolean);
    if (!chunks.length) return;
    const next = [...list];
    chunks.forEach((mail) => {
      if (isValidEmail(mail) && !next.some((m) => normalizeEmailAddr(m) === normalizeEmailAddr(mail))) next.push(mail);
    });
    setList(next);
  };

  const toggleToEmail = (email: string) => {
    const exists = toEmails.some((m) => normalizeEmailAddr(m) === normalizeEmailAddr(email));
    if (exists) setToEmails(toEmails.filter((m) => normalizeEmailAddr(m) !== normalizeEmailAddr(email)));
    else if (isValidEmail(email)) setToEmails([...toEmails, email]);
  };

  /* ── Send ───────────────────────────────────────────────────────────────── */
  const handleSend = async () => {
    if (!subject.trim() || !messageBody.trim() || toEmails.length === 0) return;
    setSending(true); setSendError(null);
    try {
      const payload: SendNowPayload = {
        lead: lead.id,
        subject: subject.trim(),
        email_body: messageBody.trim(),
        sender_email: fromEmail || null,
        cc: ccEmails,
        bcc: bccEmails,
        additional_to: toEmails.filter((e) => e !== leadEmail),
        scheduled_at: null,
      };
      await LeadEmailAPI.sendNow(payload as Parameters<typeof LeadEmailAPI.sendNow>[0]);
      toast.success(`Email sent to ${leadName || "Patient"}!`, toastOptions);
      setTimeout(() => { onSent(); onClose(); }, 800);
    } catch (err) {
      setSendError(extractErrorMessage(err, "Failed to send email. Please try again."));
    } finally { setSending(false); }
  };

  const handleClose = () => { if (!sending) onClose(); };

  const retryTemplates = () => {
    setTemplatesLoading(true); setTemplatesError(null);
    EmailTemplateAPI.list()
      .then((data) => setTemplates(data.filter((t) => t.is_active !== false)))
      .catch((err) => setTemplatesError(extractErrorMessage(err, "Failed to load email templates.")))
      .finally(() => setTemplatesLoading(false));
  };

  /* ── Lead list for To popover (just this lead) ──────────────────────────── */
  const leadRecipient = React.useMemo(() =>
    leadEmail && leadEmail !== "N/A"
      ? [{ id: lead.id, name: leadName || "Lead", email: leadEmail }]
      : [],
    [lead.id, leadName, leadEmail],
  );

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── STEP 1: Template selector ────────────────────────────────────── */}
      <Dialog open={open && step === "selector"} onClose={handleClose} maxWidth="md" fullWidth>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>New Email</Typography>
            <Typography variant="caption" color="text.secondary">
              To {leadName || "Lead"}{leadEmail && leadEmail !== "N/A" ? ` · ${leadEmail}` : ""}
            </Typography>
          </Box>
          <IconButton onClick={handleClose}><CloseIcon /></IconButton>
        </Box>

        <DialogContent>
          {/* Compose from scratch card */}
          <Box
            sx={{ border: "1px dashed #D1D5DB", borderRadius: 2, py: 4, textAlign: "center", cursor: "pointer", mb: 3, "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" } }}
            onClick={() => { setSelectedTemplate(null); setSubject(""); setMessageBody(""); setStep("composer"); setSendError(null); }}
          >
            <EditOutlinedIcon sx={{ color: "#6B7280" }} />
            <Typography fontWeight={500} mt={1} color="#374151">Compose New Email</Typography>
            <Typography variant="caption" color="text.secondary">Write a custom message from scratch</Typography>
          </Box>

          <Divider sx={{ mb: 2 }}>OR USE A TEMPLATE</Divider>

          {templatesLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={22} /></Box>}

          {!templatesLoading && templatesError && (
            <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }}
              action={<Button size="small" onClick={retryTemplates}>Retry</Button>}>
              {templatesError}
            </Alert>
          )}

          {!templatesLoading && !templatesError && templates.length === 0 && (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <EmailOutlinedIcon sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No active email templates found.</Typography>
            </Box>
          )}

          {!templatesLoading && !templatesError && templates.map((t) => (
            <Box key={t.id}
              sx={{ display: "flex", alignItems: "center", py: 2, px: 1, borderBottom: "1px solid #F3F4F6", cursor: "pointer", borderRadius: 1, bgcolor: selectedTemplate?.id === t.id ? "#F0F9FF" : "transparent", "&:hover": { bgcolor: selectedTemplate?.id === t.id ? "#F0F9FF" : "#F9FAFB" } }}
              onClick={() => handleSelectTemplate(t)}
            >
              <Radio checked={selectedTemplate?.id === t.id} onChange={() => handleSelectTemplate(t)} size="small" />
              <Box sx={{ flex: 1, ml: 0.5, minWidth: 0 }}>
                <Typography fontSize="14px" fontWeight={600} noWrap>{t.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{t.subject}</Typography>
              </Box>
              {t.use_case && (
                <Chip label={t.use_case} size="small"
                  sx={{ ...getUseCaseSx(t.use_case), fontSize: "11px", height: 20, mr: 1, textTransform: "capitalize" }} />
              )}
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }} sx={{ color: "#6B7280" }}>
                <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ))}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined" sx={{ borderColor: "#D1D5DB", color: "#374151" }}>Cancel</Button>
          <Button
            onClick={() => { setStep("composer"); setSendError(null); }}
            variant="contained"
            disabled={!selectedTemplate}
            sx={{ backgroundColor: "#111827", "&:hover": { backgroundColor: "#000" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Template preview dialog ──────────────────────────────────────── */}
      <Dialog open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} maxWidth="sm" fullWidth>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>{previewTemplate?.name}</Typography>
            {previewTemplate?.use_case && (
              <Chip label={previewTemplate.use_case} size="small"
                sx={{ ...getUseCaseSx(previewTemplate.use_case), fontSize: "11px", height: 20, mt: 0.5, textTransform: "capitalize" }} />
            )}
          </Box>
          <IconButton onClick={() => setPreviewTemplate(null)}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.5px" }}>SUBJECT</Typography>
          <Typography fontWeight={600} fontSize="14px" mb={2} mt={0.5}>{previewTemplate?.subject}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.5px" }}>BODY</Typography>
          <Typography component="pre" sx={{ mt: 0.5, p: 2, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px", lineHeight: 1.75, fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
            {stripHtml(previewTemplate?.body ?? "")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPreviewTemplate(null)} variant="outlined" sx={{ borderColor: "#D1D5DB", color: "#374151" }}>Close</Button>
          <Button variant="contained"
            onClick={() => { if (previewTemplate) handleSelectTemplate(previewTemplate); setPreviewTemplate(null); }}
            sx={{ backgroundColor: "#111827", "&:hover": { backgroundColor: "#000" } }}>
            Use This Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── STEP 2: Full composer (matches BulkActionBar exactly) ────────── */}
      <Dialog open={open && step === "composer"} onClose={handleClose} maxWidth="md" fullWidth>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>{selectedTemplate ? selectedTemplate.name : "New Email"}</Typography>
            <Typography variant="caption" color="text.secondary">
              Sending to {toEmails.length} recipient{toEmails.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={sending}><CloseIcon /></IconButton>
        </Box>

        <DialogContent sx={{ px: 3, pb: 1 }}>
          {sendError && (
            <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }} onClose={() => setSendError(null)}>
              {sendError}
            </Alert>
          )}

          {/* FROM */}
          <Box display="flex" alignItems="center" gap={1} pb={1.2} borderBottom="1px solid #E6E6E6">
            <Typography fontSize={14} color="#7A7A7A" minWidth={48}>From :</Typography>
            {loadingFrom
              ? <CircularProgress size={14} sx={{ color: "#94A3B8" }} />
              : (
                <TextField
                  select value={fromEmail} onChange={(e) => setFromEmail(e.target.value)}
                  variant="standard"
                  sx={{ minWidth: 260, "& .MuiInputBase-input": { fontSize: 14 } }}
                  InputProps={{ disableUnderline: true }}
                >
                  {fromOptions.map((email) => (
                    <MenuItem key={email} value={email} sx={{ fontSize: 14 }}>{email}</MenuItem>
                  ))}
                </TextField>
              )
            }
          </Box>

          {/* TO */}
          <Box
            ref={toRowRef}
            display="flex" alignItems="flex-start" gap={1}
            py={1.5} borderBottom="1px solid #E6E6E6"
            sx={{ flexWrap: "wrap" }}
          >
            <Typography fontSize={14} color="#7A7A7A" minWidth={48}>To :</Typography>
            <Box
              display="flex" gap={1} flexWrap="wrap" flex={1} minWidth={180}
              sx={{
                maxHeight: "90px", overflowY: "auto", paddingRight: "8px",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-track": { bgcolor: "#F3F4F6", borderRadius: "3px" },
                "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: "3px", "&:hover": { bgcolor: "#9CA3AF" } },
              }}
            >
              {toEmails.map((email) => (
                <EmailChipRow key={email} email={email} onRemove={() => setToEmails(toEmails.filter((m) => m !== email))} />
              ))}
              <InputBase
                value={toInput}
                placeholder="Add recipients"
                onFocus={() => { if (leadRecipient.length > 0 && toRowRef.current) setToAnchorEl(toRowRef.current); }}
                onChange={(e) => setToInput(e.target.value)}
                onBlur={() => { addEmailsFromInput(toInput, toEmails, setToEmails); setToInput(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
                    e.preventDefault();
                    addEmailsFromInput(toInput, toEmails, setToEmails);
                    setToInput("");
                  }
                }}
                sx={{ minWidth: 140, fontSize: 14, flex: 1 }}
              />
            </Box>

            {/* Cc / Bcc toggles */}
            <Box display="flex" gap={1} ml="auto" pt={0.5}>
              <Typography onClick={() => setShowCc(!showCc)}
                sx={{ fontSize: 13, cursor: "pointer", color: showCc || ccEmails.length > 0 ? "#232323" : "#9E9E9E", fontWeight: showCc || ccEmails.length > 0 ? 600 : 400 }}>
                Cc
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#9E9E9E", fontWeight: 600 }}>|</Typography>
              <Typography onClick={() => setShowBcc(!showBcc)}
                sx={{ fontSize: 13, cursor: "pointer", color: showBcc || bccEmails.length > 0 ? "#232323" : "#9E9E9E", fontWeight: showBcc || bccEmails.length > 0 ? 600 : 400 }}>
                Bcc
              </Typography>
            </Box>

            {/* To picker popover — ref passed directly, type matches */}
            <Popover
              open={openToPicker} anchorEl={toAnchorEl} onClose={() => setToAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              disableAutoFocus disableEnforceFocus disableRestoreFocus
              PaperProps={{
                ref: toPickerPaperRef,
                onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => e.preventDefault(),
              }}
            >
              <Box sx={{ width: 320, maxHeight: 260, overflowY: "auto", p: 1 }}>
                {leadRecipient.length === 0 ? (
                  <Typography fontSize={13} color="text.secondary" p={1}>No recipients available</Typography>
                ) : leadRecipient.map((r) => (
                  <Box key={r.id} onClick={() => toggleToEmail(r.email)}
                    sx={{ p: 0.8, borderRadius: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 1, "&:hover": { backgroundColor: "#F5F5F5" } }}>
                    <Checkbox size="small"
                      checked={toEmails.some((m) => normalizeEmailAddr(m) === normalizeEmailAddr(r.email))}
                      onChange={() => toggleToEmail(r.email)} />
                    <Box>
                      <Typography fontSize={13} fontWeight={500}>{r.name}</Typography>
                      <Typography fontSize={12} color="text.secondary">{r.email}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Popover>
          </Box>

          {/* CC */}
          {(showCc || ccEmails.length > 0) && (
            <Box display="flex" alignItems="flex-start" gap={1} py={1} borderBottom="1px solid #E6E6E6">
              <Typography fontSize={14} color="#7A7A7A" minWidth={35}>Cc :</Typography>
              <Box display="flex" gap={1} flexWrap="wrap" flex={1} alignItems="center">
                {ccEmails.map((mail) => (
                  <EmailChipRow key={mail} email={mail} onRemove={() => setCcEmails(ccEmails.filter((m) => normalizeEmailAddr(m) !== normalizeEmailAddr(mail)))} />
                ))}
                {/* Lead search for Cc */}
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <RecipientField
                    chips={ccEmails}
                    onAdd={(e) => setCcEmails((prev) => [...prev, e])}
                    onRemove={() => {}}
                    placeholder="Add CC recipients"
                    disabled={sending}
                  />
                </Box>
              </Box>
              <Box component="span" onClick={() => { setShowCc(false); setCcEmails([]); }}
                sx={{ cursor: "pointer", color: "#9E9E9E", fontSize: 12, mt: "8px", "&:hover": { color: "#374151" } }}>×</Box>
            </Box>
          )}

          {/* BCC */}
          {(showBcc || bccEmails.length > 0) && (
            <Box display="flex" alignItems="flex-start" gap={1} py={1} borderBottom="1px solid #E6E6E6">
              <Typography fontSize={14} color="#7A7A7A" minWidth={40}>Bcc :</Typography>
              <Box display="flex" gap={1} flexWrap="wrap" flex={1} alignItems="center">
                {bccEmails.map((mail) => (
                  <EmailChipRow key={mail} email={mail} onRemove={() => setBccEmails(bccEmails.filter((m) => normalizeEmailAddr(m) !== normalizeEmailAddr(mail)))} />
                ))}
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <RecipientField
                    chips={bccEmails}
                    onAdd={(e) => setBccEmails((prev) => [...prev, e])}
                    onRemove={() => {}}
                    placeholder="Add BCC recipients"
                    disabled={sending}
                  />
                </Box>
              </Box>
              <Box component="span" onClick={() => { setShowBcc(false); setBccEmails([]); }}
                sx={{ cursor: "pointer", color: "#9E9E9E", fontSize: 12, mt: "8px", "&:hover": { color: "#374151" } }}>×</Box>
            </Box>
          )}

          {/* Subject */}
          <TextField
            fullWidth variant="standard" placeholder="Subject"
            value={subject} onChange={(e) => setSubject(e.target.value)}
            InputProps={{ disableUnderline: true }}
            sx={{ py: 1.5, borderBottom: "1px solid #E5E7EB", mt: 1 }}
            disabled={sending}
          />

          {/* Body */}
          <TextField
            fullWidth multiline rows={10} variant="outlined"
            placeholder="Type your message here..."
            value={messageBody} onChange={(e) => setMessageBody(e.target.value)}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "inherit", fontSize: "13px", lineHeight: 1.75 } }}
            disabled={sending}
          />
        </DialogContent>

        {/* Toolbar + Send actions */}
        <Box sx={{ px: 3, py: 2, borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Formatting toolbar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, border: "1px solid #E5E7EB", borderRadius: 2, px: 1, py: 0.5 }}>
            <IconButton size="small" disabled={sending}><Typography fontWeight="bold" fontSize="1.2rem">A</Typography></IconButton>
            <IconButton size="small" disabled={sending}><AttachFileOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={sending}><LinkOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={sending}><EmojiEmotionsOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={sending}><ChangeHistoryIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={sending}><ImageOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={sending}><LockClockOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={sending}><CreateOutlinedIcon fontSize="small" /></IconButton>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button onClick={() => setStep("selector")} variant="outlined" disabled={sending}
              sx={{ borderColor: "#D1D5DB", color: "#374151" }}>
              Back
            </Button>
            <Button variant="contained" disabled
              sx={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}>
              Save as Template
            </Button>
            <Button
              variant="contained"
              endIcon={sending ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SendOutlinedIcon />}
              onClick={handleSend}
              disabled={!subject.trim() || !messageBody.trim() || toEmails.length === 0 || sending}
              sx={{
                backgroundColor: "#4B5563", "&:hover": { backgroundColor: "#374151" },
                "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" }, minWidth: 90,
              }}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   ChatMessage type
══════════════════════════════════════════════════════════════════════════════ */
interface ChatMessage { id: string; role: "user" | "bot"; text: string; timestamp: Date; }

/* ══════════════════════════════════════════════════════════════════════════════
   HistoryTabProps
══════════════════════════════════════════════════════════════════════════════ */
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
  emailHistory: LeadMailListItem[];
  emailHistoryLoading: boolean;
  onRefreshEmailHistory: () => void;
}

/* ══════════════════════════════════════════════════════════════════════════════
   HistoryTab
══════════════════════════════════════════════════════════════════════════════ */
const HistoryTab: React.FC<HistoryTabProps> = ({
  lead, historyView, setHistoryView,
  leadName, leadPhone, leadEmail, leadAssigned, leadCreatedAt,
  appointmentDate, appointmentSlot, appointmentDepartment, appointmentPersonnel,
  appointmentRemark, treatmentInterest, hasAppointment,
  callHistory, callHistoryLoading, callHistoryError, onRefreshCallHistory,
  smsHistory, smsHistoryLoading, smsHistoryError, onRefreshSmsHistory,
  emailHistory, emailHistoryLoading, onRefreshEmailHistory,
}) => {

  const [composeOpen, setComposeOpen] = React.useState(false);
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

  // Chatbot state
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
    setChatMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", text, timestamp: new Date() }]);
    setChatInput("");
    setBotTyping(true);
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { id: `bot-${Date.now()}`, role: "bot", text: getBotReply(text), timestamp: new Date() }]);
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
      {/* BulkActionBar-style two-step email dialog */}
      <ComposeEmailDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        lead={lead}
        leadEmail={leadEmail}
        leadName={leadName}
        onSent={onRefreshEmailHistory}
      />

      <Stack direction="row" spacing={3}>

        {/* LEFT: Activity Timeline */}
        <Card sx={{ flex: 1, p: 3, borderRadius: "16px" }}>
          <Typography variant="subtitle1" fontWeight={700} mb={3}>Activity Timeline</Typography>
          <Stack spacing={0}>
            {hasAppointment && (
              <TimelineItem icon={<EventNoteIcon sx={{ fontSize: 16, color: "#10B981" }} />}
                title={`Appointment Booked — ${appointmentDate} at ${appointmentSlot}`}
                time={leadCreatedAt} onClick={() => setHistoryView("appointment")} isClickable />
            )}
            <TimelineItem icon={<SmsOutlinedIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />}
              title={`SMS History (${smsHistory.length} messages)`}
              time={smsHistory.length > 0 ? formatDateTime(smsHistory[0].created_at) : leadCreatedAt}
              onClick={() => setHistoryView("sms")} isClickable />
            <TimelineItem icon={<CallOutlinedIcon sx={{ fontSize: 16, color: "#10B981" }} />}
              title={`Call History (${callHistory.length} calls)`}
              time={callHistory.length > 0 ? formatDateTime(callHistory[0].created_at) : leadCreatedAt}
              onClick={() => setHistoryView("call")} isClickable />
            <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: "#F59E0B" }} />}
              title="Patient shared contact number and email"
              time={leadCreatedAt} onClick={() => setHistoryView("email")} isClickable />
            <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: "#3B82F6" }} />}
              title="Sent a Welcome Email" time={leadCreatedAt} onClick={() => setHistoryView("email")} isClickable />
            <TimelineItem isAvatar avatarInitial={leadAssigned.charAt(0)}
              title={`Assigned to ${leadAssigned}`} time={leadCreatedAt} />
            <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />}
              title="Lead arrived from Website Chatbot" time={leadCreatedAt}
              onClick={() => setHistoryView("chatbot")} isClickable isLast />
          </Stack>
        </Card>

        {/* RIGHT: Detail Panel */}
        <Card sx={{ flex: 2, borderRadius: "16px", display: "flex", flexDirection: "column", maxHeight: "600px" }}>

          {/* APPOINTMENT */}
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
                      <Box sx={{ p: 1, bgcolor: "#ECFDF5", borderRadius: "8px" }}><EventNoteIcon sx={{ color: "#10B981", fontSize: 22 }} /></Box>
                      <Box>
                        <Typography fontWeight={700} fontSize="15px">Appointment Booked</Typography>
                        <Chip label="Confirmed" size="small" sx={{ bgcolor: "#ECFDF5", color: "#10B981", fontWeight: 600, fontSize: "11px", height: 20, mt: 0.5 }} />
                      </Box>
                    </Stack>
                    <Divider sx={{ mb: 2.5 }} />
                    <Stack spacing={2.5}>
                      <Stack direction="row" spacing={4}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>DATE</Typography>
                          <Typography fontWeight={700} fontSize="14px" mt={0.3}>{appointmentDate}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>TIME SLOT</Typography>
                          <Typography fontWeight={700} fontSize="14px" mt={0.3}>{appointmentSlot}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={4}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>DEPARTMENT</Typography>
                          <Typography fontWeight={600} fontSize="14px" mt={0.3}>{appointmentDepartment}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>ASSIGNED TO</Typography>
                          <Stack direction="row" spacing={1} alignItems="center" mt={0.3}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: "11px", bgcolor: "#EEF2FF", color: "#6366F1" }}>{appointmentPersonnel.charAt(0)}</Avatar>
                            <Typography fontWeight={600} fontSize="14px">{appointmentPersonnel}</Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      {appointmentRemark && appointmentRemark !== "N/A" && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>REMARK</Typography>
                          <Box sx={{ mt: 0.5, p: 1.5, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                            <Typography fontSize="13px" color="text.primary">{appointmentRemark}</Typography>
                          </Box>
                        </Box>
                      )}
                      {treatmentInterest.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>TREATMENT INTEREST</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
                            {treatmentInterest.map((t, i) => <Chip key={i} label={t} size="small" sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 500, mb: 0.5 }} />)}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Card>
                ) : (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <EventNoteIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Appointment Booked</Typography>
                    <Typography variant="caption" color="text.secondary">This lead has no appointment scheduled yet.</Typography>
                  </Box>
                )}
              </Box>
            </>
          )}

          {/* SMS */}
          {historyView === "sms" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SmsOutlinedIcon sx={{ color: "#8B5CF6", fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>SMS History</Typography>
                    <Chip label={`${smsHistory.length} messages`} size="small" sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 600, fontSize: "11px", height: 20 }} />
                  </Stack>
                  <IconButton size="small" onClick={onRefreshSmsHistory} sx={{ bgcolor: "#F8FAFC", "&:hover": { bgcolor: "#E2E8F0" } }}>
                    <Typography fontSize="11px" px={1}>Refresh</Typography>
                  </IconButton>
                </Stack>
              </Box>
              <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                {smsHistoryLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading SMS history...</Typography></Stack></Box>
                ) : smsHistoryError ? (
                  <Alert severity="error" sx={{ borderRadius: "10px" }}>{smsHistoryError}</Alert>
                ) : smsHistory.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <SmsOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No SMS Sent Yet</Typography>
                    <Typography variant="caption" color="text.secondary">SMS messages sent to this lead will appear here.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {smsHistory.map((sms) => {
                      const ss = getSMSStatusColor(sms.status);
                      return (
                        <Card key={sms.id} sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ p: 0.8, bgcolor: "#F5F3FF", borderRadius: "8px" }}><SmsOutlinedIcon sx={{ color: "#8B5CF6", fontSize: 16 }} /></Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.6rem" }}>{sms.direction === "outbound" ? "Sent To" : "Received From"}</Typography>
                                <Typography fontWeight={600} fontSize="13px">{sms.to_number}</Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip label={sms.status || "sent"} size="small" sx={{ bgcolor: ss.bg, color: ss.color, fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" }} />
                              <Typography variant="caption" color="text.secondary" fontSize="11px">{formatDateTime(sms.created_at)}</Typography>
                            </Stack>
                          </Stack>
                          <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                            <Typography fontSize="13px" color="text.primary" sx={{ lineHeight: 1.6 }}>{sms.body}</Typography>
                          </Box>
                          <Stack direction="row" justifyContent="space-between" mt={1}>
                            <Typography variant="caption" color="text.secondary">From: {sms.from_number}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "10px" }}>SID: {sms.sid.slice(0, 20)}...</Typography>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {/* CALL */}
          {historyView === "call" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CallOutlinedIcon sx={{ color: "#10B981", fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Call History</Typography>
                    <Chip label={`${callHistory.length} calls`} size="small" sx={{ bgcolor: "#F0FDF4", color: "#10B981", fontWeight: 600, fontSize: "11px", height: 20 }} />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={onRefreshCallHistory} sx={{ bgcolor: "#F8FAFC", "&:hover": { bgcolor: "#E2E8F0" } }}>
                      <Typography fontSize="11px" px={1}>Refresh</Typography>
                    </IconButton>
                    <Button size="small" variant="outlined" startIcon={<PhoneIcon sx={{ fontSize: 15 }} />} onClick={handleCallOpen}
                      sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, borderRadius: "8px", borderColor: "#BBF7D0", color: "#10B981", bgcolor: "#F0FDF4", px: 1.5, py: 0.5, "&:hover": { bgcolor: "#DCFCE7", borderColor: "#86EFAC" } }}>
                      Call
                    </Button>
                  </Stack>
                </Stack>
              </Box>
              <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                {callHistoryLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading call history...</Typography></Stack></Box>
                ) : callHistoryError ? (
                  <Alert severity="error" sx={{ borderRadius: "10px" }}>{callHistoryError}</Alert>
                ) : callHistory.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <CallOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Calls Made Yet</Typography>
                    <Typography variant="caption" color="text.secondary">Calls made to this lead will appear here.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {callHistory.map((call) => {
                      const cs = getCallStatusColor(call.status);
                      return (
                        <Card key={call.id} sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ p: 1, bgcolor: "#F0FDF4", borderRadius: "8px" }}><CallOutlinedIcon sx={{ color: "#10B981", fontSize: 20 }} /></Box>
                              <Box>
                                <Typography fontWeight={700} fontSize="13px">Outbound Call</Typography>
                                <Typography variant="caption" color="text.secondary">To: {call.to_number}</Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip label={call.status || "initiated"} size="small" sx={{ bgcolor: cs.bg, color: cs.color, fontWeight: 600, fontSize: "11px", height: 20, textTransform: "capitalize" }} />
                              <Typography variant="caption" color="text.secondary" fontSize="11px">{formatDateTime(call.created_at)}</Typography>
                            </Stack>
                          </Stack>
                          <Divider sx={{ my: 1.5 }} />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">From: {call.from_number}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "10px" }}>SID: {call.sid.slice(0, 20)}...</Typography>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {/* CHATBOT */}
          {historyView === "chatbot" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0" bgcolor="#FFFFFF">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ p: 0.8, bgcolor: "#F5F3FF", borderRadius: "8px" }}><ChatBubbleOutlineIcon sx={{ color: "#8B5CF6", fontSize: 18 }} /></Box>
                  <Typography variant="subtitle1" fontWeight={700}>Chatbot</Typography>
                </Stack>
              </Box>
              <Box sx={{ flexGrow: 1, px: 3, py: 2, overflowY: "auto", bgcolor: "#FFFFFF", display: "flex", flexDirection: "column" }}>
                {groupedMessages.map((group) => (
                  <Box key={group.dateLabel}>
                    <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                      <Typography fontSize="11px" fontWeight={600} color="#94A3B8" sx={{ letterSpacing: "0.05em" }}>{group.dateLabel}</Typography>
                    </Box>
                    <Stack spacing={1.5}>
                      {group.messages.map((msg) => (
                        <Box key={msg.id} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                          <Box sx={{ maxWidth: "70%" }}>
                            <Box sx={{ px: 2, py: 1.25, borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", bgcolor: msg.role === "user" ? "#EDE9FE" : "#F8FAFC", border: "1px solid", borderColor: msg.role === "user" ? "#DDD6FE" : "#E2E8F0" }}>
                              <Typography fontSize="13.5px" sx={{ color: "#1E293B", lineHeight: 1.65 }}>{msg.text}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ display: "block", fontSize: "11px", color: "#94A3B8", mt: 0.4, textAlign: msg.role === "user" ? "right" : "left" }}>{formatChatTime(msg.timestamp)}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
                {botTyping && (
                  <Box sx={{ display: "flex", mt: 1.5 }}>
                    <Box sx={{ px: 2, py: 1.25, bgcolor: "#F8FAFC", borderRadius: "18px 18px 18px 4px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 0.5 }}>
                      {[0, 1, 2].map((i) => <Box key={i} sx={{ width: 6, height: 6, bgcolor: "#94A3B8", borderRadius: "50%", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s`, "@keyframes bounce": { "0%,80%,100%": { transform: "scale(0.8)", opacity: 0.5 }, "40%": { transform: "scale(1.2)", opacity: 1 } } }} />)}
                    </Box>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Box>
              <Box sx={{ p: 1.5, borderTop: "1px solid #E2E8F0", bgcolor: "#FFFFFF", borderRadius: "0 0 16px 16px" }}>
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField fullWidth multiline maxRows={3} size="small" placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown} disabled={botTyping}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px", bgcolor: "#F8FAFC", "& fieldset": { borderColor: "#E2E8F0" }, "&:hover fieldset": { borderColor: "#CBD5E1" }, "&.Mui-focused fieldset": { borderColor: "#94A3B8", borderWidth: "1.5px" } } }} />
                  <IconButton onClick={handleSendChat} disabled={!chatInput.trim() || botTyping}
                    sx={{ width: 40, height: 40, borderRadius: "10px", flexShrink: 0, bgcolor: chatInput.trim() && !botTyping ? "#1E293B" : "#E2E8F0", color: chatInput.trim() && !botTyping ? "#FFFFFF" : "#94A3B8", transition: "all 0.15s", "&:hover": { bgcolor: chatInput.trim() && !botTyping ? "#0F172A" : "#E2E8F0" }, "&.Mui-disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
                    <SendIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Stack>
                <Typography variant="caption" color="text.secondary" fontSize="10px" sx={{ mt: 0.5, display: "block" }}>Press Enter to send · Shift+Enter for new line</Typography>
              </Box>
            </>
          )}

          {/* EMAIL */}
          {historyView === "email" && (
            <>
              <Box p={2} borderBottom="1px solid #E2E8F0">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Email History</Typography>
                    {!emailHistoryLoading && (
                      <Chip label={`${emailHistory.length} email${emailHistory.length !== 1 ? "s" : ""}`} size="small" sx={{ bgcolor: "#EFF6FF", color: "#3B82F6", fontWeight: 600, fontSize: "11px", height: 20 }} />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton size="small" onClick={onRefreshEmailHistory} disabled={emailHistoryLoading}
                      sx={{ bgcolor: "#F8FAFC", "&:hover": { bgcolor: "#E2E8F0" }, width: 30, height: 30 }}>
                      {emailHistoryLoading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 16, color: "#64748B" }} />}
                    </IconButton>
                    <Button onClick={() => setComposeOpen(true)} size="small" variant="outlined"
                      startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                      sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, borderRadius: "8px", borderColor: "#BFDBFE", color: "#3B82F6", bgcolor: "#EFF6FF", px: 1.5, py: 0.5, "&:hover": { bgcolor: "#DBEAFE", borderColor: "#93C5FD" } }}>
                      New Mail
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                {emailHistoryLoading && (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <Stack alignItems="center" spacing={1}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading email history...</Typography></Stack>
                  </Box>
                )}

                {!emailHistoryLoading && emailHistory.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>No Emails Sent Yet</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Emails sent to this lead will appear here.</Typography>
                    <Button onClick={() => setComposeOpen(true)} size="small" variant="outlined"
                      startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                      sx={{ mt: 2, textTransform: "none", fontSize: "13px", fontWeight: 600, borderRadius: "8px", borderColor: "#BFDBFE", color: "#3B82F6", bgcolor: "#EFF6FF", "&:hover": { bgcolor: "#DBEAFE", borderColor: "#93C5FD" } }}>
                      Send First Email
                    </Button>
                  </Box>
                )}

                {!emailHistoryLoading && emailHistory.length > 0 && (
                  <Stack spacing={2}>
                    {emailHistory.map((mail) => (
                      <Card key={mail.id} sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 40, height: 40, bgcolor: "#FEF2F2", color: "#EF4444", fontSize: 12, fontWeight: 700 }}>CC</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>Crysta Clinic</Typography>
                              <Typography variant="caption" color="text.secondary">{mail.sender_email || "team@crystaivf.com"}</Typography>
                            </Box>
                          </Stack>
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip label={mail.status} size="small" sx={getEmailStatusSx(mail.status)} />
                            <Typography variant="caption" color="text.secondary" fontSize="11px">
                              {mail.created_at ? new Date(mail.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* Recipient rows */}
                        <Stack spacing={0.4} mb={1}>
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.6rem", minWidth: 28, mt: "1px" }}>To:</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              <Chip label={leadEmail && leadEmail !== "N/A" ? leadEmail : leadName} size="small"
                                sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", fontWeight: 500, fontSize: "11px", height: 20, borderRadius: "4px" }} />
                              {((mail as LeadMailListItem & { additional_to?: string[] }).additional_to ?? []).map((e: string) => (
                                <Chip key={e} label={e} size="small"
                                  sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", fontWeight: 500, fontSize: "11px", height: 20, borderRadius: "4px" }} />
                              ))}
                            </Box>
                          </Stack>
                          {((mail as LeadMailListItem & { cc?: string[] }).cc ?? []).length > 0 && (
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.6rem", minWidth: 28, mt: "1px" }}>Cc:</Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {((mail as LeadMailListItem & { cc?: string[] }).cc ?? []).map((e: string) => (
                                  <Chip key={e} label={e} size="small"
                                    sx={{ bgcolor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", fontWeight: 500, fontSize: "11px", height: 20, borderRadius: "4px" }} />
                                ))}
                              </Box>
                            </Stack>
                          )}
                          {((mail as LeadMailListItem & { bcc?: string[] }).bcc ?? []).length > 0 && (
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.6rem", minWidth: 28, mt: "1px" }}>Bcc:</Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {((mail as LeadMailListItem & { bcc?: string[] }).bcc ?? []).map((e: string) => (
                                  <Chip key={e} label={e} size="small"
                                    sx={{ bgcolor: "#FFF7ED", color: "#EA580C", border: "1px solid #FED7AA", fontWeight: 500, fontSize: "11px", height: 20, borderRadius: "4px" }} />
                                ))}
                              </Box>
                            </Stack>
                          )}
                        </Stack>

                        <Typography variant="body2" fontWeight={700} color="#1E293B" mb={1}>{mail.subject}</Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography component="pre" sx={{ fontSize: "13px", color: "text.secondary", lineHeight: 1.75, fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                          {stripHtml(mail.email_body || "")}
                        </Typography>
                        {mail.sent_at && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
                            <Typography variant="caption" color="text.secondary" fontSize="11px">
                              ✅ Sent at {new Date(mail.sent_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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

      <Snackbar open={callSnackbar.open} autoHideDuration={4000} onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))} severity="error" sx={{ borderRadius: "10px" }}>
          {callSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default HistoryTab;