import * as React from "react";
import { useState } from "react";
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
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
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
import DeleteLeadDialog from "./DeleteLeadDialog";

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

// ── Helpers ───────────────────────────────────────────────────────────
const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiError;
  return e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? fallback;
};

const getUseCaseSx = (useCase?: string) => {
  const map: Record<string, { bgcolor: string; color: string }> = {
    reminder:    { bgcolor: "#EFF6FF", color: "#3B82F6" },
    welcome:     { bgcolor: "#ECFDF5", color: "#10B981" },
    followup:    { bgcolor: "#FFF7ED", color: "#F59E0B" },
    "follow-up": { bgcolor: "#FFF7ED", color: "#F59E0B" },
    promotional: { bgcolor: "#F5F3FF", color: "#7C3AED" },
    feedback:    { bgcolor: "#FEF2F2", color: "#EF4444" },
  };
  return map[(useCase ?? "").toLowerCase()] ?? { bgcolor: "#F1F5F9", color: "#64748B" };
};

// ── Props ─────────────────────────────────────────────────────────────
interface Props {
  selectedIds: string[];
  tab: "active" | "archived";
  onDelete: () => void;
  onArchive: (archive: boolean) => void;
  onSendEmail?: (to: string, subject: string, body: string, templateId?: string) => void;
  onSendSMS?: (leadIds: string[], message: string) => void;
}

const BulkActionBar: React.FC<Props> = ({
  selectedIds,
  tab,
  onDelete,
  onArchive,
  onSendEmail,
  onSendSMS,
}) => {
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

  // ── SMS ───────────────────────────────────────────────────────────
  const [openSMSPicker,   setOpenSMSPicker]   = useState(false);
  const [openSMSComposer, setOpenSMSComposer] = useState(false);
  const [smsTemplates,    setSmsTemplates]    = useState<SMSTemplate[]>([]);
  const [smsLoading,      setSmsLoading]      = useState(false);
  const [smsMessage,      setSmsMessage]      = useState("");
  const [isSendingSMS,    setIsSendingSMS]    = useState(false);
  const [smsError,        setSmsError]        = useState<string | null>(null);

  // ── Snackbar ──────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // ── Guard: must be after all hooks ────────────────────────────────
  if (selectedIds.length === 0) return null;

  const someDeleting  = selectedIds.some((id) => deletingIds.includes(id));
  const anyProcessing = someDeleting || isDeleting || isArchiving;

  // ── Email handlers ────────────────────────────────────────────────
  const fetchEmailTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const data = await EmailTemplateAPI.list();
      setTemplates(data.filter((t) => t.is_active !== false));
    } catch (err) {
      setTemplatesError(getErrorMessage(err, "Failed to load email templates."));
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleOpenEmail = () => {
    setSelectedTemplate(null);
    setPreviewTemplate(null);
    setSubject("");
    setMessageBody("");
    setSendError(null);
    setOpenEmail(true);
    fetchEmailTemplates();
  };

  const handleSelectEmailTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t);
    setSubject(t.subject);
    setMessageBody(t.body);
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !messageBody.trim()) return;
    setIsSending(true);
    setSendError(null);
    try {
      await Promise.all(
        selectedIds.map((leadId) =>
          LeadEmailAPI.sendNow({ lead: leadId, subject: subject.trim(), email_body: messageBody.trim() })
        )
      );
      setSnackbar({
        open: true,
        message: `Email sent to ${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""} successfully.`,
        severity: "success",
      });
      if (onSendEmail) onSendEmail("", subject, messageBody, String(selectedTemplate?.id ?? ""));
      setOpenComposer(false);
      setOpenEmail(false);
      setSelectedTemplate(null);
      setSubject("");
      setMessageBody("");
    } catch (err) {
      setSendError(getErrorMessage(err, "Failed to send email. Please try again."));
    } finally {
      setIsSending(false);
    }
  };

  // ── SMS handlers ──────────────────────────────────────────────────
  const fetchSMSTemplates = async () => {
    setSmsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (TemplateService as any).getTemplates("sms");
      setSmsTemplates(Array.isArray(data) ? data : []);
    } catch {
      setSmsTemplates([]);
    } finally {
      setSmsLoading(false);
    }
  };

  const handleOpenSMS = () => {
    setSmsMessage("");
    setSmsError(null);
    setOpenSMSComposer(true);
  };

  const handleOpenSMSPicker = () => {
    fetchSMSTemplates();
    setOpenSMSPicker(true);
  };

  const handlePickSMSTemplate = (tpl: SMSTemplate) => {
    setSmsMessage(tpl.body);
    setSmsError(null);
    setOpenSMSPicker(false);
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      setSmsError("Message cannot be empty.");
      return;
    }
    setIsSendingSMS(true);
    setSmsError(null);

    let successCount = 0;
    const errors: string[] = [];

    // Fetch each lead to get contact_no, then send SMS with required `to` field
    const results = await Promise.allSettled(
      selectedIds.map(async (leadId) => {
        const lead = await LeadAPI.getById(leadId);
        const phone = lead?.contact_no?.trim();
        if (!phone) throw new Error(`No contact number for lead ${lead?.full_name ?? leadId}`);
        return TwilioAPI.sendSMS({
          lead_uuid: leadId,
          to: phone,
          message: smsMessage.trim(),
        });
      })
    );

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        successCount += 1;
      } else {
        errors.push(
          getErrorMessage((result as PromiseRejectedResult).reason, `Failed for lead ${selectedIds[i]}.`)
        );
      }
    });

    setIsSendingSMS(false);

    if (successCount > 0) {
      setSnackbar({
        open: true,
        message: `SMS sent to ${successCount} lead${successCount > 1 ? "s" : ""} successfully.${
          errors.length ? ` ${errors.length} failed.` : ""
        }`,
        severity: errors.length === selectedIds.length ? "error" : "success",
      });
      if (onSendSMS) onSendSMS(selectedIds, smsMessage.trim());
      setOpenSMSComposer(false);
      setSmsMessage("");
    } else {
      setSmsError(errors[0] ?? "Failed to send SMS. Please try again.");
    }
  };

  // ── Delete handler ────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const result = await dispatch(deleteLeads(selectedIds));
      if (deleteLeads.fulfilled.match(result)) {
        await dispatch(fetchLeads());
        setOpenDelete(false);
        onDelete();
      } else {
        setDeleteError(typeof result.payload === "string" ? result.payload : "Failed to delete leads");
      }
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete leads"));
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Archive handler ───────────────────────────────────────────────
  const handleArchiveConfirm = async () => {
    try {
      setIsArchiving(true);
      setArchiveError(null);
      const isArchiveAction = tab === "active";
      await Promise.all(
        selectedIds.map((id) => isArchiveAction ? LeadAPI.inactivate(id) : LeadAPI.activate(id))
      );
      await dispatch(fetchLeads());
      setOpenArchive(false);
      onArchive(isArchiveAction);
    } catch (err) {
      setArchiveError(
        getErrorMessage(err, `Failed to ${tab === "active" ? "archive" : "unarchive"} leads`)
      );
    } finally {
      setIsArchiving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <Box sx={{ position: "sticky", bottom: 0, backgroundColor: "#fff", borderTop: "1px solid #E5E7EB", py: 1.5, px: 2, mt: 2, zIndex: 20 }}>

      {/* ── Action Buttons ── */}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button variant="outlined"
          startIcon={someDeleting || isDeleting
            ? <CircularProgress size={16} sx={{ color: "black" }} />
            : <DeleteOutlineOutlinedIcon />}
          onClick={() => { setOpenDelete(true); setDeleteError(null); }}
          disabled={anyProcessing}
          sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          {someDeleting || isDeleting ? "Deleting..." : "Delete"}
        </Button>

        <Button variant="outlined"
          startIcon={isArchiving
            ? <CircularProgress size={16} sx={{ color: "black" }} />
            : tab === "active" ? <ArchiveOutlinedIcon /> : <UnarchiveOutlinedIcon />}
          onClick={() => { setOpenArchive(true); setArchiveError(null); }}
          disabled={anyProcessing}
          sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          {isArchiving
            ? (tab === "active" ? "Archiving..." : "Restoring...")
            : (tab === "active" ? "Archive" : "Restore")}
        </Button>

        <Button variant="outlined"
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={handleOpenSMS}
          disabled={anyProcessing}
          sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          SMS
        </Button>

        <Button variant="outlined"
          startIcon={<EmailOutlinedIcon />}
          onClick={handleOpenEmail}
          disabled={anyProcessing}
          sx={{ color: "black", borderColor: "black", "&:disabled": { color: "#9CA3AF", borderColor: "#E5E7EB" } }}>
          Email
        </Button>
      </Stack>

      {/* ── Delete Dialog ── */}
      <DeleteLeadDialog
        open={openDelete}
        leadName={selectedIds.length === 1 ? selectedIds[0] : `${selectedIds.length} leads`}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => { setOpenDelete(false); setDeleteError(null); }}
        onConfirm={handleDelete}
      />

      {/* ── Archive Dialog ── */}
      <ArchiveLeadDialog
        open={openArchive}
        onClose={() => !isArchiving && setOpenArchive(false)}
        leadName={selectedIds.length === 1 ? selectedIds[0] : `${selectedIds.length} leads`}
        onConfirm={handleArchiveConfirm}
        isUnarchive={tab === "archived"}
        isArchiving={isArchiving}
        error={archiveError}
      />

      {/* ══════════════════════════════════════════════════════════
          SMS TEMPLATE PICKER DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog
        open={openSMSPicker}
        onClose={() => setOpenSMSPicker(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={600}>Select SMS Template</Typography>
          <IconButton size="small" onClick={() => setOpenSMSPicker(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ pt: 1, pb: 0 }}>
          {smsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : smsTemplates.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No SMS templates found.</Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
              {smsTemplates.map((tpl, idx) => (
                <React.Fragment key={tpl.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handlePickSMSTemplate(tpl)}
                      sx={{ borderRadius: "8px", px: 1.5, py: 1.25, "&:hover": { bgcolor: "#F8FAFC" } }}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography fontSize="14px" fontWeight={600} color="#1E293B">{tpl.name}</Typography>
                            {tpl.use_case && (
                              <Chip label={tpl.use_case} size="small"
                                sx={{ ...getUseCaseSx(tpl.use_case), fontSize: "11px", height: 20, textTransform: "capitalize" }} />
                            )}
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

        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button fullWidth onClick={() => setOpenSMSPicker(false)}
            sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          BULK SMS COMPOSER DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog
        open={openSMSComposer}
        onClose={() => !isSendingSMS && setOpenSMSComposer(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>Bulk SMS</Typography>
            <Typography variant="caption" color="text.secondary">
              Sending to {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenSMSComposer(false)} disabled={isSendingSMS}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          {smsError && (
            <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }} onClose={() => setSmsError(null)}>
              {smsError}
            </Alert>
          )}

          {/* Recipients summary */}
          <Box sx={{ py: 1.5, px: 2, mb: 2, bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              sx={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.5px" }}>
              TO
            </Typography>
            <Typography fontSize="13px" fontWeight={500} color="#374151" mt={0.3}>
              {selectedIds.length} selected lead{selectedIds.length > 1 ? "s" : ""}
            </Typography>
          </Box>

          {/* Message textarea */}
          <TextField
            fullWidth multiline rows={6} variant="outlined"
            placeholder="Type your SMS message here..."
            value={smsMessage}
            onChange={(e) => { setSmsMessage(e.target.value); setSmsError(null); }}
            disabled={isSendingSMS}
            inputProps={{ maxLength: 1600 }}
            helperText={`${smsMessage.length}/1600`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
          {/* Opens template picker dialog */}
          <Button fullWidth variant="outlined" onClick={handleOpenSMSPicker} disabled={isSendingSMS}
            sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
            SMS Template
          </Button>

          <Stack direction="row" spacing={1}>
            <Button fullWidth
              onClick={() => { setOpenSMSComposer(false); setSmsMessage(""); setSmsError(null); }}
              disabled={isSendingSMS}
              sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSendSMS}
              disabled={isSendingSMS || !smsMessage.trim()}
              startIcon={isSendingSMS ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SendOutlinedIcon />}
              sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
              {isSendingSMS ? "Sending..." : "Send SMS"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          EMAIL SELECTOR DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={openEmail} onClose={() => setOpenEmail(false)} maxWidth="md" fullWidth>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>New Email</Typography>
            <Typography variant="caption" color="text.secondary">
              Sending to {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenEmail(false)}><CloseIcon /></IconButton>
        </Box>

        <DialogContent>
          <Box
            sx={{ border: "1px dashed #D1D5DB", borderRadius: 2, py: 4, textAlign: "center", cursor: "pointer", mb: 3, transition: "all 0.15s", "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" } }}
            onClick={() => { setSelectedTemplate(null); setSubject(""); setMessageBody(""); setOpenEmail(false); setOpenComposer(true); }}>
            <EditOutlinedIcon sx={{ color: "#6B7280" }} />
            <Typography fontWeight={500} mt={1} color="#374151">Compose New Email</Typography>
            <Typography variant="caption" color="text.secondary">Write a custom message from scratch</Typography>
          </Box>

          <Divider sx={{ mb: 2 }}>OR USE A TEMPLATE</Divider>

          {templatesLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 5, gap: 1.5 }}>
              <CircularProgress size={22} />
              <Typography variant="caption" color="text.secondary">Loading templates...</Typography>
            </Box>
          )}

          {!templatesLoading && templatesError && (
            <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }}
              action={<Button size="small" onClick={fetchEmailTemplates} sx={{ textTransform: "none" }}>Retry</Button>}>
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
              sx={{ display: "flex", alignItems: "center", py: 2, px: 1, borderBottom: "1px solid #F3F4F6", cursor: "pointer", borderRadius: 1, transition: "background 0.1s", bgcolor: selectedTemplate?.id === t.id ? "#F0F9FF" : "transparent", "&:hover": { bgcolor: selectedTemplate?.id === t.id ? "#F0F9FF" : "#F9FAFB" } }}
              onClick={() => handleSelectEmailTemplate(t)}>
              <Radio checked={selectedTemplate?.id === t.id} onChange={() => handleSelectEmailTemplate(t)} size="small" />
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
          <Button onClick={() => setOpenEmail(false)} variant="outlined" sx={{ borderColor: "#D1D5DB", color: "#374151" }}>Cancel</Button>
          <Button onClick={() => { setOpenEmail(false); setOpenComposer(true); }} variant="contained" disabled={!selectedTemplate}
            sx={{ backgroundColor: "#111827", "&:hover": { backgroundColor: "#000" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          EMAIL TEMPLATE PREVIEW DIALOG
      ══════════════════════════════════════════════════════════ */}
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
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            sx={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.5px" }}>SUBJECT</Typography>
          <Typography fontWeight={600} fontSize="14px" mb={2} mt={0.5}>{previewTemplate?.subject}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            sx={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.5px" }}>BODY</Typography>
          <Box sx={{ mt: 0.5, p: 2, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <Typography fontSize="13px" sx={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>{previewTemplate?.body}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPreviewTemplate(null)} variant="outlined" sx={{ borderColor: "#D1D5DB", color: "#374151" }}>Close</Button>
          <Button variant="contained"
            onClick={() => { if (previewTemplate) handleSelectEmailTemplate(previewTemplate); setPreviewTemplate(null); }}
            sx={{ backgroundColor: "#111827", "&:hover": { backgroundColor: "#000" } }}>
            Use This Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          COMPOSE EMAIL DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={openComposer} onClose={() => !isSending && setOpenComposer(false)} maxWidth="md" fullWidth>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={600}>{selectedTemplate ? selectedTemplate.name : "New Email"}</Typography>
            <Typography variant="caption" color="text.secondary">
              Sending to {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenComposer(false)} disabled={isSending}><CloseIcon /></IconButton>
        </Box>

        <DialogContent sx={{ px: 3, pb: 1 }}>
          {sendError && (
            <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }} onClose={() => setSendError(null)}>
              {sendError}
            </Alert>
          )}
          <Box sx={{ py: 1.5, px: 2, mb: 1, bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              sx={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.5px" }}>TO</Typography>
            <Typography fontSize="13px" fontWeight={500} color="#374151" mt={0.3}>
              {selectedIds.length} selected lead{selectedIds.length > 1 ? "s" : ""}
            </Typography>
          </Box>
          <TextField fullWidth variant="standard" placeholder="Subject" value={subject}
            onChange={(e) => setSubject(e.target.value)} InputProps={{ disableUnderline: true }}
            sx={{ py: 1.5, borderBottom: "1px solid #E5E7EB", mt: 1 }} disabled={isSending} />
          <TextField fullWidth multiline rows={10} variant="outlined" placeholder="Type your message here..."
            value={messageBody} onChange={(e) => setMessageBody(e.target.value)}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} disabled={isSending} />
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

      {/* ── Snackbar ── */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ borderRadius: "10px" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BulkActionBar;