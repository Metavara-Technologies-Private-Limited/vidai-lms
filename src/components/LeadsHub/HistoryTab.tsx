import * as React from "react";
import {
  Box, Button, Typography, Stack, Chip, CircularProgress,
  IconButton, Card, Divider, Avatar, Alert, Snackbar, TextField,
  Dialog, DialogTitle, DialogContent, Paper, ClickAwayListener,
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
import SendRoundedIcon from "@mui/icons-material/SendRounded";

import { TimelineItem } from "./LeadDetailSubComponents";
import { getCallStatusColor, getSMSStatusColor, formatDateTime } from "./LeadDetailHelpers";
import type { LeadRecord, TwilioCall, TwilioSMS, HistoryView } from "./LeadDetailTypes";
import type { LeadMailListItem, EmailTemplate } from "../../services/leads.api";
import { TwilioAPI, LeadEmailAPI, EmailTemplateAPI } from "../../services/leads.api";
import CallDialog from "./CallDialog";
import { toast } from "react-toastify";

// ── Clinic ID ─────────────────────────────────────────────────────────────────
const CLINIC_ID = 1;

// ── Toast options ─────────────────────────────────────────────────────────────
const toastOptions      = { position: "top-right" as const, autoClose: 3000, theme: "colored" as const };
const toastErrorOptions = { position: "top-right" as const, autoClose: 4000, theme: "colored" as const };

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

const isValidEmail = (val: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

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

/* ── Lead suggestion shape ───────────────────────────────────────────────────── */
interface LeadSuggestion {
  id: number | string;
  name: string;
  email: string;
}

/* ── Fetch lead suggestions ──────────────────────────────────────────────────── */
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
        id: l.id,
        name: l.full_name || l.name || "Unknown",
        email: l.email,
      }));
  } catch { return []; }
};

/* ── Fetch clinic From email ─────────────────────────────────────────────────── */
const fetchClinicEmail = async (): Promise<string> => {
  try {
    const res = await fetch(
      `/api/clinics/${CLINIC_ID}/detail/`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` } }
    );
    if (!res.ok) return "";
    const data = await res.json();
    return data.email ?? "";
  } catch { return ""; }
};

/* ══════════════════════════════════════════════════════════════════════════════
   RecipientField — chip input + lead-search dropdown
   (identical to LeadsTable.emaildialog.tsx and LeadsConversation.tsx)
══════════════════════════════════════════════════════════════════════════════ */
interface RecipientFieldProps {
  label: string;
  chips: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
  chipColor: { bg: string; text: string; border: string };
  placeholder?: string;
  onDismiss?: () => void;
  disabled?: boolean;
}

const RecipientField: React.FC<RecipientFieldProps> = ({
  label, chips, onAdd, onRemove, chipColor,
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
    if (e.key === "ArrowDown") {
      e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && suggestions[highlightIdx]) pick(suggestions[highlightIdx]);
      else commit(inputValue);
    } else if (["Tab", ","].includes(e.key)) {
      e.preventDefault(); commit(inputValue);
    } else if (e.key === "Backspace" && !inputValue && chips.length) {
      onRemove(chips[chips.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, position: "relative" }}>
      {label && (
        <Typography fontSize="13px" color="text.secondary" minWidth={48} mt="7px" flexShrink={0} fontWeight={500}>
          {label}
        </Typography>
      )}

      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <Box ref={containerRef} sx={{ flex: 1, position: "relative" }}>
          {/* Chip + input area */}
          <Box
            onClick={() => inputRef.current?.focus()}
            sx={{
              display: "flex", flexWrap: "wrap", gap: "4px",
              alignItems: "center", minHeight: 34,
              border: "1px solid #E2E8F0", borderRadius: "10px",
              px: 1.25, py: "5px", cursor: "text", bgcolor: "#fff",
              "&:focus-within": { borderColor: "#3B82F6", boxShadow: "0 0 0 2px rgba(59,130,246,0.12)" },
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          >
            {chips.map((email) => (
              <Chip
                key={email}
                label={email}
                size="small"
                onDelete={() => onRemove(email)}
                deleteIcon={<CloseIcon sx={{ fontSize: "11px !important" }} />}
                sx={{
                  bgcolor: chipColor.bg, color: chipColor.text,
                  border: `1px solid ${chipColor.border}`,
                  fontWeight: 500, fontSize: "12px", height: 22, borderRadius: "5px",
                  "& .MuiChip-label": { px: "8px" },
                  "& .MuiChip-deleteIcon": { color: chipColor.text, opacity: 0.5, ml: "2px", mr: "4px", "&:hover": { opacity: 1 } },
                }}
              />
            ))}
            <Box sx={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, minWidth: 120 }}>
              {loading && <CircularProgress size={11} sx={{ color: "#94A3B8", flexShrink: 0 }} />}
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => { commit(inputValue); setOpen(false); }, 160)}
                onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
                placeholder={chips.length === 0 ? placeholder : ""}
                disabled={disabled}
                style={{
                  border: "none", outline: "none", fontSize: "13px", lineHeight: "1.5",
                  fontFamily: "inherit", color: "#1E293B",
                  background: "transparent", flex: 1, padding: "2px 0", minWidth: 80,
                }}
              />
            </Box>
          </Box>

          {/* Dropdown */}
          {open && suggestions.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                zIndex: 2100, borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
                overflow: "hidden", maxHeight: 220, overflowY: "auto",
              }}
            >
              <Box sx={{ px: 2, py: 0.75, bgcolor: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                <Typography fontSize="11px" color="#94A3B8" fontWeight={600} letterSpacing="0.04em" textTransform="uppercase">
                  Leads
                </Typography>
              </Box>
              {suggestions.map((s, idx) => (
                <Box
                  key={s.id}
                  onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    px: 2, py: 1, cursor: "pointer",
                    bgcolor: idx === highlightIdx ? "#F0F7FF" : "#fff",
                    borderBottom: "1px solid #F8FAFC",
                    "&:last-child": { borderBottom: "none" },
                    transition: "background 0.1s",
                  }}
                >
                  <Box sx={{
                    width: 28, height: 28, borderRadius: "50%",
                    bgcolor: idx === highlightIdx ? "#DBEAFE" : "#EFF6FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "background 0.1s",
                  }}>
                    <Typography fontSize="11px" fontWeight={700} color="#2563EB">
                      {s.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontSize="13px" fontWeight={600} color="#1E293B" noWrap>{s.name}</Typography>
                    <Typography fontSize="11.5px" color="#64748B" noWrap>{s.email}</Typography>
                  </Box>
                  {idx === highlightIdx && (
                    <Typography fontSize="10px" color="#93C5FD" fontWeight={500}>↵ select</Typography>
                  )}
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </ClickAwayListener>

      {onDismiss && (
        <IconButton size="small" onClick={onDismiss} sx={{ color: "#CBD5E1", mt: "2px", flexShrink: 0, "&:hover": { color: "#94A3B8" } }}>
          <CloseIcon sx={{ fontSize: 13 }} />
        </IconButton>
      )}
    </Box>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   ComposeEmailDialog — full From/To/CC/BCC + template picker
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
  const [subject, setSubject]   = React.useState("");
  const [body, setBody]         = React.useState("");
  const [sending, setSending]   = React.useState(false);

  // ── From ─────────────────────────────────────────────────────────────────
  const [fromEmail, setFromEmail]     = React.useState("");
  const [loadingFrom, setLoadingFrom] = React.useState(false);

  // ── To / CC / BCC ─────────────────────────────────────────────────────────
  const [toEmails, setToEmails]   = React.useState<string[]>([]);
  const [ccEmails, setCcEmails]   = React.useState<string[]>([]);
  const [bccEmails, setBccEmails] = React.useState<string[]>([]);
  const [showCc, setShowCc]       = React.useState(false);
  const [showBcc, setShowBcc]     = React.useState(false);

  // ── Templates ─────────────────────────────────────────────────────────────
  const [templates, setTemplates]               = React.useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  const [templateOpen, setTemplateOpen]         = React.useState(false);
  const [templateSearch, setTemplateSearch]     = React.useState("");
  const templateAnchorRef = React.useRef<HTMLDivElement>(null);

  // ── Reset on open ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    setSubject(""); setBody("");
    setToEmails(leadEmail && leadEmail !== "N/A" ? [leadEmail] : []);
    setCcEmails([]); setBccEmails([]);
    setShowCc(false); setShowBcc(false);
    setTemplateSearch(""); setTemplateOpen(false);

    setLoadingFrom(true);
    fetchClinicEmail().then((e) => setFromEmail(e)).finally(() => setLoadingFrom(false));

    setTemplatesLoading(true);
    EmailTemplateAPI.list()
      .then((data) => setTemplates(data))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [open, leadEmail]);

  const filteredTemplates = React.useMemo(() => {
    const q = templateSearch.toLowerCase();
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.subject || "").toLowerCase().includes(q)
    );
  }, [templates, templateSearch]);

  const handleTemplateSelect = (tpl: EmailTemplate) => {
    // Replace {{name}} placeholders with lead name
    const name = leadName || "Patient";
    const rawBody = (tpl.body || "")
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{lead_name\}\}/g, name)
      .replace(/\{\{lead_first_name\}\}/g, name.split(" ")[0]);
    setSubject(tpl.subject || "");
    setBody(stripHtml(rawBody));
    setTemplateOpen(false);
    setTemplateSearch("");
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || toEmails.length === 0) return;
    setSending(true);
    try {
      await LeadEmailAPI.sendNow({
        lead: lead.id,
        subject,
        email_body: body.trim(),
        sender_email: fromEmail || null,
        cc: ccEmails,
        bcc: bccEmails,
        additional_to: toEmails.filter((e) => e !== leadEmail),
        scheduled_at: null,
      });
      toast.success(`Email sent to ${leadName || "Patient"}!`, toastOptions);
      setTimeout(() => { onSent(); onClose(); }, 800);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to send email. Please try again."), toastErrorOptions);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <EmailOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
            <Typography fontWeight={700}>New Email</Typography>
          </Stack>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5 }}>
        <Stack spacing={1.5} mt={0.5}>

          {/* ── FROM ────────────────────────────────────────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5, py: 0.75, borderBottom: "1px solid #F1F5F9" }}>
            <Typography fontSize="13px" color="text.secondary" minWidth={48} fontWeight={500} flexShrink={0}>From:</Typography>
            {loadingFrom
              ? <CircularProgress size={13} sx={{ color: "#94A3B8" }} />
              : <Typography fontSize="13px" color="#1E293B" fontWeight={500}>{fromEmail || "—"}</Typography>
            }
          </Box>

          {/* ── TO ──────────────────────────────────────────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, width: "100%" }}>
            <Box sx={{ flex: 1 }}>
              <RecipientField
                label="To:"
                chips={toEmails}
                onAdd={(e) => setToEmails((p) => [...p, e])}
                onRemove={(e) => setToEmails(toEmails.filter((x) => x !== e))}
                chipColor={{ bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" }}
                placeholder="Search leads or type email..."
                disabled={sending}
              />
            </Box>
            {/* Cc / Bcc toggles */}
            <Stack direction="row" spacing={0.75} alignItems="center" mt="9px" flexShrink={0}>
              {!showCc && (
                <Typography fontSize="12px" color="#64748B" fontWeight={500}
                  sx={{ cursor: "pointer", "&:hover": { color: "#1D4ED8" }, userSelect: "none" }}
                  onClick={() => setShowCc(true)}>Cc</Typography>
              )}
              {(!showCc || !showBcc) && <Typography fontSize="12px" color="#CBD5E1">|</Typography>}
              {!showBcc && (
                <Typography fontSize="12px" color="#64748B" fontWeight={500}
                  sx={{ cursor: "pointer", "&:hover": { color: "#1D4ED8" }, userSelect: "none" }}
                  onClick={() => setShowBcc(true)}>Bcc</Typography>
              )}
            </Stack>
          </Box>

          {/* ── CC ──────────────────────────────────────────────────────────── */}
          {showCc && (
            <RecipientField
              label="Cc:"
              chips={ccEmails}
              onAdd={(e) => setCcEmails((p) => [...p, e])}
              onRemove={(e) => setCcEmails(ccEmails.filter((x) => x !== e))}
              chipColor={{ bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" }}
              placeholder="Search leads or type email..."
              onDismiss={() => { setShowCc(false); setCcEmails([]); }}
              disabled={sending}
            />
          )}

          {/* ── BCC ─────────────────────────────────────────────────────────── */}
          {showBcc && (
            <RecipientField
              label="Bcc:"
              chips={bccEmails}
              onAdd={(e) => setBccEmails((p) => [...p, e])}
              onRemove={(e) => setBccEmails(bccEmails.filter((x) => x !== e))}
              chipColor={{ bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" }}
              placeholder="Search leads or type email..."
              onDismiss={() => { setShowBcc(false); setBccEmails([]); }}
              disabled={sending}
            />
          )}

          <Divider />

          {/* ── Template picker ─────────────────────────────────────────────── */}
          <ClickAwayListener onClickAway={() => setTemplateOpen(false)}>
            <Box ref={templateAnchorRef} sx={{ position: "relative" }}>
              <Box
                onClick={() => !templatesLoading && setTemplateOpen((p) => !p)}
                sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  px: 1.5, py: 1, borderRadius: "10px",
                  border: "1px solid #E2E8F0", cursor: "pointer", bgcolor: "#F8FAFC",
                  "&:hover": { bgcolor: "#F1F5F9", borderColor: "#CBD5E1" },
                  transition: "all 0.15s",
                }}
              >
                <Typography fontSize="13px" color={templatesLoading ? "#94A3B8" : "#374151"}>
                  {templatesLoading ? "Loading templates…" : "Use email template (optional)"}
                </Typography>
                {templatesLoading
                  ? <CircularProgress size={13} sx={{ color: "#94A3B8" }} />
                  : <Typography fontSize="11px" color="#94A3B8">{templateOpen ? "▲" : "▼"}</Typography>
                }
              </Box>

              {templateOpen && (
                <Paper
                  elevation={0}
                  sx={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    zIndex: 1500, border: "1px solid #E2E8F0", borderRadius: "10px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.09)",
                    overflow: "hidden", maxHeight: 260,
                  }}
                >
                  <Box sx={{ px: 1.5, py: 1, borderBottom: "1px solid #F1F5F9", bgcolor: "#F8FAFC" }}>
                    <input
                      autoFocus
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      placeholder="Search templates..."
                      style={{
                        width: "100%", border: "none", outline: "none", fontSize: "13px",
                        fontFamily: "inherit", background: "transparent", color: "#1E293B",
                      }}
                    />
                  </Box>
                  <Box sx={{ overflowY: "auto", maxHeight: 200 }}>
                    {filteredTemplates.length === 0 ? (
                      <Box sx={{ py: 3, textAlign: "center" }}>
                        <Typography fontSize="13px" color="text.secondary">No templates found.</Typography>
                      </Box>
                    ) : (
                      filteredTemplates.map((tpl) => (
                        <Box
                          key={tpl.id}
                          onMouseDown={(e) => { e.preventDefault(); handleTemplateSelect(tpl); }}
                          sx={{
                            px: 2, py: 1.25, cursor: "pointer",
                            borderBottom: "1px solid #F8FAFC",
                            "&:last-child": { borderBottom: "none" },
                            "&:hover": { bgcolor: "#F0F7FF" },
                            transition: "background 0.1s",
                          }}
                        >
                          <Typography fontSize="13px" fontWeight={600} color="#1E293B">{tpl.name}</Typography>
                          {tpl.subject && (
                            <Typography fontSize="11.5px" color="#64748B" noWrap>Subject: {tpl.subject}</Typography>
                          )}
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          </ClickAwayListener>

          {/* ── Subject ─────────────────────────────────────────────────────── */}
          <TextField
            fullWidth size="small" label="Subject" value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />

          {/* ── Body ────────────────────────────────────────────────────────── */}
          <TextField
            fullWidth multiline rows={6} label="Message" value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={sending}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />

          {/* ── Actions ─────────────────────────────────────────────────────── */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={onClose} size="small"
              sx={{ textTransform: "none", borderRadius: "10px", color: "#64748B", border: "1px solid #E2E8F0", px: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim() || toEmails.length === 0}
              size="small"
              startIcon={sending ? <CircularProgress size={13} /> : <SendRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: "none", borderRadius: "10px", bgcolor: "#2f2f2f", color: "#fff", px: 2, fontWeight: 600, "&:hover": { bgcolor: "#111" }, "&.Mui-disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}
            >
              {sending ? "Sending…" : "Send Now"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   ChatMessage type
══════════════════════════════════════════════════════════════════════════════ */
interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

/* ══════════════════════════════════════════════════════════════════════════════
   HistoryTabProps
══════════════════════════════════════════════════════════════════════════════ */
interface HistoryTabProps {
  lead: LeadRecord;
  historyView: HistoryView;
  setHistoryView: (view: HistoryView) => void;
  onComposeEmail: () => void;   // kept for backward compat but no longer used internally
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

  // ── Compose dialog ────────────────────────────────────────────────────────
  const [composeOpen, setComposeOpen] = React.useState(false);

  // ── Call ──────────────────────────────────────────────────────────────────
  const [callDialogOpen, setCallDialogOpen] = React.useState(false);
  const [callSnackbar, setCallSnackbar]     = React.useState<{ open: boolean; message: string }>({ open: false, message: "" });

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

  // ── Chatbot ───────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    { id: "welcome", role: "bot", text: "Hello! How can I help you today?", timestamp: new Date() },
  ]);
  const [chatInput, setChatInput]   = React.useState("");
  const [botTyping, setBotTyping]   = React.useState(false);
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
      {/* ── Compose Email Dialog ────────────────────────────────────────────── */}
      <ComposeEmailDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        lead={lead}
        leadEmail={leadEmail}
        leadName={leadName}
        onSent={() => { onRefreshEmailHistory(); }}
      />

      <Stack direction="row" spacing={3}>

        {/* ── LEFT: Activity Timeline ─────────────────────────────────────── */}
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

        {/* ── RIGHT: Detail Panel ─────────────────────────────────────────── */}
        <Card sx={{ flex: 2, borderRadius: "16px", display: "flex", flexDirection: "column", maxHeight: "600px" }}>

          {/* APPOINTMENT VIEW */}
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

          {/* SMS VIEW */}
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

          {/* CALL VIEW */}
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

          {/* CHATBOT VIEW */}
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

          {/* EMAIL VIEW */}
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
                    {/* ── "New Mail" now opens internal ComposeEmailDialog ── */}
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
                        {/* ── Header row: sender + status/date ── */}
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

                        {/* ── Recipient rows: To / CC / BCC ── */}
                        <Stack spacing={0.4} mb={1}>
                          {/* To */}
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Typography variant="caption" color="text.secondary" fontWeight={600}
                              sx={{ textTransform: "uppercase", fontSize: "0.6rem", minWidth: 28, mt: "1px" }}>To:</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {/* Primary lead */}
                              <Chip
                                label={leadEmail && leadEmail !== "N/A" ? leadEmail : leadName}
                                size="small"
                                sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", fontWeight: 500, fontSize: "11px", height: 20, borderRadius: "4px" }}
                              />
                              {/* Additional To recipients stored in mail (if API returns them) */}
                              {Array.isArray((mail as LeadMailListItem & { additional_to?: string[] }).additional_to) &&
                                ((mail as LeadMailListItem & { additional_to?: string[] }).additional_to ?? []).map((e: string) => (
                                  <Chip key={e} label={e} size="small"
                                    sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", fontWeight: 500, fontSize: "11px", height: 20, borderRadius: "4px" }} />
                                ))
                              }
                            </Box>
                          </Stack>

                          {/* CC — only if present */}
                          {Array.isArray((mail as LeadMailListItem & { cc?: string[] }).cc) &&
                            ((mail as LeadMailListItem & { cc?: string[] }).cc ?? []).length > 0 && (
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Typography variant="caption" color="text.secondary" fontWeight={600}
                                sx={{ textTransform: "uppercase", fontSize: "0.6rem", minWidth: 28, mt: "1px" }}>Cc:</Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {((mail as LeadMailListItem & { cc?: string[] }).cc ?? []).map((e: string) => (
                                  <Chip key={e} label={e} size="small"
                                    sx={{ bgcolor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", fontWeight: 500, fontSize: "11px", height: 20, borderRadius: "4px" }} />
                                ))}
                              </Box>
                            </Stack>
                          )}

                          {/* BCC — only if present */}
                          {Array.isArray((mail as LeadMailListItem & { bcc?: string[] }).bcc) &&
                            ((mail as LeadMailListItem & { bcc?: string[] }).bcc ?? []).length > 0 && (
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <Typography variant="caption" color="text.secondary" fontWeight={600}
                                sx={{ textTransform: "uppercase", fontSize: "0.6rem", minWidth: 28, mt: "1px" }}>Bcc:</Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {((mail as LeadMailListItem & { bcc?: string[] }).bcc ?? []).map((e: string) => (
                                  <Chip key={e} label={e} size="small"
                                    sx={{ bgcolor: "#FFF7ED", color: "#EA580C", border: "1px solid #FED7AA", fontWeight: 500, fontSize: "11px", height: 20, borderRadius: "4px" }} />
                                ))}
                              </Box>
                            </Stack>
                          )}
                        </Stack>

                        {/* ── Subject ── */}
                        <Typography variant="body2" fontWeight={700} color="#1E293B" mb={1}>{mail.subject}</Typography>
                        <Divider sx={{ mb: 1.5 }} />

                        {/* ── Body ── */}
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