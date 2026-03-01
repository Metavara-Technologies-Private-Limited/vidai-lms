import * as React from "react";
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  MenuItem,
  Menu,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
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

import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import "../../styles/Leads/leads.css";
import type { FilterValues } from "../../types/leads.types";
import { MenuButton, Dialogs } from "./LeadsMenuDialogs";
import BulkActionBar from "./BulkActionBar";
import { TwilioAPI, LeadEmailAPI, EmailTemplateAPI } from "../../services/leads.api";
import type { EmailTemplate } from "../../services/leads.api";
import TemplateService from "../../services/templates.api";
import CallDialog from "./CallDialog";

// ====================== Types ======================
interface RawLead {
  id: string;
  full_name?: string;
  name?: string;
  contact_no?: string;
  email?: string;
  assigned_to_id?: number;
  assigned_to_name?: string;
  next_action_description?: string;
  next_action_status?: string;
  next_action_type?: string;
  task_type?: string;
  nextActionType?: string;
  taskType?: string;
  action_type?: string;
  status?: string;
  lead_status?: string;
  is_active?: boolean;
  created_at?: string;
  location?: string;
  source?: string;
  score?: number | string;
  activity?: string;
  initials?: string;
  department_id?: number;
}

interface ProcessedLead extends RawLead {
  assigned: string;
  quality: "Hot" | "Warm" | "Cold";
  displayId: string;
  taskType: string;
  taskStatus: string;
}

interface Props {
  search: string;
  tab: "active" | "archived";
  filters?: FilterValues;
}

interface ApiErrorShape {
  response?: { data?: { detail?: string; message?: string } };
  message?: string;
}
const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  return (
    e?.response?.data?.detail ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

const rowsPerPage = 10;

// ====================== Sticky column styles ======================
const stickyContactStyle = {
  position: "sticky" as const,
  right: 48,
  zIndex: 2,
  bgcolor: "#FFFFFF",
};
const stickyMenuStyle = {
  position: "sticky" as const,
  right: 0,
  zIndex: 2,
  bgcolor: "#FFFFFF",
};
const stickyHeaderContactStyle = {
  position: "sticky" as const,
  right: 48,
  zIndex: 3,
  bgcolor: "#F8FAFC",
};
const stickyHeaderMenuStyle = {
  position: "sticky" as const,
  right: 0,
  zIndex: 3,
  bgcolor: "#F8FAFC",
};

// ====================== Phone normalizer ======================
const normalizePhone = (phone: string | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return `+${cleaned}`;
};

// ====================== Helpers ======================
const deriveQuality = (lead: RawLead): "Hot" | "Warm" | "Cold" => {
  const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
  const hasNextAction = Boolean(lead.next_action_description?.trim());
  const nextActionPending = lead.next_action_status === "pending";
  if (hasAssignee && hasNextAction && nextActionPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

const formatLeadId = (id: string): string => {
  if (id.match(/^#?LN-\d+$/i)) return id.startsWith("#") ? id : `#${id}`;
  const lnMatch = id.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = id.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#LN-${(hash % 900) + 100}`;
};

const formatStatus = (status: string): string => {
  if (!status) return "New";
  const lower = status.toLowerCase().trim();
  const map: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    converted: "Converted",
    "follow up": "Follow Up",
    "follow-up": "Follow Up",
    "follow-ups": "Follow Up",
    follow_up: "Follow Up",
    appointment: "Appointment",
    lost: "Lost",
    "cycle conversion": "Cycle Conversion",
    cycle_conversion: "Cycle Conversion",
  };
  return map[lower] ?? lower.charAt(0).toUpperCase() + lower.slice(1);
};

const getStatusChipSx = (status: string) => {
  const lower = (status || "").toLowerCase();
  const map: Record<string, { bg: string; color: string }> = {
    converted: { bg: "rgba(22,163,74,0.10)", color: "#16A34A" },
    appointment: { bg: "rgba(16,185,129,0.10)", color: "#10B981" },
    "follow up": { bg: "rgba(245,158,11,0.10)", color: "#F59E0B" },
    new: { bg: "rgba(59,130,246,0.10)", color: "#3B82F6" },
    contacted: { bg: "rgba(99,102,241,0.10)", color: "#6366F1" },
    lost: { bg: "rgba(239,68,68,0.10)", color: "#EF4444" },
    "cycle conversion": { bg: "rgba(139,92,246,0.10)", color: "#8B5CF6" },
  };
  const s = map[lower] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
  return {
    borderRadius: "999px",
    fontWeight: 500,
    fontSize: "11px",
    height: 22,
    border: "1.5px solid",
    borderColor: s.color,
    backgroundColor: s.bg,
    color: s.color,
    "& .MuiChip-label": { px: 1 },
  };
};

const getTaskStatusChipSx = (status: string) => {
  const lower = (status || "").toLowerCase();
  if (lower === "done" || lower === "completed")
    return {
      borderRadius: "6px",
      fontWeight: 700,
      fontSize: "11px",
      height: 26,
      border: "2px solid #10B981",
      backgroundColor: "transparent",
      color: "#10B981",
      "& .MuiChip-label": { px: 1.5 },
    };
  if (lower === "to do" || lower === "todo" || lower === "pending")
    return {
      borderRadius: "6px",
      fontWeight: 700,
      fontSize: "11px",
      height: 26,
      border: "2px solid #3B82F6",
      backgroundColor: "transparent",
      color: "#3B82F6",
      "& .MuiChip-label": { px: 1.5 },
    };
  if (lower === "overdue")
    return {
      borderRadius: "6px",
      fontWeight: 700,
      fontSize: "11px",
      height: 26,
      border: "2px solid #EF4444",
      backgroundColor: "transparent",
      color: "#EF4444",
      "& .MuiChip-label": { px: 1.5 },
    };
  return {
    borderRadius: "6px",
    fontWeight: 600,
    fontSize: "11px",
    height: 26,
    border: "2px solid #94A3B8",
    backgroundColor: "transparent",
    color: "#64748B",
    "& .MuiChip-label": { px: 1.5 },
  };
};

const formatTaskStatus = (
  nextActionStatus: string | null | undefined,
  taskType: string | null | undefined,
): string => {
  if (taskType === "Book Appointment") return "Done";
  const s = (nextActionStatus || "").toLowerCase();
  if (s === "completed") return "Done";
  if (s === "pending") return "To Do";
  return "";
};

const VALID_TASK_TYPES = [
  "Follow Up",
  "Call Patient",
  "Book Appointment",
  "Send Message",
  "Send Email",
  "Review Details",
  "No Action",
];

const formatTaskType = (raw: string | null | undefined): string => {
  if (!raw || raw.trim() === "") return "";
  const trimmed = raw.trim();
  if (VALID_TASK_TYPES.includes(trimmed)) return trimmed;
  const found = VALID_TASK_TYPES.find(
    (p) => p.toLowerCase() === trimmed.toLowerCase(),
  );
  return found ?? trimmed;
};

// ====================== SMS Template type ======================
interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  use_case?: string;
}

// ====================== Use Case options ======================
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
    color: s.color,
    bgcolor: s.bg,
    fontWeight: 600,
    fontSize: "11px",
    height: 22,
    borderRadius: "4px",
    "& .MuiChip-label": { px: 1 },
  };
};

// ====================== New SMS Template Dialog ======================
interface NewSMSTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (template: SMSTemplate) => void;
}

type TemplateFormView = "form" | "preview";

const USE_CASE_BODY_SUGGESTIONS: Record<string, string> = {
  Appointment:
    "Hi {lead_first_name}, your appointment at {clinic_name} is on {appointment_date} at {appointment_time}. Reply YES to confirm.",
  Feedback:
    "Hi {lead_first_name}, we'd love to hear about your experience at {clinic_name}. Please share your feedback: {feedback_link}",
  Reminder:
    "Hi {lead_first_name}, this is a reminder for your appointment on {appointment_date} at {appointment_time} at {clinic_name}.",
  "Follow-Up":
    "Hi {lead_first_name}, thank you for visiting {clinic_name}. How are you feeling? Reply to this message if you need any assistance.",
  "Re-engagement":
    "Hi {lead_first_name}, we miss you at {clinic_name}! It's been a while. Would you like to schedule a visit? Reply YES to book.",
  "No-Show":
    "Hi {lead_first_name}, we noticed you missed your appointment at {clinic_name}. Would you like to reschedule? Reply to this message.",
  General: "Hi {lead_first_name}, ",
};

const NewSMSTemplateDialog: React.FC<NewSMSTemplateDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
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
      setView("form");
      setName("");
      setUseCase("");
      setBody("");
      setError(null);
      setDropdownAnchor(null);
    }
  }, [open]);

  const handleSelectUseCase = (uc: string) => {
    setUseCase(uc);
    setDropdownAnchor(null);
    if (!body.trim()) {
      setBody(USE_CASE_BODY_SUGGESTIONS[uc] || "");
    }
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
    setSaving(true);
    setError(null);
    try {
      const payload = {
        clinic: 1,
        name: name.trim(),
        use_case: useCase.toLowerCase() || "general",
        body: body.trim(),
        created_by: 1,
        is_active: true,
      };
      let saved: SMSTemplate | null = null;
      try {
        saved = await TemplateService.createTemplate("sms", payload);
      } catch {
        saved = {
          id: `local-${Date.now()}`,
          name: name.trim(),
          use_case: useCase,
          body: body.trim(),
        };
      }
      onSaved(saved!);
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to save template."));
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
      sx={{ zIndex: 1500 }}
    >
      {view === "form" && (
        <>
          <DialogTitle sx={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 0,
          }}>
            New SMS Template
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="e.g. Appointment Confirmation"
                fullWidth
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
              />

              <Box>
                <Typography fontSize="12px" fontWeight={500} color="#374151" mb={0.75}>
                  Use Case
                </Typography>
                <Box
                  onClick={(e) => setDropdownAnchor(e.currentTarget)}
                  sx={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid", borderColor: dropdownOpen ? "#1976d2" : "#D1D5DB",
                    borderRadius: "8px", px: 1.5, cursor: "pointer",
                    minHeight: 40, bgcolor: "#fff",
                    boxShadow: dropdownOpen ? "0 0 0 2px rgba(25,118,210,0.15)" : "none",
                    "&:hover": { borderColor: "#9CA3AF" },
                    transition: "all 0.15s",
                  }}
                >
                  {useCase ? (
                    <Chip label={useCase} size="small" sx={getUseCaseChipSx(useCase)} />
                  ) : (
                    <Typography fontSize="14px" color="#9CA3AF" sx={{ py: 1 }}>
                      Select use case
                    </Typography>
                  )}
                  <Typography sx={{
                    fontSize: "12px", color: "#6B7280", ml: 1,
                    transform: dropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s", userSelect: "none",
                  }}>▼</Typography>
                </Box>

                <Menu
                  anchorEl={dropdownAnchor}
                  open={dropdownOpen}
                  onClose={() => setDropdownAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  disablePortal={false}
                  PaperProps={{
                    sx: {
                      borderRadius: "10px",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                      mt: 0.5,
                      minWidth: 240,
                    },
                  }}
                  sx={{ zIndex: 99999 }}
                >
                  {USE_CASE_OPTIONS.map((uc) => (
                    <MenuItem
                      key={uc}
                      selected={useCase === uc}
                      onClick={() => handleSelectUseCase(uc)}
                      sx={{
                        py: 1, px: 1.5,
                        "&.Mui-selected": { bgcolor: "#F1F5F9" },
                        "&:hover": { bgcolor: "#F8FAFC" },
                      }}
                    >
                      <Chip label={uc} size="small" sx={getUseCaseChipSx(uc)} />
                    </MenuItem>
                  ))}
                </Menu>
              </Box>

              <Box>
                <Typography fontSize="12px" fontWeight={500} color="#374151" mb={0.75}>
                  Body
                </Typography>
                <textarea
                  value={body}
                  onChange={(e) => { setBody(e.target.value); setError(null); }}
                  placeholder="Type your message here..."
                  maxLength={1600}
                  rows={6}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    color: "#1E293B",
                    lineHeight: "1.6",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    resize: "vertical",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    background: "#fff",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1976d2";
                    e.target.style.boxShadow = "0 0 0 2px rgba(25,118,210,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#D1D5DB";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <Typography fontSize="11px" color="#94A3B8" mt={0.5}>
                  {body.length}/1600 — Use {"{variable_name}"} for dynamic fields
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>
                  {error}
                </Alert>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
            <Button onClick={onClose} sx={outlineBtn}>Cancel</Button>
            <Button onClick={handlePreview} sx={outlineBtn}>Preview</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !body.trim()}
              sx={darkBtn}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </>
      )}

      {view === "preview" && (
        <>
          <DialogTitle sx={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 0,
          }}>
            Preview Template
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <Typography fontSize="13px" color="#64748B">Template:</Typography>
              <Typography fontSize="13px" fontWeight={600} color="#1E293B">{name}</Typography>
              {useCase && (
                <Chip label={useCase} size="small" sx={getUseCaseChipSx(useCase)} />
              )}
            </Stack>

            <Box sx={{
              bgcolor: "#F8FAFC", border: "1px solid #E2E8F0",
              borderRadius: "12px", p: 2, minHeight: 160,
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
            }}>
              <Box sx={{
                alignSelf: "flex-start", bgcolor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "0px 12px 12px 12px",
                px: 2, py: 1.25, maxWidth: "90%",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <Typography fontSize="13px" color="#1E293B"
                  sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {body.split(/(\{[^}]+\})/g).map((part, i) =>
                    /^\{[^}]+\}$/.test(part) ? (
                      <Box key={i} component="span"
                        sx={{ color: "#4F46E5", fontWeight: 600 }}>{part}</Box>
                    ) : part
                  )}
                </Typography>
              </Box>
              <Typography fontSize="11px" color="#94A3B8"
                sx={{ mt: 0.75, alignSelf: "flex-end" }}>
                {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
            <Button onClick={() => setView("form")} sx={outlineBtn}>Back to Edit</Button>
            <Button onClick={handleSave} disabled={saving} sx={darkBtn}>
              {saving ? "Saving..." : "Save"}
            </Button>
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

const SMSTemplatePicker: React.FC<SMSTemplatePickerProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [templates, setTemplates] = React.useState<SMSTemplate[]>([]);
  const [loadingTpl, setLoadingTpl] = React.useState(false);
  const [view, setView] = React.useState<"list" | "preview">("list");
  const [selected, setSelected] = React.useState<SMSTemplate | null>(null);
  const [previewBody, setPreviewBody] = React.useState("");
  const [newTemplateOpen, setNewTemplateOpen] = React.useState(false);

  const loadTemplates = React.useCallback(() => {
    setLoadingTpl(true);
    (TemplateService as any).getTemplates("sms")
      .then((data: SMSTemplate[]) => setTemplates(data || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTpl(false));
  }, []);

  React.useEffect(() => {
    if (!open) {
      setView("list");
      setSelected(null);
      setPreviewBody("");
      return;
    }
    loadTemplates();
  }, [open, loadTemplates]);

  const handlePickTemplate = (tpl: SMSTemplate) => {
    setSelected(tpl);
    setPreviewBody(tpl.body);
    setView("preview");
  };

  const handleSave = () => {
    onSelect(previewBody);
    onClose();
  };

  const [savedSnackbar, setSavedSnackbar] = React.useState(false);

  const handleNewTemplateSaved = (tpl: SMSTemplate) => {
    setNewTemplateOpen(false);
    onSelect(tpl.body);
    setSavedSnackbar(true);
    onClose();
  };

  return (
    <>
      <NewSMSTemplateDialog
        open={newTemplateOpen}
        onClose={() => setNewTemplateOpen(false)}
        onSaved={handleNewTemplateSaved}
      />

      <Snackbar
        open={savedSnackbar}
        autoHideDuration={3000}
        onClose={() => setSavedSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSavedSnackbar(false)} severity="success" sx={{ borderRadius: "10px" }}>
          Template saved and applied to your message!
        </Alert>
      </Snackbar>

      <Dialog
        open={open && !newTemplateOpen}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
        sx={{ zIndex: 1300 }}
      >
        {view === "list" && (
          <>
            <DialogTitle sx={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 1,
            }}>
              Select SMS Template
              <IconButton size="small" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, pb: 0 }}>
              {loadingTpl ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : templates.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.secondary" fontSize="14px">
                    No SMS templates found.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding sx={{ maxHeight: 340, overflowY: "auto" }}>
                  {templates.map((tpl, idx) => (
                    <React.Fragment key={tpl.id}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => handlePickTemplate(tpl)}
                          sx={{ borderRadius: "8px", px: 1.5, py: 1.25, "&:hover": { bgcolor: "#F8FAFC" } }}
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography fontSize="14px" fontWeight={600} color="#1E293B">
                                  {tpl.name}
                                </Typography>
                                {tpl.use_case && (
                                  <Chip label={tpl.use_case} size="small" sx={getUseCaseChipSx(tpl.use_case)} />
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
            <DialogTitle sx={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 1,
            }}>
              Preview Template
              <IconButton size="small" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Stack spacing={2}>
                {selected && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontSize="13px" color="#64748B">Template:</Typography>
                    <Typography fontSize="13px" fontWeight={600} color="#1E293B">{selected.name}</Typography>
                    {selected.use_case && (
                      <Chip label={selected.use_case} size="small" sx={getUseCaseChipSx(selected.use_case)} />
                    )}
                  </Stack>
                )}

                <Box sx={{
                  bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", p: 2,
                  minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "flex-end",
                }}>
                  <Box sx={{
                    alignSelf: "flex-start", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0",
                    borderRadius: "0px 12px 12px 12px", px: 2, py: 1.25, maxWidth: "90%",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}>
                    <Typography fontSize="13px" color="#1E293B" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {previewBody.split(/(\{[^}]+\})/g).map((part, i) =>
                        /^\{[^}]+\}$/.test(part) ? (
                          <Box key={i} component="span" sx={{ color: "#4F46E5", fontWeight: 500 }}>{part}</Box>
                        ) : part
                      )}
                    </Typography>
                  </Box>
                  <Typography fontSize="11px" color="#94A3B8" sx={{ mt: 0.75, alignSelf: "flex-end" }}>
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </Typography>
                </Box>

                <TextField
                  label="Edit message before sending"
                  multiline rows={4}
                  value={previewBody}
                  onChange={(e) => setPreviewBody(e.target.value)}
                  inputProps={{ maxLength: 1600 }}
                  helperText={`${previewBody.length}/1600`}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button fullWidth onClick={() => setView("list")}
                sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
                Back to Edit
              </Button>
              <Button fullWidth onClick={handleSave} disabled={!previewBody.trim()}
                sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
                Use Template
              </Button>
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

const SMSDialog: React.FC<SMSDialogProps> = ({ open, lead, onClose }) => {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = React.useState(false);

  const handleClose = () => {
    if (sending) return;
    setMessage("");
    setError(null);
    onClose();
  };

  const handleSend = async () => {
    if (!message.trim()) { setError("Message cannot be empty."); return; }
    const phone = normalizePhone(lead?.contact_no);
    if (!phone) { setError("This lead has no contact number."); return; }
    if (!lead?.id) { setError("Lead ID is missing. Cannot send SMS."); return; }
    setSending(true);
    setError(null);
    try {
      await TwilioAPI.sendSMS({ lead_uuid: lead.id, to: phone, message: message.trim() });
      setSuccess(true);
      setMessage("");
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to send SMS. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SMSTemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={(body) => setMessage(body)}
      />

      <Dialog
        open={open && !templatePickerOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1 }}>
          Send SMS
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Box sx={{ backgroundColor: "#F8FAFC", borderRadius: "10px", px: 2, py: 1.5, border: "1px solid #E2E8F0" }}>
              <Typography variant="body2" color="text.secondary" fontSize="12px">Sending to</Typography>
              <Typography fontWeight={600} fontSize="14px">{lead?.full_name || lead?.name || "Unknown"}</Typography>
              <Typography color="text.secondary" fontSize="13px">{lead?.contact_no || "No number"}</Typography>
            </Box>

            <TextField
              label="Message" multiline rows={4}
              value={message} onChange={(e) => setMessage(e.target.value)}
              disabled={sending} placeholder="Type your message here..."
              inputProps={{ maxLength: 1600 }} helperText={`${message.length}/1600`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />

            {error && <Alert severity="error" sx={{ borderRadius: "8px" }}>{error}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 0, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
          <Button fullWidth variant="outlined" onClick={() => setTemplatePickerOpen(true)} disabled={sending}
            sx={{ height: 44, textTransform: "none", fontSize: "14px", fontWeight: 500, borderRadius: "8px", borderColor: "#D1D5DB", color: "#374151", "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" } }}>
            SMS Template
          </Button>
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button fullWidth onClick={handleClose} disabled={sending}
              sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSend} disabled={sending || !message.trim()}
              startIcon={sending ? <CircularProgress size={16} sx={{ color: "white" }} /> : null}
              sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
              {sending ? "Sending..." : "Send SMS"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ borderRadius: "10px" }}>
          SMS sent to {lead?.full_name || lead?.name}!
        </Alert>
      </Snackbar>
    </>
  );
};

// ====================== New Email Template Dialog ======================
interface NewEmailTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (template: EmailTemplate) => void;
}

const NewEmailTemplateDialog: React.FC<NewEmailTemplateDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setName(""); setSubject(""); setDescription(""); setBody(""); setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const saved = await EmailTemplateAPI.create({
        clinic: 1,
        name: name.trim(),
        subject: subject.trim(),
        description: description.trim(),
        use_case: "general",
        body: body.trim(),
        created_by: 1,
        is_active: true,
      });
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      // Fallback: treat as local template so the user can still use it
      const local: EmailTemplate = {
        id: `local-${Date.now()}`,
        name: name.trim(),
        subject: subject.trim(),
        description: description.trim(),
        body: body.trim(),
      };
      onSaved(local);
      onClose();
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
      sx={{ zIndex: 1600 }}
    >
      <DialogTitle sx={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", fontWeight: 700, fontSize: "1.05rem", pb: 0,
      }}>
        New Email Template
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Template Name" value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="e.g. IVF Follow-Up"
            fullWidth size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <TextField
            label="Subject" value={subject}
            onChange={(e) => { setSubject(e.target.value); setError(null); }}
            placeholder="e.g. Following up on your IVF inquiry"
            fullWidth size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <TextField
            label="Description (optional)" value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of when to use this template"
            fullWidth size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <Box>
            <Typography fontSize="12px" fontWeight={500} color="#374151" mb={0.75}>Body</Typography>
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); setError(null); }}
              placeholder="Write your email body here... Use {{name}} for the lead's name."
              rows={8}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", fontSize: "14px",
                fontFamily: "inherit", color: "#1E293B",
                lineHeight: "1.6", border: "1px solid #D1D5DB",
                borderRadius: "8px", resize: "vertical",
                outline: "none", background: "#fff",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1976d2";
                e.target.style.boxShadow = "0 0 0 2px rgba(25,118,210,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D1D5DB";
                e.target.style.boxShadow = "none";
              }}
            />
            <Typography fontSize="11px" color="#94A3B8" mt={0.5}>
              Use {"{{name}}"} for lead's name
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={onClose} sx={outlineBtn}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim() || !subject.trim() || !body.trim()}
          sx={darkBtn}
        >
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ====================== Emoji Picker Popover ======================
const EMOJI_LIST = [
  "😊","😀","😂","🥰","😍","🤔","😎","🙏","👍","👏",
  "❤️","🎉","🔥","✅","⭐","📋","📅","💊","🏥","🩺",
  "💉","🧬","🌸","🌟","💙","📞","📧","🕐","✉️","📝",
];

interface EmojiPickerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ anchorEl, onClose, onSelect }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    PaperProps={{
      sx: { borderRadius: "12px", p: 1, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", width: 220 },
    }}
  >
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25 }}>
      {EMOJI_LIST.map((emoji) => (
        <Box
          key={emoji}
          onClick={() => { onSelect(emoji); onClose(); }}
          sx={{
            width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", cursor: "pointer", borderRadius: "6px",
            "&:hover": { bgcolor: "#F1F5F9" }, transition: "background 0.1s",
          }}
        >
          {emoji}
        </Box>
      ))}
    </Box>
  </Menu>
);

// ====================== Format Menu Popover ======================
interface FormatMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onFormat: (type: string) => void;
}

const FormatMenu: React.FC<FormatMenuProps> = ({ anchorEl, onClose, onFormat }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 160 } }}
  >
    {[
      { label: "Bold", wrap: ["**", "**"], shortcut: "Ctrl+B" },
      { label: "Italic", wrap: ["_", "_"], shortcut: "Ctrl+I" },
      { label: "Underline", wrap: ["__", "__"], shortcut: "Ctrl+U" },
      { label: "Strikethrough", wrap: ["~~", "~~"], shortcut: "" },
      { label: "Bullet list", wrap: ["\n• ", ""], shortcut: "" },
      { label: "Numbered list", wrap: ["\n1. ", ""], shortcut: "" },
      { label: "Quote", wrap: ["\n> ", ""], shortcut: "" },
      { label: "Code", wrap: ["`", "`"], shortcut: "" },
    ].map(({ label, shortcut }) => (
      <MenuItem
        key={label}
        onClick={() => { onFormat(label); onClose(); }}
        sx={{ fontSize: "13px", py: 1, display: "flex", justifyContent: "space-between", gap: 2 }}
      >
        <span>{label}</span>
        {shortcut && <Typography fontSize="11px" color="text.secondary">{shortcut}</Typography>}
      </MenuItem>
    ))}
  </Menu>
);

// ====================== More Menu Popover ======================
interface MoreMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onAction: (action: string) => void;
}

const MoreMenu: React.FC<MoreMenuProps> = ({ anchorEl, onClose, onAction }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 180 } }}
  >
    {["Insert signature", "Insert divider", "Insert table", "Clear formatting"].map((action) => (
      <MenuItem
        key={action}
        onClick={() => { onAction(action); onClose(); }}
        sx={{ fontSize: "13px", py: 1 }}
      >
        {action}
      </MenuItem>
    ))}
  </Menu>
);

// ====================== Email Dialog ======================
// NOW FETCHES TEMPLATES FROM API — no more hardcoded mock data
interface EmailDialogProps {
  open: boolean;
  lead: ProcessedLead | null;
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

  // ── API-fetched email templates ──
  const [emailTemplates, setEmailTemplates] = React.useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [newEmailTemplateOpen, setNewEmailTemplateOpen] = React.useState(false);

  // Toolbar popover anchors
  const [emojiAnchor, setEmojiAnchor]   = React.useState<HTMLElement | null>(null);
  const [formatAnchor, setFormatAnchor] = React.useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor]     = React.useState<HTMLElement | null>(null);

  // Hidden file inputs
  const fileInputRef  = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Cursor tracking for body textarea
  const bodyRef    = React.useRef<HTMLTextAreaElement>(null);
  const cursorPos  = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });

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
        if (el) {
          el.focus();
          el.setSelectionRange(start + text.length, start + text.length);
          cursorPos.current = { start: start + text.length, end: start + text.length };
        }
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
        if (el) {
          el.focus();
          const newStart = start + before.length;
          const newEnd   = newStart + selected.length;
          el.setSelectionRange(newStart, newEnd);
          cursorPos.current = { start: newStart, end: newEnd };
        }
      });
      return next;
    });
  }, []);

  // ── Fetch email templates when dialog opens ──
  const loadEmailTemplates = React.useCallback(async () => {
    setLoadingTemplates(true);
    setTemplateError(null);
    try {
      const data = await EmailTemplateAPI.list();
      setEmailTemplates(data);
    } catch (err) {
      console.error("Failed to load email templates:", err);
      setTemplateError("Could not load templates. You can still compose a new email.");
      setEmailTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setStep("template");
      setSelectedTemplateId(null);
      setPreviewTemplate(null);
      setSubject("");
      setBody("");
      setError(null);
      setSending(false);
      setEmojiAnchor(null);
      setFormatAnchor(null);
      setMoreAnchor(null);
      loadEmailTemplates();
    }
  }, [open, loadEmailTemplates]);

  const handleClose = () => {
    if (sending) return;
    onClose();
  };

  const handleComposeNew = () => {
    setSelectedTemplateId(null);
    setSubject("");
    setBody("");
    setStep("compose");
  };

  const handleNext = () => {
    if (!selectedTemplateId) return;
    const template = emailTemplates.find((t) => String(t.id) === selectedTemplateId);
    if (template) {
      const recipientName = lead?.full_name || lead?.name || "Patient";
      setSubject(template.subject);
      setBody(
        (template.body || "")
          .replace(/\{\{name\}\}/g, recipientName)
          .replace(/\{\{lead_name\}\}/g, recipientName)
      );
    }
    setStep("compose");
  };

  // Handle new template saved from dialog
  const handleNewEmailTemplateSaved = (tpl: EmailTemplate) => {
    setNewEmailTemplateOpen(false);
    // Add it to the list and auto-select it
    setEmailTemplates((prev) => [tpl, ...prev]);
    setSelectedTemplateId(String(tpl.id));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    if (!lead?.id) {
      setError("Lead ID is missing. Cannot send email.");
      return;
    }
    if (!lead?.email) {
      setError("This lead has no email address.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await LeadEmailAPI.sendNow({
        lead: lead.id,
        subject: subject.trim(),
        email_body: body.trim(),
        sender_email: lead.email ?? null,
      });
      console.log("✅ Email sent via POST /lead-email/");
      setSuccess(true);
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to send email. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (!lead?.id) return;
    try {
      await LeadEmailAPI.saveAsDraft({
        lead: lead.id,
        subject: subject.trim(),
        email_body: body.trim(),
        sender_email: lead.email ?? null,
      });
      console.log("📝 Email saved as draft via POST /lead-email/");
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  };

  // ── Toolbar handlers ──────────────────────────────────────────
  const handleAttach = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    saveCursor();
    const names = files.map((f) => f.name).join(", ");
    insertAtCursor(`\n[📎 Attachment: ${names}]\n`);
    e.target.value = "";
  };

  const handleImageAttach = () => imageInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    saveCursor();
    insertAtCursor(`\n[🖼 Image: ${file.name}]\n`);
    e.target.value = "";
  };

  const handleInsertLink = () => {
    saveCursor();
    const url   = window.prompt("Enter URL:", "https://");
    if (!url) return;
    const label = window.prompt("Link label:", "Click here") || url;
    insertAtCursor(`[${label}](${url})`);
  };

  const handleEmojiSelect = (emoji: string) => {
    saveCursor();
    insertAtCursor(emoji);
  };

  const handleFormat = (type: string) => {
    saveCursor();
    const formats: Record<string, [string, string, string?]> = {
      "Bold":           ["**", "**", "bold text"],
      "Italic":         ["_", "_", "italic text"],
      "Underline":      ["__", "__", "underlined text"],
      "Strikethrough":  ["~~", "~~", "strikethrough"],
      "Bullet list":    ["\n• ", "", "item"],
      "Numbered list":  ["\n1. ", "", "item"],
      "Quote":          ["\n> ", "", "quote"],
      "Code":           ["`", "`", "code"],
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
      "Clear formatting": "",
    };
    if (action === "Clear formatting") {
      setBody((prev) => prev.replace(/(\*\*|__|~~|_|`)/g, ""));
    } else {
      insertAtCursor(snippets[action] || "");
    }
  };

  return (
    <>
      {/* Hidden file inputs */}
      <input ref={fileInputRef}  type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />

      {/* Emoji / Format / More popovers */}
      <EmojiPicker  anchorEl={emojiAnchor}  onClose={() => setEmojiAnchor(null)}  onSelect={handleEmojiSelect} />
      <FormatMenu   anchorEl={formatAnchor} onClose={() => setFormatAnchor(null)} onFormat={handleFormat} />
      <MoreMenu     anchorEl={moreAnchor}   onClose={() => setMoreAnchor(null)}   onAction={handleMoreAction} />

      {/* New Email Template sub-dialog */}
      <NewEmailTemplateDialog
        open={newEmailTemplateOpen}
        onClose={() => setNewEmailTemplateOpen(false)}
        onSaved={handleNewEmailTemplateSaved}
      />

      <Dialog open={open && !newEmailTemplateOpen} onClose={handleClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}>

        {/* ====== STEP 1: Template Selection ====== */}
        {step === "template" && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              New Email
              <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1, pb: 0 }}>
              {/* Compose New */}
              <Box onClick={handleComposeNew}
                sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 1.5, cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>
                <EditOutlinedIcon sx={{ fontSize: 18, color: "#475569" }} />
                <Typography fontWeight={600} fontSize="14px" color="#475569">Compose New Email</Typography>
              </Box>

              <Divider sx={{ my: 1.5 }}>
                <Typography fontSize="12px" color="text.secondary">OR</Typography>
              </Divider>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography fontSize="13px" color="text.secondary" fontWeight={500}>
                  Select Email Template
                </Typography>
                <Button
                  size="small"
                  onClick={() => setNewEmailTemplateOpen(true)}
                  sx={{
                    textTransform: "none", fontSize: "12px", fontWeight: 600,
                    color: "#1F2937", border: "1px solid #E5E7EB", borderRadius: "6px",
                    px: 1.5, py: 0.5, minWidth: 0,
                    "&:hover": { bgcolor: "#F3F4F6" },
                  }}
                >
                  + New Template
                </Button>
              </Box>

              {/* Loading state */}
              {loadingTemplates && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              )}

              {/* Error state */}
              {!loadingTemplates && templateError && (
                <Alert severity="warning" sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}>
                  {templateError}
                </Alert>
              )}

              {/* Empty state */}
              {!loadingTemplates && !templateError && emailTemplates.length === 0 && (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography color="text.secondary" fontSize="14px">
                    No email templates found.
                  </Typography>
                  <Typography color="text.secondary" fontSize="12px" mt={0.5}>
                    Click "+ New Template" above to create one.
                  </Typography>
                </Box>
              )}

              {/* Template list */}
              {!loadingTemplates && emailTemplates.length > 0 && (
                <RadioGroup
                  value={selectedTemplateId || ""}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <Stack spacing={0} divider={<Divider />} sx={{ maxHeight: 340, overflowY: "auto" }}>
                    {emailTemplates.map((template) => (
                      <Box
                        key={template.id}
                        onClick={() => setSelectedTemplateId(String(template.id))}
                        sx={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          py: 1.5, px: 0.5, cursor: "pointer", borderRadius: "8px",
                          "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s",
                        }}
                      >
                        <FormControlLabel
                          value={String(template.id)}
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color: selectedTemplateId === String(template.id) ? "#EF4444" : "#CBD5E1",
                                "&.Mui-checked": { color: "#EF4444" },
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography fontWeight={600} fontSize="13.5px" color="#1E293B">
                                {template.name}
                              </Typography>
                              {template.description && (
                                <Typography fontSize="12px" color="#64748B" mt={0.2}>
                                  {template.description}
                                </Typography>
                              )}
                              {template.subject && (
                                <Typography fontSize="11px" color="#94A3B8" mt={0.25}>
                                  Subject: {template.subject}
                                </Typography>
                              )}
                            </Box>
                          }
                          sx={{ m: 0, flex: 1 }}
                        />
                        <Tooltip title="Preview template">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplateId(String(template.id));
                              setPreviewTemplate(template);
                              setStep("preview");
                            }}
                            sx={{ color: "#93C5FD", ml: 1, "&:hover": { color: "#3B82F6", bgcolor: "#EFF6FF" } }}
                          >
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

        {/* ====== STEP 1.5: Template Preview ====== */}
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
              {/* Template info badge */}
              <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", px: 2, py: 1.25, mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography fontSize="12px" color="#64748B" fontWeight={500}>Template:</Typography>
                  <Typography fontSize="13px" fontWeight={700} color="#1E293B">{previewTemplate.name}</Typography>
                  {previewTemplate.use_case && (
                    <Chip label={previewTemplate.use_case} size="small" sx={{ height: 20, fontSize: "11px", fontWeight: 600, bgcolor: "#EFF6FF", color: "#1D4ED8", borderRadius: "4px", "& .MuiChip-label": { px: 1 } }} />
                  )}
                </Stack>
              </Box>

              {/* Email preview card */}
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                {/* Fake browser bar */}
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

                {/* Email header meta */}
                <Box sx={{ bgcolor: "#FAFAFA", px: 2.5, py: 1.5, borderBottom: "1px solid #E2E8F0" }}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>From:</Typography>
                      <Typography fontSize="12px" color="#374151">noreply@crystaivf.com</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>To:</Typography>
                      <Typography fontSize="12px" color="#374151">
                        {lead?.full_name || lead?.name || "Patient"}{lead?.email ? ` <${lead.email}>` : ""}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Typography fontSize="11px" color="#94A3B8" fontWeight={500} minWidth={52}>Subject:</Typography>
                      <Typography fontSize="12px" color="#1E293B" fontWeight={700}>{previewTemplate.subject}</Typography>
                    </Stack>
                  </Stack>
                </Box>

                {/* Email body */}
                <Box sx={{ bgcolor: "#FFFFFF", px: 2.5, py: 2.5, maxHeight: 260, overflowY: "auto" }}>
                  <Typography
                    fontSize="13px"
                    color="#1E293B"
                    sx={{ lineHeight: 1.85, whiteSpace: "pre-wrap", fontFamily: "Georgia, serif" }}
                  >
                    {(previewTemplate.body || "")
                      .replace(/\{\{name\}\}/g, lead?.full_name || lead?.name || "Patient")
                      .replace(/\{\{lead_name\}\}/g, lead?.full_name || lead?.name || "Patient")
                      .replace(/\{\{lead_first_name\}\}/g, (lead?.full_name || lead?.name || "Patient").split(" ")[0])
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

                {/* Footer note */}
                <Box sx={{ bgcolor: "#F8FAFC", borderTop: "1px solid #E2E8F0", px: 2.5, py: 1.25, textAlign: "center" }}>
                  <Typography fontSize="11px" color="#94A3B8">
                    Variables shown in <Box component="span" sx={{ color: "#7C3AED", fontWeight: 600 }}>purple</Box> will be auto-filled when sent
                  </Typography>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
              <Button
                onClick={() => { setStep("template"); setPreviewTemplate(null); }}
                sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  const recipientName = lead?.full_name || lead?.name || "Patient";
                  setSubject(previewTemplate.subject || "");
                  setBody(
                    (previewTemplate.body || "")
                      .replace(/\{\{name\}\}/g, recipientName)
                      .replace(/\{\{lead_name\}\}/g, recipientName)
                      .replace(/\{\{lead_first_name\}\}/g, recipientName.split(" ")[0])
                  );
                  setStep("compose");
                }}
                variant="contained"
                sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" } }}
              >
                Use This Template
              </Button>
            </DialogActions>
          </>
        )}

        {/* ====== STEP 2: Compose Email ====== */}
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
                  <Box sx={{ flex: 1 }}>
                    <Chip
                      label={lead?.full_name || lead?.name || lead?.email || "Unknown"}
                      size="small"
                      onDelete={() => {}}
                      deleteIcon={<CloseIcon sx={{ fontSize: "14px !important" }} />}
                      sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 500, fontSize: "12px", height: 24, "& .MuiChip-deleteIcon": { color: "#93C5FD" } }}
                    />
                  </Box>
                  <Typography fontSize="12px" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "#1D4ED8" } }}>
                    Cc | Bcc
                  </Typography>
                </Box>

                {/* Subject */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                  <Typography fontSize="13px" color="text.secondary" minWidth={55}>Subject:</Typography>
                  <TextField
                    fullWidth variant="standard" value={subject}
                    onChange={(e) => setSubject(e.target.value)} disabled={sending}
                    InputProps={{ disableUnderline: true, sx: { fontSize: "13px" } }}
                    placeholder="Enter subject..."
                  />
                </Box>

                {/* Body */}
                <Box sx={{ py: 1.5 }}>
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onSelect={saveCursor}
                    onKeyUp={saveCursor}
                    onMouseUp={saveCursor}
                    disabled={sending}
                    placeholder="Write your email..."
                    rows={12}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      resize: "vertical",
                      border: "none",
                      outline: "none",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      fontFamily: "inherit",
                      color: "#1E293B",
                      background: "transparent",
                      padding: 0,
                    }}
                  />
                </Box>

                {error && <Alert severity="error" sx={{ borderRadius: "8px", my: 1 }}>{error}</Alert>}
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: "column", gap: 0 }}>
              {/* ── Toolbar ── */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 1.5, width: "100%", borderTop: "1px solid #E5E7EB", pt: 1.5, flexWrap: "wrap" }}>
                <Tooltip title="Attach file">
                  <IconButton size="small" onClick={handleAttach} sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}>
                    <AttachFileIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Insert link">
                  <IconButton size="small" onClick={handleInsertLink} sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}>
                    <LinkIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Emoji">
                  <IconButton size="small"
                    onClick={(e) => { saveCursor(); setEmojiAnchor(e.currentTarget); }}
                    sx={{ color: emojiAnchor ? "#F59E0B" : "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#F59E0B" } }}>
                    <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Insert image">
                  <IconButton size="small" onClick={handleImageAttach} sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}>
                    <ImageOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Format text">
                  <IconButton size="small"
                    onClick={(e) => { saveCursor(); setFormatAnchor(e.currentTarget); }}
                    sx={{ color: formatAnchor ? "#6366F1" : "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#6366F1" } }}>
                    <FormatColorTextOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Highlight">
                  <IconButton size="small"
                    onClick={() => { saveCursor(); wrapSelection("==", "==", "highlighted text"); }}
                    sx={{ color: "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}>
                    <BrushOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="More options">
                  <IconButton size="small"
                    onClick={(e) => { saveCursor(); setMoreAnchor(e.currentTarget); }}
                    sx={{ color: moreAnchor ? "#10B981" : "#64748B", borderRadius: "6px", "&:hover": { bgcolor: "#F1F5F9", color: "#10B981" } }}>
                    <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* ── Action buttons ── */}
              <Box sx={{ display: "flex", gap: 1, width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={handleClose} disabled={sending}
                  sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 3, "&:hover": { bgcolor: "#F3F4F6" } }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAsTemplate}
                  disabled={sending || !subject.trim() || !body.trim()}
                  startIcon={<BookmarkBorderIcon fontSize="small" />}
                  sx={{ height: 40, color: "#374151", fontWeight: 500, textTransform: "none", borderRadius: "8px", border: "1px solid #E5E7EB", px: 2, "&:hover": { bgcolor: "#F3F4F6" } }}>
                  Save as Draft
                </Button>
                <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} variant="contained"
                  startIcon={sending ? <CircularProgress size={14} sx={{ color: "white" }} /> : <SendIcon fontSize="small" />}
                  sx={{ height: 40, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", px: 3, "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
                  {sending ? "Sending..." : "Send"}
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ borderRadius: "10px" }}>
          Email sent to {lead?.full_name || lead?.name}!
        </Alert>
      </Snackbar>
    </>
  );
};

// ====================== Main Component ======================
const LeadsTable: React.FC<Props> = ({ search, tab, filters }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const leads = useSelector(selectLeads) as RawLead[] | null;
  const loading = useSelector(selectLeadsLoading) as boolean;
  const error = useSelector(selectLeadsError) as string | null;

  const [localLeads, setLocalLeads] = React.useState<ProcessedLead[]>([]);
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const [callLead, setCallLead] = React.useState<ProcessedLead | null>(null);
  const [smsLead, setSmsLead] = React.useState<ProcessedLead | null>(null);
  const [emailLead, setEmailLead] = React.useState<ProcessedLead | null>(null);
  const [callSnackbar, setCallSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: "" });

  React.useEffect(() => {
    dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  React.useEffect(() => {
    if (leads) {
      setLocalLeads(
        leads.map((lead: RawLead): ProcessedLead => {
          const rawTaskType =
            lead.next_action_type ||
            lead.task_type ||
            lead.nextActionType ||
            lead.taskType ||
            lead.action_type ||
            "";
          const taskType = formatTaskType(rawTaskType);
          const taskStatus = formatTaskStatus(lead.next_action_status, taskType);
          return {
            ...lead,
            assigned: lead.assigned_to_name || "Unassigned",
            status: formatStatus(lead.status || lead.lead_status || "New"),
            name: lead.full_name || lead.name || "",
            quality: deriveQuality(lead),
            displayId: formatLeadId(lead.id),
            taskType,
            taskStatus,
          };
        }),
      );
    }
  }, [leads]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const isSelected = (id: string) => selectedIds.includes(id);

  const handleCallOpen = async (e: React.MouseEvent, lead: ProcessedLead) => {
    e.stopPropagation();
    const phone = normalizePhone(lead.contact_no);
    if (!phone) { setCallSnackbar({ open: true, message: "No contact number for this lead." }); return; }
    if (!lead.id) { setCallSnackbar({ open: true, message: "Lead ID is missing. Cannot initiate call." }); return; }
    setCallLead(lead);
    try {
      await TwilioAPI.makeCall({ lead_uuid: lead.id, to: phone });
    } catch (err: unknown) {
      setCallLead(null);
      setCallSnackbar({ open: true, message: extractErrorMessage(err, "Failed to initiate call.") });
    }
  };

  const handleSMSOpen = (e: React.MouseEvent, lead: ProcessedLead) => {
    e.stopPropagation();
    setSmsLead(lead);
  };

  const filteredLeads = React.useMemo(() => {
    return localLeads.filter((lead: ProcessedLead) => {
      const searchStr = `${lead.name || ""} ${lead.displayId || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      const matchTab = tab === "archived" ? lead.is_active === false : lead.is_active !== false;
      if (filters) {
        if (filters.department && lead.department_id !== Number(filters.department)) return false;
        if (filters.assignee && lead.assigned_to_id !== Number(filters.assignee)) return false;
        if (filters.status) {
          const ls = (lead.lead_status || lead.status || "").toLowerCase();
          if (ls !== filters.status.toLowerCase()) return false;
        }
        if (filters.quality && lead.quality !== filters.quality) return false;
        if (filters.source && lead.source !== filters.source) return false;
        if (filters.dateFrom || filters.dateTo) {
          const leadDate = lead.created_at ? new Date(lead.created_at) : null;
          if (!leadDate) return false;
          if (filters.dateFrom) {
            const f = new Date(filters.dateFrom);
            f.setHours(0, 0, 0, 0);
            if (leadDate < f) return false;
          }
          if (filters.dateTo) {
            const t = new Date(filters.dateTo);
            t.setHours(23, 59, 59, 999);
            if (leadDate > t) return false;
          }
        }
      }
      return matchSearch && matchTab;
    });
  }, [localLeads, search, tab, filters]);

  React.useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, tab, filters]);

  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [totalPages, page]);

  const currentLeads = filteredLeads.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  const handleBulkDelete = () => {
    setLocalLeads((p) => p.filter((l) => !selectedIds.includes(l.id)));
    setSelectedIds([]);
  };
  const handleBulkArchive = (archive: boolean) => {
    setLocalLeads((p) => p.map((l) => selectedIds.includes(l.id) ? { ...l, is_active: !archive } : l));
    setSelectedIds([]);
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading leads...</Typography>
        </Stack>
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load leads</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography variant="body2"
          sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0])}>
          Try again
        </Typography>
      </Alert>
    );

  if (localLeads.length === 0)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">No leads found</Typography>
          <Typography variant="body2" color="text.secondary">
            {tab === "archived" ? "No archived leads yet" : "Create your first lead to get started"}
          </Typography>
        </Stack>
      </Box>
    );

  if (filteredLeads.length === 0)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">
            No {tab === "archived" ? "archived" : "active"} leads found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? `No results for "${search}"`
              : filters && Object.values(filters).some((v) => v !== "" && v !== null)
                ? "No leads match the selected filters"
                : tab === "archived" ? "No archived leads yet" : "No active leads"}
          </Typography>
        </Stack>
      </Box>
    );

  return (
    <>
      <TableContainer component={Paper} elevation={0} className="leads-table" sx={{ overflowX: "auto" }}>
        <Table stickyHeader sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" className="checkbox-cell">
                <Checkbox
                  indeterminate={
                    currentLeads.some((l) => selectedIds.includes(l.id)) &&
                    !currentLeads.every((l) => selectedIds.includes(l.id))
                  }
                  checked={currentLeads.length > 0 && currentLeads.every((l) => selectedIds.includes(l.id))}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(currentLeads.map((l) => l.id));
                    else setSelectedIds([]);
                  }}
                />
              </TableCell>
              <TableCell>Lead Name | No</TableCell>
              <TableCell>Date | Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Lead Status</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>AI Score</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Task Type</TableCell>
              <TableCell>Task Status</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell align="center" sx={stickyHeaderContactStyle}>Contact Option</TableCell>
              <TableCell align="center" sx={stickyHeaderMenuStyle} />
            </TableRow>
          </TableHead>

          <TableBody>
            {currentLeads.map((lead: ProcessedLead) => (
              <TableRow
                key={lead.id}
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/leads/${encodeURIComponent(lead.id.replace(/^#/, ""))}`)}
                className={isSelected(lead.id) ? "row-selected" : ""}
              >
                <TableCell padding="checkbox" className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected(lead.id)} onChange={() => toggleSelect(lead.id)} />
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar className="lead-avatar">
                      {lead.initials || lead.full_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography className="lead-name-text">{lead.full_name}</Typography>
                      <Typography className="lead-id-text">{lead.displayId}</Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography className="lead-date">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-GB") : "N/A"}
                  </Typography>
                  <Typography className="lead-time">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                      : "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>{lead.location || "N/A"}</TableCell>
                <TableCell>{lead.source || "N/A"}</TableCell>

                <TableCell>
                  <Chip label={lead.status} size="small" sx={getStatusChipSx(lead.status ?? "")} />
                </TableCell>

                <TableCell>
                  <Chip label={lead.quality} size="small" className={`lead-chip quality-${lead.quality?.toLowerCase()}`} />
                </TableCell>

                <TableCell className="score">
                  {String(lead.score || 0).includes("%") ? lead.score : `${lead.score || 0}%`}
                </TableCell>

                <TableCell>{lead.assigned}</TableCell>

                <TableCell>
                  <Typography sx={{ fontSize: "13px", color: lead.taskType ? "#1E293B" : "#94A3B8", fontWeight: lead.taskType ? 500 : 400 }}>
                    {lead.taskType || "—"}
                  </Typography>
                </TableCell>

                <TableCell>
                  {lead.taskStatus ? (
                    <Chip label={lead.taskStatus} size="small" sx={getTaskStatusChipSx(lead.taskStatus)} />
                  ) : (
                    <Typography sx={{ fontSize: "13px", color: "#94A3B8" }}>—</Typography>
                  )}
                </TableCell>

                <TableCell
                  sx={{ color: "primary.main", fontWeight: 700 }}
                  onClick={(e) => { e.stopPropagation(); navigate("/leads/activity", { state: { lead } }); }}
                >
                  {lead.activity || "View Activity"}
                </TableCell>

                <TableCell align="center" sx={stickyContactStyle} onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title={`Call ${lead.contact_no || "N/A"}`}>
                      <span>
                        <IconButton className="action-btn" size="small" onClick={(e) => handleCallOpen(e, lead)}>
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={`SMS ${lead.contact_no || "N/A"}`}>
                      <IconButton className="action-btn" size="small" onClick={(e) => handleSMSOpen(e, lead)}>
                        <ChatBubbleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={lead.email ? `Email ${lead.email}` : "No email"}>
                      <span>
                        <IconButton
                          className="action-btn"
                          size="small"
                          disabled={!lead.email}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmailLead(lead);
                          }}
                        >
                          <EmailOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>

                <TableCell align="center" sx={stickyMenuStyle} onClick={(e) => e.stopPropagation()}>
                  <MenuButton lead={lead} setLeads={setLocalLeads} tab={tab} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, px: 2 }}>
        <Typography color="text.secondary">
          Showing {startEntry} to {endEntry} of {totalEntries}
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Box key={p} onClick={() => setPage(p)} className={`page-number ${page === p ? "active" : ""}`}>
              {p}
            </Box>
          ))}
          <IconButton disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => p + 1)}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <BulkActionBar selectedIds={selectedIds} tab={tab} onDelete={handleBulkDelete} onArchive={handleBulkArchive} />
      <Dialogs />

      <CallDialog
        open={Boolean(callLead)}
        name={callLead?.full_name || callLead?.name || "Unknown"}
        onClose={() => setCallLead(null)}
      />

      <SMSDialog open={Boolean(smsLead)} lead={smsLead} onClose={() => setSmsLead(null)} />

      <EmailDialog open={Boolean(emailLead)} lead={emailLead} onClose={() => setEmailLead(null)} />

      <Snackbar
        open={callSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))} severity="error" sx={{ borderRadius: "10px" }}>
          {callSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LeadsTable;