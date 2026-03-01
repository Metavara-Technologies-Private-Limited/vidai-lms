import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  Chip,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  TextField,
  IconButton,
  Radio,
  Divider,
} from "@mui/material";
import Lead_Subtract from "../../assets/icons/Lead_Subtract.svg";

import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DataObjectIcon from "@mui/icons-material/DataObject";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import { Dialogs } from "./LeadsMenuDialogs";
import PatientInfoTab from "./PatientInfotab";
import HistoryTab from "./HistoryTab";
import NextActionTab from "./Nextactiontab";

import {
  fetchLeads,
  convertLead,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import { api, LeadAPI } from "../../services/leads.api";

import {
  formatLeadId,
  normalizeDocument,
  formatNoteTime,
  getCleanLeadId,
  getCurrentUserId,
} from "./LeadDetailHelpers";

import type {
  LeadRecord,
  NoteData,
  RawNote,
  TwilioCall,
  TwilioSMS,
  DocumentEntry,
  HistoryView,
} from "./LeadDetailTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Email Template Types & Data
// ─────────────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
<<<<<<< Updated upstream
  uuid?: string;
  title: string;
  content: string;
  time: string;
}

interface RawNote {
  id: string;
  title?: string;
  note?: string;
  created_at?: string;
  is_deleted?: boolean;
}

// Twilio API types
interface TwilioCall {
  id: number;
  lead_uuid: string;
  sid: string;
  from_number: string;
  to_number: string;
  status?: string;
  created_at: string;
}

interface TwilioSMS {
  id: number;
  lead_uuid: string;
  sid: string;
  from_number: string;
  to_number: string;
  body: string;
  status?: string;
  direction: "inbound" | "outbound";
  created_at: string;
}

interface LeadRecord {
  id: string;
  full_name?: string;
  name?: string;
  assigned_to_name?: string;
  assigned?: string;
  status?: string;
  lead_status?: string;
  quality?: string;
  score?: number | string;
  source?: string;
  sub_source?: string;
  campaign_name?: string;
  campaign_duration?: string;
  phone?: string;
  contact_number?: string;
  contact_no?: string;
  email?: string;
  location?: string;
  gender?: string;
  age?: number | string;
  marital_status?: string;
  address?: string;
  language_preference?: string;
  created_at?: string;
  initials?: string;
  department?: string;
  department_name?: string;
  department_id?: number;
  clinic_id?: number;
  personnel?: string;
  appointment_date?: string;
  slot?: string;
  appointment_slot?: string;
  remark?: string;
  appointment_remark?: string;
  treatment_interest?: string;
  partner_name?: string;
  partner_full_name?: string;
  partner_age?: number | string;
  partner_gender?: string;
  next_action_type?: string;
  next_action_status?: string;
  next_action_description?: string;
  task?: string;
  taskStatus?: string;
  is_active?: boolean;
  book_appointment?: boolean;
  partner_inquiry?: boolean;
  phone_number?: string;
  documents?: string[];
}



interface TimelineItemProps {
  icon?: React.ReactNode;
  title: string;
  time: string;
  isAvatar?: boolean;
  avatarInitial?: string;
  isLast?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}

interface ChatBubbleProps {
  side: "left" | "right";
  text: string;
  time: string;
}

interface InfoProps {
  label: string;
  value: string;
  isAvatar?: boolean;
}

interface DocumentRowProps {
=======
>>>>>>> Stashed changes
  name: string;
  subject: string;
  preview: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "appt-confirmation",
    name: "Appointment Confirmation",
    subject: "Your Consultation is Confirmed – {appointment_date}",
    preview: "Your Consultation is Confirmed – {appointment_date}",
    body: `Hi {lead_first_name},

Thank you for choosing {clinic_name}.
Your fertility consultation has been successfully scheduled!

  • Date : {appointment_date}
  • Time : {appointment_time}
  • Location : {clinic_name}, {clinic_address}

Please arrive 10 minutes early and bring any relevant medical reports.

If you need to reschedule, please let us know.

Warm regards,
The Vidai Team`,
  },
  {
    id: "ivf-followup",
    name: "IVF Consultation Follow-Up",
    subject: "Reminder: Your Consultation Is Tomorrow",
    preview: "Reminder: Your Consultation Is Tomorrow",
    body: `Hi {lead_first_name},

Just a friendly reminder that your IVF consultation is scheduled for tomorrow.

Please ensure you:
  • Bring your ID and any prior test reports
  • Arrive 10 minutes early for check-in
  • Contact us if you need to reschedule

We look forward to seeing you!

Warm regards,
The Vidai Team`,
  },
  {
    id: "consultation-reminder",
    name: "Consultation Reminder – 24 Hrs",
    subject: "Continuing Your Care Journey Together",
    preview: "Continuing Your Care Journey Together",
    body: `Hi {lead_first_name},

Your appointment is in 24 hours. Here's a quick reminder:

  • Date : {appointment_date}
  • Time : {appointment_time}

Please feel free to reach out if you have any questions before your visit.

Warm regards,
The Vidai Team`,
  },
  {
    id: "welcome-returning",
    name: "Welcome Back – Returning Patient",
    subject: "Your Consultation Is Set for – {appointment_date}",
    preview: "Your Consultation Is Set for – March 15, 2023",
    body: `Hi {lead_first_name},

Welcome back! We're delighted to continue supporting your care journey.

Your upcoming consultation is confirmed for {appointment_date}.

If anything has changed since your last visit, please inform our team ahead of time so we can prepare accordingly.

Warm regards,
The Vidai Team`,
  },
  {
    id: "appt-booking",
    name: "Appointment Booking",
    subject: "Checking in on Your Fertility Inquiry",
    preview: "Checking in on Your Fertility Inquiry",
    body: `Hi {lead_first_name},

Thank you for your interest in our fertility services.

We noticed you recently inquired but haven't yet booked a consultation. Our specialists are ready to help you take the next step.

Please reply to this email or call us to schedule a convenient time.

Feel free to reach out with any questions.

Warm regards,
The Vidai Team`,
  },
];

function resolveTokens(text: string, tokens: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => tokens[key] ?? `{${key}}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template Preview Dialog (eye icon click)
// ─────────────────────────────────────────────────────────────────────────────

interface TemplatePreviewDialogProps {
  open: boolean;
  template: EmailTemplate | null;
  tokens: Record<string, string>;
  onClose: () => void;
  onUse: (template: EmailTemplate) => void;
}

const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  open, template, tokens, onClose, onUse,
}) => {
  if (!template) return null;
  const resolvedSubject = resolveTokens(template.subject, tokens);
  const resolvedBody    = resolveTokens(template.body, tokens);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 0.8, bgcolor: "#EFF6FF", borderRadius: "8px", display: "flex" }}>
              <EmailOutlinedIcon sx={{ color: "#3B82F6", fontSize: 18 }} />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize="14px">{template.name}</Typography>
              <Typography variant="caption" color="text.secondary" fontSize="11px">Template Preview</Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose} sx={{ color: "#6B7280" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ p: 3, bgcolor: "#F8FAFC", maxHeight: "60vh", overflowY: "auto" }}>
          <Box sx={{ bgcolor: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #F1F5F9", bgcolor: "#FAFAFA" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px" fontWeight={600}
                sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>Subject</Typography>
              <Typography fontWeight={600} fontSize="13px" mt={0.3} color="#1E293B">{resolvedSubject}</Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography fontSize="13px" color="#374151" sx={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>
                {resolvedBody}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 26, height: 26, borderRadius: "6px", bgcolor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography fontSize="9px" fontWeight={700} color="#6366F1">VI</Typography>
                </Box>
                <Box>
                  <Typography fontSize="11px" fontWeight={700} color="#1E293B">VIDAI Clinic</Typography>
                  <Typography fontSize="10px" color="text.secondary">(555) 555-0128 | crysta@gmail.com</Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 2, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button onClick={onClose} variant="outlined"
            sx={{ textTransform: "none", fontSize: "13px", borderColor: "#D1D5DB", color: "#374151", borderRadius: "8px" }}>
            Close
          </Button>
          <Button variant="contained"
            onClick={() => { onUse({ ...template, subject: resolvedSubject, body: resolvedBody }); onClose(); }}
            sx={{ textTransform: "none", fontSize: "13px", bgcolor: "#1E293B", borderRadius: "8px", boxShadow: "none", "&:hover": { bgcolor: "#0F172A", boxShadow: "none" } }}>
            Next
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// New Email Dialog — matches Figma exactly
// ─────────────────────────────────────────────────────────────────────────────

interface NewEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onComposeBlank: () => void;
  onSelectTemplate: (template: EmailTemplate) => void;
  tokens: Record<string, string>;
}

const NewEmailDialog: React.FC<NewEmailDialogProps> = ({
  open, onClose, onComposeBlank, onSelectTemplate, tokens,
}) => {
  const [selectedId, setSelectedId]           = React.useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = React.useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen]         = React.useState(false);

  React.useEffect(() => { if (open) setSelectedId(null); }, [open]);

  const handleEyeClick = (e: React.MouseEvent, tpl: EmailTemplate) => {
    e.stopPropagation();
    setPreviewTemplate(tpl);
    setPreviewOpen(true);
  };

  const handleUseFromPreview = (tpl: EmailTemplate) => {
    onSelectTemplate(tpl);
    onClose();
  };

  const handleProceedWithSelected = () => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === selectedId);
    if (!tpl) return;
    onSelectTemplate({
      ...tpl,
      subject: resolveTokens(tpl.subject, tokens),
      body:    resolveTokens(tpl.body, tokens),
    });
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}>
        <DialogContent sx={{ p: 0 }}>

          {/* Header */}
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography fontWeight={700} fontSize="16px">New Email</Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: "#6B7280" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ px: 3, py: 2.5 }}>

            {/* Compose New Email row */}
            <Box
              onClick={onComposeBlank}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                py: 1.5, borderRadius: "10px", border: "1.5px dashed #CBD5E1",
                cursor: "pointer", color: "#475569", transition: "all 0.15s ease",
                "&:hover": { bgcolor: "#F8FAFC", borderColor: "#94A3B8", color: "#1E293B" },
              }}
            >
              <EditNoteOutlinedIcon sx={{ fontSize: 18, color: "#64748B" }} />
              <Typography fontSize="14px" fontWeight={600} color="inherit">Compose New Email</Typography>
            </Box>

            {/* OR divider */}
            <Stack direction="row" alignItems="center" spacing={2} my={2.5}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary" fontSize="12px" fontWeight={500}>OR</Typography>
              <Divider sx={{ flex: 1 }} />
            </Stack>

            {/* Label */}
            <Typography fontSize="13px" color="text.secondary" fontWeight={500} mb={1.5}>
              Select Email Template
            </Typography>

            {/* Template list */}
            <Stack spacing={0}>
              {EMAIL_TEMPLATES.map((tpl, idx) => {
                const isSelected = tpl.id === selectedId;
                const isLast     = idx === EMAIL_TEMPLATES.length - 1;
                return (
                  <Box
                    key={tpl.id}
                    onClick={() => setSelectedId(tpl.id)}
                    sx={{
                      display: "flex", alignItems: "center", px: 1.5, py: 1.25,
                      cursor: "pointer",
                      borderBottom: isLast ? "none" : "1px solid #F1F5F9",
                      borderRadius: isSelected ? "8px" : 0,
                      bgcolor: isSelected ? "#F5F3FF" : "transparent",
                      transition: "background 0.12s",
                      "&:hover": { bgcolor: isSelected ? "#F5F3FF" : "#F8FAFC" },
                    }}
                  >
                    <Radio checked={isSelected} size="small"
                      sx={{ color: "#CBD5E1", "&.Mui-checked": { color: "#6366F1" }, p: 0, mr: 1.5, flexShrink: 0 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} fontSize="13px"
                        color={isSelected ? "#4F46E5" : "#374151"} noWrap>
                        {tpl.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontSize="11px" noWrap display="block">
                        {resolveTokens(tpl.preview, tokens)}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={(e) => handleEyeClick(e, tpl)}
                      sx={{ color: "#94A3B8", ml: 0.5, flexShrink: 0, "&:hover": { color: "#6366F1", bgcolor: "#EEF2FF" } }}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* Footer */}
          <Box sx={{ px: 3, py: 2, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
            <Button onClick={onClose} variant="outlined"
              sx={{ textTransform: "none", fontSize: "13px", borderColor: "#D1D5DB", color: "#374151", borderRadius: "8px", px: 3, "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
              Cancel
            </Button>
            {selectedId && (
              <Button variant="contained" onClick={handleProceedWithSelected}
                sx={{ textTransform: "none", fontSize: "13px", bgcolor: "#1E293B", borderRadius: "8px", px: 3, boxShadow: "none", "&:hover": { bgcolor: "#0F172A", boxShadow: "none" } }}>
                Next
              </Button>
            )}
          </Box>

        </DialogContent>
      </Dialog>

      {/* Eye-icon preview popup */}
      <TemplatePreviewDialog
        open={previewOpen}
        template={previewTemplate}
        tokens={tokens}
        onClose={() => setPreviewOpen(false)}
        onUse={handleUseFromPreview}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Compose Email Dialog — matches Figma design exactly
// ─────────────────────────────────────────────────────────────────────────────

interface ComposeEmailDialogProps {
  open: boolean;
  leadName: string;
  leadInitials: string;
  leadEmail: string;
  pendingTemplate: EmailTemplate | null;
  onClose: () => void;
}

// ONLY CHANGE: ToolbarBtn now accepts onClick prop
const ToolbarBtn: React.FC<{ children: React.ReactNode; title?: string; onClick?: () => void }> = ({ children, title, onClick }) => (
  <IconButton size="small" title={title} onClick={onClick}
    sx={{ color: "#6B7280", borderRadius: "6px", p: 0.6, "&:hover": { bgcolor: "#F3F4F6", color: "#111827" } }}>
    {children}
  </IconButton>
);

const ComposeEmailDialog: React.FC<ComposeEmailDialogProps> = ({
  open, leadName, leadInitials, leadEmail, pendingTemplate, onClose,
}) => {
  const [subject, setSubject] = React.useState("");
  const [body, setBody]       = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [saving, setSaving]   = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  // ONLY CHANGE: added refs and cursor tracking for toolbar functionality
  const fileRef     = React.useRef<HTMLInputElement>(null);
  const imageRef    = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const cursorPos   = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const saveCursor = () => {
    const el = textareaRef.current;
    if (el) cursorPos.current = { start: el.selectionStart, end: el.selectionEnd };
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const { start, end } = cursorPos.current;
    const next = body.substring(0, start) + text + body.substring(end);
    setBody(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + text.length, start + text.length); }, 0);
  };

  const wrapSelection = (before: string, after: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const { start, end } = cursorPos.current;
    const selected = body.substring(start, end);
    const wrapped  = before + (selected || "text") + after;
    setBody(body.substring(0, start) + wrapped + body.substring(end));
    setTimeout(() => { el.focus(); el.setSelectionRange(start + before.length, start + before.length + (selected || "text").length); }, 0);
  };

  React.useEffect(() => {
    if (open) {
      setSubject(pendingTemplate?.subject ?? "");
      setBody(pendingTemplate?.body ?? "");
      setError(null);
    }
  }, [open, pendingTemplate]);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required.");
      return;
    }
    try {
      setSending(true); setError(null);
      // TODO: await api.post("/emails/send/", { to: leadEmail, subject, body });
      console.log("📧 Sending email:", { to: leadEmail, subject, body });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send email.");
    } finally { setSending(false); }
  };

  const handleSaveAsTemplate = async () => {
    if (!subject.trim() || !body.trim()) return;
    try {
      setSaving(true);
      // TODO: await api.post("/email-templates/", { name: subject, subject, body });
      console.log("💾 Saving template:", { subject, body });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save template.");
    } finally { setSaving(false); }
  };

  // ONLY CHANGE: toolbar onClick handlers
  const handleBold     = () => { saveCursor(); wrapSelection("**", "**"); };
  const handleAttach   = () => fileRef.current?.click();
  const handleImage    = () => imageRef.current?.click();
  const handleLink     = () => { saveCursor(); const url = window.prompt("Enter URL:", "https://"); if (url) insertAtCursor(`[link](${url})`); };
  const handleEmoji    = () => { saveCursor(); const e = window.prompt("Enter emoji:", "😊"); if (e) insertAtCursor(e); };
  const handleVariable = () => { saveCursor(); const v = window.prompt("Variable name:", "lead_first_name"); if (v) insertAtCursor(`{${v}}`); };
  const handleHighlight = () => { saveCursor(); wrapSelection("==", "=="); };
  const handleMore     = () => { saveCursor(); insertAtCursor("\n\n"); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const names = Array.from(e.target.files).map((f) => f.name).join(", ");
    saveCursor(); insertAtCursor(`\n[Attachment: ${names}]`);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    saveCursor(); insertAtCursor(`\n[Image: ${file.name}]`);
  };

  return (
    <Dialog
      open={open}
      onClose={sending ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          maxHeight: "92vh",
          boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700} fontSize="16px" color="#111827">New Email</Typography>
          <IconButton onClick={onClose} disabled={sending} size="small" sx={{ color: "#6B7280" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* ── To field ── */}
        <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1 }}>
          <Typography fontSize="13px" color="#6B7280" fontWeight={500} sx={{ flexShrink: 0 }}>To :</Typography>
          {/* Recipient chip */}
          <Box sx={{
            display: "flex", alignItems: "center", gap: 0.75,
            px: 1, py: 0.4, borderRadius: "6px",
            bgcolor: "#EEF2FF", border: "1px solid #C7D2FE",
          }}>
            <Avatar sx={{ width: 18, height: 18, fontSize: "9px", fontWeight: 700, bgcolor: "#6366F1", color: "#fff" }}>
              {leadInitials}
            </Avatar>
            <Typography fontSize="12px" fontWeight={600} color="#4338CA">{leadName}</Typography>
            <IconButton size="small" onClick={() => {}} sx={{ p: 0.1, color: "#6366F1", "&:hover": { color: "#4338CA" } }}>
              <CloseIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
          {/* Cc | Bcc */}
          <Box sx={{ ml: "auto", display: "flex", gap: 1.5 }}>
            <Typography fontSize="13px" color="#6B7280" sx={{ cursor: "pointer", "&:hover": { color: "#374151" } }}>Cc</Typography>
            <Typography fontSize="13px" color="#6B7280">|</Typography>
            <Typography fontSize="13px" color="#6B7280" sx={{ cursor: "pointer", "&:hover": { color: "#374151" } }}>Bcc</Typography>
          </Box>
        </Box>

        {/* ── Subject field ── */}
        <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1 }}>
          <Typography fontSize="13px" color="#6B7280" fontWeight={500} sx={{ flexShrink: 0 }}>Subject :</Typography>
          <TextField
            fullWidth
            variant="standard"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject..."
            InputProps={{ disableUnderline: true }}
            sx={{ "& input": { fontSize: "14px", color: "#111827", fontWeight: 500, p: 0 } }}
          />
        </Box>

        {/* ── Body ── */}
        <Box sx={{ flex: 1, px: 3, pt: 2, pb: 1, overflowY: "auto", minHeight: "320px" }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            minRows={13}
            variant="standard"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onSelect={saveCursor}
            onKeyUp={saveCursor}
            onMouseUp={saveCursor}
            placeholder="Write your message here..."
            inputRef={textareaRef}
            InputProps={{ disableUnderline: true }}
            sx={{
              "& textarea": { fontSize: "14px", color: "#374151", lineHeight: 1.75, p: 0 },
              "& .MuiInputBase-root": { alignItems: "flex-start" },
            }}
          />
        </Box>

        {/* ── Formatting Toolbar ── */}
        <Box sx={{
          px: 2, py: 1.25,
          borderTop: "1px solid #F3F4F6",
          display: "flex", alignItems: "center", gap: 0.5,
        }}>
          {/* hidden file inputs */}
          <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
          <input ref={imageRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />

          <ToolbarBtn title="Bold" onClick={handleBold}><Typography fontWeight={700} fontSize="14px" sx={{ lineHeight: 1, fontFamily: "serif" }}>T</Typography></ToolbarBtn>
          <ToolbarBtn title="Attach file" onClick={handleAttach}><AttachFileIcon sx={{ fontSize: 18 }} /></ToolbarBtn>
          <ToolbarBtn title="Insert link" onClick={handleLink}><LinkIcon sx={{ fontSize: 18 }} /></ToolbarBtn>
          <ToolbarBtn title="Emoji" onClick={handleEmoji}><EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} /></ToolbarBtn>
          <ToolbarBtn title="More" onClick={handleMore}><MoreHorizIcon sx={{ fontSize: 18 }} /></ToolbarBtn>
          <ToolbarBtn title="Image" onClick={handleImage}><ImageOutlinedIcon sx={{ fontSize: 18 }} /></ToolbarBtn>
          <ToolbarBtn title="Variable" onClick={handleVariable}><DataObjectIcon sx={{ fontSize: 18 }} /></ToolbarBtn>
          <ToolbarBtn title="Highlight" onClick={handleHighlight}><DriveFileRenameOutlineIcon sx={{ fontSize: 18 }} /></ToolbarBtn>
          <ToolbarBtn title="Add block" onClick={handleMore}><AddCircleOutlineIcon sx={{ fontSize: 18 }} /></ToolbarBtn>
        </Box>

        {/* ── Footer ── */}
        <Box sx={{
          px: 3, py: 2,
          borderTop: "1px solid #E5E7EB",
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5,
        }}>
          <Button onClick={onClose} variant="outlined" disabled={sending}
            sx={{ textTransform: "none", fontSize: "14px", borderColor: "#D1D5DB", color: "#374151", borderRadius: "8px", px: 3, fontWeight: 500, "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
            Cancel
          </Button>
          <Button onClick={handleSaveAsTemplate} variant="outlined" disabled={sending || saving}
            sx={{ textTransform: "none", fontSize: "14px", borderColor: "#D1D5DB", color: "#374151", borderRadius: "8px", px: 3, fontWeight: 500, "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
            {saving ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
            Save as Template
          </Button>
          <Button variant="contained" onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            startIcon={sending ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SendIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: "none", fontSize: "14px", bgcolor: "#1E293B", borderRadius: "8px", px: 3, fontWeight: 600, boxShadow: "none", "&:hover": { bgcolor: "#0F172A", boxShadow: "none" }, "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </Box>

      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LeadDetailView
// ─────────────────────────────────────────────────────────────────────────────

export default function LeadDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const selectedTemplate = useSelector((state: RootState) => state.emailTemplate.selectedTemplate);
  const leads        = useSelector(selectLeads) as LeadRecord[] | null;
  const loading      = useSelector(selectLeadsLoading) as boolean;
  const error        = useSelector(selectLeadsError) as string | null;
  const ticketEmails = useSelector((state: RootState) => state.emailHistory.emails);

  const [activeTab, setActiveTab]               = React.useState("Patient Info");
  const [openConvertPopup, setOpenConvertPopup] = React.useState(false);
  const [convertLoading, setConvertLoading]     = React.useState(false);
  const [convertError, setConvertError]         = React.useState<string | null>(null);
  const [historyView, setHistoryView]           = React.useState<HistoryView>("chatbot");

  // ── Email dialog state ──
  const [newEmailDialogOpen, setNewEmailDialogOpen] = React.useState(false);
  const [composeEmailOpen, setComposeEmailOpen]     = React.useState(false);
  const [pendingTemplate, setPendingTemplate]       = React.useState<EmailTemplate | null>(null);

  const [notes, setNotes]               = React.useState<NoteData[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [notesError, setNotesError]     = React.useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle]     = React.useState("");
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [noteSubmitting, setNoteSubmitting] = React.useState(false);

  const [editingNoteId, setEditingNoteId]   = React.useState<string | null>(null);
  const [editTitle, setEditTitle]           = React.useState("");
  const [editContent, setEditContent]       = React.useState("");
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  const [openAddActionDialog, setOpenAddActionDialog] = React.useState(false);
  const [actionType, setActionType]           = React.useState("");
  const [actionStatus, setActionStatus]       = React.useState("pending");
  const [actionDescription, setActionDescription] = React.useState("");
  const [actionSubmitting, setActionSubmitting]   = React.useState(false);
  const [actionError, setActionError]             = React.useState<string | null>(null);

  const [deleteNoteDialog, setDeleteNoteDialog] = React.useState<string | null>(null);

  const [documents, setDocuments]     = React.useState<{ url: string; name: string }[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError]     = React.useState<string | null>(null);

  const [callHistory, setCallHistory]               = React.useState<TwilioCall[]>([]);
  const [callHistoryLoading, setCallHistoryLoading] = React.useState(false);
  const [callHistoryError, setCallHistoryError]     = React.useState<string | null>(null);

  const [smsHistory, setSmsHistory]               = React.useState<TwilioSMS[]>([]);
  const [smsHistoryLoading, setSmsHistoryLoading] = React.useState(false);
  const [smsHistoryError, setSmsHistoryError]     = React.useState<string | null>(null);

  const pillChipSx = (color: string, bg: string) => ({
    borderRadius: "999px", fontWeight: 500, fontSize: "12px", height: 22, px: 1,
    width: "fit-content", flex: "0 0 auto", alignSelf: "flex-start",
    border: "1.5px solid", borderColor: color, backgroundColor: bg, color: color,
    "& .MuiChip-label": { px: 1 },
  });

  React.useEffect(() => {
    if (!leads || leads.length === 0) {
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
    }
  }, [dispatch, leads]);

  const lead = React.useMemo((): LeadRecord | undefined => {
    if (!leads || leads.length === 0) return undefined;
    const cleanId = decodeURIComponent(id || "").replace("#", "").replace("LN-", "").replace("LD-", "");
    return leads.find((l) => {
      const leadCleanId = l.id.replace("#", "").replace("LN-", "").replace("LD-", "");
      return leadCleanId === cleanId;
    });
  }, [leads, id]);

  const relatedEmails = React.useMemo(() => {
    if (!lead) return [];
    return ticketEmails.filter((mail) => String(mail.lead_id) === String(lead.id));
  }, [ticketEmails, lead]);

  const fetchNotes = React.useCallback(async (leadUuid: string) => {
    try {
      setNotesLoading(true); setNotesError(null);
      const { data } = await api.get(`/leads/${leadUuid}/notes/`);
      const results: RawNote[] = Array.isArray(data) ? data : (data.results ?? []);
      setNotes(results.filter((n) => !n.is_deleted).map((n) => ({
        id: n.id, uuid: n.id, title: n.title ?? "", content: n.note ?? "",
        time: n.created_at ? formatNoteTime(n.created_at) : "",
      })));
    } catch (err: unknown) {
      setNotesError(err instanceof Error ? err.message :
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load notes");
    } finally { setNotesLoading(false); }
  }, []);

  const fetchDocuments = React.useCallback(async (leadUuid: string, leadDocs?: DocumentEntry[]) => {
    try {
      setDocsLoading(true); setDocsError(null);
      if (leadDocs && leadDocs.length > 0) {
        setDocuments(leadDocs.map(normalizeDocument));
      } else {
        const rawDocs: DocumentEntry[] = await LeadAPI.getDocuments(leadUuid);
        setDocuments(rawDocs.map(normalizeDocument));
      }
    } catch (err: unknown) {
      setDocsError(err instanceof Error ? err.message :
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load documents");
    } finally { setDocsLoading(false); }
  }, []);

  const fetchCallHistory = React.useCallback(async (leadUuid: string) => {
    try {
      setCallHistoryLoading(true); setCallHistoryError(null);
      const { data } = await api.get(`/twilio/calls/?lead_uuid=${leadUuid}`);
      setCallHistory(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err: unknown) {
      setCallHistoryError(err instanceof Error ? err.message :
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load call history");
    } finally { setCallHistoryLoading(false); }
  }, []);

  const fetchSMSHistory = React.useCallback(async (leadUuid: string) => {
    try {
      setSmsHistoryLoading(true); setSmsHistoryError(null);
      const { data } = await api.get(`/twilio/sms/?lead_uuid=${leadUuid}`);
      setSmsHistory(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err: unknown) {
      setSmsHistoryError(err instanceof Error ? err.message :
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load SMS history");
    } finally { setSmsHistoryLoading(false); }
  }, []);

  React.useEffect(() => {
    if (lead) {
      const rawId = decodeURIComponent(id || "");
      fetchNotes(rawId);
      fetchDocuments(lead.id, lead.documents);
      fetchCallHistory(lead.id);
      fetchSMSHistory(lead.id);
    }
  }, [lead, fetchNotes, fetchDocuments, fetchCallHistory, fetchSMSHistory, id]);

  // ── Note operations ──
  const handleAddNote = async () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    if (!lead) return;
    try {
      setNoteSubmitting(true); setNotesError(null);
      const userId = getCurrentUserId();
      const { data: created } = await api.post("/leads/notes/", {
        title: newNoteTitle.trim() || "Note", note: newNoteContent.trim(),
        lead: decodeURIComponent(id || ""), is_active: true, is_deleted: false,
        ...(userId !== null && { created_by: userId }),
      });
      const createdNote = created as RawNote;
      setNotes((prev) => [...prev, {
        id: createdNote.id, uuid: createdNote.id,
        title: createdNote.title ?? newNoteTitle, content: createdNote.note ?? newNoteContent,
        time: createdNote.created_at ? formatNoteTime(createdNote.created_at) : "",
      }]);
      setNewNoteTitle(""); setNewNoteContent("");
    } catch (err: unknown) {
      setNotesError(err instanceof Error ? err.message :
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save note");
    } finally { setNoteSubmitting(false); }
  };

  const handleStartEdit  = (note: NoteData) => { setEditingNoteId(note.id); setEditTitle(note.title); setEditContent(note.content); };
  const handleCancelEdit = () => { setEditingNoteId(null); setEditTitle(""); setEditContent(""); };

  const handleSaveEdit = async (noteId: string) => {
    if (!lead) return;
    try {
      setEditSubmitting(true); setNotesError(null);
      const userId = getCurrentUserId();
      const { data: updated } = await api.put(`/leads/notes/${noteId}/update/`, {
        title: editTitle.trim(), note: editContent.trim(),
        lead: decodeURIComponent(id || ""),
        ...(userId !== null && { created_by: userId }),
      });
      const updatedNote = updated as RawNote;
      setNotes((prev) => prev.map((n) => n.id === noteId
        ? { ...n, title: updatedNote.title ?? editTitle, content: updatedNote.note ?? editContent }
        : n));
      setEditingNoteId(null); setEditTitle(""); setEditContent("");
    } catch (err: unknown) {
      setNotesError(err instanceof Error ? err.message :
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to update note");
    } finally { setEditSubmitting(false); }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/leads/notes/${noteId}/delete/`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setDeleteNoteDialog(null);
    } catch (err: unknown) {
      setNotesError(err instanceof Error ? err.message :
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to delete note");
    }
  };

  // ── Next Action ──
  const handleAddNextAction = async () => {
    if (!actionType.trim() || !actionDescription.trim() || !lead) return;
    try {
      setActionSubmitting(true);
      const leadUuid = decodeURIComponent(id || "");
      await api.put(`/leads/${leadUuid}/update/`, {
        clinic_id: lead.clinic_id, department_id: lead.department_id,
        full_name: lead.full_name || lead.name,
        contact_no: lead.contact_no || lead.phone || lead.phone_number || "",
        source: lead.source || "Unknown", treatment_interest: lead.treatment_interest || "N/A",
        book_appointment: lead.book_appointment || false, appointment_date: lead.appointment_date || "",
        slot: lead.slot || "", is_active: lead.is_active !== false, partner_inquiry: lead.partner_inquiry || false,
        next_action_type: actionType, next_action_status: actionStatus, next_action_description: actionDescription.trim(),
      });
      setOpenAddActionDialog(false);
      setActionType(""); setActionStatus("pending"); setActionDescription(""); setActionError(null);
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } }; message?: string };
      setActionError(String(
        axiosErr?.response?.data?.detail || axiosErr?.response?.data?.non_field_errors?.[0] ||
        axiosErr?.message || "Failed to save action."
      ));
    } finally { setActionSubmitting(false); }
  };

  const closeActionDialog = () => {
    setOpenAddActionDialog(false);
    setActionType(""); setActionStatus("pending"); setActionDescription(""); setActionError(null);
  };

  // ── Convert lead ──
  const handleOpenPopup  = () => { setConvertError(null); setOpenConvertPopup(true); };
  const handleClosePopup = () => { setOpenConvertPopup(false); setConvertError(null); };

  const handleConvertLead = async () => {
    if (!lead) return;
    try {
      setConvertLoading(true); setConvertError(null);
      const leadUuid = decodeURIComponent(id || "");
      const result = await dispatch(convertLead(leadUuid) as unknown as Parameters<typeof dispatch>[0]) as { error?: unknown; payload?: unknown };
      if (convertLead.rejected.match(result as Parameters<typeof convertLead.rejected.match>[0])) {
        setConvertError(String(
          (result as { payload?: string; error?: { message?: string } })?.payload ||
          (result as { error?: { message?: string } })?.error?.message || "Failed to convert lead."
        ));
        return;
      }
      setOpenConvertPopup(false);
    } catch (err: unknown) {
      setConvertError(err instanceof Error ? err.message : "Failed to convert lead.");
    } finally { setConvertLoading(false); }
  };

  const handleEdit = () => {
    if (!lead) return;
    navigate(`/leads/edit/${getCleanLeadId(lead.id)}`, { state: { lead } });
  };

  // ── "New Mail" button → New Email dialog ──
  const handleNewMail = () => setNewEmailDialogOpen(true);

  // ── User picks "Compose New Email" ──
  const handleComposeBlank = () => {
    setPendingTemplate(null);
    setNewEmailDialogOpen(false);
    setComposeEmailOpen(true);
  };

  // ── User picks a template ──
  const handleSelectTemplate = (template: EmailTemplate) => {
    setPendingTemplate(template);
    setNewEmailDialogOpen(false);
    setComposeEmailOpen(true);
  };

  // ── Close compose ──
  const handleCloseCompose = () => {
    setComposeEmailOpen(false);
    setPendingTemplate(null);
  };

  // ── Loading / Error / Not Found ──
  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
      <Stack alignItems="center" spacing={2}><CircularProgress /><Typography color="text.secondary">Loading lead details...</Typography></Stack>
    </Box>
  );
  if (error) return (
    <Box p={3}>
      <Alert severity="error">
        <Typography fontWeight={600}>Failed to load lead</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0])}>Try again</Typography>
      </Alert>
    </Box>
  );
  if (!lead) return (
    <Box p={3}>
      <Alert severity="warning">
        <Typography fontWeight={600}>Lead not found</Typography>
        <Typography variant="body2">The lead you're looking for doesn't exist or may have been deleted.</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate("/leads")}>Go back to Leads Hub</Typography>
      </Alert>
    </Box>
  );

  // ── Extract display data ──
  const leadName          = lead.full_name || lead.name || "Unknown";
  const leadInitials      = lead.initials || leadName.charAt(0).toUpperCase();
  const leadPhone         = lead.phone || lead.contact_number || lead.contact_no || "N/A";
  const leadEmail         = lead.email || "N/A";
  const leadLocation      = lead.location || "N/A";
  const leadGender        = lead.gender || "N/A";
  const leadAge           = String(lead.age || "N/A");
  const leadMaritalStatus = lead.marital_status || "N/A";
  const leadAddress       = lead.address || "N/A";
  const leadLanguage      = lead.language_preference || "N/A";
  const leadAssigned      = lead.assigned_to_name || lead.assigned || "Unassigned";
  const leadStatus        = lead.status || lead.lead_status || "New";
  const leadQuality       = lead.quality || "N/A";
  const leadScore         = String(lead.score || 0).includes("%") ? lead.score : `${lead.score || 0}%`;
  const leadSource        = lead.source || "Unknown";
  const leadSubSource     = lead.sub_source || "N/A";
  const leadCampaignName  = lead.campaign_name || "N/A";
  const leadCampaignDuration = lead.campaign_duration || "N/A";
  const leadDisplayId     = formatLeadId(lead.id);
  const partnerName       = lead.partner_name || lead.partner_full_name || "N/A";
  const partnerAge        = String(lead.partner_age || "N/A");
  const partnerGender     = lead.partner_gender || "N/A";
  const appointmentDepartment = lead.department || lead.department_name || "N/A";
  const appointmentPersonnel  = lead.personnel || lead.assigned_to_name || "N/A";
  const appointmentDate   = lead.appointment_date ? new Date(lead.appointment_date).toLocaleDateString("en-GB") : "N/A";
  const appointmentSlot   = lead.slot || lead.appointment_slot || "N/A";
  const appointmentRemark = lead.remark || lead.appointment_remark || "N/A";
  const treatmentInterest = lead.treatment_interest ? lead.treatment_interest.split(",").map((t) => t.trim()) : [];
  const leadCreatedAt     = lead.created_at
    ? new Date(lead.created_at).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "N/A";
  const nextActionType        = lead.next_action_type || lead.task || "N/A";
  const nextActionStatus      = lead.next_action_status || lead.taskStatus || "Pending";
  const nextActionDescription = lead.next_action_description || "N/A";

  const currentStatus = (lead?.status || lead?.lead_status || "new").toLowerCase();
  const isAppointment = currentStatus === "appointment";
  const isFollowUp    = currentStatus === "follow up" || currentStatus === "follow-up" || currentStatus === "follow-ups";

  const convertedLeadIds: string[] = JSON.parse(localStorage.getItem("converted_lead_ids") || "[]");
  const leadUuidRaw = decodeURIComponent(id || "");
  const isConverted = convertedLeadIds.includes(leadUuidRaw) || currentStatus === "converted" || (lead?.lead_status || "").toLowerCase() === "converted";

  const availableActions: { value: string; label: string }[] = isFollowUp
    ? [{ value: "Appointment", label: "Appointment" }]
    : [{ value: "Follow Up", label: "Follow Up" }, { value: "Appointment", label: "Appointment" }];

  const hasAppointment = lead.book_appointment || (lead.appointment_date && lead.appointment_date !== "");

  // Token map for template resolution
  const templateTokens: Record<string, string> = {
    lead_first_name: leadName.split(" ")[0],
    appointment_date: appointmentDate !== "N/A" ? appointmentDate : "{appointment_date}",
    appointment_time: appointmentSlot !== "N/A" ? appointmentSlot : "{appointment_time}",
    clinic_name: "Crysta IVF, Bangalore",
    clinic_address: "123 Fertility Lane",
  };

  return (
    <Box p={1} minHeight="100vh">

      {/* ── TOP SUMMARY CARD ── */}
      <Card elevation={0} sx={{ position: "relative", p: 5, mb: 3, borderRadius: "16px", backgroundColor: "#FAFAFA", overflow: "hidden", boxShadow: "none" }}>
        <Box component="img" src={Lead_Subtract} alt=""
          sx={{ position: "absolute", top: "6px", left: 0, width: "100%", height: "100%", objectFit: "fill", zIndex: 0, pointerEvents: "none" }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: "relative", width: "100%", zIndex: 1 }}>
          <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ width: "100%", pl: 2, pr: 1 }}>
            <Avatar sx={{ bgcolor: "#EEF2FF", color: "#6366F1", width: 45, height: 45, fontSize: "30px", fontWeight: 700, transform: "translateY(-35px)", ml: -2, flexShrink: 0 }}>
              {leadInitials}
            </Avatar>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Lead Name</Typography>
              <Typography fontWeight={700} variant="body1" fontSize="12px">{leadName}</Typography>
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Lead ID</Typography>
              <Typography fontWeight={600} variant="body1" fontSize="12px">{leadDisplayId}</Typography>
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Source</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 16, height: 16, bgcolor: "#FFB800", borderRadius: "50%" }} />
                <Typography fontWeight={600} variant="body1" fontSize="12px">{leadSource}</Typography>
              </Stack>
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Lead Status</Typography>
              <Chip label={isConverted ? "Converted" : leadStatus} size="small"
                sx={isConverted ? pillChipSx("#16A34A", "rgba(22,163,74,0.10)") : pillChipSx("#5B8FF9", "rgba(91,143,249,0.10)")} />
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Lead Quality</Typography>
              <Chip label={leadQuality} size="small"
                sx={leadQuality === "Hot" ? pillChipSx("#FF4D4F", "rgba(255,77,79,0.10)") : leadQuality === "Warm" ? pillChipSx("#FFC53D", "rgba(255,197,61,0.10)") : pillChipSx("#52C41A", "rgba(82,196,26,0.10)")} />
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">AI Lead Score</Typography>
              <Typography fontWeight={700} color="#EC4899" fontSize="12px">{leadScore}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Card>

      {/* ── TABS & ACTION BUTTONS ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box sx={{ bgcolor: "#FAFAFA", borderRadius: "10px", p: 0.8, width: "fit-content", display: "inline-flex", alignItems: "center" }}>
          <Stack direction="row" spacing={1}>
            {["Patient Info", "History", "Next Action"].map((tab) => {
              const sel = activeTab === tab;
              return (
                <Box key={tab} onClick={() => setActiveTab(tab)}
                  sx={{ cursor: "pointer", px: 2.5, py: 1, borderRadius: "8px", bgcolor: sel ? "#FFFFFF" : "transparent", color: sel ? "#E17E61" : "#232323", boxShadow: sel ? "0 2px 6px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s ease", display: "flex", alignItems: "center" }}>
                  <Typography fontWeight={600} fontSize="14px" color="inherit">{tab}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={handleEdit}
            sx={{ borderRadius: "8px", textTransform: "none", bgcolor: "#f3f3f3", color: "#505050", border: "none", boxShadow: "none", "&:hover": { bgcolor: "#f3f3f3", color: "#232323", border: "none", boxShadow: "none" } }}>
            Edit
          </Button>

          <Button variant="contained" onClick={handleOpenPopup} startIcon={<SwapHorizIcon />} disabled={isConverted}
            sx={{ borderRadius: "8px", textTransform: "none", bgcolor: isConverted ? "#E2E8F0" : "#505050", color: isConverted ? "#94A3B8" : "#FFFFFF", px: 2, boxShadow: "none", "&:hover": { bgcolor: isConverted ? "#E2E8F0" : "#232323", boxShadow: "none" }, "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
            {isConverted ? "Converted" : "Convert Lead"}
          </Button>
        </Stack>
      </Stack>

      {/* ── TAB CONTENT ── */}
      {activeTab === "Patient Info" && (
        <PatientInfoTab
          lead={lead}
          leadPhone={leadPhone} leadEmail={leadEmail} leadLocation={leadLocation}
          leadGender={leadGender} leadAge={leadAge} leadMaritalStatus={leadMaritalStatus}
          leadAddress={leadAddress} leadLanguage={leadLanguage} leadAssigned={leadAssigned}
          leadCreatedAt={leadCreatedAt} partnerName={partnerName} partnerAge={partnerAge}
          partnerGender={partnerGender} leadSubSource={leadSubSource}
          leadCampaignName={leadCampaignName} leadCampaignDuration={leadCampaignDuration}
          appointmentDepartment={appointmentDepartment} appointmentPersonnel={appointmentPersonnel}
          appointmentDate={appointmentDate} appointmentSlot={appointmentSlot}
          appointmentRemark={appointmentRemark} treatmentInterest={treatmentInterest}
          documents={documents} docsLoading={docsLoading} docsError={docsError}
          onClearDocsError={() => setDocsError(null)}
        />
      )}

      {activeTab === "History" && (
        <HistoryTab
          lead={lead}
          historyView={historyView} setHistoryView={setHistoryView}
          onComposeEmail={handleNewMail}
          leadName={leadName} leadInitials={leadInitials} leadPhone={leadPhone}
          leadEmail={leadEmail} leadAssigned={leadAssigned} leadCreatedAt={leadCreatedAt}
          appointmentDate={appointmentDate} appointmentSlot={appointmentSlot}
          appointmentDepartment={appointmentDepartment} appointmentPersonnel={appointmentPersonnel}
          appointmentRemark={appointmentRemark} treatmentInterest={treatmentInterest}
          hasAppointment={!!hasAppointment}
          callHistory={callHistory} callHistoryLoading={callHistoryLoading} callHistoryError={callHistoryError}
          onRefreshCallHistory={() => fetchCallHistory(lead.id)}
          smsHistory={smsHistory} smsHistoryLoading={smsHistoryLoading} smsHistoryError={smsHistoryError}
          onRefreshSmsHistory={() => fetchSMSHistory(lead.id)}
          selectedTemplate={selectedTemplate}
          relatedEmails={relatedEmails}
        />
      )}

      {activeTab === "Next Action" && (
        <NextActionTab
          lead={lead}
          nextActionType={nextActionType} nextActionStatus={nextActionStatus}
          nextActionDescription={nextActionDescription}
          isAppointment={isAppointment} isFollowUp={isFollowUp}
          availableActions={availableActions}
          openAddActionDialog={openAddActionDialog} setOpenAddActionDialog={setOpenAddActionDialog}
          actionType={actionType} setActionType={setActionType}
          actionStatus={actionStatus} setActionStatus={setActionStatus}
          actionDescription={actionDescription} setActionDescription={setActionDescription}
          actionSubmitting={actionSubmitting} actionError={actionError} setActionError={setActionError}
          onAddNextAction={handleAddNextAction} onCloseActionDialog={closeActionDialog}
          notes={notes} notesLoading={notesLoading} notesError={notesError} setNotesError={setNotesError}
          editingNoteId={editingNoteId}
          editTitle={editTitle} setEditTitle={setEditTitle}
          editContent={editContent} setEditContent={setEditContent}
          editSubmitting={editSubmitting}
          newNoteTitle={newNoteTitle} setNewNoteTitle={setNewNoteTitle}
          newNoteContent={newNoteContent} setNewNoteContent={setNewNoteContent}
          noteSubmitting={noteSubmitting}
          deleteNoteDialog={deleteNoteDialog} setDeleteNoteDialog={setDeleteNoteDialog}
          onStartEditNote={handleStartEdit} onCancelEditNote={handleCancelEdit}
          onSaveEditNote={handleSaveEdit} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote}
        />
      )}

      {/* ── CONVERT POPUP ── */}
      <Dialog open={openConvertPopup} onClose={convertLoading ? undefined : handleClosePopup}
        PaperProps={{ sx: { borderRadius: "24px", p: 4, textAlign: "center", maxWidth: "420px", boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)" } }}>
        <DialogContent sx={{ p: 0 }}>
          <Stack alignItems="center" spacing={2.5}>
            <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SwapHorizIcon sx={{ fontSize: 32, color: "#F97316" }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Convert Lead</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, lineHeight: 1.6 }}>
                Are you sure you want to Convert <b>"{leadName}"</b> lead into a patient &amp; register it?
              </Typography>
            </Box>
            {convertError && <Alert severity="error" sx={{ width: "100%", borderRadius: "10px", textAlign: "left" }}>{convertError}</Alert>}
            <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 2 }}>
              <Button fullWidth onClick={handleClosePopup} variant="outlined" disabled={convertLoading}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, color: "#232323", borderColor: "#232323", py: 1.2 }}>
                Cancel
              </Button>
              <Button fullWidth variant="contained" onClick={handleConvertLead} disabled={convertLoading}
                sx={{ bgcolor: "#505050", borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, boxShadow: "none", "&:hover": { bgcolor: "#232323" }, "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
                {convertLoading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Convert"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ── STEP 1: New Email Dialog (Figma design) ── */}
      <NewEmailDialog
        open={newEmailDialogOpen}
        onClose={() => setNewEmailDialogOpen(false)}
        onComposeBlank={handleComposeBlank}
        onSelectTemplate={handleSelectTemplate}
        tokens={templateTokens}
      />

      {/* ── STEP 2: Compose Email Dialog ── */}
      <ComposeEmailDialog
        open={composeEmailOpen}
        leadName={leadName}
        leadInitials={leadInitials}
        leadEmail={leadEmail}
        pendingTemplate={pendingTemplate}
        onClose={handleCloseCompose}
      />

      <Dialogs />
    </Box>
  );
<<<<<<< Updated upstream
}

// ====================== Sub-components ======================

const TimelineItem: React.FC<TimelineItemProps> = ({ icon, title, time, isAvatar, avatarInitial, isLast, onClick, isClickable }) => (
  <Stack direction="row" spacing={2}>
    <Stack alignItems="center">
      <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isAvatar ? <Avatar sx={{ width: 20, height: 20, fontSize: "10px" }}>{avatarInitial}</Avatar> : icon}
      </Box>
      {!isLast && <Box sx={{ width: "2px", flexGrow: 1, bgcolor: "#E2E8F0", my: 0.5 }} />}
    </Stack>
    <Box pb={3} onClick={onClick} sx={{ cursor: isClickable ? "pointer" : "default", "&:hover": isClickable ? { opacity: 0.7 } : {} }}>
      <Typography variant="body2" fontWeight={600}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">{time}</Typography>
    </Box>
  </Stack>
);

const ChatBubble: React.FC<ChatBubbleProps> = ({ side, text, time }) => (
  <Box sx={{ alignSelf: side === "left" ? "flex-start" : "flex-end", maxWidth: "70%" }}>
    <Box sx={{ p: 1.5, borderRadius: side === "left" ? "0 12px 12px 12px" : "12px 0 12px 12px", bgcolor: side === "left" ? "#FFF" : "#1E293B", color: side === "left" ? "text.primary" : "#FFF", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
      <Typography variant="body2">{text}</Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", textAlign: side === "right" ? "right" : "left" }}>{time}</Typography>
  </Box>
);

const getSubSourceIcon = (source?: string): string | null => {
  const key = (source || "").toLowerCase();
  if (key.includes("facebook")) return Facebook as string;
  if (key.includes("instagram")) return Instagram as string;
  if (key.includes("linkedin")) return Linkedin as string;
  if (key.includes("google ads")) return GoogleAds as string;
  if (key.includes("google")) return GoogleCalender as string;
  return null;
};

const Info: React.FC<InfoProps> = ({ label, value, isAvatar }) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="caption" sx={{ color: "#9E9E9E", fontSize: "12px", fontWeight: 500, display: "block", mb: 0.5 }}>
      {label}
    </Typography>
    {label === "SUB-SOURCE" ? (
      <Stack direction="row" spacing={1} alignItems="center">
        {getSubSourceIcon(value) && (
          <Box component="img" src={getSubSourceIcon(value)!} alt="" sx={{ width: 16, height: 16 }} />
        )}
        <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>{value}</Typography>
      </Stack>
    ) : isAvatar ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 20, height: 20, fontSize: "10px" }}>{value?.charAt(0) || "U"}</Avatar>
        <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>{value}</Typography>
      </Stack>
    ) : (
      <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>{value}</Typography>
    )}
  </Box>
);

const DocumentRow: React.FC<DocumentRowProps> = ({ name, size, url, sx = {} }) => {
  const color = getDocColor(name);
  const ext = (name.split(".").pop() ?? "").toUpperCase();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={sx}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DescriptionOutlinedIcon sx={{ color, fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={name}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">{ext}{size ? ` · ${size}` : ""}</Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" onClick={handleDownload} disabled={!url} title="Download">
          <FileDownloadOutlinedIcon fontSize="inherit" />
        </IconButton>
        <IconButton size="small" onClick={handleOpen} disabled={!url} title="Open in new tab">
          <ShortcutIcon sx={{ transform: "rotate(90deg)", fontSize: "14px" }} />
        </IconButton>
      </Stack>
    </Stack>
  );
};
=======
}
>>>>>>> Stashed changes
