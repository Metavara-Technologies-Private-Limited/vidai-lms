import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  IconButton,
  Radio,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  InputBase,
  Avatar,
  Checkbox,
  Popover,
  Tooltip,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import FormatColorTextOutlinedIcon from "@mui/icons-material/FormatColorTextOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ExportIcon from "../../assets/icons/export.svg";

import {
  deleteLeads,
  selectDeletingIds,
  fetchLeads,
} from "../../store/leadSlice";
import {
  LeadAPI,
  LeadEmailAPI,
  EmailTemplateAPI,
  TwilioAPI,
} from "../../services/leads.api";
import type { EmailTemplate } from "../../services/leads.api";
import { clinicsApi } from "../../services/tickets.api";
import TemplateService from "../../services/templates.api";
import ArchiveLeadDialog from "./ArchiveLeadDialog";

// ── Strip HTML ────────────────────────────────────────────────────────
const decodeEntities = (str: string): string => {
  try {
    const el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  } catch {
    return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }
};
const stripHtml = (html: string): string => {
  if (!html) return "";
  let t = decodeEntities(html);
  t = decodeEntities(t);
  t = t.replace(/<\/p\s*>/gi, "\n").replace(/<\/div\s*>/gi, "\n").replace(/<\/li\s*>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<\/h[1-6]\s*>/gi, "\n").replace(/<\/tr\s*>/gi, "\n");
  t = t.replace(/<[^>]*>/g, "");
  t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return t.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim();
};

// ── Clinic email extraction ───────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const getString    = (v: unknown): string => typeof v === "string" ? v.trim() : "";
const asRecord     = (v: unknown): Record<string, unknown> => v && typeof v === "object" ? (v as Record<string, unknown>) : {};
const extractClinicEmails = (data: unknown): string[] => {
  const r = asRecord(data);
  const direct = [getString(r.email), getString(r.clinic_email), getString(r.reply_email), getString(r.contact_email)].filter((m) => m && isValidEmail(m));
  const nested = Array.isArray(r.emails) ? (r.emails as unknown[]).map((i) => getString(i)).filter((m) => m && isValidEmail(m)) : [];
  return Array.from(new Set([...direct, ...nested].map((e) => e.toLowerCase())));
};

// ── Use case chip styles ──────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────
type ApiError = { response?: { data?: { detail?: string; message?: string } }; message?: string };

interface SMSTemplate { id: string | number; name: string; use_case?: string; body: string }

interface LeadRecipient { id: string; name: string; email: string }

// ── Use case options ──────────────────────────────────────────────────
const USE_CASE_OPTIONS = ["Appointment", "Feedback", "Reminder", "Follow-Up", "Re-engagement", "No-Show", "General"];
const USE_CASE_BODY_SUGGESTIONS: Record<string, string> = {
  Appointment:      "Hi {name}, your appointment is confirmed for {date} at {time}. Please arrive 10 minutes early.",
  Feedback:         "Hi {name}, we'd love to hear your feedback. Please take a moment to share your experience with us.",
  Reminder:         "Hi {name}, this is a reminder about your upcoming appointment on {date} at {time}.",
  "Follow-Up":      "Hi {name}, we wanted to follow up regarding your recent visit. Please feel free to reach out if you have any questions.",
  "Re-engagement":  "Hi {name}, we miss you! It's been a while since your last visit. Book an appointment today.",
  "No-Show":        "Hi {name}, we noticed you missed your appointment on {date}. Please contact us to reschedule.",
  General:          "",
};

// ── Helpers ───────────────────────────────────────────────────────────
const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiError;
  return e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? fallback;
};
const normalizeEmail = (v: string) => v.trim().toLowerCase();

const toastOptions      = { position: "top-right" as const, autoClose: 3000, theme: "colored" as const };
const toastErrorOptions = { position: "top-right" as const, autoClose: 4000, theme: "colored" as const };

// ── Props ─────────────────────────────────────────────────────────────
interface Props {
  selectedIds: string[];
  tab: "active" | "archived";
  onDelete: () => void;
  onArchive: (archive: boolean) => void;
  onExport?: () => void;
  onSendEmail?: (to: string, subject: string, body: string, templateId?: string) => void;
  onSendSMS?: (leadIds: string[], message: string) => void;
}

// ── Recipient chip row ────────────────────────────────────────────────
interface ChipRowProps {
  emails: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  onInputKeyDown: (e: React.KeyboardEvent) => void;
  onRemove: (email: string) => void;
  chipColor: { bg: string; text: string; border: string };
  placeholder?: string;
}
const RecipientChipRow: React.FC<ChipRowProps> = ({
  emails, inputValue, onInputChange, onInputFocus, onInputBlur, onInputKeyDown, onRemove, chipColor, placeholder = "Add recipients",
}) => (
  <Box display="flex" gap={1} flexWrap="wrap" flex={1} minWidth={180} alignItems="center"
    sx={{ maxHeight: "90px", overflowY: "auto", "&::-webkit-scrollbar": { width: "6px" }, "&::-webkit-scrollbar-track": { bgcolor: "#F3F4F6", borderRadius: "3px" }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: "3px" } }}
  >
    {emails.map((email) => (
      <Box key={email} display="flex" alignItems="center" gap={0.75} px={1.2} py={0.4} borderRadius="16px" sx={{ bgcolor: chipColor.bg, border: `1px solid ${chipColor.border}` }}>
        <Avatar sx={{ width: 18, height: 18, fontSize: 9, bgcolor: chipColor.text }}>{email.charAt(0).toUpperCase()}</Avatar>
        <Typography fontSize="12px" fontWeight={500} color={chipColor.text}>{email}</Typography>
        <Box component="span" onClick={() => onRemove(email)} sx={{ cursor: "pointer", fontSize: 14, color: chipColor.text, opacity: 0.6, "&:hover": { opacity: 1 }, lineHeight: 1 }}>×</Box>
      </Box>
    ))}
    <InputBase value={inputValue} placeholder={emails.length === 0 ? placeholder : ""} onFocus={onInputFocus} onChange={(e) => onInputChange(e.target.value)} onBlur={onInputBlur} onKeyDown={onInputKeyDown} sx={{ minWidth: 140, fontSize: "13px", flex: 1 }} />
  </Box>
);

// ── Recipient picker popover ──────────────────────────────────────────
interface PickerPopoverProps {
  open: boolean; anchorEl: HTMLElement | null; onClose: () => void;
  paperRef: React.RefObject<HTMLDivElement | null>;
  leads: LeadRecipient[]; selectedEmails: string[]; onToggle: (email: string) => void;
}
const RecipientPickerPopover: React.FC<PickerPopoverProps> = ({ open, anchorEl, onClose, paperRef, leads, selectedEmails, onToggle }) => (
  <Popover open={open} anchorEl={anchorEl} onClose={onClose} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }} disableAutoFocus disableEnforceFocus disableRestoreFocus
    PaperProps={{ ref: paperRef, onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => e.preventDefault(), sx: { borderRadius: "10px", border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.09)" } }}
  >
    <Box sx={{ width: 300, maxHeight: 220, overflowY: "auto", p: 1 }}>
      {leads.length === 0
        ? <Typography fontSize="13px" color="text.secondary" p={1}>No recipients available</Typography>
        : leads.map((r) => (
          <Box key={r.id} onClick={() => onToggle(r.email)} sx={{ p: 0.8, borderRadius: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 1, "&:hover": { backgroundColor: "#F5F5F5" } }}>
            <Checkbox size="small" checked={selectedEmails.some((m) => normalizeEmail(m) === normalizeEmail(r.email))} onChange={() => onToggle(r.email)} />
            <Box><Typography fontSize="13px" fontWeight={500}>{r.name}</Typography><Typography fontSize="12px" color="text.secondary">{r.email}</Typography></Box>
          </Box>
        ))
      }
    </Box>
  </Popover>
);

// ─────────────────────────────────────────────────────────────────────
const BulkActionBar: React.FC<Props> = ({ selectedIds, tab, onDelete, onArchive, onExport, onSendEmail, onSendSMS }) => {
  const dispatch    = useDispatch<AppDispatch>();
  const deletingIds = useSelector(selectDeletingIds);

  // ── Delete / Archive ──────────────────────────────────────────────
  const [openDelete,   setOpenDelete]   = useState(false);
  const [openArchive,  setOpenArchive]  = useState(false);
  const [isDeleting,   setIsDeleting]   = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);
  const [isArchiving,  setIsArchiving]  = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  // ── Email state ───────────────────────────────────────────────────
  const [emailStep,         setEmailStep]         = useState<"selector" | "composer" | null>(null);
  const [loadingLeads,      setLoadingLeads]       = useState(false);
  const [allLeadRecipients, setAllLeadRecipients] = useState<LeadRecipient[]>([]);

  // Composer fields
  const [fromEmail,       setFromEmail]       = useState("");
  const [toEmails,        setToEmails]        = useState<string[]>([]);
  const [ccEmails,        setCcEmails]        = useState<string[]>([]);
  const [bccEmails,       setBccEmails]       = useState<string[]>([]);
  const [showCc,          setShowCc]          = useState(false);
  const [showBcc,         setShowBcc]         = useState(false);
  const [emailSubject,    setEmailSubject]     = useState("");
  const [emailBody,       setEmailBody]       = useState("");
  const [isSendingEmail,  setIsSendingEmail]  = useState(false);
  const [emailError,      setEmailError]      = useState<string | null>(null);

  // Picker anchors / refs
  const toRowRef          = useRef<HTMLDivElement | null>(null);
  const ccRowRef          = useRef<HTMLDivElement | null>(null);
  const bccRowRef         = useRef<HTMLDivElement | null>(null);
  const toPickerPaperRef  = useRef<HTMLDivElement | null>(null);
  const ccPickerPaperRef  = useRef<HTMLDivElement | null>(null);
  const bccPickerPaperRef = useRef<HTMLDivElement | null>(null);
  const [toAnchorEl,  setToAnchorEl]  = useState<HTMLElement | null>(null);
  const [ccAnchorEl,  setCcAnchorEl]  = useState<HTMLElement | null>(null);
  const [bccAnchorEl, setBccAnchorEl] = useState<HTMLElement | null>(null);
  const [toInput,  setToInput]  = useState("");
  const [ccInput,  setCcInput]  = useState("");
  const [bccInput, setBccInput] = useState("");

  // Template selector
  const [emailTemplates,   setEmailTemplates]   = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError,   setTemplatesError]   = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate,  setPreviewTemplate]  = useState<EmailTemplate | null>(null);

  // Body textarea ref for toolbar
  const bodyRef    = useRef<HTMLTextAreaElement>(null);
  const cursorPos  = useRef({ start: 0, end: 0 });
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── SMS ───────────────────────────────────────────────────────────
  const [smsDialog,     setSmsDialog]     = useState<"compose" | "templates" | "preview" | "newTemplate" | null>(null);
  const [smsMessage,    setSmsMessage]    = useState("");
  const [isSendingSMS,  setIsSendingSMS]  = useState(false);
  const [smsError,      setSmsError]      = useState<string | null>(null);
  const [smsTemplates,  setSmsTemplates]  = useState<SMSTemplate[]>([]);
  const [smsLoading,    setSmsLoading]    = useState(false);
  const [selectedSMSTpl, setSelectedSMSTpl] = useState<SMSTemplate | null>(null);
  const [previewBody,   setPreviewBody]   = useState("");
  const [newTplName,    setNewTplName]    = useState("");
  const [newTplUseCase, setNewTplUseCase] = useState("");
  const [newTplBody,    setNewTplBody]    = useState("");
  const [newTplSaving,  setNewTplSaving]  = useState(false);
  const [newTplError,   setNewTplError]   = useState<string | null>(null);
  const [newTplView,    setNewTplView]    = useState<"form" | "preview">("form");
  const [useCaseAnchor, setUseCaseAnchor] = useState<null | HTMLElement>(null);

  // ── Picker outside-click handlers ────────────────────────────────
  useEffect(() => {
    if (!toAnchorEl && !ccAnchorEl && !bccAnchorEl) return;
    const handler = (e: PointerEvent) => {
      if (!toPickerPaperRef.current?.contains(e.target as Node))  setToAnchorEl(null);
      if (!ccPickerPaperRef.current?.contains(e.target as Node))  setCcAnchorEl(null);
      if (!bccPickerPaperRef.current?.contains(e.target as Node)) setBccAnchorEl(null);
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [toAnchorEl, ccAnchorEl, bccAnchorEl]);

  if (selectedIds.length === 0) return null;

  const someDeleting    = selectedIds.some((id) => deletingIds.includes(id));
  const anyProcessing   = someDeleting || isDeleting || isArchiving;
  const useCaseMenuOpen = useCaseAnchor !== null;

  // ── Email helpers ─────────────────────────────────────────────────
  const addEmailsFromInput = (value: string, list: string[], setList: (v: string[]) => void) => {
    const chunks = value.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!chunks.length) return;
    const next = [...list];
    chunks.forEach((mail) => {
      if (isValidEmail(mail) && !next.some((m) => normalizeEmail(m) === normalizeEmail(mail))) next.push(mail);
    });
    setList(next);
  };

  const toggleEmail = (email: string, list: string[], setList: (v: string[]) => void) => {
    if (list.some((m) => normalizeEmail(m) === normalizeEmail(email)))
      setList(list.filter((m) => normalizeEmail(m) !== normalizeEmail(email)));
    else if (isValidEmail(email)) setList([...list, email]);
  };

  // ── Open email — load leads + clinic from-email ───────────────────
  const handleOpenEmail = async () => {
    setLoadingLeads(true);
    setEmailError(null);
    try {
      const leadsData = await Promise.all(selectedIds.map((id) => LeadAPI.getById(id)));
      const withEmail = leadsData
        .filter((l) => l.email?.trim() && l.email !== "N/A")
        .map((l) => ({ id: String(l.id), name: l.full_name, email: l.email as string }));

      if (withEmail.length === 0) {
        toast.error("None of the selected leads have an email address.", toastErrorOptions);
        return;
      }

      setAllLeadRecipients(withEmail);
      setToEmails(withEmail.map((r) => r.email));
      setCcEmails([]);
      setBccEmails([]);
      setShowCc(false);
      setShowBcc(false);
      setEmailSubject("");
      setEmailBody("");
      setSelectedTemplate(null);
      setPreviewTemplate(null);
      setToInput(""); setCcInput(""); setBccInput("");

      setFromEmail("noreply@fertility.com");
      try {
        const firstLead   = leadsData[0];
        const clinicId    = (firstLead as unknown as { clinic_id?: number }).clinic_id || 1;
        const clinicData  = await clinicsApi.getClinicDetail(clinicId);
        const emails      = extractClinicEmails(clinicData);
        if (emails.length > 0) setFromEmail(emails[0]);
      } catch { /* keep default */ }

      setTemplatesLoading(true);
      setTemplatesError(null);
      EmailTemplateAPI.list()
        .then((data) => setEmailTemplates(data.filter((t) => t.is_active !== false)))
        .catch(() => { setTemplatesError("Could not load templates. You can still compose a new email."); setEmailTemplates([]); })
        .finally(() => setTemplatesLoading(false));

      setEmailStep("selector");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load lead data."), toastErrorOptions);
    } finally {
      setLoadingLeads(false);
    }
  };

  // ── Template selection ────────────────────────────────────────────
  const handleSelectTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t);
    setEmailSubject(t.subject || "");
    setEmailBody(stripHtml(t.body || ""));
  };

  // ── Send to ALL selected leads at once ────────────────────────────
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) { setEmailError("Subject and body are required."); return; }

    const finalTo  = [...toEmails];
    const finalCc  = [...ccEmails];
    const finalBcc = [...bccEmails];
    if (toInput.trim()  && isValidEmail(toInput.trim())  && !finalTo.some( (m) => normalizeEmail(m) === normalizeEmail(toInput)))  finalTo.push(toInput.trim());
    if (ccInput.trim()  && isValidEmail(ccInput.trim())  && !finalCc.some( (m) => normalizeEmail(m) === normalizeEmail(ccInput)))  finalCc.push(ccInput.trim());
    if (bccInput.trim() && isValidEmail(bccInput.trim()) && !finalBcc.some((m) => normalizeEmail(m) === normalizeEmail(bccInput))) finalBcc.push(bccInput.trim());

    if (finalTo.length === 0) { setEmailError("Please add at least one recipient."); return; }

    setIsSendingEmail(true);
    setEmailError(null);

    const results = await Promise.allSettled(
      selectedIds.map((leadId) =>
        LeadEmailAPI.sendNow({
          lead:         leadId,
          subject:      emailSubject.trim(),
          email_body:   emailBody.trim(),
          sender_email: fromEmail || undefined,
          cc:           finalCc.length  > 0 ? finalCc  : undefined,
          bcc:          finalBcc.length > 0 ? finalBcc : undefined,
        }),
      ),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount    = results.length - successCount;

    setIsSendingEmail(false);

    if (successCount === 0) {
      const firstErr = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
      setEmailError(getErrorMessage(firstErr?.reason, "Failed to send email. Please try again."));
      return;
    }

    const parts: string[] = [`Email sent to ${successCount} lead${successCount !== 1 ? "s" : ""} successfully.`];
    if (failCount) parts.push(`${failCount} failed.`);
    (failCount > 0 ? toast.warning : toast.success)(parts.join(" "), toastOptions);

    if (onSendEmail) onSendEmail(finalTo.join("; "), emailSubject, emailBody, String(selectedTemplate?.id ?? ""));
    setEmailStep(null);
  };

  // ── Toolbar helpers ───────────────────────────────────────────────
  const saveCursor = () => {
    const el = bodyRef.current;
    if (el) cursorPos.current = { start: el.selectionStart, end: el.selectionEnd };
  };

  const insertAtCursor = (text: string) => {
    const { start, end } = cursorPos.current;
    setEmailBody((prev) => {
      const next = prev.substring(0, start) + text + prev.substring(end);
      requestAnimationFrame(() => { const el = bodyRef.current; if (el) { el.focus(); el.setSelectionRange(start + text.length, start + text.length); } });
      return next;
    });
  };

  const wrapSelection = (before: string, after: string, placeholder = "text") => {
    const { start, end } = cursorPos.current;
    setEmailBody((prev) => {
      const selected = prev.substring(start, end) || placeholder;
      const wrapped  = before + selected + after;
      const next     = prev.substring(0, start) + wrapped + prev.substring(end);
      requestAnimationFrame(() => { const el = bodyRef.current; if (el) { el.focus(); el.setSelectionRange(start + before.length, start + before.length + selected.length); } });
      return next;
    });
  };

  // ── SMS handlers ──────────────────────────────────────────────────
  const openSMSCompose = () => { setSmsMessage(""); setSmsError(null); setSmsDialog("compose"); };
  const closeSMS = () => {
    if (isSendingSMS) return;
    setSmsDialog(null); setSmsMessage(""); setSmsError(null); setSelectedSMSTpl(null); setPreviewBody("");
  };
  const fetchSMSTemplates = async () => {
    setSmsLoading(true);
    try { const d = await (TemplateService as any).getTemplates("sms"); setSmsTemplates(Array.isArray(d) ? d : []); } // eslint-disable-line @typescript-eslint/no-explicit-any
    catch { setSmsTemplates([]); }
    finally { setSmsLoading(false); }
  };
  const openTemplateList = () => { fetchSMSTemplates(); setSmsDialog("templates"); };
  const handlePickTemplate = (tpl: SMSTemplate) => { setSelectedSMSTpl(tpl); setPreviewBody(tpl.body); setSmsDialog("preview"); };
  const handleUseTemplate  = () => { setSmsMessage(previewBody); setSmsError(null); setSelectedSMSTpl(null); setPreviewBody(""); setSmsDialog("compose"); };
  const openNewTemplate    = () => { setNewTplName(""); setNewTplUseCase(""); setNewTplBody(""); setNewTplError(null); setNewTplView("form"); setUseCaseAnchor(null); setSmsDialog("newTemplate"); };
  const handleSelectUseCase = (uc: string) => { setNewTplUseCase(uc); setUseCaseAnchor(null); if (!newTplBody.trim()) setNewTplBody(USE_CASE_BODY_SUGGESTIONS[uc] || ""); };

  const handleSaveNewTemplate = async () => {
    if (!newTplName.trim()) { setNewTplError("Template name is required."); return; }
    if (!newTplBody.trim()) { setNewTplError("Body is required."); return; }
    setNewTplSaving(true); setNewTplError(null);
    try {
      const payload = { clinic: 1, name: newTplName.trim(), use_case: newTplUseCase.toLowerCase() || "general", body: newTplBody.trim(), created_by: 1, is_active: true };
      let saved: SMSTemplate | null = null;
      try { saved = await (TemplateService as any).createTemplate("sms", payload); } // eslint-disable-line @typescript-eslint/no-explicit-any
      catch { saved = { id: `local-${Date.now()}`, name: newTplName.trim(), use_case: newTplUseCase, body: newTplBody.trim() }; }
      toast.success("Template saved and applied!", toastOptions);
      setSmsMessage(saved!.body); setSmsError(null); setSmsDialog("compose");
    } catch (err) { setNewTplError(getErrorMessage(err, "Failed to save template.")); }
    finally { setNewTplSaving(false); }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) { setSmsError("Message cannot be empty."); return; }
    setIsSendingSMS(true); setSmsError(null);

    // Step 1: load all leads upfront in parallel
    const leadMap: Record<string, { phone: string; name: string }> = {}; // ✅ fixed: was `let`, now `const`
    try {
      const leadsData = await Promise.all(selectedIds.map((id) => LeadAPI.getById(id)));
      leadsData.forEach((lead, i) => {
        const phone = lead?.contact_no?.trim();
        if (phone) leadMap[selectedIds[i]] = { phone, name: lead?.full_name ?? selectedIds[i] };
      });
    } catch (err) {
      setSmsError(getErrorMessage(err, "Failed to load lead data. Please try again."));
      setIsSendingSMS(false);
      return;
    }

    // Step 2: send SMS to every lead that has a phone number
    let successCount = 0; const errors: string[] = [];
    const results = await Promise.allSettled(
      selectedIds.map((leadId) => {
        const entry = leadMap[leadId];
        if (!entry) return Promise.reject(new Error(`No contact number for lead ${leadId}`));
        return TwilioAPI.sendSMS({ lead_uuid: leadId, to: entry.phone, message: smsMessage.trim() });
      }),
    );
    results.forEach((result, i) => {
      if (result.status === "fulfilled") successCount += 1;
      else errors.push(getErrorMessage((result as PromiseRejectedResult).reason, `Failed for lead ${selectedIds[i]}.`));
    });
    setIsSendingSMS(false);
    if (successCount > 0) {
      const msg = `SMS sent to ${successCount} lead${successCount > 1 ? "s" : ""} successfully.${errors.length ? ` ${errors.length} failed.` : ""}`;
      (errors.length === selectedIds.length ? toast.error : toast.success)(msg, errors.length === selectedIds.length ? toastErrorOptions : toastOptions);
      if (onSendSMS) onSendSMS(selectedIds, smsMessage.trim());
      closeSMS();
    } else { setSmsError(errors[0] ?? "Failed to send SMS. Please try again."); }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true); setDeleteError(null);
      const result = await dispatch(deleteLeads(selectedIds));
      if (deleteLeads.fulfilled.match(result)) { await dispatch(fetchLeads()); setOpenDelete(false); onDelete(); }
      else setDeleteError(typeof result.payload === "string" ? result.payload : "Failed to delete leads");
    } catch (err) { setDeleteError(getErrorMessage(err, "Failed to delete leads")); }
    finally { setIsDeleting(false); }
  };

  const handleArchiveConfirm = async () => {
    try {
      setIsArchiving(true); setArchiveError(null);
      const isArchiveAction = tab === "active";
      await Promise.all(selectedIds.map((id) => isArchiveAction ? LeadAPI.inactivate(id) : LeadAPI.activate(id)));
      await dispatch(fetchLeads()); setOpenArchive(false); onArchive(isArchiveAction);
    } catch (err) { setArchiveError(getErrorMessage(err, `Failed to ${tab === "active" ? "archive" : "unarchive"} leads`)); }
    finally { setIsArchiving(false); }
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ position: "sticky", bottom: 0, backgroundColor: "#fff", borderTop: "1px solid #E5E7EB", py: 1.5, px: 2, mt: 2, zIndex: 20 }}>
      <input ref={fileInputRef}  type="file" multiple style={{ display: "none" }} onChange={(e) => { const files = Array.from(e.target.files || []); if (!files.length) return; saveCursor(); insertAtCursor(`\n[📎 ${files.map((f) => f.name).join(", ")}]\n`); e.target.value = ""; }} />
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; saveCursor(); insertAtCursor(`\n[🖼 ${file.name}]\n`); e.target.value = ""; }} />

      {/* Action Buttons */}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button variant="outlined" startIcon={someDeleting || isDeleting ? <CircularProgress size={16} sx={{ color: "black" }} /> : <DeleteOutlineOutlinedIcon />} onClick={() => { setOpenDelete(true); setDeleteError(null); }} disabled={anyProcessing} sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          {someDeleting || isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Button variant="outlined" startIcon={isArchiving ? <CircularProgress size={16} sx={{ color: "black" }} /> : tab === "active" ? <ArchiveOutlinedIcon /> : <UnarchiveOutlinedIcon />} onClick={() => { setOpenArchive(true); setArchiveError(null); }} disabled={anyProcessing} sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          {isArchiving ? (tab === "active" ? "Archiving..." : "Restoring...") : tab === "active" ? "Archive" : "Restore"}
        </Button>
        <Button variant="outlined" startIcon={<ChatBubbleOutlineIcon />} onClick={openSMSCompose} disabled={anyProcessing} sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>SMS</Button>
        <Button variant="outlined" startIcon={loadingLeads ? <CircularProgress size={16} sx={{ color: "black" }} /> : <EmailOutlinedIcon />} onClick={handleOpenEmail} disabled={anyProcessing || loadingLeads} sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          {loadingLeads ? "Loading..." : "Email"}
        </Button>
        <Button variant="outlined" startIcon={<img src={ExportIcon} alt="Export" width={18} height={18} />} onClick={onExport} disabled={anyProcessing} sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>Export</Button>
      </Stack>

      {/* ── Delete Dialog ── */}
      <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px", px: 3, py: 4, textAlign: "center" } }}>
        <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
          <DeleteOutlineOutlinedIcon sx={{ fontSize: 30, color: "#EF4444" }} />
        </Box>
        <Typography fontWeight={700} fontSize="18px" color="#111827" mb={1.5}>Delete Lead</Typography>
        <Typography fontSize="14px" color="#6B7280" lineHeight={1.6} mb={2} px={1}>This action cannot be undone. Are you sure you want to Delete selected Lead permanently?</Typography>
        {deleteError && <Alert severity="error" sx={{ borderRadius: "10px", mb: 2, textAlign: "left" }}>{deleteError}</Alert>}
        <Stack direction="row" spacing={1.5}>
          <Button fullWidth onClick={() => { setOpenDelete(false); setDeleteError(null); }} disabled={isDeleting} sx={{ height: 48, fontWeight: 600, textTransform: "none", borderRadius: "10px", bgcolor: "#F3F4F6", color: "#374151", "&:hover": { bgcolor: "#E5E7EB" } }}>Cancel</Button>
          <Button fullWidth onClick={handleDelete} disabled={isDeleting} sx={{ height: 48, fontWeight: 600, textTransform: "none", borderRadius: "10px", bgcolor: "#1F2937", color: "#fff", "&:hover": { bgcolor: "#111827" }, "&:disabled": { bgcolor: "#9CA3AF", color: "#fff" } }}>
            {isDeleting ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Delete"}
          </Button>
        </Stack>
      </Dialog>

      {/* ── Archive Dialog ── */}
      <ArchiveLeadDialog open={openArchive} onClose={() => !isArchiving && setOpenArchive(false)} leadName={`${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""}`} onConfirm={handleArchiveConfirm} isUnarchive={tab === "archived"} isArchiving={isArchiving} error={archiveError} />

      {/* ══════════════════════════════════════════════════════════════
          EMAIL — STEP 1: Template selector
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={emailStep === "selector"} onClose={() => setEmailStep(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={700} fontSize="1.05rem">New Email</Typography>
            <Typography variant="caption" color="text.secondary">Sending to {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""}</Typography>
          </Box>
          <IconButton onClick={() => setEmailStep(null)}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          {/* Compose from scratch */}
          <Box onClick={() => { setSelectedTemplate(null); setEmailSubject(""); setEmailBody(""); setEmailStep("composer"); setEmailError(null); }} sx={{ border: "1px dashed #D1D5DB", borderRadius: 2, py: 3, textAlign: "center", cursor: "pointer", mb: 2.5, "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" }, transition: "all 0.15s" }}>
            <EditOutlinedIcon sx={{ color: "#6B7280" }} />
            <Typography fontWeight={500} mt={0.75} color="#374151">Compose New Email</Typography>
            <Typography variant="caption" color="text.secondary">Write a custom message from scratch</Typography>
          </Box>

          <Divider sx={{ mb: 2 }}><Typography fontSize="12px" color="text.secondary">OR USE A TEMPLATE</Typography></Divider>

          {templatesLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={22} /></Box>}
          {!templatesLoading && templatesError && <Alert severity="warning" sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }} action={<Button size="small" onClick={() => { setTemplatesLoading(true); EmailTemplateAPI.list().then((d) => setEmailTemplates(d.filter((t) => t.is_active !== false))).catch(() => setTemplatesError("Could not load templates.")).finally(() => setTemplatesLoading(false)); }}>Retry</Button>}>{templatesError}</Alert>}
          {!templatesLoading && !templatesError && emailTemplates.length === 0 && <Box sx={{ textAlign: "center", py: 4 }}><Typography color="text.secondary" fontSize="14px">No email templates found.</Typography></Box>}
          {!templatesLoading && emailTemplates.length > 0 && (
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
              {emailTemplates.map((t) => (
                <Box key={t.id} onClick={() => handleSelectTemplate(t)} sx={{ display: "flex", alignItems: "center", py: 1.5, px: 0.5, borderBottom: "1px solid #F3F4F6", cursor: "pointer", borderRadius: 1, bgcolor: selectedTemplate?.id === t.id ? "#F0F9FF" : "transparent", "&:hover": { bgcolor: selectedTemplate?.id === t.id ? "#F0F9FF" : "#F9FAFB" }, transition: "background 0.15s" }}>
                  <Radio checked={selectedTemplate?.id === t.id} onChange={() => handleSelectTemplate(t)} size="small" sx={{ color: selectedTemplate?.id === t.id ? "#EF4444" : "#CBD5E1", "&.Mui-checked": { color: "#EF4444" } }} />
                  <Box sx={{ flex: 1, ml: 0.5, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize="13.5px" fontWeight={600} color="#1E293B" noWrap>{t.name}</Typography>
                      {t.use_case && <Chip label={t.use_case} size="small" sx={{ ...getUseCaseSx(t.use_case), fontSize: "11px", height: 20, textTransform: "capitalize" }} />}
                    </Stack>
                    {t.subject && <Typography fontSize="11px" color="#94A3B8" mt={0.25} noWrap>Subject: {t.subject}</Typography>}
                  </Box>
                  <Tooltip title="Preview template">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }} sx={{ color: "#93C5FD", ml: 1, "&:hover": { color: "#3B82F6", bgcolor: "#EFF6FF" } }}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={() => setEmailStep(null)} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Cancel</Button>
          <Button onClick={() => { setEmailStep("composer"); setEmailError(null); }} variant="contained" disabled={!selectedTemplate} sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}>Continue</Button>
        </DialogActions>
      </Dialog>

      {/* Template preview */}
      <Dialog open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>{previewTemplate?.name}</Typography>
            {previewTemplate?.use_case && <Chip label={previewTemplate.use_case} size="small" sx={{ ...getUseCaseSx(previewTemplate.use_case), fontSize: "11px", height: 20, mt: 0.5, textTransform: "capitalize" }} />}
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
          <Button variant="contained" onClick={() => { if (previewTemplate) handleSelectTemplate(previewTemplate); setPreviewTemplate(null); }} sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" } }}>Use This Template</Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          EMAIL — STEP 2: Composer
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={emailStep === "composer"} onClose={() => !isSendingEmail && setEmailStep(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => setEmailStep("selector")} disabled={isSendingEmail}><ChevronLeftIcon fontSize="small" /></IconButton>
            <Box>
              <Typography fontWeight={700} fontSize="1.05rem">{selectedTemplate ? selectedTemplate.name : "New Email"}</Typography>
              <Typography variant="caption" color="text.secondary">
                Sending to {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""} · {toEmails.length} recipient{toEmails.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => !isSendingEmail && setEmailStep(null)} disabled={isSendingEmail}><CloseIcon /></IconButton>
        </Box>

        <DialogContent sx={{ px: 3, pb: 1 }}>
          {emailError && <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }} onClose={() => setEmailError(null)}>{emailError}</Alert>}

          <Stack spacing={0} divider={<Divider />}>
            {/* FROM */}
            <Box display="flex" alignItems="center" gap={1} py={1.2}>
              <Typography fontSize="13px" color="text.secondary" minWidth={55}>From:</Typography>
              <TextField value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} variant="standard" size="small" placeholder="Sender email" sx={{ minWidth: 260, "& .MuiInputBase-input": { fontSize: "13px" } }} InputProps={{ disableUnderline: true }} />
            </Box>

            {/* TO */}
            <Box ref={toRowRef} display="flex" alignItems="flex-start" gap={1} py={1} sx={{ flexWrap: "wrap" }}>
              <Typography fontSize="13px" color="text.secondary" minWidth={55} mt="8px">To:</Typography>
              <RecipientChipRow
                emails={toEmails} inputValue={toInput} onInputChange={setToInput}
                onInputFocus={() => { if (allLeadRecipients.length > 0 && toRowRef.current) setToAnchorEl(toRowRef.current); }}
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
              <RecipientPickerPopover open={Boolean(toAnchorEl)} anchorEl={toAnchorEl} onClose={() => setToAnchorEl(null)} paperRef={toPickerPaperRef} leads={allLeadRecipients} selectedEmails={toEmails} onToggle={(email) => toggleEmail(email, toEmails, setToEmails)} />
            </Box>

            {/* CC */}
            {(showCc || ccEmails.length > 0) && (
              <Box ref={ccRowRef} display="flex" alignItems="flex-start" gap={1} py={1} sx={{ flexWrap: "wrap" }}>
                <Typography fontSize="13px" color="text.secondary" minWidth={55} mt="8px">Cc:</Typography>
                <RecipientChipRow
                  emails={ccEmails} inputValue={ccInput} onInputChange={setCcInput}
                  onInputFocus={() => { if (allLeadRecipients.length > 0 && ccRowRef.current) setCcAnchorEl(ccRowRef.current); }}
                  onInputBlur={() => { addEmailsFromInput(ccInput, ccEmails, setCcEmails); setCcInput(""); }}
                  onInputKeyDown={(e) => { if (e.key === "Enter" || e.key === "," || e.key === "Tab") { e.preventDefault(); addEmailsFromInput(ccInput, ccEmails, setCcEmails); setCcInput(""); } }}
                  onRemove={(email) => setCcEmails(ccEmails.filter((m) => m !== email))}
                  chipColor={{ bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" }}
                  placeholder="Add Cc recipients"
                />
                <Box display="flex" ml="auto" pt={1} flexShrink={0}>
                  <Typography fontSize="12px" color="#64748B" sx={{ cursor: "pointer", "&:hover": { color: "#EF4444" }, userSelect: "none" }} onClick={() => { setShowCc(false); setCcEmails([]); setCcAnchorEl(null); }}>✕</Typography>
                </Box>
                <RecipientPickerPopover open={Boolean(ccAnchorEl)} anchorEl={ccAnchorEl} onClose={() => setCcAnchorEl(null)} paperRef={ccPickerPaperRef} leads={allLeadRecipients} selectedEmails={ccEmails} onToggle={(email) => toggleEmail(email, ccEmails, setCcEmails)} />
              </Box>
            )}

            {/* BCC */}
            {(showBcc || bccEmails.length > 0) && (
              <Box ref={bccRowRef} display="flex" alignItems="flex-start" gap={1} py={1} sx={{ flexWrap: "wrap" }}>
                <Typography fontSize="13px" color="text.secondary" minWidth={55} mt="8px">Bcc:</Typography>
                <RecipientChipRow
                  emails={bccEmails} inputValue={bccInput} onInputChange={setBccInput}
                  onInputFocus={() => { if (allLeadRecipients.length > 0 && bccRowRef.current) setBccAnchorEl(bccRowRef.current); }}
                  onInputBlur={() => { addEmailsFromInput(bccInput, bccEmails, setBccEmails); setBccInput(""); }}
                  onInputKeyDown={(e) => { if (e.key === "Enter" || e.key === "," || e.key === "Tab") { e.preventDefault(); addEmailsFromInput(bccInput, bccEmails, setBccEmails); setBccInput(""); } }}
                  onRemove={(email) => setBccEmails(bccEmails.filter((m) => m !== email))}
                  chipColor={{ bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" }}
                  placeholder="Add Bcc recipients"
                />
                <Box display="flex" ml="auto" pt={1} flexShrink={0}>
                  <Typography fontSize="12px" color="#64748B" sx={{ cursor: "pointer", "&:hover": { color: "#EF4444" }, userSelect: "none" }} onClick={() => { setShowBcc(false); setBccEmails([]); setBccAnchorEl(null); }}>✕</Typography>
                </Box>
                <RecipientPickerPopover open={Boolean(bccAnchorEl)} anchorEl={bccAnchorEl} onClose={() => setBccAnchorEl(null)} paperRef={bccPickerPaperRef} leads={allLeadRecipients} selectedEmails={bccEmails} onToggle={(email) => toggleEmail(email, bccEmails, setBccEmails)} />
              </Box>
            )}

            {/* SUBJECT */}
            <Box display="flex" alignItems="center" gap={1} py={1}>
              <Typography fontSize="13px" color="text.secondary" minWidth={55}>Subject:</Typography>
              <TextField fullWidth variant="standard" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} disabled={isSendingEmail} InputProps={{ disableUnderline: true, sx: { fontSize: "13px" } }} placeholder="Enter subject..." />
            </Box>

            {/* BODY */}
            <Box py={1.5} sx={{ minHeight: 160 }}>
              <textarea ref={bodyRef} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} onSelect={saveCursor} onKeyUp={saveCursor} onMouseUp={saveCursor} disabled={isSendingEmail} placeholder="Write your message..." rows={9}
                style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "none", outline: "none", fontSize: "13px", lineHeight: 1.7, fontFamily: "inherit", color: "#1E293B", background: "transparent", padding: 0 }}
              />
            </Box>
          </Stack>
        </DialogContent>

        {/* Toolbar + actions */}
        <Box sx={{ px: 3, pb: 3, pt: 1, borderTop: "1px solid #E5E7EB" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 1.5, pt: 1, flexWrap: "wrap" }}>
            {[
              { title: "Attach file",   icon: <AttachFileOutlinedIcon sx={{ fontSize: 18 }} />,       onClick: () => fileInputRef.current?.click() },
              { title: "Insert link",   icon: <LinkOutlinedIcon sx={{ fontSize: 18 }} />,              onClick: () => { saveCursor(); const url = window.prompt("Enter URL:", "https://"); if (!url) return; const label = window.prompt("Link label:", "Click here") || url; insertAtCursor(`[${label}](${url})`); } },
              { title: "Emoji",         icon: <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />,    onClick: () => { saveCursor(); const e = window.prompt("Enter emoji:"); if (e) insertAtCursor(e); } },
              { title: "Insert image",  icon: <ImageOutlinedIcon sx={{ fontSize: 18 }} />,            onClick: () => imageInputRef.current?.click() },
              { title: "Bold",          icon: <FormatColorTextOutlinedIcon sx={{ fontSize: 18 }} />,  onClick: () => { saveCursor(); wrapSelection("**", "**", "bold text"); } },
              { title: "Highlight",     icon: <BrushOutlinedIcon sx={{ fontSize: 18 }} />,            onClick: () => { saveCursor(); wrapSelection("==", "==", "highlighted text"); } },
              { title: "Bullet list",   icon: <AddCircleOutlineIcon sx={{ fontSize: 18 }} />,         onClick: () => { saveCursor(); insertAtCursor("\n• "); } },
            ].map(({ title, icon, onClick }) => (
              <Tooltip key={title} title={title}>
                <IconButton size="small" onClick={onClick} disabled={isSendingEmail} sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}>{icon}</IconButton>
              </Tooltip>
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button onClick={() => setEmailStep("selector")} disabled={isSendingEmail} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Back</Button>
            <Button
              variant="contained"
              onClick={handleSendEmail}
              disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim() || toEmails.length === 0}
              endIcon={isSendingEmail ? <CircularProgress size={14} sx={{ color: "white" }} /> : <SendOutlinedIcon />}
              sx={{ height: 40, backgroundColor: "#4B5563", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, minWidth: 120, "&:hover": { backgroundColor: "#374151" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}
            >
              {isSendingEmail ? "Sending..." : `Send to ${selectedIds.length}`}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* SMS — STEP 1: COMPOSE */}
      <Dialog open={smsDialog === "compose"} onClose={closeSMS} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700} fontSize="1.05rem">Send SMS</Typography>
          <IconButton size="small" onClick={closeSMS} disabled={isSendingSMS}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ backgroundColor: "#F8FAFC", borderRadius: "10px", px: 2, py: 1.5, border: "1px solid #E2E8F0", mb: 2 }}>
            <Typography variant="body2" color="text.secondary" fontSize="12px">Sending to</Typography>
            <Typography fontWeight={600} fontSize="14px">{selectedIds.length} selected lead{selectedIds.length > 1 ? "s" : ""}</Typography>
          </Box>
          <TextField label="Message" multiline rows={4} value={smsMessage} onChange={(e) => { setSmsMessage(e.target.value); setSmsError(null); }} disabled={isSendingSMS} placeholder="Type your message here..." inputProps={{ maxLength: 1600 }} helperText={`${smsMessage.length}/1600`} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
          {smsError && <Alert severity="error" sx={{ borderRadius: "8px", mt: 2 }} onClose={() => setSmsError(null)}>{smsError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
          <Button fullWidth variant="outlined" onClick={openTemplateList} disabled={isSendingSMS} sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>SMS Template</Button>
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button fullWidth onClick={closeSMS} disabled={isSendingSMS} sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>Cancel</Button>
            <Button fullWidth onClick={handleSendSMS} disabled={isSendingSMS || !smsMessage.trim()} startIcon={isSendingSMS ? <CircularProgress size={16} sx={{ color: "white" }} /> : null} sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
              {isSendingSMS ? "Sending..." : "Send SMS"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* SMS — STEP 2: SELECT TEMPLATE */}
      <Dialog open={smsDialog === "templates"} onClose={() => setSmsDialog("compose")} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={600}>Select SMS Template</Typography>
          <IconButton size="small" onClick={() => setSmsDialog("compose")}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 1, pb: 0 }}>
          {smsLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
           : smsTemplates.length === 0 ? <Box sx={{ textAlign: "center", py: 4 }}><ChatBubbleOutlineIcon sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }} /><Typography variant="body2" color="text.secondary">No SMS templates found.</Typography></Box>
           : (
            <List disablePadding sx={{ maxHeight: 340, overflowY: "auto" }}>
              {smsTemplates.map((tpl, idx) => (
                <React.Fragment key={tpl.id}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handlePickTemplate(tpl)} sx={{ borderRadius: "8px", px: 1.5, py: 1.25, "&:hover": { bgcolor: "#F8FAFC" } }}>
                      <ListItemText
                        primary={<Stack direction="row" spacing={1} alignItems="center"><Typography fontSize="14px" fontWeight={600} color="#1E293B">{tpl.name}</Typography>{tpl.use_case && <Chip label={tpl.use_case} size="small" sx={{ ...getUseCaseSx(tpl.use_case), fontSize: "11px", height: 20, textTransform: "capitalize" }} />}</Stack>}
                        secondary={<Typography fontSize="12px" color="#64748B" sx={{ mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{tpl.body}</Typography>}
                      />
                    </ListItemButton>
                  </ListItem>
                  {idx < smsTemplates.length - 1 && <Divider sx={{ my: 0.25 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
          <Button fullWidth variant="outlined" onClick={openNewTemplate} sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>+ New Template</Button>
          <Button fullWidth onClick={() => setSmsDialog("compose")} sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* SMS — STEP 3: PREVIEW TEMPLATE */}
      <Dialog open={smsDialog === "preview"} onClose={() => setSmsDialog("templates")} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={600}>Preview Template</Typography>
          <IconButton size="small" onClick={() => setSmsDialog("templates")}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          {selectedSMSTpl && (
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <Typography fontSize="13px" color="#64748B">Template:</Typography>
              <Typography fontSize="13px" fontWeight={600} color="#1E293B">{selectedSMSTpl.name}</Typography>
              {selectedSMSTpl.use_case && <Chip label={selectedSMSTpl.use_case} size="small" sx={{ ...getUseCaseSx(selectedSMSTpl.use_case), fontSize: "11px", height: 20, textTransform: "capitalize" }} />}
            </Stack>
          )}
          <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", p: 2, minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "flex-end", mb: 2 }}>
            <Box sx={{ alignSelf: "flex-start", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "0px 12px 12px 12px", px: 2, py: 1.25, maxWidth: "90%", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <Typography fontSize="13px" color="#1E293B" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {previewBody.split(/(\{[^}]+\})/g).map((part, i) => /^\{[^}]+\}$/.test(part) ? <Box key={i} component="span" sx={{ color: "#4F46E5", fontWeight: 500 }}>{part}</Box> : part)}
              </Typography>
            </Box>
            <Typography fontSize="11px" color="#94A3B8" sx={{ mt: 0.75, alignSelf: "flex-end" }}>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</Typography>
          </Box>
          <TextField label="Edit message before sending" multiline rows={4} value={previewBody} onChange={(e) => setPreviewBody(e.target.value)} inputProps={{ maxLength: 1600 }} helperText={`${previewBody.length}/1600`} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth onClick={() => setSmsDialog("templates")} sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>Back</Button>
          <Button fullWidth onClick={handleUseTemplate} disabled={!previewBody.trim()} sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>Use Template</Button>
        </DialogActions>
      </Dialog>

      {/* SMS — STEP 4: NEW TEMPLATE */}
      <Dialog open={smsDialog === "newTemplate"} onClose={() => setSmsDialog("templates")} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        {newTplView === "form" && (
          <>
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography fontWeight={700} fontSize="1.05rem">New SMS Template</Typography>
              <IconButton size="small" onClick={() => setSmsDialog("templates")}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <DialogContent sx={{ pt: 2 }}>
              <Stack spacing={2.5}>
                <TextField placeholder="Name" value={newTplName} onChange={(e) => { setNewTplName(e.target.value); setNewTplError(null); }} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
                <Box>
                  <Typography fontSize="13px" fontWeight={500} color="#374151" mb={0.75}>Use Case</Typography>
                  <Box onClick={(e) => setUseCaseAnchor(e.currentTarget as HTMLElement)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid", borderColor: useCaseMenuOpen ? "#1976d2" : "#D1D5DB", borderRadius: "8px", px: 1.5, cursor: "pointer", minHeight: 42, bgcolor: "#fff", boxShadow: useCaseMenuOpen ? "0 0 0 2px rgba(25,118,210,0.15)" : "none", "&:hover": { borderColor: "#9CA3AF" }, transition: "all 0.15s" }}>
                    {newTplUseCase ? <Chip label={newTplUseCase} size="small" sx={getUseCaseSx(newTplUseCase)} /> : <Typography fontSize="14px" color="#9CA3AF">Select use case</Typography>}
                    <Typography sx={{ fontSize: "12px", color: "#6B7280", transform: useCaseMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</Typography>
                  </Box>
                  <Menu anchorEl={useCaseAnchor} open={useCaseMenuOpen} onClose={() => setUseCaseAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }} PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", mt: 0.5, minWidth: 220 } }}>
                    {USE_CASE_OPTIONS.map((uc) => <MenuItem key={uc} selected={newTplUseCase === uc} onClick={() => handleSelectUseCase(uc)} sx={{ py: 1, px: 1.5, "&.Mui-selected": { bgcolor: "#F1F5F9" }, "&:hover": { bgcolor: "#F8FAFC" } }}><Chip label={uc} size="small" sx={getUseCaseSx(uc)} /></MenuItem>)}
                  </Menu>
                </Box>
                <Box>
                  <Typography fontSize="13px" fontWeight={500} color="#374151" mb={0.75}>Body</Typography>
                  <textarea value={newTplBody} onChange={(e) => { setNewTplBody(e.target.value); setNewTplError(null); }} placeholder="Type your message here..." maxLength={1600} rows={7} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "14px", fontFamily: "inherit", color: "#1E293B", lineHeight: "1.6", border: "1px solid #D1D5DB", borderRadius: "8px", resize: "vertical", outline: "none", background: "#fff" }} onFocus={(e) => { e.target.style.borderColor = "#1976d2"; e.target.style.boxShadow = "0 0 0 2px rgba(25,118,210,0.15)"; }} onBlur={(e) => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }} />
                  <Typography fontSize="11px" color="#94A3B8" mt={0.5}>{newTplBody.length}/1600 — Use {"{variable_name}"} for dynamic fields</Typography>
                </Box>
                {newTplError && <Alert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>{newTplError}</Alert>}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
              <Button onClick={() => setSmsDialog("templates")} sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151", bgcolor: "white", "&:hover": { bgcolor: "#F9FAFB" } }}>Cancel</Button>
              <Button onClick={() => { if (!newTplName.trim()) { setNewTplError("Template name is required."); return; } if (!newTplBody.trim()) { setNewTplError("Body is required."); return; } setNewTplError(null); setNewTplView("preview"); }} sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151", bgcolor: "white", "&:hover": { bgcolor: "#F9FAFB" } }}>Preview</Button>
              <Button onClick={handleSaveNewTemplate} disabled={newTplSaving || !newTplName.trim() || !newTplBody.trim()} sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", bgcolor: "#1F2937", color: "white", fontWeight: 600, "&:hover": { bgcolor: "#111827" }, "&:disabled": { bgcolor: "#9CA3AF", color: "white" } }}>{newTplSaving ? "Saving..." : "Save"}</Button>
            </DialogActions>
          </>
        )}
        {newTplView === "preview" && (
          <>
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography fontWeight={700} fontSize="1.05rem">Preview Template</Typography>
              <IconButton size="small" onClick={() => setSmsDialog("templates")}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <DialogContent sx={{ pt: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Typography fontSize="13px" color="#64748B">Template:</Typography>
                <Typography fontSize="13px" fontWeight={600} color="#1E293B">{newTplName}</Typography>
                {newTplUseCase && <Chip label={newTplUseCase} size="small" sx={getUseCaseSx(newTplUseCase)} />}
              </Stack>
              <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", p: 2, minHeight: 160, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <Box sx={{ alignSelf: "flex-start", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "0px 12px 12px 12px", px: 2, py: 1.25, maxWidth: "90%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <Typography fontSize="13px" color="#1E293B" sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {newTplBody.split(/(\{[^}]+\})/g).map((part, i) => /^\{[^}]+\}$/.test(part) ? <Box key={i} component="span" sx={{ color: "#4F46E5", fontWeight: 600 }}>{part}</Box> : part)}
                  </Typography>
                </Box>
                <Typography fontSize="11px" color="#94A3B8" sx={{ mt: 0.75, alignSelf: "flex-end" }}>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
              <Button onClick={() => setNewTplView("form")} sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151", bgcolor: "white", "&:hover": { bgcolor: "#F9FAFB" } }}>Back to Edit</Button>
              <Button onClick={handleSaveNewTemplate} disabled={newTplSaving} sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", bgcolor: "#1F2937", color: "white", fontWeight: 600, "&:hover": { bgcolor: "#111827" }, "&:disabled": { bgcolor: "#9CA3AF", color: "white" } }}>{newTplSaving ? "Saving..." : "Save"}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default BulkActionBar;