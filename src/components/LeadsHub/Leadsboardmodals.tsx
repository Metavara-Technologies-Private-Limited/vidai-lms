// LeadsboardModals.tsx
// SmsModal, EmailDialog (full Gmail-style), BookAppointmentModal, SuccessToast

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  Fade,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Avatar,
  InputBase,
  Checkbox,
  Popover,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { toast } from "react-toastify";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EventIcon from "@mui/icons-material/Event";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import FormatColorTextOutlinedIcon from "@mui/icons-material/FormatColorTextOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LinkIcon from "@mui/icons-material/Link";

import type { LeadItem, AppointmentState } from "./Leadsboardtypes";
import { TIME_SLOTS } from "./Leadsboardtypes";
import { IS_MEDICAL_APP } from "../../config/appType";
import { EmailTemplateAPI, LeadEmailAPI } from "../../services/leads.api";
import type { EmailTemplate, EmailTemplatePayload } from "../../services/leads.api";

// ── Toast options ─────────────────────────────────────────────────────────────
const toastOptions = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "colored" as const,
};

// ── Shared field style ────────────────────────────────────────────────────────
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 500,
    color: "#111827",
    bgcolor: "#FFFFFF",
    "& fieldset": { borderColor: "#D1D5DB" },
    "&:hover fieldset": { borderColor: "#9CA3AF" },
    "&.Mui-focused fieldset": { borderColor: "#6B7280", borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": {
    fontSize: "13px",
    color: "#9CA3AF",
    "&.Mui-focused": { color: "#374151" },
  },
  "& .MuiSelect-icon": { color: "#374151" },
};

// ── Shared button styles ──────────────────────────────────────────────────────
const outlineBtn = {
  height: 40, px: 3, textTransform: "none" as const, fontWeight: 500,
  borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151",
  bgcolor: "transparent", "&:hover": { bgcolor: "#F9FAFB" },
};
const darkBtn = {
  height: 40, px: 3, textTransform: "none" as const, fontWeight: 600,
  borderRadius: "8px", bgcolor: "#1F2937", color: "white",
  "&:hover": { bgcolor: "#111827" },
  "&:disabled": { bgcolor: "#9CA3AF", color: "white" },
};

// ── Error extractor ───────────────────────────────────────────────────────────
interface ApiErrorShape {
  response?: { data?: { detail?: string; message?: string } };
  message?: string;
}
const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  return e?.response?.data?.detail || e?.response?.data?.message || e?.message || fallback;
};

// ── Strip HTML ────────────────────────────────────────────────────────────────
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

// ── Email validators ──────────────────────────────────────────────────────────
const isValidEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
const normalizeEmail = (val: string) => val.trim().toLowerCase();

// ── Use case chip styles ──────────────────────────────────────────────────────
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
  };
  return map[(useCase ?? "").toLowerCase()] ?? { bgcolor: "#F1F5F9", color: "#64748B" };
};

// ── EMOJI_LIST ────────────────────────────────────────────────────────────────
const EMOJI_LIST = [
  "😊","😀","😂","🥰","😍","🤔","😎","🙏","👍","👏",
  "❤️","🎉","🔥","✅","⭐","📋","📅","💊","🏥","🩺",
  "💉","🧬","🌸","🌟","💙","📞","📧","🕐","✉️","📝",
];

// ══════════════════════════════════════════════════════════════════════════════
// Toolbar sub-components
// ══════════════════════════════════════════════════════════════════════════════

interface EmojiPickerProps { anchorEl: HTMLElement | null; onClose: () => void; onSelect: (e: string) => void; }
const EmojiPicker: React.FC<EmojiPickerProps> = ({ anchorEl, onClose, onSelect }) => (
  <Popover anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}
    PaperProps={{ sx: { borderRadius: "12px", p: 1, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", width: 220 } }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25 }}>
      {EMOJI_LIST.map((emoji) => (
        <Box key={emoji} onClick={() => { onSelect(emoji); onClose(); }}
          sx={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", cursor: "pointer", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9" } }}>
          {emoji}
        </Box>
      ))}
    </Box>
  </Popover>
);

interface FormatMenuProps { anchorEl: HTMLElement | null; onClose: () => void; onFormat: (t: string) => void; }
const FormatMenu: React.FC<FormatMenuProps> = ({ anchorEl, onClose, onFormat }) => (
  <Popover anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}
    PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 160 } }}>
    {[
      { label: "Bold", shortcut: "Ctrl+B" }, { label: "Italic", shortcut: "Ctrl+I" },
      { label: "Underline", shortcut: "Ctrl+U" }, { label: "Strikethrough", shortcut: "" },
      { label: "Bullet list", shortcut: "" }, { label: "Numbered list", shortcut: "" },
      { label: "Quote", shortcut: "" }, { label: "Code", shortcut: "" },
    ].map(({ label, shortcut }) => (
      <MenuItem key={label} onClick={() => { onFormat(label); onClose(); }}
        sx={{ fontSize: "13px", py: 1, display: "flex", justifyContent: "space-between", gap: 2 }}>
        <span>{label}</span>
        {shortcut && <Typography fontSize="11px" color="text.secondary">{shortcut}</Typography>}
      </MenuItem>
    ))}
  </Popover>
);

interface MoreMenuProps { anchorEl: HTMLElement | null; onClose: () => void; onAction: (a: string) => void; }
const MoreMenu: React.FC<MoreMenuProps> = ({ anchorEl, onClose, onAction }) => (
  <Popover anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}
    PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 180 } }}>
    {["Insert signature", "Insert divider", "Insert table", "Clear formatting"].map((action) => (
      <MenuItem key={action} onClick={() => { onAction(action); onClose(); }} sx={{ fontSize: "13px", py: 1 }}>
        {action}
      </MenuItem>
    ))}
  </Popover>
);

// ══════════════════════════════════════════════════════════════════════════════
// RecipientChipRow
// ══════════════════════════════════════════════════════════════════════════════
interface RecipientChipRowProps {
  emails: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onInputBlur: () => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onInputFocus: () => void;
  onRemove: (email: string) => void;
  chipColor: { bg: string; text: string; border: string };
  placeholder?: string;
}

const RecipientChipRow: React.FC<RecipientChipRowProps> = ({
  emails, inputValue, onInputChange, onInputBlur, onInputKeyDown, onInputFocus, onRemove, chipColor, placeholder = "Add recipients",
}) => (
  <Box display="flex" gap={1} flexWrap="wrap" flex={1} minWidth={180} alignItems="center"
    sx={{ maxHeight: "90px", overflowY: "auto",
      "&::-webkit-scrollbar": { width: "6px" },
      "&::-webkit-scrollbar-track": { bgcolor: "#F3F4F6", borderRadius: "3px" },
      "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: "3px" },
    }}>
    {emails.map((email) => (
      <Box key={email} display="flex" alignItems="center" gap={0.75} px={1.2} py={0.4} borderRadius="16px"
        sx={{ bgcolor: chipColor.bg, border: `1px solid ${chipColor.border}` }}>
        <Avatar sx={{ width: 18, height: 18, fontSize: 9, bgcolor: chipColor.text }}>
          {email.charAt(0).toUpperCase()}
        </Avatar>
        <Typography fontSize="12px" fontWeight={500} color={chipColor.text}>{email}</Typography>
        <Box component="span" onClick={() => onRemove(email)}
          sx={{ cursor: "pointer", fontSize: 14, color: chipColor.text, opacity: 0.6, "&:hover": { opacity: 1 }, lineHeight: 1 }}>
          ×
        </Box>
      </Box>
    ))}
    <InputBase value={inputValue} placeholder={emails.length === 0 ? placeholder : ""}
      onFocus={onInputFocus} onChange={(e) => onInputChange(e.target.value)}
      onBlur={onInputBlur} onKeyDown={onInputKeyDown}
      sx={{ minWidth: 140, fontSize: "13px", flex: 1 }} />
  </Box>
);

// ══════════════════════════════════════════════════════════════════════════════
// RecipientPickerPopover
// ══════════════════════════════════════════════════════════════════════════════
interface LeadSuggestion { id: number | string; name: string; email: string; }

interface RecipientPickerPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  paperRef: React.RefObject<HTMLDivElement | null>;
  leads: LeadSuggestion[];
  selectedEmails: string[];
  onToggle: (email: string) => void;
}

const RecipientPickerPopover: React.FC<RecipientPickerPopoverProps> = ({
  open, anchorEl, onClose, paperRef, leads, selectedEmails, onToggle,
}) => (
  <Popover open={open} anchorEl={anchorEl} onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    transformOrigin={{ vertical: "top", horizontal: "left" }}
    disableAutoFocus disableEnforceFocus disableRestoreFocus
    PaperProps={{
      ref: paperRef,
      onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => e.preventDefault(),
      sx: { borderRadius: "10px", border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.09)" },
    }}>
    <Box sx={{ width: 300, maxHeight: 220, overflowY: "auto", p: 1 }}>
      {leads.length === 0 ? (
        <Typography fontSize="13px" color="text.secondary" p={1}>No recipients available</Typography>
      ) : leads.map((r) => (
        <Box key={r.id} onClick={() => onToggle(r.email)}
          sx={{ p: 0.8, borderRadius: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 1, "&:hover": { backgroundColor: "#F5F5F5" } }}>
          <Checkbox size="small"
            checked={selectedEmails.some((m) => normalizeEmail(m) === normalizeEmail(r.email))}
            onChange={() => onToggle(r.email)} />
          <Box>
            <Typography fontSize="13px" fontWeight={500}>{r.name}</Typography>
            <Typography fontSize="12px" color="text.secondary">{r.email}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  </Popover>
);

// ══════════════════════════════════════════════════════════════════════════════
// NewEmailTemplateDialog
// ══════════════════════════════════════════════════════════════════════════════
interface NewEmailTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (tpl: EmailTemplate) => void;
}

const NewEmailTemplateDialog: React.FC<NewEmailTemplateDialogProps> = ({ open, onClose, onSaved }) => {
  const [name, setName]               = React.useState("");
  const [subject, setSubject]         = React.useState("");
  const [description, setDescription] = React.useState("");
  const [body, setBody]               = React.useState("");
  const [saving, setSaving]           = React.useState(false);
  const [error, setError]             = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) { setName(""); setSubject(""); setDescription(""); setBody(""); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim())    { setError("Template name is required."); return; }
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!body.trim())    { setError("Body is required."); return; }
    setSaving(true); setError(null);
    try {
      const saved = await EmailTemplateAPI.create({
        clinic: 1, name: name.trim(), subject: subject.trim(),
        description: description.trim(), use_case: "general",
        body: body.trim(), created_by: 1, is_active: true,
      } as EmailTemplatePayload);
      onSaved(saved); onClose();
    } catch {
      const local: EmailTemplate = {
        id: `local-${Date.now()}`, name: name.trim(),
        subject: subject.trim(), description: description.trim(), body: body.trim(),
      };
      onSaved(local); onClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }} sx={{ zIndex: 1600 }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 0 }}>
        New Email Template
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <TextField label="Template Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="e.g. IVF Follow-Up" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <TextField label="Subject" value={subject} onChange={(e) => { setSubject(e.target.value); setError(null); }}
            placeholder="e.g. Following up on your IVF inquiry" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of when to use this template" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <Box>
            <Typography fontSize="12px" fontWeight={500} color="#374151" mb={0.75}>Body</Typography>
            <textarea value={body} onChange={(e) => { setBody(e.target.value); setError(null); }}
              placeholder="Write your email body here... Use {{name}} for the lead's name."
              rows={8}
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "14px", fontFamily: "inherit", color: "#1E293B", lineHeight: "1.6", border: "1px solid #D1D5DB", borderRadius: "8px", resize: "vertical", outline: "none", background: "#fff" }}
              onFocus={(e) => { e.target.style.borderColor = "#1976d2"; e.target.style.boxShadow = "0 0 0 2px rgba(25,118,210,0.15)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}
            />
            <Typography fontSize="11px" color="#94A3B8" mt={0.5}>Use {"{{name}}"} for lead's name</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={onClose} sx={outlineBtn}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !name.trim() || !subject.trim() || !body.trim()} sx={darkBtn}>
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SuccessToast
// ══════════════════════════════════════════════════════════════════════════════
interface SuccessToastProps { show: boolean; message: string; }

export const SuccessToast: React.FC<SuccessToastProps> = ({ show, message }) => (
  <Fade in={show}>
    <Box sx={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      bgcolor: "#10B981", color: "white", px: 3, py: 1.5, borderRadius: "12px",
      display: "flex", alignItems: "center", gap: 1.5, zIndex: 10000,
      boxShadow: "0px 10px 20px rgba(16,185,129,0.2)",
    }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
      <Typography variant="body2" fontWeight={600}>{message}</Typography>
    </Box>
  </Fade>
);

// ══════════════════════════════════════════════════════════════════════════════
// SmsModal (unchanged)
// ══════════════════════════════════════════════════════════════════════════════
interface SmsModalProps {
  open: boolean;
  selectedLead: LeadItem | null;
  smsMessage: string;
  setSmsMessage: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
}

export const SmsModal: React.FC<SmsModalProps> = ({
  open, selectedLead, smsMessage, setSmsMessage, onClose, onSend,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}>
    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3 }}>
      <Typography variant="h6" fontWeight={800} color="#1E293B">Send SMS</Typography>
      <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} color="#475569" sx={{ mb: 1 }}>To:</Typography>
        <Chip label={selectedLead?.full_name || (selectedLead as unknown as { name?: string })?.name} size="small"
          sx={{ bgcolor: "#EEF2FF", color: "#6366F1", fontWeight: 600, borderRadius: "8px", height: 32, fontSize: "0.875rem" }} />
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={600} color="#475569" sx={{ mb: 1 }}>Message:</Typography>
        <TextField fullWidth multiline rows={6} placeholder="Type your message here..." value={smsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", "& fieldset": { borderColor: "#E2E8F0" }, "&:hover fieldset": { borderColor: "#CBD5E1" }, "&.Mui-focused fieldset": { borderColor: "#6366F1", borderWidth: "2px" } } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "right" }}>
          {smsMessage.length} / 160 characters
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions sx={{ p: 3, borderTop: "1px solid #F1F5F9", gap: 2 }}>
      <Button onClick={onClose} sx={{ flex: 1, color: "#64748B", textTransform: "none", fontWeight: 700, borderRadius: "12px", border: "1px solid #E2E8F0", py: 1.2 }}>Cancel</Button>
      <Button variant="contained" onClick={onSend} disabled={!smsMessage.trim()} endIcon={<SendIcon sx={{ fontSize: 16 }} />}
        sx={{ flex: 1, bgcolor: "#334155", borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.2, "&:hover": { bgcolor: "#1e293b" }, "&:disabled": { bgcolor: "#CBD5E1" } }}>
        Send
      </Button>
    </DialogActions>
  </Dialog>
);

// ══════════════════════════════════════════════════════════════════════════════
// MailModal — full Gmail-style email composer
// ══════════════════════════════════════════════════════════════════════════════
interface MailModalProps {
  open: boolean;
  selectedLead: LeadItem | null;
  onClose: () => void;
}

export const MailModal: React.FC<MailModalProps> = ({ open, selectedLead, onClose }) => {
  /* ── Step ──────────────────────────────────────────────────────────────── */
  const [step, setStep] = React.useState<"selector" | "composer">("selector");

  /* ── Content ───────────────────────────────────────────────────────────── */
  const [subject, setSubject]   = React.useState("");
  const [body, setBody]         = React.useState("");
  const [sending, setSending]   = React.useState(false);
  const [error, setError]       = React.useState<string | null>(null);
  const [fromEmail, setFromEmail] = React.useState("noreply@fertility.com");

  /* ── To / Cc / Bcc ─────────────────────────────────────────────────────── */
  const [toEmails,  setToEmails]  = React.useState<string[]>([]);
  const [ccEmails,  setCcEmails]  = React.useState<string[]>([]);
  const [bccEmails, setBccEmails] = React.useState<string[]>([]);
  const [showCc,    setShowCc]    = React.useState(false);
  const [showBcc,   setShowBcc]   = React.useState(false);

  const toRowRef  = React.useRef<HTMLDivElement | null>(null);
  const ccRowRef  = React.useRef<HTMLDivElement | null>(null);
  const bccRowRef = React.useRef<HTMLDivElement | null>(null);

  const toPickerPaperRef  = React.useRef<HTMLDivElement | null>(null);
  const ccPickerPaperRef  = React.useRef<HTMLDivElement | null>(null);
  const bccPickerPaperRef = React.useRef<HTMLDivElement | null>(null);

  const [toAnchorEl,  setToAnchorEl]  = React.useState<HTMLElement | null>(null);
  const [ccAnchorEl,  setCcAnchorEl]  = React.useState<HTMLElement | null>(null);
  const [bccAnchorEl, setBccAnchorEl] = React.useState<HTMLElement | null>(null);

  const [toInput,  setToInput]  = React.useState("");
  const [ccInput,  setCcInput]  = React.useState("");
  const [bccInput, setBccInput] = React.useState("");

  const openToPicker  = Boolean(toAnchorEl);
  const openCcPicker  = Boolean(ccAnchorEl);
  const openBccPicker = Boolean(bccAnchorEl);

  /* ── Templates ─────────────────────────────────────────────────────────── */
  const [emailTemplates,     setEmailTemplates]     = React.useState<EmailTemplate[]>([]);
  const [loadingTemplates,   setLoadingTemplates]   = React.useState(false);
  const [templateError,      setTemplateError]      = React.useState<string | null>(null);
  const [selectedTemplate,   setSelectedTemplate]   = React.useState<EmailTemplate | null>(null);
  const [previewTemplate,    setPreviewTemplate]    = React.useState<EmailTemplate | null>(null);
  const [newTemplateOpen,    setNewTemplateOpen]    = React.useState(false);

  /* ── Toolbar ────────────────────────────────────────────────────────────── */
  const [emojiAnchor,  setEmojiAnchor]  = React.useState<HTMLElement | null>(null);
  const [formatAnchor, setFormatAnchor] = React.useState<HTMLElement | null>(null);
  const [moreAnchor,   setMoreAnchor]   = React.useState<HTMLElement | null>(null);

  const fileInputRef  = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const bodyRef       = React.useRef<HTMLTextAreaElement>(null);
  const cursorPos     = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const leadEmail = (selectedLead?.email as string | undefined) ?? "";
  const leadName  =
    selectedLead?.full_name ||
    (selectedLead as unknown as { name?: string })?.name ||
    "Patient";

  /* ── Close-outside-click ────────────────────────────────────────────────── */
  React.useEffect(() => {
    if (!openToPicker) return;
    const h = (e: PointerEvent) => { if (!toPickerPaperRef.current?.contains(e.target as Node)) setToAnchorEl(null); };
    document.addEventListener("pointerdown", h, true);
    return () => document.removeEventListener("pointerdown", h, true);
  }, [openToPicker]);

  React.useEffect(() => {
    if (!openCcPicker) return;
    const h = (e: PointerEvent) => { if (!ccPickerPaperRef.current?.contains(e.target as Node)) setCcAnchorEl(null); };
    document.addEventListener("pointerdown", h, true);
    return () => document.removeEventListener("pointerdown", h, true);
  }, [openCcPicker]);

  React.useEffect(() => {
    if (!openBccPicker) return;
    const h = (e: PointerEvent) => { if (!bccPickerPaperRef.current?.contains(e.target as Node)) setBccAnchorEl(null); };
    document.addEventListener("pointerdown", h, true);
    return () => document.removeEventListener("pointerdown", h, true);
  }, [openBccPicker]);

  /* ── Reset + load on open ───────────────────────────────────────────────── */
  React.useEffect(() => {
    if (!open) return;
    setStep("selector");
    setSubject(""); setBody(""); setError(null); setSending(false);
    setSelectedTemplate(null); setPreviewTemplate(null);
    setToEmails(leadEmail && leadEmail !== "N/A" ? [leadEmail] : []);
    setCcEmails([]); setBccEmails([]);
    setShowCc(false); setShowBcc(false);
    setToInput(""); setCcInput(""); setBccInput("");
    setFromEmail("noreply@fertility.com");
    setToAnchorEl(null); setCcAnchorEl(null); setBccAnchorEl(null);
    setEmojiAnchor(null); setFormatAnchor(null); setMoreAnchor(null);

    setLoadingTemplates(true);
    setTemplateError(null);
    EmailTemplateAPI.list()
      .then((data) => setEmailTemplates(data.filter((t) => t.is_active !== false)))
      .catch(() => { setTemplateError("Could not load templates. You can still compose a new email."); setEmailTemplates([]); })
      .finally(() => setLoadingTemplates(false));
  }, [open, leadEmail]);

  /* ── Template select ────────────────────────────────────────────────────── */
  const handleSelectTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t);
    setSubject(t.subject || "");
    const raw = (t.body || "")
      .replace(/\{\{name\}\}/g, leadName)
      .replace(/\{\{lead_name\}\}/g, leadName)
      .replace(/\{\{lead_first_name\}\}/g, leadName.split(" ")[0]);
    setBody(stripHtml(raw));
  };

  /* ── Cursor helpers ─────────────────────────────────────────────────────── */
  const saveCursor = () => {
    const el = bodyRef.current;
    if (el) cursorPos.current = { start: el.selectionStart, end: el.selectionEnd };
  };

  const insertAtCursor = React.useCallback((text: string) => {
    const { start, end } = cursorPos.current;
    setBody((prev) => {
      const next = prev.substring(0, start) + text + prev.substring(end);
      requestAnimationFrame(() => {
        const el = bodyRef.current;
        if (el) { el.focus(); el.setSelectionRange(start + text.length, start + text.length); cursorPos.current = { start: start + text.length, end: start + text.length }; }
      });
      return next;
    });
  }, []);

  const wrapSelection = React.useCallback((before: string, after: string, placeholder = "text") => {
    const { start, end } = cursorPos.current;
    setBody((prev) => {
      const selected = prev.substring(start, end) || placeholder;
      const wrapped  = before + selected + after;
      const next     = prev.substring(0, start) + wrapped + prev.substring(end);
      requestAnimationFrame(() => {
        const el = bodyRef.current;
        if (el) { el.focus(); const ns = start + before.length; const ne = ns + selected.length; el.setSelectionRange(ns, ne); cursorPos.current = { start: ns, end: ne }; }
      });
      return next;
    });
  }, []);

  /* ── Email input helpers ────────────────────────────────────────────────── */
  const addEmailsFromInput = (value: string, list: string[], setList: (v: string[]) => void) => {
    const chunks = value.split(/[;,\n]/).map((i) => i.trim()).filter(Boolean);
    if (!chunks.length) return;
    const next = [...list];
    chunks.forEach((mail) => {
      if (isValidEmail(mail) && !next.some((m) => normalizeEmail(m) === normalizeEmail(mail))) next.push(mail);
    });
    setList(next);
  };

  const toggleToEmail  = (email: string) => { const exists = toEmails.some((m) => normalizeEmail(m) === normalizeEmail(email)); if (exists) setToEmails(toEmails.filter((m) => normalizeEmail(m) !== normalizeEmail(email))); else if (isValidEmail(email)) setToEmails([...toEmails, email]); };
  const toggleCcEmail  = (email: string) => { const exists = ccEmails.some((m) => normalizeEmail(m) === normalizeEmail(email)); if (exists) setCcEmails(ccEmails.filter((m) => normalizeEmail(m) !== normalizeEmail(email))); else if (isValidEmail(email)) setCcEmails([...ccEmails, email]); };
  const toggleBccEmail = (email: string) => { const exists = bccEmails.some((m) => normalizeEmail(m) === normalizeEmail(email)); if (exists) setBccEmails(bccEmails.filter((m) => normalizeEmail(m) !== normalizeEmail(email))); else if (isValidEmail(email)) setBccEmails([...bccEmails, email]); };

  const leadRecipient = React.useMemo(
    () => leadEmail && leadEmail !== "N/A" ? [{ id: selectedLead?.id ?? 0, name: leadName, email: leadEmail }] : [],
    [selectedLead?.id, leadName, leadEmail],
  );

  /* ── Send ───────────────────────────────────────────────────────────────── */
  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { setError("Subject and body are required."); return; }
    if (!selectedLead?.id)               { setError("Lead ID is missing."); return; }
    if (toEmails.length === 0)           { setError("Please add at least one recipient."); return; }
    setSending(true); setError(null);
    try {
      await LeadEmailAPI.sendNow({
        lead: selectedLead.id,
        subject: subject.trim(),
        email_body: body.trim(),
        sender_email: fromEmail || undefined,
        cc: ccEmails,
        bcc: bccEmails,
        additional_to: toEmails.filter((e) => e !== leadEmail),
      });
      toast.success(`Email sent to ${leadName}!`, toastOptions);
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to send email. Please try again."));
    } finally { setSending(false); }
  };

  const handleSaveAsDraft = async () => {
    if (!subject.trim() || !body.trim() || !selectedLead?.id) return;
    try {
      await LeadEmailAPI.saveAsDraft({ lead: selectedLead.id, subject: subject.trim(), email_body: body.trim(), sender_email: fromEmail });
      toast.success("Saved as draft!", toastOptions);
    } catch { /* silent */ }
  };

  /* ── Toolbar handlers ───────────────────────────────────────────────────── */
  const handleFileChange  = (e: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(e.target.files || []); if (!files.length) return; saveCursor(); insertAtCursor(`\n[📎 Attachment: ${files.map((f) => f.name).join(", ")}]\n`); e.target.value = ""; };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; saveCursor(); insertAtCursor(`\n[🖼 Image: ${file.name}]\n`); e.target.value = ""; };
  const handleInsertLink  = () => { saveCursor(); const url = window.prompt("URL:", "https://"); if (!url) return; const label = window.prompt("Link label:", "Click here") || url; insertAtCursor(`[${label}](${url})`); };
  const handleEmojiSelect = (emoji: string) => { saveCursor(); insertAtCursor(emoji); };
  const handleFormat = (type: string) => {
    saveCursor();
    const formats: Record<string, [string, string, string?]> = {
      Bold: ["**","**","bold text"], Italic: ["_","_","italic text"], Underline: ["__","__","underlined text"],
      Strikethrough: ["~~","~~","strikethrough"], "Bullet list": ["\n• ","","item"],
      "Numbered list": ["\n1. ","","item"], Quote: ["\n> ","","quote"], Code: ["`","`","code"],
    };
    const fmt = formats[type];
    if (fmt) wrapSelection(fmt[0], fmt[1], fmt[2]);
  };
  const handleMoreAction = (action: string) => {
    saveCursor();
    const snippets: Record<string, string> = {
      "Insert signature": `\n\n---\nWarm regards,\nCrysta IVF, Bangalore\n(935) 555-0128 | crysta@gmail.com`,
      "Insert divider":   "\n\n---\n\n",
      "Insert table":     "\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n",
    };
    if (action === "Clear formatting") setBody((prev) => prev.replace(/(\*\*|__|~~|_|`)/g, ""));
    else insertAtCursor(snippets[action] || "");
  };

  const handleClose  = () => { if (!sending) onClose(); };
  const canSend      = subject.trim() && body.trim() && toEmails.length > 0 && !sending;

  const retryTemplates = () => {
    setLoadingTemplates(true); setTemplateError(null);
    EmailTemplateAPI.list()
      .then((data) => setEmailTemplates(data.filter((t) => t.is_active !== false)))
      .catch(() => setTemplateError("Could not load templates."))
      .finally(() => setLoadingTemplates(false));
  };

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <input ref={fileInputRef}  type="file" multiple      style={{ display: "none" }} onChange={handleFileChange} />
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />

      <EmojiPicker  anchorEl={emojiAnchor}  onClose={() => setEmojiAnchor(null)}  onSelect={handleEmojiSelect} />
      <FormatMenu   anchorEl={formatAnchor} onClose={() => setFormatAnchor(null)} onFormat={handleFormat} />
      <MoreMenu     anchorEl={moreAnchor}   onClose={() => setMoreAnchor(null)}   onAction={handleMoreAction} />

      <NewEmailTemplateDialog
        open={newTemplateOpen}
        onClose={() => setNewTemplateOpen(false)}
        onSaved={(tpl) => { setNewTemplateOpen(false); setEmailTemplates((prev) => [tpl, ...prev]); setSelectedTemplate(tpl); handleSelectTemplate(tpl); }}
      />

      {/* ── STEP 1: Template selector ─────────────────────────────────────── */}
      <Dialog open={open && step === "selector" && !newTemplateOpen} onClose={handleClose}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}>

        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={700} fontSize="1.05rem">New Email</Typography>
            <Typography variant="caption" color="text.secondary">
              To {leadName}{leadEmail && leadEmail !== "N/A" ? ` · ${leadEmail}` : ""}
            </Typography>
          </Box>
          <IconButton onClick={handleClose}><CloseIcon /></IconButton>
        </Box>

        <DialogContent sx={{ pt: 2 }}>
          {/* Compose from scratch */}
          <Box onClick={() => { setSelectedTemplate(null); setSubject(""); setBody(""); setStep("composer"); setError(null); }}
            sx={{ border: "1px dashed #D1D5DB", borderRadius: 2, py: 3, textAlign: "center", cursor: "pointer", mb: 2.5, "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" }, transition: "all 0.15s" }}>
            <EditOutlinedIcon sx={{ color: "#6B7280" }} />
            <Typography fontWeight={500} mt={0.75} color="#374151">Compose New Email</Typography>
            <Typography variant="caption" color="text.secondary">Write a custom message from scratch</Typography>
          </Box>

          <Divider sx={{ mb: 2 }}>
            <Typography fontSize="12px" color="text.secondary">OR USE A TEMPLATE</Typography>
          </Divider>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography fontSize="13px" color="text.secondary" fontWeight={500}>Select Email Template</Typography>
            <Button size="small" onClick={() => setNewTemplateOpen(true)}
              sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, color: "#1F2937", border: "1px solid #E5E7EB", borderRadius: "6px", px: 1.5, py: 0.5, minWidth: 0, "&:hover": { bgcolor: "#F3F4F6" } }}>
              + New Template
            </Button>
          </Box>

          {loadingTemplates && <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={22} /></Box>}

          {!loadingTemplates && templateError && (
            <Alert severity="warning" sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}
              action={<Button size="small" onClick={retryTemplates}>Retry</Button>}>
              {templateError}
            </Alert>
          )}

          {!loadingTemplates && !templateError && emailTemplates.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary" fontSize="14px">No email templates found.</Typography>
              <Typography color="text.secondary" fontSize="12px" mt={0.5}>Click "+ New Template" above to create one.</Typography>
            </Box>
          )}

          {!loadingTemplates && emailTemplates.length > 0 && (
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
              {emailTemplates.map((t) => (
                <Box key={t.id} onClick={() => handleSelectTemplate(t)}
                  sx={{ display: "flex", alignItems: "center", py: 1.5, px: 0.5, borderBottom: "1px solid #F3F4F6", cursor: "pointer", borderRadius: 1, bgcolor: selectedTemplate?.id === t.id ? "#F0F9FF" : "transparent", "&:hover": { bgcolor: selectedTemplate?.id === t.id ? "#F0F9FF" : "#F9FAFB" }, transition: "background 0.15s" }}>
                  <Radio checked={selectedTemplate?.id === t.id} onChange={() => handleSelectTemplate(t)} size="small"
                    sx={{ color: selectedTemplate?.id === t.id ? "#EF4444" : "#CBD5E1", "&.Mui-checked": { color: "#EF4444" } }} />
                  <Box sx={{ flex: 1, ml: 0.5, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize="13.5px" fontWeight={600} color="#1E293B" noWrap>{t.name}</Typography>
                      {t.use_case && (
                        <Chip label={t.use_case} size="small"
                          sx={{ ...getUseCaseSx(t.use_case), fontSize: "11px", height: 20, textTransform: "capitalize" }} />
                      )}
                    </Stack>
                    {t.subject && <Typography fontSize="11px" color="#94A3B8" mt={0.25} noWrap>Subject: {t.subject}</Typography>}
                  </Box>
                  <Tooltip title="Preview template">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }}
                      sx={{ color: "#93C5FD", ml: 1, "&:hover": { color: "#3B82F6", bgcolor: "#EFF6FF" } }}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={handleClose} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Cancel</Button>
          <Button onClick={() => { setStep("composer"); setError(null); }} variant="contained" disabled={!selectedTemplate}
            sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Template preview dialog ──────────────────────────────────────────── */}
      <Dialog open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
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
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setPreviewTemplate(null)} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Close</Button>
          <Button variant="contained" onClick={() => { if (previewTemplate) handleSelectTemplate(previewTemplate); setPreviewTemplate(null); }}
            sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" } }}>
            Use This Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── STEP 2: Full Gmail-style composer ───────────────────────────────── */}
      <Dialog open={open && step === "composer"} onClose={handleClose}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}>

        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => setStep("selector")} disabled={sending}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography fontWeight={700} fontSize="1.05rem">
                {selectedTemplate ? selectedTemplate.name : "New Email"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sending to {toEmails.length} recipient{toEmails.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleClose} disabled={sending}><CloseIcon /></IconButton>
        </Box>

        <DialogContent sx={{ px: 3, pb: 1 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack spacing={0} divider={<Divider />}>
            {/* FROM */}
            <Box display="flex" alignItems="center" gap={1} py={1.2}>
              <Typography fontSize="13px" color="text.secondary" minWidth={55}>From:</Typography>
              <TextField value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} variant="standard" size="small"
                placeholder="Sender email" sx={{ minWidth: 260, "& .MuiInputBase-input": { fontSize: "13px" } }}
                InputProps={{ disableUnderline: true }} />
            </Box>

            {/* TO */}
            <Box ref={toRowRef} display="flex" alignItems="flex-start" gap={1} py={1} sx={{ flexWrap: "wrap" }}>
              <Typography fontSize="13px" color="text.secondary" minWidth={55} mt="8px">To:</Typography>
              <RecipientChipRow
                emails={toEmails} inputValue={toInput} onInputChange={setToInput}
                onInputFocus={() => { if (leadRecipient.length > 0 && toRowRef.current) setToAnchorEl(toRowRef.current); }}
                onInputBlur={() => { addEmailsFromInput(toInput, toEmails, setToEmails); setToInput(""); }}
                onInputKeyDown={(e) => { if (e.key === "Enter" || e.key === "," || e.key === "Tab") { e.preventDefault(); addEmailsFromInput(toInput, toEmails, setToEmails); setToInput(""); } }}
                onRemove={(email) => setToEmails(toEmails.filter((m) => m !== email))}
                chipColor={{ bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" }}
                placeholder="Add recipients"
              />
              <Box display="flex" gap={0.75} ml="auto" pt={1} flexShrink={0}>
                {!showCc  && <Typography fontSize="12px" color="#64748B" fontWeight={500} sx={{ cursor: "pointer", "&:hover": { color: "#1D4ED8" }, userSelect: "none" }} onClick={() => setShowCc(true)}>Cc</Typography>}
                {(!showCc || !showBcc) && <Typography fontSize="12px" color="#CBD5E1">|</Typography>}
                {!showBcc && <Typography fontSize="12px" color="#64748B" fontWeight={500} sx={{ cursor: "pointer", "&:hover": { color: "#1D4ED8" }, userSelect: "none" }} onClick={() => setShowBcc(true)}>Bcc</Typography>}
              </Box>
              <RecipientPickerPopover open={openToPicker} anchorEl={toAnchorEl} onClose={() => setToAnchorEl(null)}
                paperRef={toPickerPaperRef} leads={leadRecipient} selectedEmails={toEmails} onToggle={toggleToEmail} />
            </Box>

            {/* CC */}
            {(showCc || ccEmails.length > 0) && (
              <Box ref={ccRowRef} display="flex" alignItems="flex-start" gap={1} py={1} sx={{ flexWrap: "wrap" }}>
                <Typography fontSize="13px" color="text.secondary" minWidth={55} mt="8px">Cc:</Typography>
                <RecipientChipRow
                  emails={ccEmails} inputValue={ccInput} onInputChange={setCcInput}
                  onInputFocus={() => { if (leadRecipient.length > 0 && ccRowRef.current) setCcAnchorEl(ccRowRef.current); }}
                  onInputBlur={() => { addEmailsFromInput(ccInput, ccEmails, setCcEmails); setCcInput(""); }}
                  onInputKeyDown={(e) => { if (e.key === "Enter" || e.key === "," || e.key === "Tab") { e.preventDefault(); addEmailsFromInput(ccInput, ccEmails, setCcEmails); setCcInput(""); } }}
                  onRemove={(email) => setCcEmails(ccEmails.filter((m) => m !== email))}
                  chipColor={{ bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" }}
                  placeholder="Add Cc recipients"
                />
                <Box display="flex" gap={0.75} ml="auto" pt={1} flexShrink={0}>
                  <Typography fontSize="12px" color="#64748B" fontWeight={500} sx={{ cursor: "pointer", "&:hover": { color: "#EF4444" }, userSelect: "none" }}
                    onClick={() => { setShowCc(false); setCcEmails([]); setCcAnchorEl(null); }}>✕</Typography>
                </Box>
                <RecipientPickerPopover open={openCcPicker} anchorEl={ccAnchorEl} onClose={() => setCcAnchorEl(null)}
                  paperRef={ccPickerPaperRef} leads={leadRecipient} selectedEmails={ccEmails} onToggle={toggleCcEmail} />
              </Box>
            )}

            {/* BCC */}
            {(showBcc || bccEmails.length > 0) && (
              <Box ref={bccRowRef} display="flex" alignItems="flex-start" gap={1} py={1} sx={{ flexWrap: "wrap" }}>
                <Typography fontSize="13px" color="text.secondary" minWidth={55} mt="8px">Bcc:</Typography>
                <RecipientChipRow
                  emails={bccEmails} inputValue={bccInput} onInputChange={setBccInput}
                  onInputFocus={() => { if (leadRecipient.length > 0 && bccRowRef.current) setBccAnchorEl(bccRowRef.current); }}
                  onInputBlur={() => { addEmailsFromInput(bccInput, bccEmails, setBccEmails); setBccInput(""); }}
                  onInputKeyDown={(e) => { if (e.key === "Enter" || e.key === "," || e.key === "Tab") { e.preventDefault(); addEmailsFromInput(bccInput, bccEmails, setBccEmails); setBccInput(""); } }}
                  onRemove={(email) => setBccEmails(bccEmails.filter((m) => m !== email))}
                  chipColor={{ bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" }}
                  placeholder="Add Bcc recipients"
                />
                <Box display="flex" gap={0.75} ml="auto" pt={1} flexShrink={0}>
                  <Typography fontSize="12px" color="#64748B" fontWeight={500} sx={{ cursor: "pointer", "&:hover": { color: "#EF4444" }, userSelect: "none" }}
                    onClick={() => { setShowBcc(false); setBccEmails([]); setBccAnchorEl(null); }}>✕</Typography>
                </Box>
                <RecipientPickerPopover open={openBccPicker} anchorEl={bccAnchorEl} onClose={() => setBccAnchorEl(null)}
                  paperRef={bccPickerPaperRef} leads={leadRecipient} selectedEmails={bccEmails} onToggle={toggleBccEmail} />
              </Box>
            )}

            {/* SUBJECT */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <Typography fontSize="13px" color="text.secondary" minWidth={55}>Subject:</Typography>
              <TextField fullWidth variant="standard" value={subject} onChange={(e) => setSubject(e.target.value)}
                disabled={sending} InputProps={{ disableUnderline: true, sx: { fontSize: "13px" } }} placeholder="Enter subject..." />
            </Box>

            {/* BODY */}
            <Box sx={{ py: 1.5, minHeight: 160 }}>
              <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)}
                onSelect={saveCursor} onKeyUp={saveCursor} onMouseUp={saveCursor}
                disabled={sending} placeholder="Write your message..." rows={9}
                style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "none", outline: "none", fontSize: "13px", lineHeight: 1.7, fontFamily: "inherit", color: "#1E293B", background: "transparent", padding: 0 }}
              />
            </Box>
          </Stack>
        </DialogContent>

        {/* Toolbar + actions */}
        <Box sx={{ px: 3, pb: 3, pt: 1, borderTop: "1px solid #E5E7EB" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 1.5, pt: 1, flexWrap: "wrap" }}>
            {[
              { title: "Attach file",   icon: <AttachFileIcon sx={{ fontSize: 18 }} />,               onClick: () => fileInputRef.current?.click(),                                                      active: false,                   activeColor: undefined },
              { title: "Insert link",   icon: <LinkIcon sx={{ fontSize: 18 }} />,                      onClick: handleInsertLink,                                                                         active: false,                   activeColor: undefined },
              { title: "Emoji",         icon: <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />,     onClick: (e: React.MouseEvent<HTMLButtonElement>) => { saveCursor(); setEmojiAnchor(e.currentTarget); }, active: Boolean(emojiAnchor),   activeColor: "#F59E0B" },
              { title: "Insert image",  icon: <ImageOutlinedIcon sx={{ fontSize: 18 }} />,             onClick: () => imageInputRef.current?.click(),                                                     active: false,                   activeColor: undefined },
              { title: "Format text",   icon: <FormatColorTextOutlinedIcon sx={{ fontSize: 18 }} />,   onClick: (e: React.MouseEvent<HTMLButtonElement>) => { saveCursor(); setFormatAnchor(e.currentTarget); }, active: Boolean(formatAnchor), activeColor: "#6366F1" },
              { title: "Highlight",     icon: <BrushOutlinedIcon sx={{ fontSize: 18 }} />,             onClick: () => { saveCursor(); wrapSelection("==", "==", "highlighted text"); },                  active: false,                   activeColor: undefined },
              { title: "More options",  icon: <AddCircleOutlineIcon sx={{ fontSize: 18 }} />,          onClick: (e: React.MouseEvent<HTMLButtonElement>) => { saveCursor(); setMoreAnchor(e.currentTarget); }, active: Boolean(moreAnchor),   activeColor: "#10B981" },
            ].map(({ title, icon, onClick, active, activeColor }) => (
              <Tooltip key={title} title={title}>
                <IconButton size="small" onClick={onClick as React.MouseEventHandler<HTMLButtonElement>} disabled={sending}
                  sx={{ color: active && activeColor ? activeColor : "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: activeColor || "#1E293B" } }}>
                  {icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button onClick={() => setStep("selector")} disabled={sending} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Back</Button>
            <Button onClick={handleSaveAsDraft} disabled={sending || !subject.trim() || !body.trim()} startIcon={<BookmarkBorderIcon fontSize="small" />}
              sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 2, "&:hover": { bgcolor: "#F3F4F6" } }}>
              Save as Draft
            </Button>
            <Button variant="contained" onClick={handleSend} disabled={!canSend}
              endIcon={sending ? <CircularProgress size={14} sx={{ color: "white" }} /> : <SendIcon fontSize="small" />}
              sx={{ height: 40, backgroundColor: "#4B5563", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, minWidth: 90, "&:hover": { backgroundColor: "#374151" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// BookAppointmentModal (unchanged)
// ══════════════════════════════════════════════════════════════════════════════
interface BookAppointmentModalProps {
  open: boolean;
  selectedLead: LeadItem | null;
  appointment: AppointmentState;
  setSelectedDepartmentId: (id: number | "") => void;
  setSelectedEmployeeId: (id: number | "") => void;
  setDate: (d: Date | null) => void;
  setSlot: (s: string) => void;
  setRemark: (r: string) => void;
  clearError: () => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  open, appointment, setSelectedDepartmentId, setSelectedEmployeeId,
  setDate, setSlot, setRemark, clearError, onClose, onSubmit,
}) => (
  <Dialog open={open} onClose={!appointment.submitting ? onClose : undefined} fullWidth maxWidth="sm"
    PaperProps={{ sx: { borderRadius: "20px", boxShadow: "0px 24px 48px rgba(0,0,0,0.14)", overflow: "hidden", bgcolor: "#FFFFFF" } }}>

    <DialogTitle sx={{ px: 3, pt: 3, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography fontWeight={800} fontSize="1.2rem" color="#111827">Book an Appointment</Typography>
      <IconButton onClick={onClose} disabled={appointment.submitting} size="small"
        sx={{ bgcolor: "#F3F4F6", borderRadius: "8px", width: 32, height: 32, "&:hover": { bgcolor: "#E5E7EB" } }}>
        <CloseIcon sx={{ fontSize: 16, color: "#374151" }} />
      </IconButton>
    </DialogTitle>

    <Divider />

    <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
      {appointment.error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: "0.82rem" }} onClose={clearError}>
          {appointment.error}
        </Alert>
      )}

      <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", mb: 2.5 }}>
        Appointment Details
      </Typography>

      <Stack spacing={2.5}>
        <Box sx={{ display: "grid", gridTemplateColumns: IS_MEDICAL_APP ? "1fr 1fr" : "1fr", gap: 2 }}>
          {IS_MEDICAL_APP && (
            <FormControl size="small" fullWidth sx={fieldSx}>
              <InputLabel shrink>Department&nbsp;<span style={{ color: "#EF4444" }}>*</span></InputLabel>
              <Select value={appointment.selectedDepartmentId} label="Department *" notched
                onChange={(e) => setSelectedDepartmentId(Number(e.target.value))}
                disabled={appointment.submitting || appointment.loadingDepartments}
                endAdornment={appointment.loadingDepartments ? <CircularProgress size={14} sx={{ mr: 2 }} /> : null}>
                <MenuItem value="" disabled><Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Select Department</Typography></MenuItem>
                {appointment.departments.map((d) => <MenuItem key={d.id} value={d.id} sx={{ fontSize: "0.9rem" }}>{d.name}</MenuItem>)}
                {appointment.departments.length === 0 && !appointment.loadingDepartments && (
                  <MenuItem disabled sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}>No departments found</MenuItem>
                )}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" fullWidth sx={fieldSx}>
            <InputLabel shrink>Personnel&nbsp;<span style={{ color: "#EF4444" }}>*</span></InputLabel>
            <Select value={appointment.selectedEmployeeId} label="Personnel *" notched
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              disabled={appointment.submitting || appointment.loadingEmployees || (IS_MEDICAL_APP && !appointment.selectedDepartmentId)}
              endAdornment={appointment.loadingEmployees ? <CircularProgress size={14} sx={{ mr: 2 }} /> : null}>
              {IS_MEDICAL_APP && !appointment.selectedDepartmentId ? (
                <MenuItem value="" disabled sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}>Select department first</MenuItem>
              ) : [
                <MenuItem key="__empty__" value=""><Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Select Personnel</Typography></MenuItem>,
                ...(IS_MEDICAL_APP ? appointment.filteredEmployees : appointment.employees).map((emp) => (
                  <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: "0.9rem" }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{emp.emp_name}</Typography>
                      {emp.emp_type && <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{emp.emp_type}</Typography>}
                    </Box>
                  </MenuItem>
                )),
              ]}
              {IS_MEDICAL_APP && appointment.selectedDepartmentId && appointment.filteredEmployees.length === 0 && !appointment.loadingEmployees && (
                <MenuItem disabled sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}>No personnel in this department</MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <DatePicker value={appointment.date} onChange={(v) => setDate(v ? new Date(v as unknown as string) : null)}
            minDate={new Date()} slots={{ openPickerIcon: EventIcon }}
            label={<span>Date&nbsp;<span style={{ color: "#EF4444" }}>*</span></span>}
            slotProps={{
              textField: { size: "small", fullWidth: true, sx: fieldSx, InputLabelProps: { shrink: true } },
              popper: { sx: { "& .MuiPaper-root": { borderRadius: "14px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }, "& .MuiPickersDay-root.Mui-selected": { bgcolor: "#334155" }, "& .MuiPickersDay-root.Mui-selected:hover": { bgcolor: "#1E293B" } } },
            }}
          />

          <FormControl size="small" fullWidth sx={fieldSx}>
            <InputLabel shrink>Select Slot&nbsp;<span style={{ color: "#EF4444" }}>*</span></InputLabel>
            <Select value={appointment.slot} label="Select Slot *" notched
              onChange={(e) => setSlot(e.target.value)} disabled={appointment.submitting}>
              <MenuItem value="" disabled><Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Select Time Slot</Typography></MenuItem>
              {TIME_SLOTS.map((s) => <MenuItem key={s} value={s} sx={{ fontSize: "0.9rem" }}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <TextField label="Remark" size="small" fullWidth multiline minRows={2}
          value={appointment.remark} onChange={(e) => setRemark(e.target.value)}
          disabled={appointment.submitting} placeholder="Type Here...."
          InputLabelProps={{ shrink: true }} sx={fieldSx} />
      </Stack>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1.5, justifyContent: "flex-end" }}>
      <Button onClick={onClose} disabled={appointment.submitting} variant="outlined"
        sx={{ textTransform: "none", borderRadius: "12px", fontWeight: 600, fontSize: "15px", px: 4, py: 1.1, borderColor: "#D1D5DB", color: "#374151", "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" } }}>
        Cancel
      </Button>
      <Button onClick={onSubmit}
        disabled={(IS_MEDICAL_APP && !appointment.selectedDepartmentId) || !appointment.date || !appointment.slot || appointment.submitting}
        variant="contained"
        sx={{ textTransform: "none", borderRadius: "12px", fontWeight: 600, fontSize: "15px", px: 4, py: 1.1, minWidth: 100, bgcolor: "#1F2937", boxShadow: "none", "&:hover": { bgcolor: "#111827", boxShadow: "none" }, "&:disabled": { bgcolor: "#E5E7EB", color: "#9CA3AF" } }}>
        {appointment.submitting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Save"}
      </Button>
    </DialogActions>
  </Dialog>
);