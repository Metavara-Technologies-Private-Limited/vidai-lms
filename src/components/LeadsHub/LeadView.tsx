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
  DialogTitle,
  DialogActions,
  TextField,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Tooltip,
} from "@mui/material";
import Lead_Subtract from "../../assets/icons/Lead_Subtract.svg";

import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
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
import { api, LeadAPI, LeadEmailAPI, EmailTemplateAPI } from "../../services/leads.api";
import type { EmailTemplate, EmailTemplatePayload } from "../../services/leads.api";

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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function extractErr(err: unknown, fallback = "Something went wrong."): string {
  const e = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } }; message?: string };
  return e?.response?.data?.detail || e?.response?.data?.non_field_errors?.[0] || e?.message || fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// NewEmailTemplateDialog
// ─────────────────────────────────────────────────────────────────────────────
interface NewEmailTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (tpl: EmailTemplate) => void;
}

const NewEmailTemplateDialog: React.FC<NewEmailTemplateDialogProps> = ({ open, onClose, onSaved }) => {
  const [name, setName]        = React.useState("");
  const [subject, setSubject]  = React.useState("");
  const [description, setDesc] = React.useState("");
  const [body, setBody]        = React.useState("");
  const [saving, setSaving]    = React.useState(false);
  const [error, setError]      = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) { setName(""); setSubject(""); setDesc(""); setBody(""); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      setError("Name, subject, and body are required."); return;
    }
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
        id: `local-${Date.now()}`, name: name.trim(), subject: subject.trim(),
        body: body.trim(), description: description.trim(),
      };
      onSaved(local); onClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.05rem", display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        New Email Template
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} pt={0.5}>
          {error && <Alert severity="error" sx={{ borderRadius: "8px" }}>{error}</Alert>}
          <TextField label="Template Name" value={name} onChange={(e) => setName(e.target.value)} size="small" fullWidth required />
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} size="small" fullWidth required />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDesc(e.target.value)} size="small" fullWidth />
          <TextField label="Body" value={body} onChange={(e) => setBody(e.target.value)} size="small" fullWidth required multiline minRows={5}
            placeholder="Use {{lead_first_name}}, {{appointment_date}}, etc." />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={onClose}
          sx={{ height: 38, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} variant="contained"
          sx={{ height: 38, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" } }}>
          {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Save Template"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EmailDialog — API-backed templates + real send via POST /lead-email/
// ─────────────────────────────────────────────────────────────────────────────
interface EmailDialogProps {
  open: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
}

const EmailDialog: React.FC<EmailDialogProps> = ({ open, lead, onClose }) => {
  const [step, setStep]                             = React.useState<"template" | "preview" | "compose">("template");
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate]       = React.useState<EmailTemplate | null>(null);
  const [subject, setSubject]                       = React.useState("");
  const [body, setBody]                             = React.useState("");
  const [sending, setSending]                       = React.useState(false);
  const [error, setError]                           = React.useState<string | null>(null);

  const [emailTemplates, setEmailTemplates]         = React.useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates]     = React.useState(false);
  const [templateError, setTemplateError]           = React.useState<string | null>(null);
  const [newTplOpen, setNewTplOpen]                 = React.useState(false);

  const fileInputRef  = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const bodyRef       = React.useRef<HTMLTextAreaElement>(null);
  const cursorPos     = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });

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
        if (el) { el.focus(); el.setSelectionRange(start + text.length, start + text.length); }
      });
      return next;
    });
  }, []);

  const loadEmailTemplates = React.useCallback(async () => {
    setLoadingTemplates(true); setTemplateError(null);
    try {
      const data = await EmailTemplateAPI.list();
      setEmailTemplates(data);
    } catch {
      setTemplateError("Could not load templates. You can still compose a new email.");
      setEmailTemplates([]);
    } finally { setLoadingTemplates(false); }
  }, []);

  React.useEffect(() => {
    if (open) {
      setStep("template"); setSelectedTemplateId(null); setPreviewTemplate(null);
      setSubject(""); setBody(""); setError(null); setSending(false);
      loadEmailTemplates();
    }
  }, [open, loadEmailTemplates]);

  const handleClose = () => { if (sending) return; onClose(); };
  const handleComposeNew = () => { setSelectedTemplateId(null); setSubject(""); setBody(""); setStep("compose"); };

  const resolveBody = (raw: string) => {
    const name = lead?.full_name || lead?.name || "Patient";
    return raw
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{lead_name\}\}/g, name)
      .replace(/\{\{lead_first_name\}\}/g, name.split(" ")[0]);
  };

  const handleNext = () => {
    const template = emailTemplates.find((t) => String(t.id) === selectedTemplateId);
    if (template) { setSubject(template.subject); setBody(resolveBody(template.body || "")); }
    setStep("compose");
  };

  const handleNewTplSaved = (tpl: EmailTemplate) => {
    setEmailTemplates((prev) => [tpl, ...prev]);
    setSelectedTemplateId(String(tpl.id));
    setNewTplOpen(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { setError("Subject and body are required."); return; }
    if (!lead?.id) { setError("Lead ID is missing."); return; }
    setSending(true); setError(null);
    try {
      await LeadEmailAPI.sendNow({
        lead: lead.id,
        subject: subject.trim(),
        email_body: body.trim(),
        sender_email: lead.email ?? null,
      });
      onClose();
    } catch (err: unknown) {
      setError(extractErr(err, "Failed to send email. Please try again."));
    } finally { setSending(false); }
  };

  const handleSaveAsDraft = async () => {
    if (!subject.trim() || !body.trim() || !lead?.id) return;
    try {
      await LeadEmailAPI.saveAsDraft({
        lead: lead.id, subject: subject.trim(),
        email_body: body.trim(), sender_email: lead.email ?? null,
      });
    } catch { /* silent */ }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    saveCursor();
    insertAtCursor(`\n[📎 Attachment: ${files.map((f) => f.name).join(", ")}]\n`);
    e.target.value = "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    saveCursor();
    insertAtCursor(`\n[🖼 Image: ${file.name}]\n`);
    e.target.value = "";
  };

  const recipientName = lead?.full_name || lead?.name || "Patient";

  return (
    <>
      <input ref={fileInputRef}  type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />

      <NewEmailTemplateDialog open={newTplOpen} onClose={() => setNewTplOpen(false)} onSaved={handleNewTplSaved} />

      <Dialog open={open && !newTplOpen} onClose={handleClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}>

        {/* ══ STEP 1: Template Selection ══ */}
        {step === "template" && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              New Email
              <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1, pb: 0 }}>
              <Box onClick={handleComposeNew}
                sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 1.5, cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>
                <EditNoteOutlinedIcon sx={{ fontSize: 18, color: "#475569" }} />
                <Typography fontWeight={600} fontSize="14px" color="#475569">Compose New Email</Typography>
              </Box>

              <Divider sx={{ my: 1.5 }}>
                <Typography fontSize="12px" color="text.secondary">OR</Typography>
              </Divider>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography fontSize="13px" color="text.secondary" fontWeight={500}>Select Email Template</Typography>
                <Button size="small" onClick={() => setNewTplOpen(true)}
                  sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, color: "#1F2937", border: "1px solid #E5E7EB", borderRadius: "6px", px: 1.5, py: 0.5, "&:hover": { bgcolor: "#F3F4F6" } }}>
                  + New Template
                </Button>
              </Box>

              {loadingTemplates && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>}

              {!loadingTemplates && templateError && (
                <Alert severity="warning" sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}>{templateError}</Alert>
              )}

              {!loadingTemplates && !templateError && emailTemplates.length === 0 && (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography color="text.secondary" fontSize="14px">No email templates found.</Typography>
                  <Typography color="text.secondary" fontSize="12px" mt={0.5}>Click "+ New Template" above to create one.</Typography>
                </Box>
              )}

              {!loadingTemplates && emailTemplates.length > 0 && (
                <RadioGroup value={selectedTemplateId || ""} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                  <Stack spacing={0} divider={<Divider />} sx={{ maxHeight: 340, overflowY: "auto" }}>
                    {emailTemplates.map((template) => (
                      <Box key={template.id} onClick={() => setSelectedTemplateId(String(template.id))}
                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, px: 0.5, cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>
                        <FormControlLabel
                          value={String(template.id)}
                          control={<Radio size="small" sx={{ color: selectedTemplateId === String(template.id) ? "#EF4444" : "#CBD5E1", "&.Mui-checked": { color: "#EF4444" } }} />}
                          label={
                            <Box>
                              <Typography fontWeight={600} fontSize="13.5px" color="#1E293B">{template.name}</Typography>
                              {template.description && <Typography fontSize="12px" color="#64748B" mt={0.2}>{template.description}</Typography>}
                              {template.subject && <Typography fontSize="11px" color="#94A3B8" mt={0.25}>Subject: {template.subject}</Typography>}
                            </Box>
                          }
                          sx={{ m: 0, flex: 1 }}
                        />
                        <Tooltip title="Preview template">
                          <IconButton size="small"
                            onClick={(e) => { e.stopPropagation(); setSelectedTemplateId(String(template.id)); setPreviewTemplate(template); setStep("preview"); }}
                            sx={{ color: "#93C5FD", ml: 1, "&:hover": { color: "#3B82F6", bgcolor: "#EFF6FF" } }}>
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                  </Stack>
                </RadioGroup>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
              <Button onClick={handleClose}
                sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!selectedTemplateId} variant="contained"
                sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}>
                Next
              </Button>
            </DialogActions>
          </>
        )}

        {/* ══ STEP 1.5: Template Preview ══ */}
        {step === "preview" && previewTemplate && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={() => { setStep("template"); setPreviewTemplate(null); }}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography fontWeight={700} fontSize="1.05rem">Preview Template</Typography>
              </Stack>
              <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 0, pb: 0 }}>
              <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", px: 2, py: 1.25, mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography fontSize="12px" color="#64748B" fontWeight={500}>Template:</Typography>
                  <Typography fontSize="13px" fontWeight={700} color="#1E293B">{previewTemplate.name}</Typography>
                  {previewTemplate.use_case && (
                    <Chip label={previewTemplate.use_case} size="small"
                      sx={{ height: 20, fontSize: "11px", fontWeight: 600, bgcolor: "#EFF6FF", color: "#1D4ED8", borderRadius: "4px", "& .MuiChip-label": { px: 1 } }} />
                  )}
                </Stack>
              </Box>

              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <Box sx={{ bgcolor: "#1F2937", px: 2, py: 1 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {["#EF4444","#F59E0B","#10B981"].map((c) => (
                      <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
                    ))}
                    <Box sx={{ flex: 1, bgcolor: "#374151", borderRadius: "4px", height: 20, ml: 1, display: "flex", alignItems: "center", px: 1.5 }}>
                      <Typography fontSize="10px" color="#94A3B8">Mail Preview</Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ bgcolor: "#FAFAFA", px: 2.5, py: 1.5, borderBottom: "1px solid #E2E8F0" }}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>From:</Typography>
                      <Typography fontSize="12px" color="#374151">noreply@crystaivf.com</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>To:</Typography>
                      <Typography fontSize="12px" color="#374151">
                        {recipientName}{lead?.email ? ` <${lead.email}>` : ""}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>Subject:</Typography>
                      <Typography fontSize="12px" color="#1E293B" fontWeight={700}>{previewTemplate.subject}</Typography>
                    </Stack>
                  </Stack>
                </Box>

                <Box sx={{ bgcolor: "#FFFFFF", px: 2.5, py: 2.5, maxHeight: 260, overflowY: "auto" }}>
                  <Typography fontSize="13px" color="#1E293B"
                    sx={{ lineHeight: 1.85, whiteSpace: "pre-wrap", fontFamily: "Georgia, serif" }}>
                    {resolveBody(previewTemplate.body || "")
                      .split(/(\{\{[^}]+\}\}|\{[^}]+\})/g)
                      .map((part, i) =>
                        /^(\{\{[^}]+\}\}|\{[^}]+\})$/.test(part) ? (
                          <Box key={i} component="span" sx={{ color: "#7C3AED", fontWeight: 600, bgcolor: "#F5F3FF", borderRadius: "3px", px: 0.5 }}>
                            {part}
                          </Box>
                        ) : part
                      )
                    }
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: "#F8FAFC", borderTop: "1px solid #E2E8F0", px: 2.5, py: 1.25, textAlign: "center" }}>
                  <Typography fontSize="11px" color="#94A3B8">
                    Variables in <Box component="span" sx={{ color: "#7C3AED", fontWeight: 600 }}>purple</Box> will be auto-filled when sent
                  </Typography>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
              <Button onClick={() => { setStep("template"); setPreviewTemplate(null); }}
                sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>
                Back
              </Button>
              <Button variant="contained"
                onClick={() => { setSubject(previewTemplate.subject || ""); setBody(resolveBody(previewTemplate.body || "")); setStep("compose"); }}
                sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" } }}>
                Use This Template
              </Button>
            </DialogActions>
          </>
        )}

        {/* ══ STEP 2: Compose ══ */}
        {step === "compose" && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              New Email
              <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 0, pb: 0 }}>
              <Stack spacing={0} divider={<Divider />}>
                {/* To */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                  <Typography fontSize="13px" color="text.secondary" minWidth={55}>To:</Typography>
                  <Chip label={recipientName} size="small"
                    sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 500, fontSize: "12px", height: 24 }} />
                  <Typography fontSize="12px" color="text.secondary" sx={{ ml: "auto", cursor: "pointer" }}>Cc | Bcc</Typography>
                </Box>
                {/* Subject */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                  <Typography fontSize="13px" color="text.secondary" minWidth={55}>Subject:</Typography>
                  <TextField fullWidth variant="standard" value={subject}
                    onChange={(e) => setSubject(e.target.value)} disabled={sending}
                    InputProps={{ disableUnderline: true, sx: { fontSize: "13px" } }}
                    placeholder="Enter subject..." />
                </Box>
                {/* Body */}
                <Box sx={{ py: 1.5 }}>
                  {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}>
                      {error}
                    </Alert>
                  )}
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onSelect={saveCursor}
                    onKeyUp={saveCursor}
                    onMouseUp={saveCursor}
                    placeholder="Write your message here..."
                    disabled={sending}
                    style={{
                      width: "100%", minHeight: 260, border: "none", outline: "none",
                      resize: "none", fontSize: "14px", color: "#374151", lineHeight: 1.75,
                      fontFamily: "inherit", background: "transparent", padding: 0,
                    }}
                  />
                </Box>
              </Stack>
            </DialogContent>

            {/* Toolbar */}
            <Box sx={{ px: 2, py: 1, borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 0.5 }}>
              {([
                { icon: <Typography fontWeight={700} fontSize="14px" sx={{ lineHeight: 1, fontFamily: "serif" }}>T</Typography>, title: "Bold",
                  action: () => { saveCursor(); const {start,end}=cursorPos.current; setBody(p=>p.substring(0,start)+"**"+(p.substring(start,end)||"text")+"**"+p.substring(end)); } },
                { icon: <AttachFileIcon sx={{ fontSize: 18 }} />, title: "Attach", action: () => fileInputRef.current?.click() },
                { icon: <LinkIcon sx={{ fontSize: 18 }} />, title: "Link",
                  action: () => { saveCursor(); const u=window.prompt("URL:","https://"); if(u) insertAtCursor(`[link](${u})`); } },
                { icon: <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />, title: "Emoji",
                  action: () => { saveCursor(); const e=window.prompt("Emoji:","😊"); if(e) insertAtCursor(e); } },
                { icon: <MoreHorizIcon sx={{ fontSize: 18 }} />, title: "More", action: () => { saveCursor(); insertAtCursor("\n\n"); } },
                { icon: <ImageOutlinedIcon sx={{ fontSize: 18 }} />, title: "Image", action: () => imageInputRef.current?.click() },
                { icon: <DataObjectIcon sx={{ fontSize: 18 }} />, title: "Variable",
                  action: () => { saveCursor(); const v=window.prompt("Variable:","lead_first_name"); if(v) insertAtCursor(`{{${v}}}`); } },
                { icon: <DriveFileRenameOutlineIcon sx={{ fontSize: 18 }} />, title: "Highlight",
                  action: () => { saveCursor(); const {start,end}=cursorPos.current; setBody(p=>p.substring(0,start)+"=="+(p.substring(start,end)||"text")+"=="+p.substring(end)); } },
                { icon: <AddCircleOutlineIcon sx={{ fontSize: 18 }} />, title: "Block", action: () => { saveCursor(); insertAtCursor("\n\n"); } },
              ] as { icon: React.ReactNode; title: string; action: () => void }[]).map(({ icon, title, action }) => (
                <IconButton key={title} size="small" title={title} onClick={action}
                  sx={{ color: "#6B7280", borderRadius: "6px", p: 0.6, "&:hover": { bgcolor: "#F3F4F6", color: "#111827" } }}>
                  {icon}
                </IconButton>
              ))}
            </Box>

            {/* Footer */}
            <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, borderTop: "1px solid #E5E7EB", gap: 1 }}>
              <Button onClick={handleClose} disabled={sending}
                sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>
                Cancel
              </Button>
              <Button onClick={handleSaveAsDraft} disabled={sending || !subject.trim() || !body.trim()}
                sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>
                Save as Draft
              </Button>
              <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} variant="contained"
                startIcon={sending ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}>
                {sending ? "Sending…" : "Send"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
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

  const [activeTab, setActiveTab]               = React.useState("Patient Info");
  const [openConvertPopup, setOpenConvertPopup] = React.useState(false);
  const [convertLoading, setConvertLoading]     = React.useState(false);
  const [convertError, setConvertError]         = React.useState<string | null>(null);
  const [historyView, setHistoryView]           = React.useState<HistoryView>("chatbot");

  // ── Email dialog state ──
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);

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
          onComposeEmail={() => setEmailDialogOpen(true)}
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

      {/* ── Email Dialog (API-backed, same as LeadsTable) ── */}
      <EmailDialog
        open={emailDialogOpen}
        lead={lead}
        onClose={() => setEmailDialogOpen(false)}
      />

      <Dialogs />
    </Box>
  );
}