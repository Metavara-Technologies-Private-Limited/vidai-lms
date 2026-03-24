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
  ClickAwayListener,
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
import { toast } from "react-toastify";

// ── Shared toast options ──────────────────────────────────────────────────────
const toastOptions      = { position: "top-right" as const, autoClose: 3000, theme: "colored" as const };
const toastErrorOptions = { position: "top-right" as const, autoClose: 4000, theme: "colored" as const };

// ── Clinic ID ─────────────────────────────────────────────────────────────────
const CLINIC_ID = 1;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const isValidEmail = (val: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

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

/* ── Lead suggestion shape ──────────────────────────────────────────────────── */
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
      .filter((l: Lead) => l.email)
      .map((l: Lead) => ({ id: l.id, name: l.full_name || "Unknown", email: l.email as string }));
  } catch {
    return [];
  }
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
  } catch {
    return "";
  }
};

/* ══════════════════════════════════════════════════════════════════════════════
   RecipientField — shared chip-input + lead-search dropdown
   (identical behaviour to LeadsTable.emaildialog.tsx)
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
          {/* Chip + input row */}
          <Box
            onClick={() => inputRef.current?.focus()}
            sx={{
              display: "flex", flexWrap: "wrap", gap: "4px",
              alignItems: "center", minHeight: 34,
              border: "1px solid #E2E8F0", borderRadius: "10px",
              px: 1.25, py: "5px", cursor: "text",
              bgcolor: "#fff",
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
                  bgcolor: chipColor.bg,
                  color: chipColor.text,
                  border: `1px solid ${chipColor.border}`,
                  fontWeight: 500,
                  fontSize: "12px",
                  height: 22,
                  borderRadius: "5px",
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
                  border: "none", outline: "none",
                  fontSize: "13px", lineHeight: "1.5",
                  fontFamily: "inherit", color: "#1E293B",
                  background: "transparent", flex: 1, padding: "2px 0",
                  minWidth: 80,
                }}
              />
            </Box>
          </Box>

          {/* Dropdown */}
          {open && suggestions.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0, right: 0,
                zIndex: 2100,
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
                overflow: "hidden",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {/* Header */}
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
   ComposeDialog — Email compose with From/To/CC/BCC RecipientFields
══════════════════════════════════════════════════════════════════════════════ */
interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onSent: () => void;
}

const ComposeDialog: React.FC<ComposeDialogProps> = ({ open, onClose, lead, onSent }) => {
  const [subject, setSubject]   = React.useState("");
  const [body, setBody]         = React.useState("");
  const [sending, setSending]   = React.useState(false);

  // ── From ────────────────────────────────────────────────────────────────
  const [fromEmail, setFromEmail]   = React.useState("");
  const [loadingFrom, setLoadingFrom] = React.useState(false);

  // ── To / CC / BCC ────────────────────────────────────────────────────────
  const [toEmails, setToEmails]   = React.useState<string[]>([]);
  const [ccEmails, setCcEmails]   = React.useState<string[]>([]);
  const [bccEmails, setBccEmails] = React.useState<string[]>([]);
  const [showCc, setShowCc]       = React.useState(false);
  const [showBcc, setShowBcc]     = React.useState(false);

  // ── Templates ────────────────────────────────────────────────────────────
  const [templates, setTemplates]           = React.useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  const [templateOpen, setTemplateOpen]     = React.useState(false);
  const [templateSearch, setTemplateSearch] = React.useState("");
  const templateAnchorRef = React.useRef<HTMLDivElement>(null);

  // ── Reset on open ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    setSubject(""); setBody("");
    setToEmails(lead.email ? [lead.email] : []);
    setCcEmails([]); setBccEmails([]);
    setShowCc(false); setShowBcc(false);
    setTemplateSearch(""); setTemplateOpen(false);

    // Fetch From email
    setLoadingFrom(true);
    fetchClinicEmail().then((e) => setFromEmail(e)).finally(() => setLoadingFrom(false));

    // Fetch templates
    setTemplatesLoading(true);
    EmailTemplateAPI.list()
      .then((data) => setTemplates(data))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [open, lead.email]);

  const handleTemplateSelect = (tpl: EmailTemplate) => {
    setSubject(tpl.subject || "");
    setBody(stripHtml(tpl.body || ""));
    setTemplateOpen(false);
    setTemplateSearch("");
  };

  const filteredTemplates = React.useMemo(() => {
    const q = templateSearch.toLowerCase();
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.subject || "").toLowerCase().includes(q)
    );
  }, [templates, templateSearch]);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      await LeadEmailAPI.sendNow({
        lead: lead.id,
        subject,
        email_body: body.trim(),
        sender_email: fromEmail || null,
        cc: ccEmails,
        bcc: bccEmails,
        additional_to: toEmails.filter((e) => e !== lead.email),
        scheduled_at: null,
      });
      toast.success(`Email sent to ${lead.full_name || "Patient"}!`, toastOptions);
      setTimeout(() => { onSent(); onClose(); }, 800);
    } catch {
      toast.error("Failed to send email. Please try again.", toastErrorOptions);
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

          {/* ── FROM ──────────────────────────────────────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5, py: 0.75, borderBottom: "1px solid #F1F5F9" }}>
            <Typography fontSize="13px" color="text.secondary" minWidth={48} fontWeight={500} flexShrink={0}>From:</Typography>
            {loadingFrom ? (
              <CircularProgress size={13} sx={{ color: "#94A3B8" }} />
            ) : (
              <Typography fontSize="13px" color="#1E293B" fontWeight={500}>{fromEmail || "—"}</Typography>
            )}
          </Box>

          {/* ── TO ────────────────────────────────────────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0, flexDirection: "column", gap: "6px" }}>
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
          </Box>

          {/* ── CC ────────────────────────────────────────────────────────── */}
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

          {/* ── BCC ───────────────────────────────────────────────────────── */}
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

          {/* ── Template picker ───────────────────────────────────────────── */}
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
                  {/* Search inside template dropdown */}
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

          {/* ── Subject ───────────────────────────────────────────────────── */}
          <TextField
            fullWidth size="small" label="Subject" value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <TextField
            fullWidth multiline rows={6} label="Message" value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={sending}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={onClose} size="small"
              sx={{ textTransform: "none", borderRadius: "10px", color: "#64748B", border: "1px solid #E2E8F0", px: 2 }}>
              Cancel
            </Button>
            <Button onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim() || toEmails.length === 0}
              size="small"
              startIcon={sending ? <CircularProgress size={13} /> : <SendRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: "none", borderRadius: "10px", bgcolor: "#2f2f2f", color: "#fff", px: 2, fontWeight: 600, "&:hover": { bgcolor: "#111" }, "&.Mui-disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
              {sending ? "Sending…" : "Send Now"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   SMSDialog — unchanged from original
══════════════════════════════════════════════════════════════════════════════ */
interface SMSDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onSent: () => void;
}

const SMSDialog: React.FC<SMSDialogProps> = ({ open, onClose, lead, onSent }) => {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const handleClose = () => { if (sending) return; setMessage(""); onClose(); };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await TwilioAPI.sendSMS({ lead_uuid: lead.id, to: lead.contact_no, message: message.trim() });
      toast.success(`SMS sent to ${lead.full_name || "Patient"}!`, toastOptions);
      setTimeout(() => { onSent(); onClose(); setMessage(""); }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send SMS. Please try again.";
      toast.error(msg, toastErrorOptions);
    } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
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
              {lead.contact_no && (
                <Typography component="span" fontSize={12} color="text.secondary" fontWeight={400} ml={1}>{lead.contact_no}</Typography>
              )}
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
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   Main component — LeadsConversation (unchanged layout)
══════════════════════════════════════════════════════════════════════════════ */
export default function LeadsConversation() {
  const allLeads = useSelector(selectLeads);
  const leads = React.useMemo(() => allLeads.filter((l) => l.is_active !== false), [allLeads]);

  const [search, setSearch]         = React.useState("");
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);
  const [activeTab, setActiveTab]   = React.useState<TabType>("email");

  const [emailHistory, setEmailHistory]   = React.useState<LeadMailListItem[]>([]);
  const [emailLoading, setEmailLoading]   = React.useState(false);
  const [emailError, setEmailError]       = React.useState<string | null>(null);
  const [composeOpen, setComposeOpen]     = React.useState(false);

  const [smsHistory, setSmsHistory]       = React.useState<TwilioSMS[]>([]);
  const [smsLoading, setSmsLoading]       = React.useState(false);
  const [smsError, setSmsError]           = React.useState<string | null>(null);
  const [smsComposeOpen, setSmsComposeOpen] = React.useState(false);

  const [callHistory, setCallHistory]     = React.useState<TwilioCall[]>([]);
  const [callLoading, setCallLoading]     = React.useState(false);
  const [callError, setCallError]         = React.useState<string | null>(null);

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
        `${(import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"}/twilio/sms/?lead_uuid=${id}`,
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
        `${(import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"}/twilio/calls/?lead_uuid=${id}`,
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
    sms:   smsHistory.length,
    call:  callHistory.length,
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
                {activeLead.department_name    && <Chip label={activeLead.department_name}                   size="small" sx={{ bgcolor: "#f3f4f6", color: "#374151",  fontSize: 11 }} />}
                {activeLead.treatment_interest && <Chip label={activeLead.treatment_interest}                size="small" sx={{ bgcolor: "#ede9fe", color: "#7b61ff",  fontSize: 11 }} />}
                {activeLead.source             && <Chip label={`Source: ${activeLead.source}`}               size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a",  fontSize: 11 }} />}
                {activeLead.assigned_to_name   && <Chip label={`Assigned: ${activeLead.assigned_to_name}`}  size="small" sx={{ bgcolor: "#fff7ed", color: "#ea580c",  fontSize: 11 }} />}
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
                        <Typography component="pre" sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.75, fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
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
              <IconButton
                onClick={() => { if (activeTab === "email") fetchEmails(activeLead.id); if (activeTab === "sms") fetchSMS(activeLead.id); if (activeTab === "call") fetchCalls(activeLead.id); }}
                title="Refresh"
                sx={{ bgcolor: "#f3f4f6", borderRadius: "12px", width: 40, height: 40, "&:hover": { bgcolor: "#e5e7eb" } }}>
                <RefreshIcon sx={{ fontSize: 18, color: "#374151" }} />
              </IconButton>
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", bgcolor: "#f6f7fb", borderRadius: "14px", px: 2, py: 1, cursor: "pointer", gap: 1 }} onClick={handleCompose}>
                {activeTab === "sms"
                  ? <SmsOutlinedIcon sx={{ color: "#9ca3af", fontSize: 16 }} />
                  : <EmailOutlinedIcon sx={{ color: "#9ca3af", fontSize: 16 }} />}
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