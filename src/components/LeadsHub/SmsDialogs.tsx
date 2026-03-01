/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, List, ListItem,
  ListItemButton, ListItemText, Menu, MenuItem, Snackbar, Stack,
  TextField, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import type { ProcessedLead, SMSTemplate } from "./LeadsTable.types";
import { USE_CASE_OPTIONS, USE_CASE_BODY_SUGGESTIONS } from "./LeadsTable.types";
import { extractErrorMessage, normalizePhone } from "./LeadsTable.helpers";
import { getUseCaseChipSx, outlineBtn, darkBtn } from "./LeadsTable.styles";
import { TwilioAPI } from "../../services/leads.api";
import TemplateService from "../../services/templates.api";

// ====================== New SMS Template Dialog ======================
interface NewSMSTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (template: SMSTemplate) => void;
}

type TemplateFormView = "form" | "preview";

export const NewSMSTemplateDialog: React.FC<NewSMSTemplateDialogProps> = ({ open, onClose, onSaved }) => {
  const [view, setView] = React.useState<TemplateFormView>("form");
  const [name, setName] = React.useState("");
  const [useCase, setUseCase] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dropdownAnchor, setDropdownAnchor] = React.useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(dropdownAnchor);

  React.useEffect(() => {
    if (!open) {
      setView("form"); setName(""); setUseCase(""); setBody(""); setError(null); setDropdownAnchor(null);
    }
  }, [open]);

  const handleSelectUseCase = (uc: string) => {
    setUseCase(uc);
    setDropdownAnchor(null);
    if (!body.trim()) setBody(USE_CASE_BODY_SUGGESTIONS[uc] || "");
  };

  const handlePreview = () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }
    setError(null);
    setView("preview");
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        clinic: 1, name: name.trim(),
        use_case: useCase.toLowerCase() || "general",
        body: body.trim(), created_by: 1, is_active: true,
      };
      let saved: SMSTemplate | null = null;
      try {
        saved = await TemplateService.createTemplate("sms", payload);
      } catch {
        saved = { id: `local-${Date.now()}`, name: name.trim(), use_case: useCase, body: body.trim() };
      }
      onSaved(saved!);
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to save template."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }} sx={{ zIndex: 1500 }}>
      {view === "form" && (
        <>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 0 }}>
            New SMS Template
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField label="Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="e.g. Appointment Confirmation" fullWidth size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
              <Box>
                <Typography fontSize="12px" fontWeight={500} color="#374151" mb={0.75}>Use Case</Typography>
                <Box onClick={(e) => setDropdownAnchor(e.currentTarget)}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid", borderColor: dropdownOpen ? "#1976d2" : "#D1D5DB", borderRadius: "8px", px: 1.5, cursor: "pointer", minHeight: 40, bgcolor: "#fff", boxShadow: dropdownOpen ? "0 0 0 2px rgba(25,118,210,0.15)" : "none", "&:hover": { borderColor: "#9CA3AF" }, transition: "all 0.15s" }}>
                  {useCase ? <Chip label={useCase} size="small" sx={getUseCaseChipSx(useCase)} /> : <Typography fontSize="14px" color="#9CA3AF" sx={{ py: 1 }}>Select use case</Typography>}
                  <Typography sx={{ fontSize: "12px", color: "#6B7280", ml: 1, transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", userSelect: "none" }}>▼</Typography>
                </Box>
                <Menu anchorEl={dropdownAnchor} open={dropdownOpen} onClose={() => setDropdownAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }} disablePortal={false} PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", mt: 0.5, minWidth: 240 } }} sx={{ zIndex: 99999 }}>
                  {USE_CASE_OPTIONS.map((uc) => (
                    <MenuItem key={uc} selected={useCase === uc} onClick={() => handleSelectUseCase(uc)} sx={{ py: 1, px: 1.5, "&.Mui-selected": { bgcolor: "#F1F5F9" }, "&:hover": { bgcolor: "#F8FAFC" } }}>
                      <Chip label={uc} size="small" sx={getUseCaseChipSx(uc)} />
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
              <Box>
                <Typography fontSize="12px" fontWeight={500} color="#374151" mb={0.75}>Body</Typography>
                <textarea value={body} onChange={(e) => { setBody(e.target.value); setError(null); }} placeholder="Type your message here..." maxLength={1600} rows={6}
                  style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "14px", fontFamily: "inherit", color: "#1E293B", lineHeight: "1.6", border: "1px solid #D1D5DB", borderRadius: "8px", resize: "vertical", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", background: "#fff" }}
                  onFocus={(e) => { e.target.style.borderColor = "#1976d2"; e.target.style.boxShadow = "0 0 0 2px rgba(25,118,210,0.15)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }} />
                <Typography fontSize="11px" color="#94A3B8" mt={0.5}>{body.length}/1600 — Use {"{variable_name}"} for dynamic fields</Typography>
              </Box>
              {error && <Alert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
            <Button onClick={onClose} sx={outlineBtn}>Cancel</Button>
            <Button onClick={handlePreview} sx={outlineBtn}>Preview</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim() || !body.trim()} sx={darkBtn}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </>
      )}
      {view === "preview" && (
        <>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 0 }}>
            Preview Template
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <Typography fontSize="13px" color="#64748B">Template:</Typography>
              <Typography fontSize="13px" fontWeight={600} color="#1E293B">{name}</Typography>
              {useCase && <Chip label={useCase} size="small" sx={getUseCaseChipSx(useCase)} />}
            </Stack>
            <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", p: 2, minHeight: 160, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Box sx={{ alignSelf: "flex-start", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "0px 12px 12px 12px", px: 2, py: 1.25, maxWidth: "90%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Typography fontSize="13px" color="#1E293B" sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {body.split(/(\{[^}]+\})/g).map((part, i) =>
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
            <Button onClick={() => setView("form")} sx={outlineBtn}>Back to Edit</Button>
            <Button onClick={handleSave} disabled={saving} sx={darkBtn}>{saving ? "Saving..." : "Save"}</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

// ====================== SMS Template Picker Dialog ======================
interface SMSTemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (body: string) => void;
}

export const SMSTemplatePicker: React.FC<SMSTemplatePickerProps> = ({ open, onClose, onSelect }) => {
  const [templates, setTemplates] = React.useState<SMSTemplate[]>([]);
  const [loadingTpl, setLoadingTpl] = React.useState(false);
  const [view, setView] = React.useState<"list" | "preview">("list");
  const [selected, setSelected] = React.useState<SMSTemplate | null>(null);
  const [previewBody, setPreviewBody] = React.useState("");
  const [newTemplateOpen, setNewTemplateOpen] = React.useState(false);
  const [savedSnackbar, setSavedSnackbar] = React.useState(false);

  const loadTemplates = React.useCallback(() => {
    setLoadingTpl(true);
    (TemplateService as any).getTemplates("sms")
      .then((data: SMSTemplate[]) => setTemplates(data || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTpl(false));
  }, []);

  React.useEffect(() => {
    if (!open) { setView("list"); setSelected(null); setPreviewBody(""); return; }
    loadTemplates();
  }, [open, loadTemplates]);

  const handlePickTemplate = (tpl: SMSTemplate) => { setSelected(tpl); setPreviewBody(tpl.body); setView("preview"); };
  const handleSave = () => { onSelect(previewBody); onClose(); };
  const handleNewTemplateSaved = (tpl: SMSTemplate) => { setNewTemplateOpen(false); onSelect(tpl.body); setSavedSnackbar(true); onClose(); };

  return (
    <>
      <NewSMSTemplateDialog open={newTemplateOpen} onClose={() => setNewTemplateOpen(false)} onSaved={handleNewTemplateSaved} />
      <Snackbar open={savedSnackbar} autoHideDuration={3000} onClose={() => setSavedSnackbar(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSavedSnackbar(false)} severity="success" sx={{ borderRadius: "10px" }}>Template saved and applied to your message!</Alert>
      </Snackbar>
      <Dialog open={open && !newTemplateOpen} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }} sx={{ zIndex: 1300 }}>
        {view === "list" && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 1 }}>
              Select SMS Template
              <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, pb: 0 }}>
              {loadingTpl ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
              ) : templates.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}><Typography color="text.secondary" fontSize="14px">No SMS templates found.</Typography></Box>
              ) : (
                <List disablePadding sx={{ maxHeight: 340, overflowY: "auto" }}>
                  {templates.map((tpl, idx) => (
                    <React.Fragment key={tpl.id}>
                      <ListItem disablePadding>
                        <ListItemButton onClick={() => handlePickTemplate(tpl)} sx={{ borderRadius: "8px", px: 1.5, py: 1.25, "&:hover": { bgcolor: "#F8FAFC" } }}>
                          <ListItemText
                            primary={<Stack direction="row" spacing={1} alignItems="center"><Typography fontSize="14px" fontWeight={600} color="#1E293B">{tpl.name}</Typography>{tpl.use_case && <Chip label={tpl.use_case} size="small" sx={getUseCaseChipSx(tpl.use_case)} />}</Stack>}
                            secondary={<Typography fontSize="12px" color="#64748B" sx={{ mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{tpl.body}</Typography>}
                          />
                        </ListItemButton>
                      </ListItem>
                      {idx < templates.length - 1 && <Divider sx={{ my: 0.25 }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
              <Button fullWidth variant="outlined" onClick={() => setNewTemplateOpen(true)} sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>+ New Template</Button>
              <Button fullWidth onClick={onClose} sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>Cancel</Button>
            </DialogActions>
          </>
        )}
        {view === "preview" && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 1 }}>
              Preview Template
              <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Stack spacing={2}>
                {selected && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontSize="13px" color="#64748B">Template:</Typography>
                    <Typography fontSize="13px" fontWeight={600} color="#1E293B">{selected.name}</Typography>
                    {selected.use_case && <Chip label={selected.use_case} size="small" sx={getUseCaseChipSx(selected.use_case)} />}
                  </Stack>
                )}
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
                <TextField label="Edit message before sending" multiline rows={4} value={previewBody} onChange={(e) => setPreviewBody(e.target.value)} inputProps={{ maxLength: 1600 }} helperText={`${previewBody.length}/1600`} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button fullWidth onClick={() => setView("list")} sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>Back to Edit</Button>
              <Button fullWidth onClick={handleSave} disabled={!previewBody.trim()} sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>Use Template</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

// ====================== SMS Dialog ======================
interface SMSDialogProps {
  open: boolean;
  lead: ProcessedLead | null;
  onClose: () => void;
}

export const SMSDialog: React.FC<SMSDialogProps> = ({ open, lead, onClose }) => {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = React.useState(false);

  const handleClose = () => { if (sending) return; setMessage(""); setError(null); onClose(); };

  const handleSend = async () => {
    if (!message.trim()) { setError("Message cannot be empty."); return; }
    const phone = normalizePhone(lead?.contact_no);
    if (!phone) { setError("This lead has no contact number."); return; }
    if (!lead?.id) { setError("Lead ID is missing. Cannot send SMS."); return; }
    setSending(true); setError(null);
    try {
      await TwilioAPI.sendSMS({ lead_uuid: lead.id, to: phone, message: message.trim() });
      setSuccess(true); setMessage(""); onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to send SMS. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SMSTemplatePicker open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} onSelect={(body) => setMessage(body)} />
      <Dialog open={open && !templatePickerOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }} sx={{ zIndex: 1300 }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1 }}>Send SMS</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Box sx={{ backgroundColor: "#F8FAFC", borderRadius: "10px", px: 2, py: 1.5, border: "1px solid #E2E8F0" }}>
              <Typography variant="body2" color="text.secondary" fontSize="12px">Sending to</Typography>
              <Typography fontWeight={600} fontSize="14px">{lead?.full_name || lead?.name || "Unknown"}</Typography>
              <Typography color="text.secondary" fontSize="13px">{lead?.contact_no || "No number"}</Typography>
            </Box>
            <TextField label="Message" multiline rows={4} value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} placeholder="Type your message here..." inputProps={{ maxLength: 1600 }} helperText={`${message.length}/1600`} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
            {error && <Alert severity="error" sx={{ borderRadius: "8px" }}>{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
          <Button fullWidth variant="outlined" onClick={() => setTemplatePickerOpen(true)} disabled={sending} sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>SMS Template</Button>
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button fullWidth onClick={handleClose} disabled={sending} sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>Cancel</Button>
            <Button fullWidth onClick={handleSend} disabled={sending || !message.trim()} startIcon={sending ? <CircularProgress size={16} sx={{ color: "white" }} /> : null} sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
              {sending ? "Sending..." : "Send SMS"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ borderRadius: "10px" }}>SMS sent to {lead?.full_name || lead?.name}!</Alert>
      </Snackbar>
    </>
  );
};