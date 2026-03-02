/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  Radio, RadioGroup, Snackbar, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SendIcon from "@mui/icons-material/Send";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import FormatColorTextOutlinedIcon from "@mui/icons-material/FormatColorTextOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import type { ProcessedLead } from "./LeadsTable.types";
import { extractErrorMessage } from "./LeadsTable.helpers";
import { outlineBtn, darkBtn } from "./LeadsTable.styles";
import { EmojiPicker, FormatMenu, MoreMenu } from "./LeadsTable.toolbarcomponents";
import { EmailTemplateAPI, LeadEmailAPI } from "../../services/leads.api";
import type { EmailTemplate } from "../../services/leads.api";

// ====================== New Email Template Dialog ======================
interface NewEmailTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (template: EmailTemplate) => void;
}

export const NewEmailTemplateDialog: React.FC<NewEmailTemplateDialogProps> = ({ open, onClose, onSaved }) => {
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) { setName(""); setSubject(""); setDescription(""); setBody(""); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }
    setSaving(true); setError(null);
    try {
      const saved = await EmailTemplateAPI.create({ clinic: 1, name: name.trim(), subject: subject.trim(), description: description.trim(), use_case: "general", body: body.trim(), created_by: 1, is_active: true });
      onSaved(saved); onClose();
    } catch {
      const local: EmailTemplate = { id: `local-${Date.now()}`, name: name.trim(), subject: subject.trim(), description: description.trim(), body: body.trim() };
      onSaved(local); onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }} sx={{ zIndex: 1600 }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 0 }}>
        New Email Template
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <TextField label="Template Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="e.g. IVF Follow-Up" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <TextField label="Subject" value={subject} onChange={(e) => { setSubject(e.target.value); setError(null); }} placeholder="e.g. Following up on your IVF inquiry" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of when to use this template" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <Box>
            <Typography fontSize="12px" fontWeight={500} color="#374151" mb={0.75}>Body</Typography>
            <textarea value={body} onChange={(e) => { setBody(e.target.value); setError(null); }} placeholder="Write your email body here... Use {{name}} for the lead's name." rows={8}
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "14px", fontFamily: "inherit", color: "#1E293B", lineHeight: "1.6", border: "1px solid #D1D5DB", borderRadius: "8px", resize: "vertical", outline: "none", background: "#fff" }}
              onFocus={(e) => { e.target.style.borderColor = "#1976d2"; e.target.style.boxShadow = "0 0 0 2px rgba(25,118,210,0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }} />
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

// ====================== Email Dialog ======================
interface EmailDialogProps {
  open: boolean;
  lead: ProcessedLead | null;
  onClose: () => void;
}

export const EmailDialog: React.FC<EmailDialogProps> = ({ open, lead, onClose }) => {
  const [step, setStep] = React.useState<"template" | "preview" | "compose">("template");
  const [previewTemplate, setPreviewTemplate] = React.useState<EmailTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [emailTemplates, setEmailTemplates] = React.useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [newEmailTemplateOpen, setNewEmailTemplateOpen] = React.useState(false);

  const [emojiAnchor, setEmojiAnchor]   = React.useState<HTMLElement | null>(null);
  const [formatAnchor, setFormatAnchor] = React.useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor]     = React.useState<HTMLElement | null>(null);

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
        if (el) { el.focus(); const newStart = start + before.length; const newEnd = newStart + selected.length; el.setSelectionRange(newStart, newEnd); cursorPos.current = { start: newStart, end: newEnd }; }
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
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setStep("template"); setSelectedTemplateId(null); setPreviewTemplate(null);
      setSubject(""); setBody(""); setError(null); setSending(false);
      setEmojiAnchor(null); setFormatAnchor(null); setMoreAnchor(null);
      loadEmailTemplates();
    }
  }, [open, loadEmailTemplates]);

  const handleClose = () => { if (sending) return; onClose(); };
  const handleComposeNew = () => { setSelectedTemplateId(null); setSubject(""); setBody(""); setStep("compose"); };

  const handleNext = () => {
    if (!selectedTemplateId) return;
    const template = emailTemplates.find((t) => String(t.id) === selectedTemplateId);
    if (template) {
      const recipientName = lead?.full_name || lead?.name || "Patient";
      setSubject(template.subject);
      setBody((template.body || "").replace(/\{\{name\}\}/g, recipientName).replace(/\{\{lead_name\}\}/g, recipientName));
    }
    setStep("compose");
  };

  const handleNewEmailTemplateSaved = (tpl: EmailTemplate) => {
    setNewEmailTemplateOpen(false);
    setEmailTemplates((prev) => [tpl, ...prev]);
    setSelectedTemplateId(String(tpl.id));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { setError("Subject and body are required."); return; }
    if (!lead?.id) { setError("Lead ID is missing. Cannot send email."); return; }
    if (!lead?.email) { setError("This lead has no email address."); return; }
    setSending(true); setError(null);
    try {
      await LeadEmailAPI.sendNow({ lead: lead.id, subject: subject.trim(), email_body: body.trim(), sender_email: lead.email ?? null });
      setSuccess(true); onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to send email. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!subject.trim() || !body.trim() || !lead?.id) return;
    try {
      await LeadEmailAPI.saveAsDraft({ lead: lead.id, subject: subject.trim(), email_body: body.trim(), sender_email: lead.email ?? null });
    } catch (err) { console.error("Failed to save draft:", err); }
  };

  // Toolbar handlers
  const handleAttach      = () => fileInputRef.current?.click();
  const handleFileChange  = (e: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(e.target.files || []); if (!files.length) return; saveCursor(); insertAtCursor(`\n[📎 Attachment: ${files.map(f => f.name).join(", ")}]\n`); e.target.value = ""; };
  const handleImageAttach = () => imageInputRef.current?.click();
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; saveCursor(); insertAtCursor(`\n[🖼 Image: ${file.name}]\n`); e.target.value = ""; };
  const handleInsertLink  = () => { saveCursor(); const url = window.prompt("Enter URL:", "https://"); if (!url) return; const label = window.prompt("Link label:", "Click here") || url; insertAtCursor(`[${label}](${url})`); };
  const handleEmojiSelect = (emoji: string) => { saveCursor(); insertAtCursor(emoji); };

  const handleFormat = (type: string) => {
    saveCursor();
    const formats: Record<string, [string, string, string?]> = {
      "Bold": ["**","**","bold text"], "Italic": ["_","_","italic text"],
      "Underline": ["__","__","underlined text"], "Strikethrough": ["~~","~~","strikethrough"],
      "Bullet list": ["\n• ","","item"], "Numbered list": ["\n1. ","","item"],
      "Quote": ["\n> ","","quote"], "Code": ["`","`","code"],
    };
    const fmt = formats[type];
    if (fmt) wrapSelection(fmt[0], fmt[1], fmt[2]);
  };

  const handleMoreAction = (action: string) => {
    saveCursor();
    const snippets: Record<string, string> = {
      "Insert signature": `\n\n---\nWarm regards,\nCrysta IVF, Bangalore\n(935) 555-0128 | crysta@gmail.com`,
      "Insert divider": "\n\n---\n\n",
      "Insert table": "\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n",
    };
    if (action === "Clear formatting") setBody((prev) => prev.replace(/(\*\*|__|~~|_|`)/g, ""));
    else insertAtCursor(snippets[action] || "");
  };

  const recipientName = lead?.full_name || lead?.name || "Patient";

  return (
    <>
      <input ref={fileInputRef}  type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />

      <EmojiPicker  anchorEl={emojiAnchor}  onClose={() => setEmojiAnchor(null)}  onSelect={handleEmojiSelect} />
      <FormatMenu   anchorEl={formatAnchor} onClose={() => setFormatAnchor(null)} onFormat={handleFormat} />
      <MoreMenu     anchorEl={moreAnchor}   onClose={() => setMoreAnchor(null)}   onAction={handleMoreAction} />

      <NewEmailTemplateDialog open={newEmailTemplateOpen} onClose={() => setNewEmailTemplateOpen(false)} onSaved={handleNewEmailTemplateSaved} />

      <Dialog open={open && !newEmailTemplateOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}>

        {/* ── Step 1: Template Selection ── */}
        {step === "template" && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              New Email
              <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1, pb: 0 }}>
              <Box onClick={handleComposeNew} sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 1.5, cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>
                <EditOutlinedIcon sx={{ fontSize: 18, color: "#475569" }} />
                <Typography fontWeight={600} fontSize="14px" color="#475569">Compose New Email</Typography>
              </Box>
              <Divider sx={{ my: 1.5 }}><Typography fontSize="12px" color="text.secondary">OR</Typography></Divider>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography fontSize="13px" color="text.secondary" fontWeight={500}>Select Email Template</Typography>
                <Button size="small" onClick={() => setNewEmailTemplateOpen(true)} sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, color: "#1F2937", border: "1px solid #E5E7EB", borderRadius: "6px", px: 1.5, py: 0.5, minWidth: 0, "&:hover": { bgcolor: "#F3F4F6" } }}>+ New Template</Button>
              </Box>

              {loadingTemplates && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>}
              {!loadingTemplates && templateError && <Alert severity="warning" sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}>{templateError}</Alert>}
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
                      <Box key={template.id} onClick={() => setSelectedTemplateId(String(template.id))} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, px: 0.5, cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>
                        <FormControlLabel
                          value={String(template.id)}
                          control={<Radio size="small" sx={{ color: selectedTemplateId === String(template.id) ? "#EF4444" : "#CBD5E1", "&.Mui-checked": { color: "#EF4444" } }} />}
                          label={<Box><Typography fontWeight={600} fontSize="13.5px" color="#1E293B">{template.name}</Typography>{template.description && <Typography fontSize="12px" color="#64748B" mt={0.2}>{template.description}</Typography>}{template.subject && <Typography fontSize="11px" color="#94A3B8" mt={0.25}>Subject: {template.subject}</Typography>}</Box>}
                          sx={{ m: 0, flex: 1 }}
                        />
                        <Tooltip title="Preview template">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedTemplateId(String(template.id)); setPreviewTemplate(template); setStep("preview"); }} sx={{ color: "#93C5FD", ml: 1, "&:hover": { color: "#3B82F6", bgcolor: "#EFF6FF" } }}>
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
              <Button onClick={handleClose} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Cancel</Button>
              <Button onClick={handleNext} disabled={!selectedTemplateId} variant="contained" sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } }}>Next</Button>
            </DialogActions>
          </>
        )}

        {/* ── Step 1.5: Template Preview ── */}
        {step === "preview" && previewTemplate && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={() => { setStep("template"); setPreviewTemplate(null); }}><ChevronLeftIcon fontSize="small" /></IconButton>
                <Typography fontWeight={700} fontSize="1.05rem">Preview Template</Typography>
              </Stack>
              <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, pb: 0 }}>
              <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", px: 2, py: 1.25, mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography fontSize="12px" color="#64748B" fontWeight={500}>Template:</Typography>
                  <Typography fontSize="13px" fontWeight={700} color="#1E293B">{previewTemplate.name}</Typography>
                  {previewTemplate.use_case && <Chip label={previewTemplate.use_case} size="small" sx={{ height: 20, fontSize: "11px", fontWeight: 600, bgcolor: "#EFF6FF", color: "#1D4ED8", borderRadius: "4px", "& .MuiChip-label": { px: 1 } }} />}
                </Stack>
              </Box>
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <Box sx={{ bgcolor: "#1F2937", px: 2, py: 1 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {["#EF4444","#F59E0B","#10B981"].map((c) => <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />)}
                    <Box sx={{ flex: 1, bgcolor: "#374151", borderRadius: "4px", height: 20, ml: 1, display: "flex", alignItems: "center", px: 1.5 }}><Typography fontSize="10px" color="#94A3B8">Mail Preview</Typography></Box>
                  </Stack>
                </Box>
                <Box sx={{ bgcolor: "#FAFAFA", px: 2.5, py: 1.5, borderBottom: "1px solid #E2E8F0" }}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} alignItems="center"><Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>From:</Typography><Typography fontSize="12px" color="#374151">noreply@crystaivf.com</Typography></Stack>
                    <Stack direction="row" spacing={1} alignItems="center"><Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>To:</Typography><Typography fontSize="12px" color="#374151">{recipientName}{lead?.email ? ` <${lead.email}>` : ""}</Typography></Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start"><Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>Subject:</Typography><Typography fontSize="12px" color="#1E293B" fontWeight={700}>{previewTemplate.subject}</Typography></Stack>
                  </Stack>
                </Box>
                <Box sx={{ bgcolor: "#FFFFFF", px: 2.5, py: 2.5, maxHeight: 260, overflowY: "auto" }}>
                  <Typography fontSize="13px" color="#1E293B" sx={{ lineHeight: 1.85, whiteSpace: "pre-wrap", fontFamily: "Georgia, serif" }}>
                    {(previewTemplate.body || "").replace(/\{\{name\}\}/g, recipientName).replace(/\{\{lead_name\}\}/g, recipientName).replace(/\{\{lead_first_name\}\}/g, recipientName.split(" ")[0])
                      .split(/(\{\{[^}]+\}\}|\{[^}]+\})/g).map((part, i) =>
                        /^(\{\{[^}]+\}\}|\{[^}]+\})$/.test(part) ? <Box key={i} component="span" sx={{ color: "#7C3AED", fontWeight: 600, bgcolor: "#F5F3FF", borderRadius: "3px", px: 0.5 }}>{part}</Box> : part
                      )}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#F8FAFC", borderTop: "1px solid #E2E8F0", px: 2.5, py: 1.25, textAlign: "center" }}>
                  <Typography fontSize="11px" color="#94A3B8">Variables shown in <Box component="span" sx={{ color: "#7C3AED", fontWeight: 600 }}>purple</Box> will be auto-filled when sent</Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
              <Button onClick={() => { setStep("template"); setPreviewTemplate(null); }} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Back</Button>
              <Button onClick={() => { setSubject(previewTemplate.subject || ""); setBody((previewTemplate.body || "").replace(/\{\{name\}\}/g, recipientName).replace(/\{\{lead_name\}\}/g, recipientName).replace(/\{\{lead_first_name\}\}/g, recipientName.split(" ")[0])); setStep("compose"); }} variant="contained" sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" } }}>Use This Template</Button>
            </DialogActions>
          </>
        )}

        {/* ── Step 2: Compose Email ── */}
        {step === "compose" && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              New Email
              <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, pb: 0 }}>
              <Stack spacing={0} divider={<Divider />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                  <Typography fontSize="13px" color="text.secondary" minWidth={55}>To:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Chip label={lead?.full_name || lead?.name || lead?.email || "Unknown"} size="small" onDelete={() => {}} deleteIcon={<CloseIcon sx={{ fontSize: "14px !important" }} />} sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 500, fontSize: "12px", height: 24, "& .MuiChip-deleteIcon": { color: "#93C5FD" } }} />
                  </Box>
                  <Typography fontSize="12px" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "#1D4ED8" } }}>Cc | Bcc</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                  <Typography fontSize="13px" color="text.secondary" minWidth={55}>Subject:</Typography>
                  <TextField fullWidth variant="standard" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} InputProps={{ disableUnderline: true, sx: { fontSize: "13px" } }} placeholder="Enter subject..." />
                </Box>
                <Box sx={{ py: 1.5 }}>
                  <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} onSelect={saveCursor} onKeyUp={saveCursor} onMouseUp={saveCursor} disabled={sending} placeholder="Write your email..." rows={12}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "none", outline: "none", fontSize: "13px", lineHeight: 1.7, fontFamily: "inherit", color: "#1E293B", background: "transparent", padding: 0 }} />
                </Box>
                {error && <Alert severity="error" sx={{ borderRadius: "8px", my: 1 }}>{error}</Alert>}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: "column", gap: 0 }}>
              {/* Toolbar */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 1.5, width: "100%", borderTop: "1px solid #E5E7EB", pt: 1.5, flexWrap: "wrap" }}>
                {[
                  { title: "Attach file",    icon: <AttachFileIcon sx={{ fontSize: 18 }} />,              onClick: handleAttach,                                               activeColor: undefined },
                  { title: "Insert link",    icon: <LinkIcon sx={{ fontSize: 18 }} />,                    onClick: handleInsertLink,                                           activeColor: undefined },
                  { title: "Emoji",          icon: <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />,  onClick: (e: React.MouseEvent<HTMLButtonElement>) => { saveCursor(); setEmojiAnchor(e.currentTarget); }, activeColor: "#F59E0B", active: Boolean(emojiAnchor) },
                  { title: "Insert image",   icon: <ImageOutlinedIcon sx={{ fontSize: 18 }} />,           onClick: handleImageAttach,                                          activeColor: undefined },
                  { title: "Format text",    icon: <FormatColorTextOutlinedIcon sx={{ fontSize: 18 }} />,onClick: (e: React.MouseEvent<HTMLButtonElement>) => { saveCursor(); setFormatAnchor(e.currentTarget); }, activeColor: "#6366F1", active: Boolean(formatAnchor) },
                  { title: "Highlight",      icon: <BrushOutlinedIcon sx={{ fontSize: 18 }} />,           onClick: () => { saveCursor(); wrapSelection("==","==","highlighted text"); }, activeColor: undefined },
                  { title: "More options",   icon: <AddCircleOutlineIcon sx={{ fontSize: 18 }} />,        onClick: (e: React.MouseEvent<HTMLButtonElement>) => { saveCursor(); setMoreAnchor(e.currentTarget); },  activeColor: "#10B981", active: Boolean(moreAnchor) },
                ].map(({ title, icon, onClick, activeColor, active }) => (
                  <Tooltip key={title} title={title}>
                    <IconButton size="small" onClick={onClick as any} sx={{ color: (active && activeColor) ? activeColor : "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: activeColor || "#1E293B" } }}>
                      {icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
              {/* Action buttons */}
              <Box sx={{ display: "flex", gap: 1, width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={handleClose} disabled={sending} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Cancel</Button>
                <Button onClick={handleSaveAsTemplate} disabled={sending || !subject.trim() || !body.trim()} startIcon={<BookmarkBorderIcon fontSize="small" />} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 2, "&:hover": { bgcolor: "#F3F4F6" } }}>Save as Draft</Button>
                <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} variant="contained" startIcon={sending ? <CircularProgress size={14} sx={{ color: "white" }} /> : <SendIcon fontSize="small" />} sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
                  {sending ? "Sending..." : "Send"}
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ borderRadius: "10px" }}>Email sent to {recipientName}!</Alert>
      </Snackbar>
    </>
  );
};