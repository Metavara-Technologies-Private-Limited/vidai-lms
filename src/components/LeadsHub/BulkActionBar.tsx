import * as React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
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
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";

import { deleteLeads, selectDeletingIds, fetchLeads } from "../../store/leadSlice";
import { LeadAPI, LeadEmailAPI, EmailTemplateAPI, TwilioAPI } from "../../services/leads.api";
import type { EmailTemplate } from "../../services/leads.api";
import TemplateService from "../../services/templates.api";
import ArchiveLeadDialog from "./ArchiveLeadDialog";

// ── Types ─────────────────────────────────────────────────────────────
type ApiError = {
  response?: { data?: { detail?: string; message?: string } };
  message?: string;
};

interface SMSTemplate {
  id: string | number;
  name: string;
  use_case?: string;
  body: string;
}

// ── Use case options (matching screenshots) ───────────────────────────
const USE_CASE_OPTIONS = ["Appointment", "Feedback", "Reminder", "Follow-Up", "Re-engagement", "No-Show", "General"];

const USE_CASE_BODY_SUGGESTIONS: Record<string, string> = {
  Appointment: "Hi {name}, your appointment is confirmed for {date} at {time}. Please arrive 10 minutes early.",
  Feedback: "Hi {name}, we'd love to hear your feedback. Please take a moment to share your experience with us.",
  Reminder: "Hi {name}, this is a reminder about your upcoming appointment on {date} at {time}.",
  "Follow-Up": "Hi {name}, we wanted to follow up regarding your recent visit. Please feel free to reach out if you have any questions.",
  "Re-engagement": "Hi {name}, we miss you! It's been a while since your last visit. Book an appointment today.",
  "No-Show": "Hi {name}, we noticed you missed your appointment on {date}. Please contact us to reschedule.",
  General: "",
};

const getUseCaseSx = (useCase?: string) => {
  const map: Record<string, { bgcolor: string; color: string }> = {
    appointment:    { bgcolor: "#ECFDF5", color: "#10B981" },
    feedback:       { bgcolor: "#FEF2F2", color: "#EF4444" },
    reminder:       { bgcolor: "#EFF6FF", color: "#3B82F6" },
    "follow-up":    { bgcolor: "#FFF7ED", color: "#F59E0B" },
    followup:       { bgcolor: "#FFF7ED", color: "#F59E0B" },
    "re-engagement":{ bgcolor: "#F5F3FF", color: "#7C3AED" },
    "no-show":      { bgcolor: "#FFF1F2", color: "#F43F5E" },
    general:        { bgcolor: "#F1F5F9", color: "#64748B" },
    promotional:    { bgcolor: "#F5F3FF", color: "#7C3AED" },
    welcome:        { bgcolor: "#ECFDF5", color: "#10B981" },
  };
  return map[(useCase ?? "").toLowerCase()] ?? { bgcolor: "#F1F5F9", color: "#64748B" };
};

// ── Helpers ───────────────────────────────────────────────────────────
const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiError;
  return e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? fallback;
};

const toastOptions      = { position: "top-right" as const, autoClose: 3000, theme: "colored" as const };
const toastErrorOptions = { position: "top-right" as const, autoClose: 4000, theme: "colored" as const };

// ── Props ─────────────────────────────────────────────────────────────
interface Props {
  selectedIds: string[];
  tab: "active" | "archived";
  onDelete: () => void;
  onArchive: (archive: boolean) => void;
  onSendEmail?: (to: string, subject: string, body: string, templateId?: string) => void;
  onSendSMS?: (leadIds: string[], message: string) => void;
}

const BulkActionBar: React.FC<Props> = ({ selectedIds, tab, onDelete, onArchive, onSendEmail, onSendSMS }) => {
  const dispatch    = useDispatch<AppDispatch>();
  const deletingIds = useSelector(selectDeletingIds);

  // ── Delete / Archive ──────────────────────────────────────────────
  const [openDelete,   setOpenDelete]   = useState(false);
  const [openArchive,  setOpenArchive]  = useState(false);
  const [isDeleting,   setIsDeleting]   = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);
  const [isArchiving,  setIsArchiving]  = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  // ── Email ─────────────────────────────────────────────────────────
  const [openEmail,        setOpenEmail]        = useState(false);
  const [openComposer,     setOpenComposer]     = useState(false);
  const [templates,        setTemplates]        = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError,   setTemplatesError]   = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate,  setPreviewTemplate]  = useState<EmailTemplate | null>(null);
  const [subject,          setSubject]          = useState("");
  const [messageBody,      setMessageBody]      = useState("");
  const [isSending,        setIsSending]        = useState(false);
  const [sendError,        setSendError]        = useState<string | null>(null);

  // ── SMS state ─────────────────────────────────────────────────────
  const [smsDialog,      setSmsDialog]      = useState<"compose" | "templates" | "preview" | "newTemplate" | null>(null);
  const [smsMessage,     setSmsMessage]     = useState("");
  const [isSendingSMS,   setIsSendingSMS]   = useState(false);
  const [smsError,       setSmsError]       = useState<string | null>(null);
  const [smsTemplates,   setSmsTemplates]   = useState<SMSTemplate[]>([]);
  const [smsLoading,     setSmsLoading]     = useState(false);
  const [selectedSMSTpl, setSelectedSMSTpl] = useState<SMSTemplate | null>(null);
  const [previewBody,    setPreviewBody]    = useState("");

  // New template form state
  const [newTplName,    setNewTplName]    = useState("");
  const [newTplUseCase, setNewTplUseCase] = useState("");
  const [newTplBody,    setNewTplBody]    = useState("");
  const [newTplSaving,  setNewTplSaving]  = useState(false);
  const [newTplError,   setNewTplError]   = useState<string | null>(null);
  const [newTplView,    setNewTplView]    = useState<"form" | "preview">("form");
  const [useCaseAnchor, setUseCaseAnchor] = useState<null | HTMLElement>(null);

  // ── Guard ─────────────────────────────────────────────────────────
  if (selectedIds.length === 0) return null;

  const someDeleting  = selectedIds.some((id) => deletingIds.includes(id));
  const anyProcessing = someDeleting || isDeleting || isArchiving;

  // ── Email handlers ────────────────────────────────────────────────
  const fetchEmailTemplates = async () => {
    setTemplatesLoading(true); setTemplatesError(null);
    try {
      const data = await EmailTemplateAPI.list();
      setTemplates(data.filter((t) => t.is_active !== false));
    } catch (err) {
      setTemplatesError(getErrorMessage(err, "Failed to load email templates."));
    } finally { setTemplatesLoading(false); }
  };

  const handleOpenEmail = () => {
    setSelectedTemplate(null); setPreviewTemplate(null);
    setSubject(""); setMessageBody(""); setSendError(null);
    setOpenEmail(true); fetchEmailTemplates();
  };

  const handleSelectEmailTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t); setSubject(t.subject); setMessageBody(t.body);
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !messageBody.trim()) return;
    setIsSending(true); setSendError(null);
    try {
      await Promise.all(selectedIds.map((leadId) =>
        LeadEmailAPI.sendNow({ lead: leadId, subject: subject.trim(), email_body: messageBody.trim() })
      ));
      toast.success(`Email sent to ${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""} successfully.`, toastOptions);
      if (onSendEmail) onSendEmail("", subject, messageBody, String(selectedTemplate?.id ?? ""));
      setOpenComposer(false); setOpenEmail(false);
      setSelectedTemplate(null); setSubject(""); setMessageBody("");
    } catch (err) {
      setSendError(getErrorMessage(err, "Failed to send email. Please try again."));
    } finally { setIsSending(false); }
  };

  // ── SMS handlers ──────────────────────────────────────────────────
  const openSMSCompose = () => {
    setSmsMessage(""); setSmsError(null); setSmsDialog("compose");
  };

  const closeSMS = () => {
    if (isSendingSMS) return;
    setSmsDialog(null); setSmsMessage(""); setSmsError(null);
    setSelectedSMSTpl(null); setPreviewBody("");
  };

  const fetchSMSTemplates = async () => {
    setSmsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (TemplateService as any).getTemplates("sms");
      setSmsTemplates(Array.isArray(data) ? data : []);
    } catch { setSmsTemplates([]); }
    finally { setSmsLoading(false); }
  };

  const openTemplateList = () => { fetchSMSTemplates(); setSmsDialog("templates"); };

  const handlePickTemplate = (tpl: SMSTemplate) => {
    setSelectedSMSTpl(tpl); setPreviewBody(tpl.body); setSmsDialog("preview");
  };

  const handleUseTemplate = () => {
    setSmsMessage(previewBody); setSmsError(null);
    setSelectedSMSTpl(null); setPreviewBody(""); setSmsDialog("compose");
  };

  const openNewTemplate = () => {
    setNewTplName(""); setNewTplUseCase(""); setNewTplBody("");
    setNewTplError(null); setNewTplView("form"); setUseCaseAnchor(null);
    setSmsDialog("newTemplate");
  };

  const handleSelectUseCase = (uc: string) => {
    setNewTplUseCase(uc); setUseCaseAnchor(null);
    if (!newTplBody.trim()) setNewTplBody(USE_CASE_BODY_SUGGESTIONS[uc] || "");
  };

  const handleSaveNewTemplate = async () => {
    if (!newTplName.trim()) { setNewTplError("Template name is required."); return; }
    if (!newTplBody.trim()) { setNewTplError("Body is required."); return; }
    setNewTplSaving(true); setNewTplError(null);
    try {
      const payload = {
        clinic: 1, name: newTplName.trim(),
        use_case: newTplUseCase.toLowerCase() || "general",
        body: newTplBody.trim(), created_by: 1, is_active: true,
      };
      let saved: SMSTemplate | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saved = await (TemplateService as any).createTemplate("sms", payload);
      } catch {
        saved = { id: `local-${Date.now()}`, name: newTplName.trim(), use_case: newTplUseCase, body: newTplBody.trim() };
      }
      toast.success("Template saved and applied!", toastOptions);
      setSmsMessage(saved!.body);
      setSmsError(null);
      setSmsDialog("compose");
    } catch (err: unknown) {
      setNewTplError(getErrorMessage(err, "Failed to save template."));
    } finally { setNewTplSaving(false); }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) { setSmsError("Message cannot be empty."); return; }
    setIsSendingSMS(true); setSmsError(null);
    let successCount = 0;
    const errors: string[] = [];
    const results = await Promise.allSettled(
      selectedIds.map(async (leadId) => {
        const lead = await LeadAPI.getById(leadId);
        const phone = lead?.contact_no?.trim();
        if (!phone) throw new Error(`No contact number for lead ${lead?.full_name ?? leadId}`);
        return TwilioAPI.sendSMS({ lead_uuid: leadId, to: phone, message: smsMessage.trim() });
      })
    );
    results.forEach((result, i) => {
      if (result.status === "fulfilled") successCount += 1;
      else errors.push(getErrorMessage((result as PromiseRejectedResult).reason, `Failed for lead ${selectedIds[i]}.`));
    });
    setIsSendingSMS(false);
    if (successCount > 0) {
      const msg = `SMS sent to ${successCount} lead${successCount > 1 ? "s" : ""} successfully.${errors.length ? ` ${errors.length} failed.` : ""}`;
      // FIX (line 291): was a ternary expression used as statement — changed to if/else
      if (errors.length === selectedIds.length) {
        toast.error(msg, toastErrorOptions);
      } else {
        toast.success(msg, toastOptions);
      }
      if (onSendSMS) onSendSMS(selectedIds, smsMessage.trim());
      closeSMS();
    } else {
      setSmsError(errors[0] ?? "Failed to send SMS. Please try again.");
    }
  };

  // ── Delete / Archive handlers ─────────────────────────────────────
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
    } catch (err) {
      setArchiveError(getErrorMessage(err, `Failed to ${tab === "active" ? "archive" : "unarchive"} leads`));
    } finally { setIsArchiving(false); }
  };

  // Derived boolean — avoids redundant Boolean() casts in JSX
  // FIX (lines 553, 557): replaced Boolean(useCaseAnchor) with useCaseMenuOpen
  const useCaseMenuOpen = useCaseAnchor !== null;

  // ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ position: "sticky", bottom: 0, backgroundColor: "#fff", borderTop: "1px solid #E5E7EB", py: 1.5, px: 2, mt: 2, zIndex: 20 }}>

      {/* Action Buttons */}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button variant="outlined"
          startIcon={someDeleting || isDeleting ? <CircularProgress size={16} sx={{ color: "black" }} /> : <DeleteOutlineOutlinedIcon />}
          onClick={() => { setOpenDelete(true); setDeleteError(null); }} disabled={anyProcessing}
          sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          {someDeleting || isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Button variant="outlined"
          startIcon={isArchiving ? <CircularProgress size={16} sx={{ color: "black" }} /> : tab === "active" ? <ArchiveOutlinedIcon /> : <UnarchiveOutlinedIcon />}
          onClick={() => { setOpenArchive(true); setArchiveError(null); }} disabled={anyProcessing}
          sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          {isArchiving ? (tab === "active" ? "Archiving..." : "Restoring...") : (tab === "active" ? "Archive" : "Restore")}
        </Button>
        <Button variant="outlined" startIcon={<ChatBubbleOutlineIcon />} onClick={openSMSCompose} disabled={anyProcessing}
          sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          SMS
        </Button>
        <Button variant="outlined" startIcon={<EmailOutlinedIcon />} onClick={handleOpenEmail} disabled={anyProcessing}
          sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          Email
        </Button>
      </Stack>

      {/* ── Delete Dialog ── */}
      <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", px: 3, py: 4, textAlign: "center" } }}>
        <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
          <DeleteOutlineOutlinedIcon sx={{ fontSize: 30, color: "#EF4444" }} />
        </Box>
        <Typography fontWeight={700} fontSize="18px" color="#111827" mb={1.5}>Delete Lead</Typography>
        <Typography fontSize="14px" color="#6B7280" lineHeight={1.6} mb={2} px={1}>
          This action cannot be undone. Are you sure you want to Delete selected Lead permanently?
        </Typography>
        {deleteError && <Alert severity="error" sx={{ borderRadius: "10px", mb: 2, textAlign: "left" }}>{deleteError}</Alert>}
        <Stack direction="row" spacing={1.5}>
          <Button fullWidth onClick={() => { setOpenDelete(false); setDeleteError(null); }} disabled={isDeleting}
            sx={{ height: 48, fontWeight: 600, textTransform: "none", borderRadius: "10px", bgcolor: "#F3F4F6", color: "#374151", "&:hover": { bgcolor: "#E5E7EB" } }}>Cancel</Button>
          <Button fullWidth onClick={handleDelete} disabled={isDeleting}
            sx={{ height: 48, fontWeight: 600, textTransform: "none", borderRadius: "10px", bgcolor: "#1F2937", color: "#fff", "&:hover": { bgcolor: "#111827" }, "&:disabled": { bgcolor: "#9CA3AF", color: "#fff" } }}>
            {isDeleting ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Delete"}
          </Button>
        </Stack>
      </Dialog>

      {/* ── Archive Dialog ── */}
      <ArchiveLeadDialog
        open={openArchive} onClose={() => !isArchiving && setOpenArchive(false)}
        leadName={`${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""}`}
        onConfirm={handleArchiveConfirm} isUnarchive={tab === "archived"}
        isArchiving={isArchiving} error={archiveError}
      />

      {/* ══════════════════════════════════════════════════════════
          SMS — STEP 1: COMPOSE
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={smsDialog === "compose"} onClose={closeSMS} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1 }}>Send SMS</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Box sx={{ backgroundColor: "#F8FAFC", borderRadius: "10px", px: 2, py: 1.5, border: "1px solid #E2E8F0" }}>
              <Typography variant="body2" color="text.secondary" fontSize="12px">Sending to</Typography>
              <Typography fontWeight={600} fontSize="14px">
                {selectedIds.length} selected lead{selectedIds.length > 1 ? "s" : ""}
              </Typography>
            </Box>
            <TextField label="Message" multiline rows={4} value={smsMessage}
              onChange={(e) => { setSmsMessage(e.target.value); setSmsError(null); }}
              disabled={isSendingSMS} placeholder="Type your message here..."
              inputProps={{ maxLength: 1600 }} helperText={`${smsMessage.length}/1600`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
            {smsError && <Alert severity="error" sx={{ borderRadius: "8px" }} onClose={() => setSmsError(null)}>{smsError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
          <Button fullWidth variant="outlined" onClick={openTemplateList} disabled={isSendingSMS}
            sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
            SMS Template
          </Button>
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button fullWidth onClick={closeSMS} disabled={isSendingSMS}
              sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSendSMS} disabled={isSendingSMS || !smsMessage.trim()}
              startIcon={isSendingSMS ? <CircularProgress size={16} sx={{ color: "white" }} /> : null}
              sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
              {isSendingSMS ? "Sending..." : "Send SMS"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          SMS — STEP 2: SELECT TEMPLATE
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={smsDialog === "templates"} onClose={() => setSmsDialog("compose")} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={600}>Select SMS Template</Typography>
          <IconButton size="small" onClick={() => setSmsDialog("compose")}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 1, pb: 0 }}>
          {smsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
          ) : smsTemplates.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No SMS templates found.</Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 340, overflowY: "auto" }}>
              {smsTemplates.map((tpl, idx) => (
                <React.Fragment key={tpl.id}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handlePickTemplate(tpl)}
                      sx={{ borderRadius: "8px", px: 1.5, py: 1.25, "&:hover": { bgcolor: "#F8FAFC" } }}>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography fontSize="14px" fontWeight={600} color="#1E293B">{tpl.name}</Typography>
                            {tpl.use_case && <Chip label={tpl.use_case} size="small" sx={{ ...getUseCaseSx(tpl.use_case), fontSize: "11px", height: 20, textTransform: "capitalize" }} />}
                          </Stack>
                        }
                        secondary={
                          <Typography fontSize="12px" color="#64748B"
                            sx={{ mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {tpl.body}
                          </Typography>
                        }
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
          <Button fullWidth variant="outlined" onClick={openNewTemplate}
            sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
            + New Template
          </Button>
          <Button fullWidth onClick={() => setSmsDialog("compose")}
            sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          SMS — STEP 3: PREVIEW TEMPLATE
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={smsDialog === "preview"} onClose={() => setSmsDialog("templates")} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={600}>Preview Template</Typography>
          <IconButton size="small" onClick={() => setSmsDialog("templates")}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {selectedSMSTpl && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontSize="13px" color="#64748B">Template:</Typography>
                <Typography fontSize="13px" fontWeight={600} color="#1E293B">{selectedSMSTpl.name}</Typography>
                {selectedSMSTpl.use_case && <Chip label={selectedSMSTpl.use_case} size="small" sx={{ ...getUseCaseSx(selectedSMSTpl.use_case), fontSize: "11px", height: 20, textTransform: "capitalize" }} />}
              </Stack>
            )}
            {/* Chat bubble preview */}
            <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", p: 2, minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Box sx={{ alignSelf: "flex-start", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "0px 12px 12px 12px", px: 2, py: 1.25, maxWidth: "90%", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <Typography fontSize="13px" color="#1E293B" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {previewBody.split(/(\{[^}]+\})/g).map((part, i) =>
                    /^\{[^}]+\}$/.test(part) ? <Box key={i} component="span" sx={{ color: "#4F46E5", fontWeight: 500 }}>{part}</Box> : part
                  )}
                </Typography>
              </Box>
              <Typography fontSize="11px" color="#94A3B8" sx={{ mt: 0.75, alignSelf: "flex-end" }}>
                {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
            </Box>
            <TextField label="Edit message before sending" multiline rows={4} value={previewBody}
              onChange={(e) => setPreviewBody(e.target.value)}
              inputProps={{ maxLength: 1600 }} helperText={`${previewBody.length}/1600`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth onClick={() => setSmsDialog("templates")}
            sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
            Back
          </Button>
          <Button fullWidth onClick={handleUseTemplate} disabled={!previewBody.trim()}
            sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
            Use Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          SMS — STEP 4: NEW TEMPLATE
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={smsDialog === "newTemplate"} onClose={() => setSmsDialog("templates")} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>

        {newTplView === "form" && (
          <>
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography fontWeight={700} fontSize="1.05rem">New SMS Template</Typography>
              <IconButton size="small" onClick={() => setSmsDialog("templates")}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <DialogContent sx={{ pt: 2 }}>
              <Stack spacing={2.5}>
                {/* Name */}
                <TextField
                  placeholder="Name" value={newTplName}
                  onChange={(e) => { setNewTplName(e.target.value); setNewTplError(null); }}
                  fullWidth size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                />

                {/* Use Case dropdown */}
                {/* FIX (lines 553, 557): replaced Boolean(useCaseAnchor) with useCaseMenuOpen */}
                <Box>
                  <Typography fontSize="13px" fontWeight={500} color="#374151" mb={0.75}>Use Case</Typography>
                  <Box
                    onClick={(e) => setUseCaseAnchor(e.currentTarget as HTMLElement)}
                    sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      border: "1px solid",
                      borderColor: useCaseMenuOpen ? "#1976d2" : "#D1D5DB",
                      borderRadius: "8px", px: 1.5, cursor: "pointer", minHeight: 42, bgcolor: "#fff",
                      boxShadow: useCaseMenuOpen ? "0 0 0 2px rgba(25,118,210,0.15)" : "none",
                      "&:hover": { borderColor: "#9CA3AF" },
                      transition: "all 0.15s",
                    }}>
                    {newTplUseCase
                      ? <Chip label={newTplUseCase} size="small" sx={getUseCaseSx(newTplUseCase)} />
                      : <Typography fontSize="14px" color="#9CA3AF">Select use case</Typography>}
                    <Typography sx={{ fontSize: "12px", color: "#6B7280", transform: useCaseMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</Typography>
                  </Box>
                  <Menu
                    anchorEl={useCaseAnchor}
                    open={useCaseMenuOpen}
                    onClose={() => setUseCaseAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", mt: 0.5, minWidth: 220 } }}>
                    {USE_CASE_OPTIONS.map((uc) => (
                      <MenuItem key={uc} selected={newTplUseCase === uc} onClick={() => handleSelectUseCase(uc)}
                        sx={{ py: 1, px: 1.5, "&.Mui-selected": { bgcolor: "#F1F5F9" }, "&:hover": { bgcolor: "#F8FAFC" } }}>
                        <Chip label={uc} size="small" sx={getUseCaseSx(uc)} />
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>

                {/* Body */}
                <Box>
                  <Typography fontSize="13px" fontWeight={500} color="#374151" mb={0.75}>Body</Typography>
                  <textarea
                    value={newTplBody}
                    onChange={(e) => { setNewTplBody(e.target.value); setNewTplError(null); }}
                    placeholder="Type your message here..."
                    maxLength={1600} rows={7}
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "14px", fontFamily: "inherit", color: "#1E293B", lineHeight: "1.6", border: "1px solid #D1D5DB", borderRadius: "8px", resize: "vertical", outline: "none", background: "#fff" }}
                    onFocus={(e) => { e.target.style.borderColor = "#1976d2"; e.target.style.boxShadow = "0 0 0 2px rgba(25,118,210,0.15)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}
                  />
                  <Typography fontSize="11px" color="#94A3B8" mt={0.5}>
                    {newTplBody.length}/1600 — Use {"{variable_name}"} for dynamic fields
                  </Typography>
                </Box>

                {newTplError && <Alert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>{newTplError}</Alert>}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
              <Button onClick={() => setSmsDialog("templates")}
                sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151", bgcolor: "white", "&:hover": { bgcolor: "#F9FAFB" } }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (!newTplName.trim()) { setNewTplError("Template name is required."); return; }
                if (!newTplBody.trim()) { setNewTplError("Body is required."); return; }
                setNewTplError(null); setNewTplView("preview");
              }} sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151", bgcolor: "white", "&:hover": { bgcolor: "#F9FAFB" } }}>
                Preview
              </Button>
              <Button onClick={handleSaveNewTemplate} disabled={newTplSaving || !newTplName.trim() || !newTplBody.trim()}
                sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", bgcolor: "#1F2937", color: "white", fontWeight: 600, "&:hover": { bgcolor: "#111827" }, "&:disabled": { bgcolor: "#9CA3AF", color: "white" } }}>
                {newTplSaving ? "Saving..." : "Save"}
              </Button>
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
                    {newTplBody.split(/(\{[^}]+\})/g).map((part, i) =>
                      /^\{[^}]+\}$/.test(part) ? <Box key={i} component="span" sx={{ color: "#4F46E5", fontWeight: 600 }}>{part}</Box> : part
                    )}
                  </Typography>
                </Box>
                <Typography fontSize="11px" color="#94A3B8" sx={{ mt: 0.75, alignSelf: "flex-end" }}>
                  {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
              <Button onClick={() => setNewTplView("form")}
                sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151", bgcolor: "white", "&:hover": { bgcolor: "#F9FAFB" } }}>
                Back to Edit
              </Button>
              <Button onClick={handleSaveNewTemplate} disabled={newTplSaving}
                sx={{ height: 44, px: 3, textTransform: "none", borderRadius: "8px", bgcolor: "#1F2937", color: "white", fontWeight: 600, "&:hover": { bgcolor: "#111827" }, "&:disabled": { bgcolor: "#9CA3AF", color: "white" } }}>
                {newTplSaving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          EMAIL SELECTOR DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={openEmail} onClose={() => setOpenEmail(false)} maxWidth="md" fullWidth>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>New Email</Typography>
            <Typography variant="caption" color="text.secondary">Sending to {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""}</Typography>
          </Box>
          <IconButton onClick={() => setOpenEmail(false)}><CloseIcon /></IconButton>
        </Box>
        <DialogContent>
          <Box sx={{ border: "1px dashed #D1D5DB", borderRadius: 2, py: 4, textAlign: "center", cursor: "pointer", mb: 3, "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" } }}
            onClick={() => { setSelectedTemplate(null); setSubject(""); setMessageBody(""); setOpenEmail(false); setOpenComposer(true); }}>
            <EditOutlinedIcon sx={{ color: "#6B7280" }} />
            <Typography fontWeight={500} mt={1} color="#374151">Compose New Email</Typography>
            <Typography variant="caption" color="text.secondary">Write a custom message from scratch</Typography>
          </Box>
          <Divider sx={{ mb: 2 }}>OR USE A TEMPLATE</Divider>
          {templatesLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={22} /></Box>}
          {!templatesLoading && templatesError && (
            <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }}
              action={<Button size="small" onClick={fetchEmailTemplates}>Retry</Button>}>{templatesError}</Alert>
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
              onClick={() => handleSelectEmailTemplate(t)}>
              <Radio checked={selectedTemplate?.id === t.id} onChange={() => handleSelectEmailTemplate(t)} size="small" />
              <Box sx={{ flex: 1, ml: 0.5, minWidth: 0 }}>
                <Typography fontSize="14px" fontWeight={600} noWrap>{t.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{t.subject}</Typography>
              </Box>
              {t.use_case && <Chip label={t.use_case} size="small" sx={{ ...getUseCaseSx(t.use_case), fontSize: "11px", height: 20, mr: 1, textTransform: "capitalize" }} />}
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }} sx={{ color: "#6B7280" }}>
                <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEmail(false)} variant="outlined" sx={{ borderColor: "#D1D5DB", color: "#374151" }}>Cancel</Button>
          <Button onClick={() => { setOpenEmail(false); setOpenComposer(true); }} variant="contained" disabled={!selectedTemplate}
            sx={{ backgroundColor: "#111827", "&:hover": { backgroundColor: "#000" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Email Preview Dialog ── */}
      <Dialog open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} maxWidth="sm" fullWidth>
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
          <Box sx={{ mt: 0.5, p: 2, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px", lineHeight: 1.75, "& p": { margin: "0 0 8px 0" }, "& a": { color: "#3B82F6" } }}
            dangerouslySetInnerHTML={{ __html: previewTemplate?.body ?? "" }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPreviewTemplate(null)} variant="outlined" sx={{ borderColor: "#D1D5DB", color: "#374151" }}>Close</Button>
          <Button variant="contained" onClick={() => { if (previewTemplate) handleSelectEmailTemplate(previewTemplate); setPreviewTemplate(null); }}
            sx={{ backgroundColor: "#111827", "&:hover": { backgroundColor: "#000" } }}>Use This Template</Button>
        </DialogActions>
      </Dialog>

      {/* ── Compose Email Dialog ── */}
      <Dialog open={openComposer} onClose={() => !isSending && setOpenComposer(false)} maxWidth="md" fullWidth>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>{selectedTemplate ? selectedTemplate.name : "New Email"}</Typography>
            <Typography variant="caption" color="text.secondary">Sending to {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""}</Typography>
          </Box>
          <IconButton onClick={() => setOpenComposer(false)} disabled={isSending}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {sendError && <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }} onClose={() => setSendError(null)}>{sendError}</Alert>}
          <Box sx={{ py: 1.5, px: 2, mb: 1, bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.5px" }}>TO</Typography>
            <Typography fontSize="13px" fontWeight={500} color="#374151" mt={0.3}>{selectedIds.length} selected lead{selectedIds.length > 1 ? "s" : ""}</Typography>
          </Box>
          <TextField fullWidth variant="standard" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}
            InputProps={{ disableUnderline: true }} sx={{ py: 1.5, borderBottom: "1px solid #E5E7EB", mt: 1 }} disabled={isSending} />
          {selectedTemplate ? (
            <Box sx={{ mt: 2, p: 2, minHeight: 220, border: "1px solid #E5E7EB", borderRadius: 2, bgcolor: "#FAFAFA", fontSize: "13px", lineHeight: 1.75, overflowY: "auto" }}
              dangerouslySetInnerHTML={{ __html: messageBody }} />
          ) : (
            <TextField fullWidth multiline rows={10} variant="outlined" placeholder="Type your message here..."
              value={messageBody} onChange={(e) => setMessageBody(e.target.value)}
              sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} disabled={isSending} />
          )}
        </DialogContent>
        <Box sx={{ px: 3, py: 2, borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, border: "1px solid #E5E7EB", borderRadius: 2, px: 1, py: 0.5 }}>
            <IconButton size="small" disabled={isSending}><Typography fontWeight="bold" fontSize="1.2rem">A</Typography></IconButton>
            <IconButton size="small" disabled={isSending}><AttachFileOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={isSending}><LinkOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={isSending}><EmojiEmotionsOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={isSending}><ChangeHistoryIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={isSending}><ImageOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={isSending}><LockClockOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small" disabled={isSending}><CreateOutlinedIcon fontSize="small" /></IconButton>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => { setOpenComposer(false); setOpenEmail(true); fetchEmailTemplates(); }}
              variant="outlined" disabled={isSending} sx={{ borderColor: "#D1D5DB", color: "#374151" }}>Back</Button>
            <Button variant="contained" disabled sx={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}>Save as Template</Button>
            <Button variant="contained"
              endIcon={isSending ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SendOutlinedIcon />}
              onClick={handleSendEmail} disabled={!subject.trim() || !messageBody.trim() || isSending}
              sx={{ backgroundColor: "#4B5563", "&:hover": { backgroundColor: "#374151" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" }, minWidth: 90 }}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default BulkActionBar;