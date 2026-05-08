import * as React from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import Lead_Subtract from "../../assets/icons/Lead_Subtract.svg";
import Lead_Status_Edit from "../../assets/icons/Lead_Status_Edit.svg";
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
import { selectUser } from "../../store/authSlice";
import {
  hasAnySubcategoryActionPermission,
  resolveUserRole,
} from "../../utils/roleAccess";
import {
  api,
  LeadAPI,
  LeadEmailAPI,
  EmailTemplateAPI,
  InterestAPI,
} from "../../services/leads.api";
import type {
  EmailTemplate,
  EmailTemplatePayload,
  LeadMailListItem,
} from "../../services/leads.api";
import {
  formatLeadId,
  normalizeDocument,
  formatNoteTime,
  getCleanLeadId,
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

import {
  APP_TYPE,
  STATUS_OPTIONS_BY_APP,
  FLOW_COPY_BY_APP,
  IS_CONTRACTS_APP,
} from "../../config/appType";

import BookAppointmentModal from "./BookAppointmentModal";
import type { AppointmentResult } from "./BookAppointmentModal";
import { selectClinic } from "../../store/clinicSlice";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function extractErr(err: unknown, fallback = "Something went wrong."): string {
  const e = err as {
    response?: { data?: { detail?: string; non_field_errors?: string[] } };
    message?: string;
  };
  return (
    e?.response?.data?.detail ||
    e?.response?.data?.non_field_errors?.[0] ||
    e?.message ||
    fallback
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function capitalizeWords(val: string | undefined | null): string {
  if (!val) return "N/A";
  return val
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function capitalize(val: string | undefined | null): string {
  if (!val) return "N/A";
  return val.charAt(0).toUpperCase() + val.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// getLeadTaskStatus
// Reads ONLY action_status from the backend.
// Backend values : "to_do" | "in_progress" | "completed" | null | ""
// UI display     : "To Do" | "In Progress"  | "Completed" | ""
// Returns ""  when action_status is not set — chip is hidden, shows "—"
// ─────────────────────────────────────────────────────────────────────────────
type LeadWithApiFields = LeadRecord & { action_status?: string };

function getLeadTaskStatus(
  lead?: LeadWithApiFields,
): "To Do" | "In Progress" | "Completed" | "" {
  if (!lead) return "";

  const raw = (lead.action_status ?? "").trim().toLowerCase();

  if (raw === "to_do") return "To Do";
  if (raw === "in_progress") return "In Progress";
  if (raw === "completed") return "Completed";
  // Legacy display-value strings that may arrive from older records
  if (raw === "to do") return "To Do";
  if (raw === "in progress") return "In Progress";
  if (raw === "pending") return "To Do"; // old records stored "pending"

  return ""; // not set → caller renders "—"
}

function toDisplayPhone(val: string | undefined | null): string {
  if (!val) return "N/A";
  const trimmed = val.trim();
  if (!trimmed) return "N/A";
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (!digitsOnly || /^0+$/.test(digitsOnly)) return "N/A";
  return trimmed;
}

const LEAD_STATUS_OPTIONS = STATUS_OPTIONS_BY_APP[APP_TYPE];
type LeadStatusOption = (typeof LEAD_STATUS_OPTIONS)[number];

const LEAD_STATUS_PILL_COLORS: Record<
  LeadStatusOption,
  { color: string; bg: string }
> = {
  New: { color: "#5B8FF9", bg: "rgba(91,143,249,0.10)" },
  Appointment: { color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  "Follow Up": { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  Negotiation: { color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  "Proposal Sent": { color: "#4F46E5", bg: "rgba(79,70,229,0.10)" },
  "Contract Signed": { color: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  "Converted Lead": { color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
  "Lost Lead": { color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
} as Record<LeadStatusOption, { color: string; bg: string }>;

const LEAD_STATUS_API_VALUES: Record<LeadStatusOption, string> = {
  New: "new",
  Appointment: "appointment",
  "Follow Up": "follow up",
  Negotiation: "negotiation",
  "Proposal Sent": "proposal sent",
  "Contract Signed": "contract signed",
  "Converted Lead": "converted",
  "Lost Lead": "lost",
} as Record<LeadStatusOption, string>;

const toastOptions = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "colored" as const,
};

function normalizeLeadStatusForPill(
  status: string | undefined,
): LeadStatusOption {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized === "appointment") return "Appointment";
  if (normalized === "follow up" || normalized === "follow-up")
    return "Follow Up";
  if (normalized === "negotiation") return "Negotiation";
  if (normalized === "proposal sent") return "Proposal Sent";
  if (normalized === "contract signed") return "Contract Signed";
  if (normalized === "converted" || normalized === "converted lead")
    return "Converted Lead";
  if (normalized === "lost" || normalized === "lost lead") return "Lost Lead";
  return "New";
}

const TAB_LABELS = [
  FLOW_COPY_BY_APP[APP_TYPE].infoTab,
  "History",
  "Next Action",
];

// ─────────────────────────────────────────────────────────────────────────────
// NewEmailTemplateDialog
// ─────────────────────────────────────────────────────────────────────────────
interface NewEmailTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (tpl: EmailTemplate) => void;
}

const NewEmailTemplateDialog: React.FC<NewEmailTemplateDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDesc] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setSubject("");
      setDesc("");
      setBody("");
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      setError("Name, subject, and body are required.");
      return;
    }
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
      } as EmailTemplatePayload);
      onSaved(saved);
      onClose();
    } catch {
      const local: EmailTemplate = {
        id: `local-${Date.now()}`,
        name: name.trim(),
        subject: subject.trim(),
        body: body.trim(),
        description: description.trim(),
      };
      onSaved(local);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.05rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        New Email Template
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} pt={0.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: "8px" }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            required
          />
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            size="small"
            fullWidth
            required
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            size="small"
            fullWidth
            required
            multiline
            minRows={5}
            placeholder="Use {{lead_first_name}}, {{appointment_date}}, etc."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            height: 38,
            color: "#374151",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            px: 3,
            "&:hover": { bgcolor: "#F3F4F6" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          sx={{
            height: 38,
            backgroundColor: "#1F2937",
            color: "white",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            "&:hover": { backgroundColor: "#111827" },
          }}
        >
          {saving ? (
            <CircularProgress size={16} sx={{ color: "#fff" }} />
          ) : (
            "Save Template"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EmailDialog
// ─────────────────────────────────────────────────────────────────────────────
interface EmailDialogProps {
  open: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
  onSent?: () => void;
}

const EmailDialog: React.FC<EmailDialogProps> = ({
  open,
  lead,
  onClose,
  onSent,
}) => {
  const [step, setStep] = React.useState<"template" | "preview" | "compose">(
    "template",
  );
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    string | null
  >(null);
  const [previewTemplate, setPreviewTemplate] =
    React.useState<EmailTemplate | null>(null);
  const [fromEmail, setFromEmail] = React.useState("noreply@fertility.com");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailTemplates, setEmailTemplates] = React.useState<EmailTemplate[]>(
    [],
  );
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [newTplOpen, setNewTplOpen] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const cursorPos = React.useRef<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  const saveCursor = () => {
    const el = bodyRef.current;
    if (el)
      cursorPos.current = { start: el.selectionStart, end: el.selectionEnd };
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
        }
      });
      return next;
    });
  }, []);

  const loadEmailTemplates = React.useCallback(async () => {
    setLoadingTemplates(true);
    setTemplateError(null);
    try {
      const data = await EmailTemplateAPI.list();
      setEmailTemplates(data);
    } catch {
      setTemplateError(
        "Could not load templates. You can still compose a new email.",
      );
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
      setFromEmail("noreply@fertility.com");
      setSubject("");
      setBody("");
      setError(null);
      setSending(false);
      loadEmailTemplates();

      const clinicId = lead?.clinic_id;
      if (clinicId) {
        api
          .get(`/clinics/${clinicId}/detail/`)
          .then((res) => {
            const clinicEmail =
              typeof res?.data?.email === "string" ? res.data.email.trim() : "";
            if (clinicEmail) {
              setFromEmail(clinicEmail);
            }
          })
          .catch(() => {
            // Keep fallback sender when clinic email fetch fails.
          });
      }
    }
  }, [open, loadEmailTemplates, lead?.clinic_id]);

  const handleClose = () => {
    if (sending) return;
    onClose();
  };

  const resolveBody = (raw: string) => {
    const name = lead?.full_name || lead?.name || "Patient";
    return raw
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{lead_name\}\}/g, name)
      .replace(/\{\{lead_first_name\}\}/g, name.split(" ")[0]);
  };

  const handleNext = () => {
    const template = emailTemplates.find(
      (t) => String(t.id) === selectedTemplateId,
    );
    if (template) {
      setSubject(template.subject);
      setBody(stripHtml(resolveBody(template.body || "")));
    }
    setStep("compose");
  };

  const handleNewTplSaved = (tpl: EmailTemplate) => {
    setEmailTemplates((prev) => [tpl, ...prev]);
    setSelectedTemplateId(String(tpl.id));
    setNewTplOpen(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    if (!lead?.id) {
      setError("Lead ID is missing.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await LeadEmailAPI.sendNow({
        lead: lead.id,
        subject: subject.trim(),
        email_body: body.trim(),
        sender_email: fromEmail || null,
      });
      onSent?.();
      onClose();
    } catch (err: unknown) {
      setError(extractErr(err, "Failed to send email. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!subject.trim() || !body.trim() || !lead?.id) return;
    try {
      await LeadEmailAPI.saveAsDraft({
        lead: lead.id,
        subject: subject.trim(),
        email_body: body.trim(),
        sender_email: fromEmail || null,
      });
    } catch {
      // silent
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    saveCursor();
    insertAtCursor(
      `\n[📎 Attachment: ${files.map((f) => f.name).join(", ")}]\n`,
    );
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
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageChange}
      />
      <NewEmailTemplateDialog
        open={newTplOpen}
        onClose={() => setNewTplOpen(false)}
        onSaved={handleNewTplSaved}
      />

      <Dialog
        open={open && !newTplOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}
      >
        {step === "template" && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                pb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              New Email{" "}
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1, pb: 0 }}>
              <Box
                onClick={() => {
                  setSelectedTemplateId(null);
                  setSubject("");
                  setBody("");
                  setStep("compose");
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  py: 1.5,
                  cursor: "pointer",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#F8FAFC" },
                  transition: "background 0.15s",
                }}
              >
                <EditNoteOutlinedIcon sx={{ fontSize: 18, color: "#475569" }} />
                <Typography fontWeight={600} fontSize="14px" color="#475569">
                  Compose New Email
                </Typography>
              </Box>
              <Divider sx={{ my: 1.5 }}>
                <Typography fontSize="12px" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Typography
                  fontSize="13px"
                  color="text.secondary"
                  fontWeight={500}
                >
                  Select Email Template
                </Typography>
                <Button
                  size="small"
                  onClick={() => setNewTplOpen(true)}
                  sx={{
                    textTransform: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1F2937",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                    px: 1.5,
                    py: 0.5,
                    "&:hover": { bgcolor: "#F3F4F6" },
                  }}
                >
                  + New Template
                </Button>
              </Box>
              {loadingTemplates && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              {!loadingTemplates && templateError && (
                <Alert
                  severity="warning"
                  sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}
                >
                  {templateError}
                </Alert>
              )}
              {!loadingTemplates &&
                !templateError &&
                emailTemplates.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography color="text.secondary" fontSize="14px">
                      No email templates found.
                    </Typography>
                    <Typography color="text.secondary" fontSize="12px" mt={0.5}>
                      Click "+ New Template" above to create one.
                    </Typography>
                  </Box>
                )}
              {!loadingTemplates && emailTemplates.length > 0 && (
                <RadioGroup
                  value={selectedTemplateId || ""}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <Stack
                    spacing={0}
                    divider={<Divider />}
                    sx={{
                      maxHeight: 340,
                      overflowY: "auto",
                      paddingRight: "4px",
                      "&::-webkit-scrollbar": { width: "6px" },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "#F5F5F5",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#D0D0D0",
                        borderRadius: "4px",
                        transition: "backgroundColor 0.2s",
                        "&:hover": { backgroundColor: "#B0B0B0" },
                      },
                    }}
                  >
                    {emailTemplates.map((template) => (
                      <Box
                        key={template.id}
                        onClick={() =>
                          setSelectedTemplateId(String(template.id))
                        }
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 1.5,
                          px: 0.5,
                          cursor: "pointer",
                          borderRadius: "8px",
                          "&:hover": { bgcolor: "#F8FAFC" },
                          transition: "background 0.15s",
                        }}
                      >
                        <FormControlLabel
                          value={String(template.id)}
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color:
                                  selectedTemplateId === String(template.id)
                                    ? "#EF4444"
                                    : "#CBD5E1",
                                "&.Mui-checked": { color: "#EF4444" },
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography
                                fontWeight={600}
                                fontSize="13.5px"
                                color="#1E293B"
                              >
                                {template.name}
                              </Typography>
                              {template.description && (
                                <Typography
                                  fontSize="12px"
                                  color="#64748B"
                                  mt={0.2}
                                >
                                  {template.description}
                                </Typography>
                              )}
                              {template.subject && (
                                <Typography
                                  fontSize="11px"
                                  color="#94A3B8"
                                  mt={0.25}
                                >
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
                            sx={{
                              color: "#93C5FD",
                              ml: 1,
                              "&:hover": {
                                color: "#3B82F6",
                                bgcolor: "#EFF6FF",
                              },
                            }}
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
              <Button
                onClick={handleClose}
                sx={{
                  height: 40,
                  color: "#374151",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  px: 3,
                  "&:hover": { bgcolor: "#F3F4F6" },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedTemplateId}
                variant="contained"
                sx={{
                  height: 40,
                  backgroundColor: "#1F2937",
                  color: "white",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                  "&:hover": { backgroundColor: "#111827" },
                  "&:disabled": {
                    backgroundColor: "#E5E7EB",
                    color: "#9CA3AF",
                  },
                }}
              >
                Next
              </Button>
            </DialogActions>
          </>
        )}

        {step === "preview" && previewTemplate && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                pb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => {
                    setStep("template");
                    setPreviewTemplate(null);
                  }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography fontWeight={700} fontSize="1.05rem">
                  Preview Template
                </Typography>
              </Stack>
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, pb: 0 }}>
              <Box
                sx={{
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  px: 2,
                  py: 1.25,
                  mb: 2,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography fontSize="12px" color="#64748B" fontWeight={500}>
                    Template:
                  </Typography>
                  <Typography fontSize="13px" fontWeight={700} color="#1E293B">
                    {previewTemplate.name}
                  </Typography>
                  {previewTemplate.use_case && (
                    <Chip
                      label={previewTemplate.use_case}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "11px",
                        fontWeight: 600,
                        bgcolor: "#EFF6FF",
                        color: "#1D4ED8",
                        borderRadius: "4px",
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  )}
                </Stack>
              </Box>
              <Box
                sx={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <Box sx={{ bgcolor: "#1F2937", px: 2, py: 1 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {["#EF4444", "#F59E0B", "#10B981"].map((c) => (
                      <Box
                        key={c}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: c,
                        }}
                      />
                    ))}
                    <Box
                      sx={{
                        flex: 1,
                        bgcolor: "#374151",
                        borderRadius: "4px",
                        height: 20,
                        ml: 1,
                        display: "flex",
                        alignItems: "center",
                        px: 1.5,
                      }}
                    >
                      <Typography fontSize="10px" color="#94A3B8">
                        Mail Preview
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box
                  sx={{
                    bgcolor: "#FAFAFA",
                    px: 2.5,
                    py: 1.5,
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        fontSize="11px"
                        color="#94A3B8"
                        fontWeight={500}
                        minWidth={52}
                      >
                        From:
                      </Typography>
                      <Typography fontSize="12px" color="#374151">
                        {fromEmail}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        fontSize="11px"
                        color="#94A3B8"
                        fontWeight={500}
                        minWidth={52}
                      >
                        To:
                      </Typography>
                      <Typography fontSize="12px" color="#374151">
                        {recipientName}
                        {lead?.email ? ` <${lead.email}>` : ""}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Typography
                        fontSize="11px"
                        color="#94A3B8"
                        fontWeight={500}
                        minWidth={52}
                      >
                        Subject:
                      </Typography>
                      <Typography
                        fontSize="12px"
                        color="#1E293B"
                        fontWeight={700}
                      >
                        {previewTemplate.subject}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Box
                  sx={{
                    bgcolor: "#FFFFFF",
                    px: 2.5,
                    py: 2.5,
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  <Typography
                    component="pre"
                    sx={{
                      fontSize: "13px",
                      color: "#1E293B",
                      lineHeight: 1.85,
                      fontFamily: "inherit",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      margin: 0,
                    }}
                  >
                    {stripHtml(resolveBody(previewTemplate.body || ""))}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    px: 2.5,
                    py: 1.25,
                    textAlign: "center",
                  }}
                >
                  <Typography fontSize="11px" color="#94A3B8">
                    Variables in{" "}
                    <Box
                      component="span"
                      sx={{ color: "#7C3AED", fontWeight: 600 }}
                    >
                      purple
                    </Box>{" "}
                    will be auto-filled when sent
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
              <Button
                onClick={() => {
                  setStep("template");
                  setPreviewTemplate(null);
                }}
                sx={{
                  height: 40,
                  color: "#374151",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  px: 3,
                  "&:hover": { bgcolor: "#F3F4F6" },
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setSubject(previewTemplate.subject || "");
                  setBody(stripHtml(resolveBody(previewTemplate.body || "")));
                  setStep("compose");
                }}
                sx={{
                  height: 40,
                  backgroundColor: "#1F2937",
                  color: "white",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                  "&:hover": { backgroundColor: "#111827" },
                }}
              >
                Use This Template
              </Button>
            </DialogActions>
          </>
        )}

        {step === "compose" && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                pb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              New Email{" "}
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, pb: 0 }}>
              <Stack spacing={0} divider={<Divider />}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}
                >
                  <Typography
                    fontSize="13px"
                    color="text.secondary"
                    minWidth={55}
                  >
                    From:
                  </Typography>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    disabled={sending}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: "13px" },
                    }}
                    placeholder="Enter sender email"
                  />
                </Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}
                >
                  <Typography
                    fontSize="13px"
                    color="text.secondary"
                    minWidth={55}
                  >
                    To:
                  </Typography>
                  <Chip
                    label={recipientName}
                    size="small"
                    sx={{
                      bgcolor: "#EFF6FF",
                      color: "#1D4ED8",
                      fontWeight: 500,
                      fontSize: "12px",
                      height: 24,
                    }}
                  />
                  <Typography
                    fontSize="12px"
                    color="text.secondary"
                    sx={{ ml: "auto", cursor: "pointer" }}
                  >
                    Cc | Bcc
                  </Typography>
                </Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}
                >
                  <Typography
                    fontSize="13px"
                    color="text.secondary"
                    minWidth={55}
                  >
                    Subject:
                  </Typography>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={sending}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: "13px" },
                    }}
                    placeholder="Enter subject..."
                  />
                </Box>
                <Box sx={{ py: 1.5 }}>
                  {error && (
                    <Alert
                      severity="error"
                      onClose={() => setError(null)}
                      sx={{ borderRadius: "8px", mb: 1.5, fontSize: "13px" }}
                    >
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
                      width: "100%",
                      minHeight: 260,
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontSize: "14px",
                      color: "#374151",
                      lineHeight: 1.75,
                      fontFamily: "inherit",
                      background: "transparent",
                      padding: 0,
                    }}
                  />
                </Box>
              </Stack>
            </DialogContent>
            <Box
              sx={{
                px: 2,
                py: 1,
                borderTop: "1px solid #F3F4F6",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {(
                [
                  {
                    icon: (
                      <Typography
                        fontWeight={700}
                        fontSize="14px"
                        sx={{ lineHeight: 1, fontFamily: "serif" }}
                      >
                        T
                      </Typography>
                    ),
                    title: "Bold",
                    action: () => {
                      saveCursor();
                      const { start, end } = cursorPos.current;
                      setBody(
                        (p) =>
                          p.substring(0, start) +
                          "**" +
                          (p.substring(start, end) || "text") +
                          "**" +
                          p.substring(end),
                      );
                    },
                  },
                  {
                    icon: <AttachFileIcon sx={{ fontSize: 18 }} />,
                    title: "Attach",
                    action: () => fileInputRef.current?.click(),
                  },
                  {
                    icon: <LinkIcon sx={{ fontSize: 18 }} />,
                    title: "Link",
                    action: () => {
                      saveCursor();
                      const u = window.prompt("URL:", "https://");
                      if (u) insertAtCursor(`[link](${u})`);
                    },
                  },
                  {
                    icon: <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />,
                    title: "Emoji",
                    action: () => {
                      saveCursor();
                      const e = window.prompt("Emoji:", "😊");
                      if (e) insertAtCursor(e);
                    },
                  },
                  {
                    icon: <MoreHorizIcon sx={{ fontSize: 18 }} />,
                    title: "More",
                    action: () => {
                      saveCursor();
                      insertAtCursor("\n\n");
                    },
                  },
                  {
                    icon: <ImageOutlinedIcon sx={{ fontSize: 18 }} />,
                    title: "Image",
                    action: () => imageInputRef.current?.click(),
                  },
                  {
                    icon: <DataObjectIcon sx={{ fontSize: 18 }} />,
                    title: "Variable",
                    action: () => {
                      saveCursor();
                      const v = window.prompt("Variable:", "lead_first_name");
                      if (v) insertAtCursor(`{{${v}}}`);
                    },
                  },
                  {
                    icon: <DriveFileRenameOutlineIcon sx={{ fontSize: 18 }} />,
                    title: "Highlight",
                    action: () => {
                      saveCursor();
                      const { start, end } = cursorPos.current;
                      setBody(
                        (p) =>
                          p.substring(0, start) +
                          "==" +
                          (p.substring(start, end) || "text") +
                          "==" +
                          p.substring(end),
                      );
                    },
                  },
                  {
                    icon: <AddCircleOutlineIcon sx={{ fontSize: 18 }} />,
                    title: "Block",
                    action: () => {
                      saveCursor();
                      insertAtCursor("\n\n");
                    },
                  },
                ] as {
                  icon: React.ReactNode;
                  title: string;
                  action: () => void;
                }[]
              ).map(({ icon, title, action }) => (
                <IconButton
                  key={title}
                  size="small"
                  title={title}
                  onClick={action}
                  sx={{
                    color: "#6B7280",
                    borderRadius: "6px",
                    p: 0.6,
                    "&:hover": { bgcolor: "#F3F4F6", color: "#111827" },
                  }}
                >
                  {icon}
                </IconButton>
              ))}
            </Box>
            <DialogActions
              sx={{
                px: 3,
                pb: 3,
                pt: 1.5,
                borderTop: "1px solid #E5E7EB",
                gap: 1,
              }}
            >
              <Button
                onClick={handleClose}
                disabled={sending}
                sx={{
                  height: 40,
                  color: "#374151",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  px: 3,
                  "&:hover": { bgcolor: "#F3F4F6" },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAsDraft}
                disabled={sending || !subject.trim() || !body.trim()}
                sx={{
                  height: 40,
                  color: "#374151",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  px: 3,
                  "&:hover": { bgcolor: "#F3F4F6" },
                }}
              >
                Save as Draft
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim()}
                variant="contained"
                startIcon={
                  sending ? (
                    <CircularProgress size={14} sx={{ color: "#fff" }} />
                  ) : (
                    <SendIcon sx={{ fontSize: 16 }} />
                  )
                }
                sx={{
                  height: 40,
                  backgroundColor: "#1F2937",
                  color: "white",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                  "&:hover": { backgroundColor: "#111827" },
                  "&:disabled": {
                    backgroundColor: "#E5E7EB",
                    color: "#9CA3AF",
                  },
                }}
              >
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const leads = useSelector(selectLeads) as LeadRecord[] | null;
  const loading = useSelector(selectLeadsLoading) as boolean;
  const error = useSelector(selectLeadsError) as string | null;
  const authedUser = useSelector(selectUser);
  const authUser = authedUser as Record<string, unknown> | null;
  const nestedAuthUser =
    authUser?.user && typeof authUser.user === "object"
      ? (authUser.user as Record<string, unknown>)
      : null;
  const role = resolveUserRole(authUser);
  const permissions = authUser?.permissions ?? nestedAuthUser?.permissions;
  const leadAliases = ["leads hub"];
  const canEditLeads =
    role === "super_admin" ||
    hasAnySubcategoryActionPermission(permissions, leadAliases, "edit");

  const [activeTab, setActiveTab] = React.useState(TAB_LABELS[0]);
  const [openConvertPopup, setOpenConvertPopup] = React.useState(false);
  const [convertLoading, setConvertLoading] = React.useState(false);
  const [convertError, setConvertError] = React.useState<string | null>(null);
  const [historyView, setHistoryView] = React.useState<HistoryView>("chatbot");
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const clinic = useSelector(selectClinic);
  const clinicName = clinic?.name || "Our Clinic";
  const [bookApptOpen, setBookApptOpen] = React.useState(false);
  const [emailHistory, setEmailHistory] = React.useState<LeadMailListItem[]>(
    [],
  );
  const [emailHistoryLoading, setEmailHistoryLoading] = React.useState(false);

  const fetchEmailHistory = React.useCallback(async (leadId: string) => {
    if (!leadId) return;
    setEmailHistoryLoading(true);
    try {
      const data = await LeadEmailAPI.listByLead(leadId);
      setEmailHistory(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    } finally {
      setEmailHistoryLoading(false);
    }
  }, []);

  const [notes, setNotes] = React.useState<NoteData[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [notesError, setNotesError] = React.useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = React.useState("");
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [noteSubmitting, setNoteSubmitting] = React.useState(false);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editSubmitting, setEditSubmitting] = React.useState(false);
  const [openAddActionDialog, setOpenAddActionDialog] = React.useState(false);
  const [actionType, setActionType] = React.useState("");
  const [actionStatus, setActionStatus] = React.useState("pending");
  const [actionDescription, setActionDescription] = React.useState("");
  const [actionSubmitting, setActionSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [deleteNoteDialog, setDeleteNoteDialog] = React.useState<string | null>(
    null,
  );
  const [documents, setDocuments] = React.useState<
    { url: string; name: string }[]
  >([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError] = React.useState<string | null>(null);
  const [callHistory, setCallHistory] = React.useState<TwilioCall[]>([]);
  const [callHistoryLoading, setCallHistoryLoading] = React.useState(false);
  const [callHistoryError, setCallHistoryError] = React.useState<string | null>(
    null,
  );
  const [smsHistory, setSmsHistory] = React.useState<TwilioSMS[]>([]);
  const [smsHistoryLoading, setSmsHistoryLoading] = React.useState(false);
  const [smsHistoryError, setSmsHistoryError] = React.useState<string | null>(
    null,
  );
  const [fullLead, setFullLead] = React.useState<LeadRecord | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [selectedLeadStatus, setSelectedLeadStatus] =
    React.useState<LeadStatusOption>("New");
  const [draftLeadStatus, setDraftLeadStatus] =
    React.useState<LeadStatusOption>("New");
  const [statusSaving, setStatusSaving] = React.useState(false);
  const [interests, setInterests] = React.useState<
    { id: string; name: string }[]
    >([]);

  const pillChipSx = (color: string, bg: string) => ({
    borderRadius: "999px",
    fontWeight: 500,
    fontSize: "12px",
    height: 22,
    px: 1,
    width: "fit-content",
    flex: "0 1 auto",
    maxWidth: "100%",
    alignSelf: "flex-start",
    border: "1.5px solid",
    borderColor: color,
    backgroundColor: bg,
    color: color,
    "& .MuiChip-label": { px: 1 },
  });

  React.useEffect(() => {
    if (!leads || leads.length === 0)
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch, leads]);

  const lead = React.useMemo((): LeadRecord | undefined => {
    if (!leads || leads.length === 0) return undefined;
    const cleanId = decodeURIComponent(id || "")
      .replace("#", "")
      .replace("LN-", "")
      .replace("LD-", "");
    return leads.find(
      (l) =>
        l.id.replace("#", "").replace("LN-", "").replace("LD-", "") === cleanId,
    );
  }, [leads, id]);

  React.useEffect(() => {
    if (!id) return;
    LeadAPI.getById(decodeURIComponent(id))
      .then((data) => setFullLead(data as unknown as LeadRecord))
      .catch(() => setFullLead(null));
  }, [id]);

  const activeLead: LeadRecord | undefined = fullLead ?? lead;

  const sendLeadSummaryEmail = React.useCallback(
    async ({
      leadData,
      eventType,
      appointmentResult,
    }: {
      leadData: LeadRecord;
      eventType: "appointment" | "update";
      appointmentResult?: AppointmentResult;
      statusLabel?: string;
    }) => {
      const recipientEmail = (leadData.email || "").trim();
      if (!recipientEmail) return;
      const leadName = (leadData.full_name || leadData.name || "Lead").trim();
      const leadFirstName = leadName.split(/\s+/)[0] || "Lead";
      const appointmentDate =
        appointmentResult?.appointment_date || leadData.appointment_date || "-";
      const appointmentSlot = appointmentResult?.slot || leadData.slot || "-";
      const senderEmail = authedUser?.email?.trim() || undefined;
      const subject =
        eventType === "appointment"
          ? `Appointment Booked - ${appointmentDate}`
          : `Lead Updated - ${leadName}`;
      const emailBody = [
        `Hi ${leadFirstName},`,
        "",
        `${clinicName} here 👋`,
        "",
        eventType === "appointment"
          ? `Your appointment has been successfully scheduled.`
          : `Your details have been updated in our system.`,
        "",
        `📅 Date: ${appointmentDate}`,
        `⏰ Time: ${appointmentSlot}`,
        `👨‍⚕️ Doctor: ${leadData.personal_name || "-"}`,
        `🏥 Department: ${leadData.department_name || "-"}`,
        "",
        `📝 Note: ${stripHtml(appointmentResult?.remark || leadData.remark || "-")}`,
        "",
        `If you need any changes or assistance, feel free to contact us.`,
        "",
        `Regards,`,
        `${clinicName}`,
      ].join("\n");
      await LeadEmailAPI.sendNow({
        lead: String(leadData.id),
        subject,
        sender_email: senderEmail,
        email_body: emailBody,
      });
    },
    [authedUser?.email, clinicName],
  );

    React.useEffect(() => {
      const clinicId = activeLead?.clinic_id;

      if (!clinicId) return;

      InterestAPI.listActiveByClinic(clinicId)
        .then((data) => {
          setInterests(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setInterests([]);
        });
    }, [activeLead?.clinic_id]);

  React.useEffect(() => {
    const current = normalizeLeadStatusForPill(
      activeLead?.status || activeLead?.lead_status || "New",
    );
    setSelectedLeadStatus(current);
  }, [activeLead?.id, activeLead?.status, activeLead?.lead_status]);

  const fetchNotes = React.useCallback(async (leadUuid: string) => {
    try {
      setNotesLoading(true);
      setNotesError(null);
      const { data } = await api.get(`/leads/${leadUuid}/notes/`);
      const results: RawNote[] = Array.isArray(data)
        ? data
        : (data.results ?? []);
      setNotes(
        results
          .filter((n) => !n.is_deleted)
          .map((n) => ({
            id: n.id,
            uuid: n.id,
            title: n.title ?? "",
            content: n.note ?? "",
            time: n.created_at ? formatNoteTime(n.created_at) : "",
          })),
      );
    } catch (err: unknown) {
      setNotesError(
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ?? "Failed to load notes"),
      );
    } finally {
      setNotesLoading(false);
    }
  }, []);

  const fetchDocuments = React.useCallback((leadDocs: DocumentEntry[]) => {
    setDocsLoading(true);
    setDocsError(null);
    try {
      setDocuments(
        Array.isArray(leadDocs) ? leadDocs.map(normalizeDocument) : [],
      );
    } catch (err: unknown) {
      setDocsError(
        err instanceof Error ? err.message : "Failed to load documents",
      );
    } finally {
      setDocsLoading(false);
    }
  }, []);

  const fetchCallHistory = React.useCallback(async (leadUuid: string) => {
    try {
      setCallHistoryLoading(true);
      setCallHistoryError(null);
      const { data } = await api.get(`/twilio/calls/?lead_uuid=${leadUuid}`);
      setCallHistory(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err: unknown) {
      setCallHistoryError(
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ?? "Failed to load call history"),
      );
    } finally {
      setCallHistoryLoading(false);
    }
  }, []);

  const fetchSMSHistory = React.useCallback(async (leadUuid: string) => {
    try {
      setSmsHistoryLoading(true);
      setSmsHistoryError(null);
      const { data } = await api.get(`/twilio/sms/?lead_uuid=${leadUuid}`);
      setSmsHistory(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err: unknown) {
      setSmsHistoryError(
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ?? "Failed to load SMS history"),
      );
    } finally {
      setSmsHistoryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
  }, [location.key, dispatch]);

  React.useEffect(() => {
    if (activeLead) {
      const rawId = decodeURIComponent(id || "");
      fetchNotes(rawId);
      fetchDocuments((activeLead.documents ?? []) as DocumentEntry[]);
      fetchCallHistory(activeLead.id);
      fetchSMSHistory(activeLead.id);
      fetchEmailHistory(activeLead.id);
    }
  }, [
    activeLead,
    activeLead?.id,
    activeLead?.documents,
    location.key,
    fetchNotes,
    fetchDocuments,
    fetchCallHistory,
    fetchSMSHistory,
    fetchEmailHistory,
    id,
  ]);

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    if (!activeLead) return;
    try {
      setNoteSubmitting(true);
      setNotesError(null);
      const { data: created } = await api.post("/leads/notes/", {
        title: newNoteTitle.trim() || "Note",
        note: newNoteContent.trim(),
        lead: decodeURIComponent(id || ""),
        is_active: true,
        is_deleted: false,
      });
      const createdNote = created as RawNote;
      setNotes((prev) => [
        ...prev,
        {
          id: createdNote.id,
          uuid: createdNote.id,
          title: createdNote.title ?? newNoteTitle,
          content: createdNote.note ?? newNoteContent,
          time: createdNote.created_at
            ? formatNoteTime(createdNote.created_at)
            : "",
        },
      ]);
      setNewNoteTitle("");
      setNewNoteContent("");
    } catch (err: unknown) {
      setNotesError(
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ?? "Failed to save note"),
      );
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleStartEdit = (note: NoteData) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!activeLead) return;
    try {
      setEditSubmitting(true);
      setNotesError(null);
      const { data: updated } = await api.put(
        `/leads/notes/${noteId}/update/`,
        {
          title: editTitle.trim(),
          note: editContent.trim(),
          lead: decodeURIComponent(id || ""),
        },
      );
      const updatedNote = updated as RawNote;
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                title: updatedNote.title ?? editTitle,
                content: updatedNote.note ?? editContent,
              }
            : n,
        ),
      );
      setEditingNoteId(null);
      setEditTitle("");
      setEditContent("");
    } catch (err: unknown) {
      setNotesError(
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ?? "Failed to update note"),
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/leads/notes/${noteId}/delete/`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setDeleteNoteDialog(null);
    } catch (err: unknown) {
      setNotesError(
        err instanceof Error
          ? err.message
          : ((err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ?? "Failed to delete note"),
      );
    }
  };

  const handleAddNextAction = async () => {
    if (!actionType.trim() || !actionDescription.trim() || !activeLead) return;
    const resolvedContactNo =
      activeLead.contact_no ||
      activeLead.phone ||
      activeLead.phone_number ||
      undefined;
    try {
      setActionSubmitting(true);
      await api.put(
        `/leads/${decodeURIComponent(id || "")}/update/?clinic_id=${activeLead.clinic_id ?? 0}`,
        {
          clinic_id: activeLead.clinic_id,
          department_id: activeLead.department_id,
          full_name: activeLead.full_name || activeLead.name,
          ...(resolvedContactNo ? { contact_no: resolvedContactNo } : {}),
          source: activeLead.source || "Unknown",
          treatment_interest: Array.isArray(activeLead.treatment_interest)
            ? activeLead.treatment_interest.map((t) =>
                typeof t === "string" ? t : t.id,
              )
            : [],
          book_appointment: activeLead.book_appointment || false,
          appointment_date: activeLead.appointment_date || "",
          slot: activeLead.slot || "",
          is_active: activeLead.is_active !== false,
          partner_inquiry: activeLead.partner_inquiry || false,
          next_action_type: actionType,
          next_action_status: actionStatus,
          next_action_description: actionDescription.trim(),
        },
      );
      setOpenAddActionDialog(false);
      setActionType("");
      setActionStatus("pending");
      setActionDescription("");
      setActionError(null);
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { detail?: string; non_field_errors?: string[] } };
        message?: string;
      };
      setActionError(
        String(
          e?.response?.data?.detail ||
            e?.response?.data?.non_field_errors?.[0] ||
            e?.message ||
            "Failed to save action.",
        ),
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  const closeActionDialog = () => {
    setOpenAddActionDialog(false);
    setActionType("");
    setActionStatus("pending");
    setActionDescription("");
    setActionError(null);
  };

  const handleOpenPopup = () => {
    setConvertError(null);
    setOpenConvertPopup(true);
  };
  const handleClosePopup = () => {
    setOpenConvertPopup(false);
    setConvertError(null);
  };

  const handleConvertLead = async () => {
    if (!activeLead) return;
    try {
      setConvertLoading(true);
      setConvertError(null);
      const leadUuid = decodeURIComponent(id || "");
      const result = (await dispatch(
        convertLead(leadUuid) as unknown as Parameters<typeof dispatch>[0],
      )) as { error?: unknown; payload?: unknown };
      if (
        convertLead.rejected.match(
          result as Parameters<typeof convertLead.rejected.match>[0],
        )
      ) {
        setConvertError(
          String(
            (result as { payload?: string; error?: { message?: string } })
              ?.payload ||
              (result as { error?: { message?: string } })?.error?.message ||
              "Failed to convert lead.",
          ),
        );
        return;
      }
      setFullLead(
        (prev) =>
          ({
            ...(prev ?? activeLead),
            lead_status: "converted",
            status: "converted",
          }) as LeadRecord,
      );
      toast.success("Lead Converted & Register successfully as a Patient!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      try {
        const ids: string[] = JSON.parse(
          localStorage.getItem("converted_lead_ids") || "[]",
        );
        if (!ids.includes(leadUuid))
          localStorage.setItem(
            "converted_lead_ids",
            JSON.stringify([...ids, leadUuid]),
          );
      } catch {
        /* no-op */
      }
      setOpenConvertPopup(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to convert lead.";
      setConvertError(message);
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } finally {
      setConvertLoading(false);
    }
  };

  const handleEdit = () => {
    if (!activeLead || !canEditLeads) return;
    navigate(`/leads/edit/${getCleanLeadId(activeLead.id)}`, {
      state: { lead: activeLead },
    });
  };

  const handleBookAppointment = React.useCallback(() => {
    if (!activeLead) return;
    setBookApptOpen(true);
  }, [activeLead]);

  const handleAppointmentSaved = React.useCallback(
    (result: AppointmentResult) => {
      setBookApptOpen(false);
      const mailLeadData = {
        ...(activeLead ?? {}),
        book_appointment: true,
        lead_status: "Appointment",
        status: "Appointment",
        appointment_date: result.appointment_date,
        slot: result.slot,
        remark: result.remark,
        personal_name: result.personnelName || activeLead?.personal_name,
        department_id: result.department_id ?? activeLead?.department_id,
        department_name: result.departmentName || activeLead?.department_name,
      } as LeadRecord;
      void sendLeadSummaryEmail({
        leadData: mailLeadData,
        eventType: "appointment",
        appointmentResult: result,
        statusLabel: "Appointment",
      }).catch(() => {
        toast.warning(
          "Appointment saved, but confirmation email could not be sent.",
          toastOptions,
        );
      });
      setFullLead((prev) => {
        const base = prev ?? activeLead ?? null;
        if (!base) return prev;
        return {
          ...base,
          book_appointment: true,
          lead_status: "Appointment",
          status: "Appointment",
          appointment_date: result.appointment_date,
          slot: result.slot,
          remark: result.remark,
          personal_id: result.personal_id,
          personal_name: result.personnelName || base.personal_name,
          department_id: result.department_id ?? base.department_id,
          department_name: result.departmentName || base.department_name,
        } as LeadRecord;
      });
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
    },
    [activeLead, dispatch, sendLeadSummaryEmail],
  );

  if (loading && !activeLead)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">
            Loading lead details...
          </Typography>
        </Stack>
      </Box>
    );

  if (error)
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography fontWeight={600}>Failed to load lead</Typography>
          <Typography variant="body2">{error}</Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: "primary.main",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() =>
              dispatch(
                fetchLeads() as unknown as Parameters<typeof dispatch>[0],
              )
            }
          >
            Try again
          </Typography>
        </Alert>
      </Box>
    );

  if (!activeLead)
    return (
      <Box p={3}>
        <Alert severity="warning">
          <Typography fontWeight={600}>Lead not found</Typography>
          <Typography variant="body2">
            The lead you're looking for doesn't exist or may have been deleted.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: "primary.main",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => navigate("/leads")}
          >
            Go back to Leads Hub
          </Typography>
        </Alert>
      </Box>
    );

  const leadName = capitalizeWords(
    activeLead.full_name || activeLead.name || "Unknown",
  );
  const leadInitials = activeLead.initials || leadName.charAt(0).toUpperCase();
  const leadPhone = toDisplayPhone(
    activeLead.phone || activeLead.contact_number || activeLead.contact_no,
  );
  const leadEmail = activeLead.email || "N/A";
  const leadLocation = capitalizeWords(activeLead.location || "N/A");
  const leadGender = capitalize(activeLead.gender);
  const leadAge = String(activeLead.age || "N/A");
  const leadMaritalStatus = capitalize(activeLead.marital_status);
  const leadAddress = capitalizeWords(activeLead.address || "N/A");
  const leadLanguage = capitalize(activeLead.language_preference || "N/A");
  const leadAssigned = capitalizeWords(
    activeLead.assigned_to_name || activeLead.assigned || "Unassigned",
  );
  const leadStatus = selectedLeadStatus;
  const leadQuality = capitalize(activeLead.quality || "N/A");
  const leadScore = !IS_CONTRACTS_APP
    ? String(activeLead.score || 0).includes("%")
      ? activeLead.score
      : `${activeLead.score || 0}%`
    : null;
  const leadSource = capitalizeWords(activeLead.source || "Unknown");
  const leadSubSource = capitalizeWords(activeLead.sub_source || "N/A");
  const leadCampaignName = capitalizeWords(activeLead.campaign_name || "N/A");
  const leadCampaignDuration = capitalize(
    activeLead.campaign_duration || "N/A",
  );
  const leadDisplayId = formatLeadId(activeLead.id);
  const partnerName = capitalizeWords(
    activeLead.partner_name || activeLead.partner_full_name || "N/A",
  );
  const partnerAge = String(activeLead.partner_age || "N/A");
  const partnerGender = capitalize(activeLead.partner_gender);
  const leadCreatedAt = activeLead.created_at
    ? new Date(activeLead.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";
  const nextActionType = capitalizeWords(
    activeLead.next_action_type || activeLead.task || "N/A",
  );
  const nextActionStatus = capitalize(
    activeLead.next_action_status || activeLead.taskStatus || "Pending",
  );
  const nextActionDescription = capitalize(
    activeLead.next_action_description || "N/A",
  );

  // ── Task status: reads action_status only, returns "To Do"|"In Progress"|"Completed"|""
  const leadTaskStatus = getLeadTaskStatus(activeLead);

  // ── FIX: treatment_interest may be an array or a string from the API
  const treatmentInterest = (() => {
    const raw = activeLead.treatment_interest;
    if (!raw) return [];

    // Collect all IDs from the raw value
    const ids: string[] = [];

    if (Array.isArray(raw)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw.forEach((item: any) => {
        if (typeof item === "object" && item !== null) {
          if (item.id) ids.push(String(item.id).trim());
        } else {
          String(item)
            .split(",")
            .forEach((id) => {
              const cleaned = id.trim();
              if (cleaned) ids.push(cleaned);
            });
        }
      });
    } else if (typeof raw === "string") {
      String(raw)
        .split(",")
        .forEach((id) => {
          const cleaned = id.trim();
          if (cleaned) ids.push(cleaned);
        });
    }

    // UUID pattern for detection
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Expand: some IDs may themselves resolve to multiple names
    const resolved: string[] = [];
    ids.forEach((id) => {
      const found = interests.find((i) => String(i.id).trim() === id);
      if (!found) {
        resolved.push(capitalizeWords(id));
        return;
      }

      const nameVal = found.name ?? "";
      const parts = nameVal
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const allUUIDs = parts.every((p) => UUID_RE.test(p));

      if (allUUIDs && parts.length > 0) {
        // The interest's name is a list of sub-IDs — resolve each
        parts.forEach((subId) => {
          const sub = interests.find((i) => String(i.id).trim() === subId);
          resolved.push(capitalizeWords(sub?.name || subId));
        });
      } else {
        resolved.push(capitalizeWords(nameVal || id));
      }
    });

    // Deduplicate
    return [...new Set(resolved)];
  })();

  const hasAppointment = activeLead.book_appointment === true;
  const appointmentDepartment = hasAppointment
    ? capitalizeWords(
        activeLead.department_name || activeLead.department || "N/A",
      )
    : "N/A";
  const appointmentPersonnel = hasAppointment
    ? capitalizeWords(
        activeLead.personal_name ||
          activeLead.personnel ||
          activeLead.assigned_to_name ||
          activeLead.assigned ||
          "N/A",
      )
    : "N/A";
  const appointmentDate =
    hasAppointment && activeLead.appointment_date
      ? new Date(activeLead.appointment_date).toLocaleDateString("en-GB")
      : "N/A";
  const appointmentSlot = hasAppointment
    ? capitalize(activeLead.slot || "N/A")
    : "N/A";
  const appointmentRemark = hasAppointment
    ? capitalize(stripHtml(activeLead.remark || ""))
    : "N/A";
  const currentStatus = (
    activeLead?.status ||
    activeLead?.lead_status ||
    "new"
  ).toLowerCase();
  const isAppointment = currentStatus === "appointment";
  const isFollowUp =
    currentStatus === "follow up" ||
    currentStatus === "follow-up" ||
    currentStatus === "follow-ups";
  const convertedLeadIds: string[] = JSON.parse(
    localStorage.getItem("converted_lead_ids") || "[]",
  );
  const leadUuidRaw = decodeURIComponent(id || "");
  const isConverted =
    convertedLeadIds.includes(leadUuidRaw) ||
    currentStatus === "converted" ||
    (activeLead?.lead_status || "").toLowerCase() === "converted";
  const leadStatusPill = LEAD_STATUS_PILL_COLORS[leadStatus] ?? {
    color: "#6B7280",
    bg: "#F3F4F6",
  };

  const openStatusDialog = () => {
    if (!canEditLeads) return;
    setDraftLeadStatus(selectedLeadStatus);
    setStatusDialogOpen(true);
  };
  const closeStatusDialog = () => {
    if (statusSaving) return;
    setStatusDialogOpen(false);
  };

  const saveLeadStatus = async () => {
    if (!activeLead || statusSaving || !canEditLeads) return;
    const nextLeadStatus = LEAD_STATUS_API_VALUES[draftLeadStatus];
    try {
      setStatusSaving(true);
      const updatedLead = await LeadAPI.update(activeLead.id, {
        clinic_id: activeLead.clinic_id ?? 0,
        department_id: activeLead.department_id ?? 0,
        full_name: activeLead.full_name || activeLead.name || "",
        contact_no:
          activeLead.contact_no ||
          activeLead.phone ||
          activeLead.phone_number ||
          "",
        source: activeLead.source || "Unknown",
        treatment_interest: Array.isArray(activeLead.treatment_interest)
          ? activeLead.treatment_interest.map((t) =>
              typeof t === "string" ? t : t.id,
            )
          : [],
        book_appointment: activeLead.book_appointment || false,
        appointment_date: activeLead.appointment_date || null,
        slot: activeLead.slot || "",
        is_active: activeLead.is_active !== false,
        partner_inquiry: activeLead.partner_inquiry || false,
        lead_status: nextLeadStatus as "new" | "contacted",
      });
      setFullLead((updatedLead as unknown as LeadRecord) ?? null);
      setSelectedLeadStatus(draftLeadStatus);
      setStatusDialogOpen(false);
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
      void sendLeadSummaryEmail({
        leadData: {
          ...(activeLead ?? {}),
          ...(updatedLead as unknown as LeadRecord),
          status: draftLeadStatus,
        } as LeadRecord,
        eventType: "update",
        statusLabel: draftLeadStatus,
      }).catch(() => {
        toast.warning(
          "Lead status updated, but email could not be sent.",
          toastOptions,
        );
      });
      toast.success("Lead status updated.", toastOptions);
    } catch (err) {
      toast.error(
        extractErr(err, "Failed to update lead status."),
        toastOptions,
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const availableActions: { value: string; label: string }[] = isFollowUp
    ? [{ value: "Book Appointment", label: "Book Appointment" }]
    : [
        { value: "Follow Up", label: "Follow Up" },
        { value: "Book Appointment", label: "Book Appointment" },
        { value: "Call Patient", label: "Call Patient" },
        { value: "Send Message", label: "Send Message" },
        { value: "Send Email", label: "Send Email" },
        { value: "Review Details", label: "Review Details" },
        { value: "No Action", label: "No Action" },
      ];

  return (
    <Box p={1} sx={{ minHeight: "80vh", overflowY: "auto" }}>
      <Card
        elevation={0}
        sx={{
          position: "relative",
          p: { xs: 2, sm: 3, md: 5 },
          mb: 3,
          borderRadius: "16px",
          backgroundColor: "#FAFAFA",
          overflow: "hidden",
          boxShadow: "none",
        }}
      >
        <Box
          component="img"
          src={Lead_Subtract}
          alt=""
          sx={{
            position: "absolute",
            top: "6px",
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="stretch"
          sx={{ position: "relative", width: "100%", zIndex: 1 }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "flex-end" }}
            justifyContent="space-between"
            sx={{
              width: "100%",
              pl: { xs: 0, sm: 1 },
              pr: 0,
              gap: { xs: 1.25, md: 0 },
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#EEF2FF",
                color: "#6366F1",
                width: 45,
                height: 45,
                fontSize: "30px",
                fontWeight: 700,
                transform: { xs: "none", md: "translateY(-35px)" },
                ml: { xs: 0, md: -2 },
                flexShrink: 0,
              }}
            >
              {leadInitials}
            </Avatar>

            {/* Lab Name */}
            <Stack
              spacing={0.5}
              sx={{
                flex: 1.3,
                transform: { xs: "none", md: "translateY(14px)" },
                minWidth: { xs: "100%", md: 0 },
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="10px"
              >
                Lab Name
              </Typography>
              <Typography fontWeight={700} variant="body1" fontSize="12px">
                {leadName}
              </Typography>
            </Stack>

            {/* Lead ID */}
            <Stack
              spacing={0.5}
              sx={{
                flex: 1.3,
                transform: { xs: "none", md: "translateY(14px)" },
                minWidth: { xs: "100%", md: 0 },
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="10px"
              >
                Lead ID
              </Typography>
              <Typography fontWeight={600} variant="body1" fontSize="12px">
                {leadDisplayId}
              </Typography>
            </Stack>

            {/* Source */}
            <Stack
              spacing={0.5}
              sx={{
                flex: 1.3,
                transform: { xs: "none", md: "translateY(14px)" },
                minWidth: { xs: "100%", md: 0 },
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="10px"
              >
                Source
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: "#FFB800",
                    borderRadius: "50%",
                  }}
                />
                <Typography fontWeight={600} variant="body1" fontSize="12px">
                  {leadSource}
                </Typography>
              </Stack>
            </Stack>

            {/* Lead Status */}
<Stack
  spacing={0.5}
  sx={{
    flex: "1 1 180px",
    transform: { xs: "none", md: "translateY(14px)" },
    minWidth: 0,
  }}
>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="10px"
              >
                Lead Status
              </Typography>
<Stack
  direction="row"
  alignItems="center"
  spacing={0.5}
  flexWrap="wrap"
  useFlexGap
>
                  <Chip
                  label={leadStatus}
                  size="small"
                  sx={pillChipSx(leadStatusPill.color, leadStatusPill.bg)}
                />
                <IconButton
                  size="small"
                  onClick={openStatusDialog}
                  disabled={!canEditLeads}
                  sx={{ p: 0.35 }}
                  aria-label="Edit lead status"
                >
                  <Box
                    component="img"
                    src={Lead_Status_Edit}
                    alt="Edit Status"
                    sx={{ width: 14, height: 14 }}
                  />
                </IconButton>
              </Stack>
            </Stack>

            {/* Lead Quality */}
            <Stack
              spacing={0.5}
              sx={{
                flex: 1.3,
                transform: { xs: "none", md: "translateY(14px)" },
                minWidth: { xs: "100%", md: 0 },
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="10px"
              >
                Lead Quality
              </Typography>
              <Chip
                label={leadQuality}
                size="small"
                sx={
                  leadQuality === "Hot"
                    ? pillChipSx("#FF4D4F", "rgba(255,77,79,0.10)")
                    : leadQuality === "Warm"
                      ? pillChipSx("#FFC53D", "rgba(255,197,61,0.10)")
                      : pillChipSx("#52C41A", "rgba(82,196,26,0.10)")
                }
              />
            </Stack>

            {/* ── Task Status ─────────────────────────────────────────────────
                Reads action_status from API only.
                "to_do"       → "To Do"      (blue chip)
                "in_progress" → "In Progress" (indigo chip)
                "completed"   → "Completed"  (green chip)
                null / ""     → "—"          (no chip rendered)
            ────────────────────────────────────────────────────────────────── */}
            <Stack
              spacing={0.5}
              sx={{
                flex: 1.3,
                transform: { xs: "none", md: "translateY(14px)" },
                minWidth: { xs: "100%", md: 0 },
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="10px"
              >
                Task Status
              </Typography>
              {leadTaskStatus ? (
                <Chip
                  label={leadTaskStatus}
                  size="small"
                  sx={
                    leadTaskStatus === "Completed"
                      ? pillChipSx("#52C41A", "rgba(82,196,26,0.10)")
                      : leadTaskStatus === "In Progress"
                        ? pillChipSx("#2F54EB", "rgba(47,84,235,0.10)")
                        : pillChipSx("#1890FF", "rgba(24,144,255,0.10)") // "To Do"
                  }
                />
              ) : (
                <Typography fontSize="12px" color="#94A3B8">
                  —
                </Typography>
              )}
            </Stack>

            {/* AI Lead Score — medical app only */}
            {!IS_CONTRACTS_APP && (
              <Stack
                spacing={0.5}
                sx={{
                  flex: 1.3,
                  transform: { xs: "none", md: "translateY(14px)" },
                  minWidth: { xs: "100%", md: 0 },
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontSize="10px"
                >
                  AI Lead Score
                </Typography>
                <Typography fontWeight={700} color="#EC4899" fontSize="12px">
                  {leadScore}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Card>

      {/* Edit Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={closeStatusDialog}
        PaperProps={{
          sx: { borderRadius: "20px", width: 360, overflow: "hidden" },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 2,
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <Typography fontWeight={700} fontSize="1.2rem">
            Edit Status
          </Typography>
          <IconButton
            onClick={closeStatusDialog}
            size="small"
            sx={{ bgcolor: "#F3F4F6", width: 36, height: 36 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pt: 2.5, pb: 1 }}>
          <Stack spacing={1.1}>
            <Typography fontSize="13px" color="#8B8B8B" fontWeight={500}>
              Status
            </Typography>
            <Select
              value={draftLeadStatus}
              onChange={(event) =>
                setDraftLeadStatus(event.target.value as LeadStatusOption)
              }
              size="small"
              renderValue={(value) => {
                const style = LEAD_STATUS_PILL_COLORS[
                  value as LeadStatusOption
                ] ?? { color: "#6B7280", bg: "#F3F4F6" };
                return (
                  <Chip
                    label={value}
                    size="small"
                    sx={pillChipSx(style.color, style.bg)}
                  />
                );
              }}
              sx={{
                minHeight: 50,
                borderRadius: "12px",
                bgcolor: "#FFFFFF",
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  py: 1.25,
                },
              }}
            >
              {LEAD_STATUS_OPTIONS.map((statusOption) => {
                const style = LEAD_STATUS_PILL_COLORS[statusOption] ?? {
                  color: "#6B7280",
                  bg: "#F3F4F6",
                };
                return (
                  <MenuItem key={statusOption} value={statusOption}>
                    <Chip
                      label={statusOption}
                      size="small"
                      sx={pillChipSx(style.color, style.bg)}
                    />
                  </MenuItem>
                );
              })}
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2.25, pt: 1.5, gap: 1.5 }}>
          <Button
            onClick={closeStatusDialog}
            variant="outlined"
            disabled={statusSaving}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              borderColor: "#5C5C5C",
              color: "#5C5C5C",
              minWidth: 140,
              height: 44,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveLeadStatus}
            variant="contained"
            disabled={statusSaving}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              backgroundColor: "#5C5C5C",
              minWidth: 140,
              height: 44,
              "&:hover": { backgroundColor: "#454545" },
            }}
          >
            {statusSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        gap={1.5}
        mb={3}
      >
        <Box
          sx={{
            bgcolor: "#FAFAFA",
            borderRadius: "10px",
            p: 0.8,
            width: { xs: "100%", md: "fit-content" },
            display: "inline-flex",
            alignItems: "center",
            overflowX: "auto",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ minWidth: "max-content" }}>
            {TAB_LABELS.map((tab) => {
              const sel = activeTab === tab;
              return (
                <Box
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    cursor: "pointer",
                    px: 2.5,
                    py: 1,
                    borderRadius: "8px",
                    bgcolor: sel ? "#FFFFFF" : "transparent",
                    color: sel ? "#E17E61" : "#232323",
                    boxShadow: sel ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    fontWeight={600}
                    fontSize={isMobile ? "13px" : "14px"}
                    color="inherit"
                  >
                    {tab}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={handleEdit}
            disabled={!canEditLeads}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              bgcolor: "#f3f3f3",
              color: "#505050",
              width: { xs: "100%", sm: "auto" },
              border: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#f3f3f3",
                color: "#232323",
                border: "none",
                boxShadow: "none",
              },
              "&:disabled": {
                bgcolor: "#E5E7EB",
                color: "#9CA3AF",
                border: "none",
              },
            }}
            title={!canEditLeads ? "No permission to edit leads" : undefined}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            onClick={handleOpenPopup}
            startIcon={<SwapHorizIcon />}
            disabled={isConverted}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              bgcolor: isConverted ? "#E2E8F0" : "#505050",
              color: isConverted ? "#94A3B8" : "#FFFFFF",
              width: { xs: "100%", sm: "auto" },
              px: 2,
              boxShadow: "none",
              "&:hover": {
                bgcolor: isConverted ? "#E2E8F0" : "#232323",
                boxShadow: "none",
              },
              "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" },
            }}
          >
            {isConverted ? "Converted" : "Convert Lead"}
          </Button>
        </Stack>
      </Stack>

      {activeTab === TAB_LABELS[0] && (
        <PatientInfoTab
          lead={activeLead}
          leadPhone={leadPhone}
          leadEmail={leadEmail}
          leadLocation={leadLocation}
          leadGender={leadGender}
          leadAge={leadAge}
          leadMaritalStatus={leadMaritalStatus}
          leadAddress={leadAddress}
          leadLanguage={leadLanguage}
          leadAssigned={leadAssigned}
          leadCreatedAt={leadCreatedAt}
          partnerName={partnerName}
          partnerAge={partnerAge}
          partnerGender={partnerGender}
          leadSource={leadSource}
          leadSubSource={leadSubSource}
          leadCampaignName={leadCampaignName}
          leadCampaignDuration={leadCampaignDuration}
          hasAppointment={hasAppointment}
          appointmentDepartment={appointmentDepartment}
          appointmentPersonnel={appointmentPersonnel}
          appointmentDate={appointmentDate}
          appointmentSlot={appointmentSlot}
          appointmentRemark={appointmentRemark}
          treatmentInterest={treatmentInterest}
          documents={documents}
          docsLoading={docsLoading}
          docsError={docsError}
          onClearDocsError={() => setDocsError(null)}
          onBookAppointment={handleBookAppointment}
        />
      )}

      {activeTab === "History" && (
        <HistoryTab
          lead={activeLead}
          historyView={historyView}
          setHistoryView={setHistoryView}
          leadName={leadName}
          leadPhone={leadPhone}
          leadEmail={leadEmail}
          leadAssigned={leadAssigned}
          leadCreatedAt={leadCreatedAt}
          appointmentDate={appointmentDate}
          appointmentSlot={appointmentSlot}
          appointmentDepartment={appointmentDepartment}
          appointmentPersonnel={appointmentPersonnel}
          appointmentRemark={appointmentRemark}
          treatmentInterest={treatmentInterest}
          hasAppointment={hasAppointment}
          callHistory={callHistory}
          callHistoryLoading={callHistoryLoading}
          callHistoryError={callHistoryError}
          onRefreshCallHistory={() => fetchCallHistory(activeLead.id)}
          smsHistory={smsHistory}
          smsHistoryLoading={smsHistoryLoading}
          smsHistoryError={smsHistoryError}
          onRefreshSmsHistory={() => fetchSMSHistory(activeLead.id)}
          emailHistory={emailHistory}
          emailHistoryLoading={emailHistoryLoading}
          onRefreshEmailHistory={() => fetchEmailHistory(activeLead.id)}
        />
      )}

      {activeTab === "Next Action" && (
        <NextActionTab
          lead={activeLead}
          nextActionType={nextActionType}
          nextActionStatus={nextActionStatus}
          nextActionDescription={nextActionDescription}
          isAppointment={isAppointment}
          isFollowUp={isFollowUp}
          availableActions={availableActions}
          openAddActionDialog={openAddActionDialog}
          setOpenAddActionDialog={setOpenAddActionDialog}
          actionType={actionType}
          setActionType={setActionType}
          actionStatus={actionStatus}
          setActionStatus={setActionStatus}
          actionDescription={actionDescription}
          setActionDescription={setActionDescription}
          actionSubmitting={actionSubmitting}
          actionError={actionError}
          setActionError={setActionError}
          onAddNextAction={handleAddNextAction}
          onCloseActionDialog={closeActionDialog}
          notes={notes}
          notesLoading={notesLoading}
          notesError={notesError}
          setNotesError={setNotesError}
          editingNoteId={editingNoteId}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editContent={editContent}
          setEditContent={setEditContent}
          editSubmitting={editSubmitting}
          newNoteTitle={newNoteTitle}
          setNewNoteTitle={setNewNoteTitle}
          newNoteContent={newNoteContent}
          setNewNoteContent={setNewNoteContent}
          noteSubmitting={noteSubmitting}
          deleteNoteDialog={deleteNoteDialog}
          setDeleteNoteDialog={setDeleteNoteDialog}
          onStartEditNote={handleStartEdit}
          onCancelEditNote={handleCancelEdit}
          onSaveEditNote={handleSaveEdit}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
        />
      )}

      <BookAppointmentModal
        open={bookApptOpen}
        lead={activeLead}
        onClose={() => setBookApptOpen(false)}
        onSaved={handleAppointmentSaved}
      />

      <Dialog
        open={openConvertPopup}
        onClose={convertLoading ? undefined : handleClosePopup}
        PaperProps={{
          sx: {
            borderRadius: "24px",
            p: 4,
            textAlign: "center",
            maxWidth: "420px",
            boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Stack alignItems="center" spacing={2.5}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#FFF7ED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SwapHorizIcon sx={{ fontSize: 32, color: "#F97316" }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Convert Lead
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, lineHeight: 1.6 }}
              >
                Are you sure you want to Convert <b>"{leadName}"</b> lead into a
                patient &amp; register it?
              </Typography>
            </Box>
            {convertError && (
              <Alert
                severity="error"
                sx={{ width: "100%", borderRadius: "10px", textAlign: "left" }}
              >
                {convertError}
              </Alert>
            )}
            <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 2 }}>
              <Button
                fullWidth
                onClick={handleClosePopup}
                variant="outlined"
                disabled={convertLoading}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#232323",
                  borderColor: "#232323",
                  py: 1.2,
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleConvertLead}
                disabled={convertLoading}
                sx={{
                  bgcolor: "#505050",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.2,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#232323" },
                  "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" },
                }}
              >
                {convertLoading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  "Convert"
                )}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <EmailDialog
        open={emailDialogOpen}
        lead={activeLead}
        onClose={() => setEmailDialogOpen(false)}
        onSent={() => {
          setActiveTab("History");
          setHistoryView("email");
          fetchEmailHistory(activeLead.id);
        }}
      />

      <Dialogs />
    </Box>
  );
}
