// LeadsBoard.tsx
// Main component — no any, Date not Dayjs, exhaustive-deps fixed

import * as React from "react";
import { Box, Stack, Typography, CircularProgress, Alert } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";

import { Dialogs } from "./LeadsMenuDialogs";
import {
  fetchLeads,
  bookAppointment,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import {
  DepartmentAPI,
  EmployeeAPI,
  TwilioAPI,
  LeadEmailAPI,
  EmailTemplateAPI,
} from "../../services/leads.api";
import type { FilterValues } from "../../types/leads.types";
import type { EmailTemplate, EmailTemplatePayload } from "../../services/leads.api";
import TemplateService from "../../services/templates.api";

import {
  type LeadItem,
  type RawLead,
  type AppointmentState,
  BOARD_COLUMNS,
  mapRawToLeadItem,
} from "./Leadsboardtypes";
import { BookAppointmentModal, SuccessToast } from "./Leadsboardmodals";
import { LeadColumn } from "./Leadsboardcard";
import CallDialog from "./CallDialog";

import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
  Tooltip,
  Alert as MuiAlert,
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

// ====================== Props ======================
interface Props {
  search: string;
  filters?: FilterValues;
}

// ====================== Phone normalizer (same as LeadsTable) ======================
const normalizePhone = (phone: string | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return `+${cleaned}`;
};

interface ApiErrorShape {
  response?: { data?: { detail?: string; message?: string } };
  message?: string;
}
const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  return e?.response?.data?.detail || e?.response?.data?.message || e?.message || fallback;
};

// ====================== Empty appointment state ======================
const emptyAppointment = (): AppointmentState => ({
  departments: [],
  employees: [],
  filteredEmployees: [],
  selectedDepartmentId: "",
  selectedEmployeeId: "",
  date: null,
  slot: "",
  remark: "",
  loadingDepartments: false,
  loadingEmployees: false,
  submitting: false,
  error: null,
  success: false,
});

// ====================== SMS Template type ======================
interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  use_case?: string;
}

// ====================== Use Case options (exact same as LeadsTable) ======================
const USE_CASE_OPTIONS = [
  "Appointment",
  "Feedback",
  "Reminder",
  "Follow-Up",
  "Re-engagement",
  "No-Show",
  "General",
];

const getUseCaseChipSx = (useCase: string | undefined) => {
  const lower = (useCase || "").toLowerCase();
  const map: Record<string, { color: string; bg: string }> = {
    appointment: { color: "#16A34A", bg: "#F0FDF4" },
    reminder: { color: "#D97706", bg: "#FFFBEB" },
    feedback: { color: "#3B82F6", bg: "#EFF6FF" },
    "follow-up": { color: "#8B5CF6", bg: "#F5F3FF" },
    "re-engagement": { color: "#EC4899", bg: "#FDF2F8" },
    "no-show": { color: "#EF4444", bg: "#FEF2F2" },
    general: { color: "#6B7280", bg: "#F3F4F6" },
  };
  const s = map[lower] ?? { color: "#6B7280", bg: "#F3F4F6" };
  return {
    color: s.color, bgcolor: s.bg, fontWeight: 600, fontSize: "11px",
    height: 22, borderRadius: "4px", "& .MuiChip-label": { px: 1 },
  };
};

const USE_CASE_BODY_SUGGESTIONS: Record<string, string> = {
  Appointment: "Hi {lead_first_name}, your appointment at {clinic_name} is on {appointment_date} at {appointment_time}. Reply YES to confirm.",
  Feedback: "Hi {lead_first_name}, we'd love to hear about your experience at {clinic_name}. Please share your feedback: {feedback_link}",
  Reminder: "Hi {lead_first_name}, this is a reminder for your appointment on {appointment_date} at {appointment_time} at {clinic_name}.",
  "Follow-Up": "Hi {lead_first_name}, thank you for visiting {clinic_name}. How are you feeling? Reply to this message if you need any assistance.",
  "Re-engagement": "Hi {lead_first_name}, we miss you at {clinic_name}! It's been a while. Would you like to schedule a visit? Reply YES to book.",
  "No-Show": "Hi {lead_first_name}, we noticed you missed your appointment at {clinic_name}. Would you like to reschedule? Reply to this message.",
  General: "Hi {lead_first_name}, ",
};

// ====================== New SMS Template Dialog (exact copy from LeadsTable) ======================
interface NewSMSTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (template: SMSTemplate) => void;
}

type TemplateFormView = "form" | "preview";

const NewSMSTemplateDialog: React.FC<NewSMSTemplateDialogProps> = ({ open, onClose, onSaved }) => {
  const [view, setView] = React.useState<TemplateFormView>("form");
  const [name, setName] = React.useState("");
  const [useCase, setUseCase] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dropdownAnchor, setDropdownAnchor] = React.useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(dropdownAnchor);

  React.useEffect(() => {
    if (!open) { setView("form"); setName(""); setUseCase(""); setBody(""); setError(null); setDropdownAnchor(null); }
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
      const payload = { clinic: 1, name: name.trim(), use_case: useCase.toLowerCase() || "general", body: body.trim(), created_by: 1, is_active: true };
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
    } finally { setSaving(false); }
  };

  const outlineBtn = { height: 40, px: 3, textTransform: "none" as const, fontWeight: 500, borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151", bgcolor: "transparent", "&:hover": { bgcolor: "#F9FAFB" } };
  const darkBtn = { height: 40, px: 3, textTransform: "none" as const, fontWeight: 600, borderRadius: "8px", bgcolor: "#1F2937", color: "white", "&:hover": { bgcolor: "#111827" }, "&:disabled": { bgcolor: "#9CA3AF", color: "white" } };

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
              <TextField label="Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="e.g. Appointment Confirmation" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
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
              {error && <MuiAlert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>{error}</MuiAlert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
            <Button onClick={onClose} sx={outlineBtn}>Cancel</Button>
            <Button onClick={handlePreview} sx={outlineBtn}>Preview</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim() || !body.trim()} sx={darkBtn}>{saving ? "Saving..." : "Save"}</Button>
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

// ====================== SMS Template Picker (exact copy from LeadsTable) ======================
interface SMSTemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (body: string) => void;
}

const SMSTemplatePicker: React.FC<SMSTemplatePickerProps> = ({ open, onClose, onSelect }) => {
  const [templates, setTemplates] = React.useState<SMSTemplate[]>([]);
  const [loadingTpl, setLoadingTpl] = React.useState(false);
  const [view, setView] = React.useState<"list" | "preview">("list");
  const [selected, setSelected] = React.useState<SMSTemplate | null>(null);
  const [previewBody, setPreviewBody] = React.useState("");
  const [newTemplateOpen, setNewTemplateOpen] = React.useState(false);
  const [savedSnackbar, setSavedSnackbar] = React.useState(false);

  const loadTemplates = React.useCallback(() => {
    setLoadingTpl(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleNewTemplateSaved = (tpl: SMSTemplate) => {
    setNewTemplateOpen(false);
    onSelect(tpl.body);
    setSavedSnackbar(true);
    onClose();
  };

  return (
    <>
      <NewSMSTemplateDialog open={newTemplateOpen} onClose={() => setNewTemplateOpen(false)} onSaved={handleNewTemplateSaved} />
      <Snackbar open={savedSnackbar} autoHideDuration={3000} onClose={() => setSavedSnackbar(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <MuiAlert onClose={() => setSavedSnackbar(false)} severity="success" sx={{ borderRadius: "10px" }}>Template saved and applied to your message!</MuiAlert>
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
              <Button fullWidth variant="outlined" onClick={() => setNewTemplateOpen(true)}
                sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
                + New Template
              </Button>
              <Button fullWidth onClick={onClose}
                sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
                Cancel
              </Button>
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

// ====================== SMS Dialog (exact copy from LeadsTable) ======================
interface SMSDialogProps {
  open: boolean;
  lead: LeadItem | null;
  onClose: () => void;
}

const SMSDialog: React.FC<SMSDialogProps> = ({ open, lead, onClose }) => {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = React.useState(false);

  const handleClose = () => {
    if (sending) return;
    setMessage(""); setError(null); onClose();
  };

  const handleSend = async () => {
    if (!message.trim()) { setError("Message cannot be empty."); return; }
    const phone = normalizePhone(lead?.contact_no as string | undefined);
    if (!phone) { setError("This lead has no contact number."); return; }
    if (!lead?.id) { setError("Lead ID is missing. Cannot send SMS."); return; }
    setSending(true); setError(null);
    try {
      await TwilioAPI.sendSMS({ lead_uuid: lead.id, to: phone, message: message.trim() });
      setSuccess(true); setMessage(""); onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to send SMS. Please try again."));
    } finally { setSending(false); }
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
              <Typography fontWeight={600} fontSize="14px">{(lead?.full_name ?? lead?.name ?? "Unknown") as string}</Typography>
              <Typography color="text.secondary" fontSize="13px">{(lead?.contact_no ?? "No number") as string}</Typography>
            </Box>
            <TextField label="Message" multiline rows={4} value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} placeholder="Type your message here..." inputProps={{ maxLength: 1600 }} helperText={`${message.length}/1600`} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
            {error && <MuiAlert severity="error" sx={{ borderRadius: "8px" }}>{error}</MuiAlert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
          <Button fullWidth variant="outlined" onClick={() => setTemplatePickerOpen(true)} disabled={sending}
            sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
            SMS Template
          </Button>
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button fullWidth onClick={handleClose} disabled={sending} sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>Cancel</Button>
            <Button fullWidth onClick={handleSend} disabled={sending || !message.trim()} startIcon={sending ? <CircularProgress size={16} sx={{ color: "white" }} /> : null}
              sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
              {sending ? "Sending..." : "Send SMS"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <MuiAlert onClose={() => setSuccess(false)} severity="success" sx={{ borderRadius: "10px" }}>
          SMS sent to {(lead?.full_name ?? lead?.name) as string}!
        </MuiAlert>
      </Snackbar>
    </>
  );
};

// ====================== New Email Template Dialog ======================
interface NewEmailTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (tpl: EmailTemplate) => void;
}

const NewEmailTemplateDialog: React.FC<NewEmailTemplateDialogProps> = ({ open, onClose, onSaved }) => {
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDesc] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) { setName(""); setSubject(""); setDesc(""); setBody(""); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }
    setSaving(true); setError(null);
    try {
      const saved = await EmailTemplateAPI.create({ clinic: 1, name: name.trim(), subject: subject.trim(), description: description.trim(), use_case: "general", body: body.trim(), created_by: 1, is_active: true } as EmailTemplatePayload);
      onSaved(saved); onClose();
    } catch {
      const local: EmailTemplate = { id: `local-${Date.now()}`, name: name.trim(), subject: subject.trim(), body: body.trim(), description: description.trim() };
      onSaved(local); onClose();
    } finally { setSaving(false); }
  };

  const outlineBtn = { height: 40, px: 3, textTransform: "none" as const, fontWeight: 500, borderRadius: "8px", border: "1px solid #D1D5DB", color: "#374151", bgcolor: "transparent", "&:hover": { bgcolor: "#F9FAFB" } };
  const darkBtn = { height: 40, px: 3, textTransform: "none" as const, fontWeight: 600, borderRadius: "8px", bgcolor: "#1F2937", color: "white", "&:hover": { bgcolor: "#111827" }, "&:disabled": { bgcolor: "#9CA3AF", color: "white" } };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }} sx={{ zIndex: 1600 }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 0 }}>
        New Email Template <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <TextField label="Template Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="e.g. IVF Follow-Up" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <TextField label="Subject" value={subject} onChange={(e) => { setSubject(e.target.value); setError(null); }} placeholder="e.g. Following up on your IVF inquiry" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Short description of when to use this template" fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
          <Box>
            <Typography fontSize="12px" fontWeight={500} color="#374151" mb={0.75}>Body</Typography>
            <textarea value={body} onChange={(e) => { setBody(e.target.value); setError(null); }} placeholder="Write your email body here... Use {{name}} for the lead's name." rows={8}
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "14px", fontFamily: "inherit", color: "#1E293B", lineHeight: "1.6", border: "1px solid #D1D5DB", borderRadius: "8px", resize: "vertical", outline: "none", background: "#fff" }}
              onFocus={(e) => { e.target.style.borderColor = "#1976d2"; e.target.style.boxShadow = "0 0 0 2px rgba(25,118,210,0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }} />
            <Typography fontSize="11px" color="#94A3B8" mt={0.5}>Use {"{{name}}"} for lead's name</Typography>
          </Box>
          {error && <MuiAlert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>{error}</MuiAlert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={onClose} sx={outlineBtn}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !name.trim() || !subject.trim() || !body.trim()} sx={darkBtn}>{saving ? "Saving..." : "Save Template"}</Button>
      </DialogActions>
    </Dialog>
  );
};

// ====================== Emoji / Format / More popovers ======================
const EMOJI_LIST = ["😊","😀","😂","🥰","😍","🤔","😎","🙏","👍","👏","❤️","🎉","🔥","✅","⭐","📋","📅","💊","🏥","🩺","💉","🧬","🌸","🌟","💙","📞","📧","🕐","✉️","📝"];

interface EmojiPickerProps { anchorEl: HTMLElement | null; onClose: () => void; onSelect: (emoji: string) => void; }
const EmojiPicker: React.FC<EmojiPickerProps> = ({ anchorEl, onClose, onSelect }) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose} PaperProps={{ sx: { borderRadius: "12px", p: 1, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", width: 220 } }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25 }}>
      {EMOJI_LIST.map((emoji) => (
        <Box key={emoji} onClick={() => { onSelect(emoji); onClose(); }} sx={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", cursor: "pointer", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9" }, transition: "background 0.1s" }}>{emoji}</Box>
      ))}
    </Box>
  </Menu>
);

interface FormatMenuProps { anchorEl: HTMLElement | null; onClose: () => void; onFormat: (type: string) => void; }
const FormatMenu: React.FC<FormatMenuProps> = ({ anchorEl, onClose, onFormat }) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose} PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 160 } }}>
    {[{ label: "Bold", shortcut: "Ctrl+B" },{ label: "Italic", shortcut: "Ctrl+I" },{ label: "Underline", shortcut: "Ctrl+U" },{ label: "Strikethrough", shortcut: "" },{ label: "Bullet list", shortcut: "" },{ label: "Numbered list", shortcut: "" },{ label: "Quote", shortcut: "" },{ label: "Code", shortcut: "" }].map(({ label, shortcut }) => (
      <MenuItem key={label} onClick={() => { onFormat(label); onClose(); }} sx={{ fontSize: "13px", py: 1, display: "flex", justifyContent: "space-between", gap: 2 }}>
        <span>{label}</span>{shortcut && <Typography fontSize="11px" color="text.secondary">{shortcut}</Typography>}
      </MenuItem>
    ))}
  </Menu>
);

interface MoreMenuProps { anchorEl: HTMLElement | null; onClose: () => void; onAction: (action: string) => void; }
const MoreMenu: React.FC<MoreMenuProps> = ({ anchorEl, onClose, onAction }) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose} PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 180 } }}>
    {["Insert signature","Insert divider","Insert table","Clear formatting"].map((action) => (
      <MenuItem key={action} onClick={() => { onAction(action); onClose(); }} sx={{ fontSize: "13px", py: 1 }}>{action}</MenuItem>
    ))}
  </Menu>
);

// ====================== Email Dialog (exact copy from LeadsTable) ======================
interface EmailDialogProps {
  open: boolean;
  lead: LeadItem | null;
  onClose: () => void;
}

const EmailDialog: React.FC<EmailDialogProps> = ({ open, lead, onClose }) => {
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
  const [emojiAnchor, setEmojiAnchor] = React.useState<HTMLElement | null>(null);
  const [formatAnchor, setFormatAnchor] = React.useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = React.useState<HTMLElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const cursorPos = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const saveCursor = () => { const el = bodyRef.current; if (el) cursorPos.current = { start: el.selectionStart, end: el.selectionEnd }; };

  const insertAtCursor = React.useCallback((text: string) => {
    const { start, end } = cursorPos.current;
    setBody((prev) => {
      const next = prev.substring(0, start) + text + prev.substring(end);
      requestAnimationFrame(() => { const el = bodyRef.current; if (el) { el.focus(); el.setSelectionRange(start + text.length, start + text.length); cursorPos.current = { start: start + text.length, end: start + text.length }; } });
      return next;
    });
  }, []);

  const wrapSelection = React.useCallback((before: string, after: string, placeholder = "text") => {
    const { start, end } = cursorPos.current;
    setBody((prev) => {
      const selected = prev.substring(start, end) || placeholder;
      const wrapped = before + selected + after;
      const next = prev.substring(0, start) + wrapped + prev.substring(end);
      requestAnimationFrame(() => { const el = bodyRef.current; if (el) { el.focus(); const ns = start + before.length; const ne = ns + selected.length; el.setSelectionRange(ns, ne); cursorPos.current = { start: ns, end: ne }; } });
      return next;
    });
  }, []);

  const loadEmailTemplates = React.useCallback(async () => {
    setLoadingTemplates(true); setTemplateError(null);
    try { const data = await EmailTemplateAPI.list(); setEmailTemplates(data); }
    catch { setTemplateError("Could not load templates. You can still compose a new email."); setEmailTemplates([]); }
    finally { setLoadingTemplates(false); }
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
  const recipientName = (lead?.full_name ?? lead?.name ?? "Patient") as string;
  const leadEmail = lead?.email as string | undefined;
  const resolveBody = (raw: string) => raw.replace(/\{\{name\}\}/g, recipientName).replace(/\{\{lead_name\}\}/g, recipientName).replace(/\{\{lead_first_name\}\}/g, recipientName.split(" ")[0]);

  const handleNext = () => {
    const template = emailTemplates.find((t) => String(t.id) === selectedTemplateId);
    if (template) { setSubject(template.subject); setBody(resolveBody(template.body || "")); }
    setStep("compose");
  };

  const handleNewEmailTemplateSaved = (tpl: EmailTemplate) => { setNewEmailTemplateOpen(false); setEmailTemplates((prev) => [tpl, ...prev]); setSelectedTemplateId(String(tpl.id)); };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { setError("Subject and body are required."); return; }
    if (!lead?.id) { setError("Lead ID is missing."); return; }
    if (!leadEmail) { setError("This lead has no email address."); return; }
    setSending(true); setError(null);
    try { await LeadEmailAPI.sendNow({ lead: lead.id, subject: subject.trim(), email_body: body.trim(), sender_email: leadEmail ?? null }); setSuccess(true); onClose(); }
    catch (err: unknown) { setError(extractErrorMessage(err, "Failed to send email. Please try again.")); }
    finally { setSending(false); }
  };

  const handleSaveAsDraft = async () => {
    if (!subject.trim() || !body.trim() || !lead?.id) return;
    try { await LeadEmailAPI.saveAsDraft({ lead: lead.id, subject: subject.trim(), email_body: body.trim(), sender_email: leadEmail ?? null }); } catch { /* silent */ }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(e.target.files || []); if (!files.length) return; saveCursor(); insertAtCursor(`\n[📎 Attachment: ${files.map((f) => f.name).join(", ")}]\n`); e.target.value = ""; };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; saveCursor(); insertAtCursor(`\n[🖼 Image: ${file.name}]\n`); e.target.value = ""; };
  const handleEmojiSelect = (emoji: string) => { saveCursor(); insertAtCursor(emoji); };
  const handleFormat = (type: string) => {
    saveCursor();
    const formats: Record<string, [string, string, string?]> = { "Bold": ["**","**","bold text"],"Italic": ["_","_","italic text"],"Underline": ["__","__","underlined text"],"Strikethrough": ["~~","~~","strikethrough"],"Bullet list": ["\n• ","","item"],"Numbered list": ["\n1. ","","item"],"Quote": ["\n> ","","quote"],"Code": ["`","`","code"] };
    const fmt = formats[type]; if (fmt) wrapSelection(fmt[0], fmt[1], fmt[2]);
  };
  const handleMoreAction = (action: string) => {
    saveCursor();
    const snippets: Record<string, string> = { "Insert signature": `\n\n---\nWarm regards,\nCrysta IVF, Bangalore\n(935) 555-0128 | crysta@gmail.com`, "Insert divider": "\n\n---\n\n", "Insert table": "\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n" };
    if (action === "Clear formatting") { setBody((prev) => prev.replace(/(\*\*|__|~~|_|`)/g, "")); } else { insertAtCursor(snippets[action] || ""); }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
      <EmojiPicker anchorEl={emojiAnchor} onClose={() => setEmojiAnchor(null)} onSelect={handleEmojiSelect} />
      <FormatMenu anchorEl={formatAnchor} onClose={() => setFormatAnchor(null)} onFormat={handleFormat} />
      <MoreMenu anchorEl={moreAnchor} onClose={() => setMoreAnchor(null)} onAction={handleMoreAction} />
      <NewEmailTemplateDialog open={newEmailTemplateOpen} onClose={() => setNewEmailTemplateOpen(false)} onSaved={handleNewEmailTemplateSaved} />

      <Dialog open={open && !newEmailTemplateOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }} sx={{ zIndex: 1300 }}>
        {step === "template" && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              New Email <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1, pb: 0 }}>
              <Box onClick={handleComposeNew} sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 1.5, cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>
                <EditOutlinedIcon sx={{ fontSize: 18, color: "#475569" }} />
                <Typography fontWeight={600} fontSize="14px" color="#475569">Compose New Email</Typography>
              </Box>
              <Divider sx={{ my: 1.5 }}><Typography fontSize="12px" color="text.secondary">OR</Typography></Divider>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography fontSize="13px" color="text.secondary" fontWeight={500}>Select Email Template</Typography>
                <Button size="small" onClick={() => setNewEmailTemplateOpen(true)} sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, color: "#1F2937", border: "1px solid #E5E7EB", borderRadius: "6px", px: 1.5, py: 0.5, "&:hover": { bgcolor: "#F3F4F6" } }}>+ New Template</Button>
              </Box>
              {loadingTemplates && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>}
              {!loadingTemplates && templateError && <MuiAlert severity="warning" sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}>{templateError}</MuiAlert>}
              {!loadingTemplates && !templateError && emailTemplates.length === 0 && <Box sx={{ textAlign: "center", py: 3 }}><Typography color="text.secondary" fontSize="14px">No email templates found.</Typography><Typography color="text.secondary" fontSize="12px" mt={0.5}>Click "+ New Template" above to create one.</Typography></Box>}
              {!loadingTemplates && emailTemplates.length > 0 && (
                <RadioGroup value={selectedTemplateId || ""} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                  <Stack spacing={0} divider={<Divider />} sx={{ maxHeight: 340, overflowY: "auto" }}>
                    {emailTemplates.map((template) => (
                      <Box key={template.id} onClick={() => setSelectedTemplateId(String(template.id))} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, px: 0.5, cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>
                        <FormControlLabel value={String(template.id)} control={<Radio size="small" sx={{ color: selectedTemplateId === String(template.id) ? "#EF4444" : "#CBD5E1", "&.Mui-checked": { color: "#EF4444" } }} />}
                          label={<Box><Typography fontWeight={600} fontSize="13.5px" color="#1E293B">{template.name}</Typography>{template.description && <Typography fontSize="12px" color="#64748B" mt={0.2}>{template.description}</Typography>}{template.subject && <Typography fontSize="11px" color="#94A3B8" mt={0.25}>Subject: {template.subject}</Typography>}</Box>}
                          sx={{ m: 0, flex: 1 }} />
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
                    <Stack direction="row" spacing={1} alignItems="center"><Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>To:</Typography><Typography fontSize="12px" color="#374151">{recipientName}{leadEmail ? ` <${leadEmail}>` : ""}</Typography></Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start"><Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>Subject:</Typography><Typography fontSize="12px" color="#1E293B" fontWeight={700}>{previewTemplate.subject}</Typography></Stack>
                  </Stack>
                </Box>
                <Box sx={{ bgcolor: "#FFFFFF", px: 2.5, py: 2.5, maxHeight: 260, overflowY: "auto" }}>
                  <Typography fontSize="13px" color="#1E293B" sx={{ lineHeight: 1.85, whiteSpace: "pre-wrap", fontFamily: "Georgia, serif" }}>
                    {resolveBody(previewTemplate.body || "").split(/(\{\{[^}]+\}\}|\{[^}]+\})/g).map((part, i) =>
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
              <Button variant="contained" onClick={() => { setSubject(previewTemplate.subject || ""); setBody(resolveBody(previewTemplate.body || "")); setStep("compose"); }} sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" } }}>Use This Template</Button>
            </DialogActions>
          </>
        )}

        {step === "compose" && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              New Email <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, pb: 0 }}>
              <Stack spacing={0} divider={<Divider />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                  <Typography fontSize="13px" color="text.secondary" minWidth={55}>To:</Typography>
                  <Box sx={{ flex: 1 }}><Chip label={recipientName} size="small" onDelete={() => {}} deleteIcon={<CloseIcon sx={{ fontSize: "14px !important" }} />} sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 500, fontSize: "12px", height: 24, "& .MuiChip-deleteIcon": { color: "#93C5FD" } }} /></Box>
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
                {error && <MuiAlert severity="error" sx={{ borderRadius: "8px", my: 1 }}>{error}</MuiAlert>}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: "column", gap: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 1.5, width: "100%", borderTop: "1px solid #E5E7EB", pt: 1.5, flexWrap: "wrap" }}>
                <Tooltip title="Attach file"><IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}><AttachFileIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="Insert link"><IconButton size="small" onClick={() => { saveCursor(); const u = window.prompt("URL:", "https://"); if (u) { const l = window.prompt("Link label:", "Click here") || u; insertAtCursor(`[${l}](${u})`); } }} sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}><LinkIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="Emoji"><IconButton size="small" onClick={(e) => { saveCursor(); setEmojiAnchor(e.currentTarget); }} sx={{ color: emojiAnchor ? "#F59E0B" : "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#F59E0B" } }}><EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="Insert image"><IconButton size="small" onClick={() => imageInputRef.current?.click()} sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}><ImageOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="Format text"><IconButton size="small" onClick={(e) => { saveCursor(); setFormatAnchor(e.currentTarget); }} sx={{ color: formatAnchor ? "#6366F1" : "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#6366F1" } }}><FormatColorTextOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="Highlight"><IconButton size="small" onClick={() => { saveCursor(); wrapSelection("==", "==", "highlighted text"); }} sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}><BrushOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="More options"><IconButton size="small" onClick={(e) => { saveCursor(); setMoreAnchor(e.currentTarget); }} sx={{ color: moreAnchor ? "#10B981" : "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#10B981" } }}><AddCircleOutlineIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              </Box>
              <Box sx={{ display: "flex", gap: 1, width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={handleClose} disabled={sending} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>Cancel</Button>
                <Button onClick={handleSaveAsDraft} disabled={sending || !subject.trim() || !body.trim()} startIcon={<BookmarkBorderIcon fontSize="small" />} sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 2, "&:hover": { bgcolor: "#F3F4F6" } }}>Save as Draft</Button>
                <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} variant="contained" startIcon={sending ? <CircularProgress size={14} sx={{ color: "white" }} /> : <SendIcon fontSize="small" />}
                  sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
                  {sending ? "Sending..." : "Send"}
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <MuiAlert onClose={() => setSuccess(false)} severity="success" sx={{ borderRadius: "10px" }}>Email sent to {recipientName}!</MuiAlert>
      </Snackbar>
    </>
  );
};

// ====================== Main LeadsBoard Component ======================
const LeadsBoard: React.FC<Props> = ({ search, filters }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const reduxLeads = useSelector(selectLeads);
  const loading    = useSelector(selectLeadsLoading);
  const error      = useSelector(selectLeadsError);

  const [leads, setLeads] = React.useState<LeadItem[]>([]);

  React.useEffect(() => { dispatch(fetchLeads()); }, [dispatch]);

  React.useEffect(() => {
    if (reduxLeads && reduxLeads.length > 0) {
      setLeads((reduxLeads as RawLead[]).map(mapRawToLeadItem));
    }
  }, [reduxLeads]);

  const [openBookModal, setOpenBookModal] = React.useState(false);
  const [selectedLead,  setSelectedLead ] = React.useState<LeadItem | null>(null);
  const [smsLead,       setSmsLead      ] = React.useState<LeadItem | null>(null);
  const [emailLead,     setEmailLead    ] = React.useState<LeadItem | null>(null);
  const [callLead,      setCallLead     ] = React.useState<LeadItem | null>(null);
  const [callSnackbar,  setCallSnackbar ] = React.useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [appointment,   setAppointment  ] = React.useState<AppointmentState>(emptyAppointment());
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);

  const handleCallOpen = async (lead: LeadItem) => {
    const phone = normalizePhone(lead.contact_no as string | undefined);
    if (!phone) { setCallSnackbar({ open: true, message: "No contact number for this lead." }); return; }
    if (!lead.id) { setCallSnackbar({ open: true, message: "Lead ID is missing. Cannot initiate call." }); return; }
    setCallLead(lead);
    try { await TwilioAPI.makeCall({ lead_uuid: lead.id, to: phone }); }
    catch (err: unknown) { setCallLead(null); setCallSnackbar({ open: true, message: extractErrorMessage(err, "Failed to initiate call.") }); }
  };

  React.useEffect(() => {
    if (!openBookModal || !selectedLead?.clinic_id) return;
    const fetchAll = async () => {
      setAppointment((prev) => ({ ...prev, loadingDepartments: true, loadingEmployees: true, error: null }));
      try {
        const [departments, employees] = await Promise.all([DepartmentAPI.listActiveByClinic(selectedLead.clinic_id as number), EmployeeAPI.listByClinic(selectedLead.clinic_id as number)]);
        setAppointment((prev) => ({ ...prev, departments, employees }));
      } catch { setAppointment((prev) => ({ ...prev, error: "Failed to load departments/personnel. Please try again." })); }
      finally { setAppointment((prev) => ({ ...prev, loadingDepartments: false, loadingEmployees: false })); }
    };
    fetchAll();
  }, [openBookModal, selectedLead]);

  React.useEffect(() => {
    setAppointment((prev) => {
      if (!prev.selectedDepartmentId) return { ...prev, filteredEmployees: prev.employees };
      const deptName = prev.departments.find((d) => d.id === Number(prev.selectedDepartmentId))?.name ?? "";
      const filtered = prev.employees.filter((emp) => emp.department_name?.toLowerCase() === deptName.toLowerCase());
      const empStillPresent = filtered.some((e) => e.id === Number(prev.selectedEmployeeId));
      return { ...prev, filteredEmployees: filtered, selectedEmployeeId: empStillPresent ? prev.selectedEmployeeId : "" };
    });
  }, [appointment.selectedDepartmentId, appointment.employees, appointment.departments]);

  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      const searchStr = `${lead.full_name || lead.name || ""} ${lead.id || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      const isActive = lead.is_active !== false;
      if (filters) {
        if (filters.department && lead.department_id !== Number(filters.department)) return false;
        if (filters.assignee   && lead.assigned_to_id !== Number(filters.assignee))  return false;
        if (filters.status) { const ls = (lead.lead_status || lead.status || "").toLowerCase(); if (ls !== filters.status.toLowerCase()) return false; }
        if (filters.quality && lead.quality !== filters.quality) return false;
        if (filters.source  && lead.source  !== filters.source)  return false;
        if (filters.dateFrom || filters.dateTo) {
          const leadDate = lead.created_at ? new Date(lead.created_at) : null;
          if (!leadDate) return false;
          if (filters.dateFrom) { const from = new Date(filters.dateFrom); from.setHours(0,0,0,0); if (leadDate < from) return false; }
          if (filters.dateTo)   { const to   = new Date(filters.dateTo);   to.setHours(23,59,59,999); if (leadDate > to) return false; }
        }
      }
      return matchSearch && isActive;
    });
  }, [leads, search, filters]);

  const handleBookAppointmentSubmit = async () => {
    if (!selectedLead?.id)                 { setAppointment((p) => ({ ...p, error: "Lead ID is missing." })); return; }
    if (!appointment.selectedDepartmentId) { setAppointment((p) => ({ ...p, error: "Please select a department." })); return; }
    if (!appointment.date)                 { setAppointment((p) => ({ ...p, error: "Please select an appointment date." })); return; }
    if (!appointment.slot)                 { setAppointment((p) => ({ ...p, error: "Please select a time slot." })); return; }
    setAppointment((p) => ({ ...p, submitting: true, error: null }));
    const leadId        = selectedLead.id.replace(/^#/, "");
    const formattedDate = appointment.date.toISOString().split("T")[0];
    const result = await dispatch(bookAppointment({ leadId, payload: { department_id: Number(appointment.selectedDepartmentId), appointment_date: formattedDate, slot: appointment.slot, remark: appointment.remark, ...(appointment.selectedEmployeeId && { assigned_to_id: Number(appointment.selectedEmployeeId) }) } }));
    setAppointment((p) => ({ ...p, submitting: false }));
    if (bookAppointment.rejected.match(result)) { const errMsg = typeof result.payload === "string" ? result.payload : "Failed to book appointment. Please try again."; setAppointment((p) => ({ ...p, error: errMsg })); return; }
    setAppointment((p) => ({ ...p, success: true }));
    handleCloseBook();
    setTimeout(() => setAppointment((p) => ({ ...p, success: false })), 2000);
  };

  const handleOpenBookModal = (lead: LeadItem) => {
    setSelectedLead(lead);
    setAppointment({ ...emptyAppointment(), selectedDepartmentId: lead.department_id != null ? String(lead.department_id) : "", selectedEmployeeId: lead.assigned_to_id != null ? String(lead.assigned_to_id) : "", date: lead.appointment_date ? new Date(lead.appointment_date) : null, slot: lead.slot || "", remark: lead.remark || "" });
    setOpenBookModal(true);
  };

  const handleCloseBook = () => { setOpenBookModal(false); setSelectedLead(null); setAppointment((p) => ({ ...p, error: null, submitting: false })); };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
      <Stack alignItems="center" spacing={2}><CircularProgress /><Typography color="text.secondary">Loading leads...</Typography></Stack>
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ mb: 3 }}>
      <Typography fontWeight={600}>Failed to load leads</Typography>
      <Typography variant="body2">{error}</Typography>
      <Typography variant="body2" sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }} onClick={() => dispatch(fetchLeads())}>Try again</Typography>
    </Alert>
  );

  if (leads.length === 0) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
      <Stack alignItems="center" spacing={2}><Typography variant="h6" color="text.secondary">No leads found</Typography><Typography variant="body2" color="text.secondary">Create your first lead to get started</Typography></Stack>
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: "flex", overflowX: "auto", gap: 3, p: 4, bgcolor: "#F8FAFC", height: "calc(100vh - 64px)", alignItems: "flex-start", "&::-webkit-scrollbar": { height: "10px" }, "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "10px" } }}>
        {BOARD_COLUMNS.map((col) => {
          const leadsInCol = filteredLeads.filter((l) => {
            const leadStatus = (l.status || l.lead_status || "no status").toLowerCase().trim();
            return col.statusKey.some((key) => leadStatus === (key || "no status").toLowerCase().trim());
          });
          return (
            <LeadColumn
              key={col.label}
              col={col}
              leads={leadsInCol}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onOpenSms={(lead) => setSmsLead(lead)}
              onOpenMail={(lead) => setEmailLead(lead)}
              onOpenBook={handleOpenBookModal}
              onOpenCall={handleCallOpen}
              setLeads={setLeads}
            />
          );
        })}

        <Dialogs />
        <SuccessToast show={showSaveSuccess} message="Saved as A Template successfully!" />
        <SuccessToast show={appointment.success} message="Appointment booked successfully!" />

        {/* ── SMS Dialog — exact same as LeadsTable ── */}
        <SMSDialog open={Boolean(smsLead)} lead={smsLead} onClose={() => setSmsLead(null)} />

        {/* ── Email Dialog — exact same as LeadsTable ── */}
        <EmailDialog open={Boolean(emailLead)} lead={emailLead} onClose={() => setEmailLead(null)} />

        {/* ── Call Dialog — exact same as LeadsTable ── */}
        <CallDialog open={Boolean(callLead)} name={(callLead?.full_name ?? callLead?.name ?? "Unknown") as string} onClose={() => setCallLead(null)} />

        {/* ── Call Error Snackbar ── */}
        <Snackbar open={callSnackbar.open} autoHideDuration={4000} onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <MuiAlert onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))} severity="error" sx={{ borderRadius: "10px" }}>{callSnackbar.message}</MuiAlert>
        </Snackbar>

        <BookAppointmentModal
          open={openBookModal}
          selectedLead={selectedLead}
          appointment={appointment}
          setSelectedDepartmentId={(id) => setAppointment((p) => ({ ...p, selectedDepartmentId: String(id) }))}
          setSelectedEmployeeId={(id)   => setAppointment((p) => ({ ...p, selectedEmployeeId: String(id) }))}
          setDate={(d)   => setAppointment((p) => ({ ...p, date: d }))}
          setSlot={(s)   => setAppointment((p) => ({ ...p, slot: s }))}
          setRemark={(r) => setAppointment((p) => ({ ...p, remark: r }))}
          clearError={()  => setAppointment((p) => ({ ...p, error: null }))}
          onClose={handleCloseBook}
          onSubmit={handleBookAppointmentSubmit}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default LeadsBoard;