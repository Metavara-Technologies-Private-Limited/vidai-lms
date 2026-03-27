import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Avatar,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Menu,
  Popover,
  InputBase,
  Checkbox,
  Radio,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

import { useSelector } from "react-redux";
import { selectLeads } from "../../store/leadSlice";
import type { Lead } from "../../services/leads.api";
import {
  LeadEmailAPI,
  EmailTemplateAPI,
  TwilioAPI,
} from "../../services/leads.api";
import type { LeadMailListItem, EmailTemplate } from "../../services/leads.api";
import type { TwilioCall, TwilioSMS } from "./LeadDetailTypes";
import {
  formatDateTime,
  getCallStatusColor,
  getSMSStatusColor,
} from "./LeadDetailHelpers";
import { toast } from "react-toastify";
import TemplateService from "../../services/templates.api";
import { normalizePhone } from "./LeadsTable.helpers";

// ── Shared toast options ──────────────────────────────────────────────────────
const toastOptions = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "colored" as const,
};
const toastErrorOptions = {
  position: "top-right" as const,
  autoClose: 4000,
  theme: "colored" as const,
};

// ── Clinic ID ─────────────────────────────────────────────────────────────────
const CLINIC_ID = 1;

// ── SMS Use-case options ──────────────────────────────────────────────────────
const USE_CASE_OPTIONS = [
  "appointment",
  "follow-up",
  "reminder",
  "promotion",
  "general",
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const isValidEmail = (val: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

const normalizeEmail = (e: string) => e.trim().toLowerCase();

const decodeEntities = (str: string): string => {
  try {
    const el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  } catch {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
};

const stripHtml = (html: string): string => {
  if (!html) return "";
  let text = decodeEntities(html);
  text = decodeEntities(text);
  text = text
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<\/div\s*>/gi, "\n")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]\s*>/gi, "\n")
    .replace(/<\/tr\s*>/gi, "\n");
  text = text.replace(/<[^>]*>/g, "");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

const statusMap: Record<string, { bg: string; color: string; border: string }> =
  {
    New: { bg: "#F3F3FF", color: "#6C6CFF", border: "#7C7CFF" },
    Appointment: { bg: "#EEF4FF", color: "#2F6FFF", border: "#4C8DFF" },
    "Follow-Ups": { bg: "#FFF6E5", color: "#FF9F0A", border: "#FFB020" },
    Converted: { bg: "#EAFBF1", color: "#16A34A", border: "#22C55E" },
    Lost: { bg: "#FDECEC", color: "#E5484D", border: "#FF5A5F" },
    Contacted: { bg: "#EAFBF1", color: "#16A34A", border: "#22C55E" },
    "Cycle Conversion": { bg: "#FFF6E5", color: "#FF9F0A", border: "#FFB020" },
  };

const getEmailStatusSx = (status: string) => {
  const s = (status || "").toUpperCase();
  if (s === "SENT") return { bgcolor: "#ECFDF5", color: "#10B981" };
  if (s === "DRAFT") return { bgcolor: "#F1F5F9", color: "#64748B" };
  if (s === "FAILED") return { bgcolor: "#FEF2F2", color: "#EF4444" };
  if (s === "SCHEDULED") return { bgcolor: "#EFF6FF", color: "#3B82F6" };
  if (s === "CANCELLED") return { bgcolor: "#FFF7ED", color: "#F59E0B" };
  return { bgcolor: "#F1F5F9", color: "#64748B" };
};

const getUseCaseSx = (uc: string) => {
  const map: Record<string, { bgcolor: string; color: string }> = {
    appointment: { bgcolor: "#EFF6FF", color: "#2563EB" },
    "follow-up": { bgcolor: "#F0FDF4", color: "#16A34A" },
    reminder: { bgcolor: "#FFF7ED", color: "#EA580C" },
    promotion: { bgcolor: "#FAF5FF", color: "#7C3AED" },
    general: { bgcolor: "#F1F5F9", color: "#475569" },
  };
  return map[uc.toLowerCase()] ?? { bgcolor: "#F1F5F9", color: "#475569" };
};

/* ── SMS template shape ──────────────────────────────────────────────────── */
interface SMSTemplate {
  id: number | string;
  name: string;
  body: string;
  use_case?: string;
}

/* ── Fetch SMS templates ─────────────────────────────────────────────────── */
const fetchSMSTemplates = async (): Promise<SMSTemplate[]> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (TemplateService as any).getTemplates("sms");
    return data || [];
  } catch {
    return [];
  }
};

/* ── Save new SMS template ──────────────────────────────────────────────── */
const saveNewSMSTemplate = async (payload: {
  name: string;
  body: string;
  use_case?: string;
}): Promise<SMSTemplate> => {
  const res = await fetch("/api/sms-templates/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save template");
  return res.json();
};

/* ── Fetch clinic From email ─────────────────────────────────────────────── */
const fetchClinicEmail = async (): Promise<string> => {
  try {
    const res = await fetch(`/api/clinics/${CLINIC_ID}/detail/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
      },
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.email ?? "";
  } catch {
    return "";
  }
};

/* ── addEmailsFromInput helper ──────────────────────────────────────────── */
const addEmailsFromInput = (
  raw: string,
  existing: string[],
  setter: React.Dispatch<React.SetStateAction<string[]>>,
) => {
  const emails = raw
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(
      (e) =>
        isValidEmail(e) &&
        !existing.map(normalizeEmail).includes(normalizeEmail(e)),
    );
  if (emails.length) setter((prev) => [...prev, ...emails]);
};

type TabType = "email" | "sms" | "call";
type SMSDialogStep = "compose" | "templates" | "preview" | "newTemplate";
type NewTplView = "form" | "preview";

/* ════════════════════════════════════════════════════════════════════════════
   SMS — 4-step dialog suite
   ════════════════════════════════════════════════════════════════════════════ */
interface SMSSuiteProps {
  open: boolean;
  lead: Lead;
  onClose: () => void;
  onSent: () => void;
}

const SMSSuite: React.FC<SMSSuiteProps> = ({ open, lead, onClose, onSent }) => {
  const [step, setStep] = React.useState<SMSDialogStep>("compose");
  const [smsMessage, setSmsMsg] = React.useState("");
  const [smsError, setSmsError] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState(false);

  // templates list
  const [templates, setTemplates] = React.useState<SMSTemplate[]>([]);
  const [tplLoading, setTplLoading] = React.useState(false);
  const [selectedTpl, setSelectedTpl] = React.useState<SMSTemplate | null>(
    null,
  );
  const [previewBody, setPreviewBody] = React.useState("");

  // new template
  const [newTplView, setNewTplView] = React.useState<NewTplView>("form");
  const [newTplName, setNewTplName] = React.useState("");
  const [newTplBody, setNewTplBody] = React.useState("");
  const [newTplUseCase, setNewTplUseCase] = React.useState("");
  const [newTplError, setNewTplError] = React.useState<string | null>(null);
  const [newTplSaving, setNewTplSaving] = React.useState(false);
  const [useCaseAnchor, setUseCaseAnchor] = React.useState<HTMLElement | null>(
    null,
  );

  // Reset on open
  React.useEffect(() => {
    if (!open) return;
    setStep("compose");
    setSmsMsg("");
    setSmsError(null);
    setSelectedTpl(null);
    setPreviewBody("");
    setNewTplView("form");
    setNewTplName("");
    setNewTplBody("");
    setNewTplUseCase("");
    setNewTplError(null);
  }, [open]);

  const loadTemplates = async () => {
    setTplLoading(true);
    const data = await fetchSMSTemplates();
    setTemplates(data);
    setTplLoading(false);
  };

  const openTemplates = () => {
    loadTemplates();
    setStep("templates");
  };

  const handlePickTemplate = (tpl: SMSTemplate) => {
    setSelectedTpl(tpl);
    setPreviewBody(tpl.body);
    setStep("preview");
  };

  const handleUseTemplate = () => {
    setSmsMsg(previewBody);
    setStep("compose");
  };

  const handleSend = async () => {
    if (!smsMessage.trim()) {
      setSmsError("Message cannot be empty");
      return;
    }

    const phone = normalizePhone(lead?.contact_no as string | undefined);

    if (!phone) {
      setSmsError("This lead has no contact number.");
      return;
    }

    if (!lead?.id) {
      setSmsError("Lead ID is missing. Cannot send SMS.");
      return;
    }

    setIsSending(true);

    try {
      await TwilioAPI.sendSMS({
        lead_uuid: lead.id,
        to: phone,
        message: smsMessage.trim(),
      });

      toast.success(`SMS sent to ${lead.full_name || "Patient"}!`);

      setTimeout(() => {
        onSent();
        onClose();
      }, 800);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("SMS ERROR:", err);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to send SMS.";

      setSmsError(msg);
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveNewTemplate = async () => {
    if (!newTplName.trim()) {
      setNewTplError("Template name is required.");
      return;
    }
    if (!newTplBody.trim()) {
      setNewTplError("Body is required.");
      return;
    }
    setNewTplSaving(true);
    try {
      const saved = await saveNewSMSTemplate({
        name: newTplName.trim(),
        body: newTplBody.trim(),
        use_case: newTplUseCase || undefined,
      });
      toast.success("Template saved!", toastOptions);
      setSmsMsg(saved.body);
      setStep("compose");
    } catch {
      setNewTplError("Failed to save template. Please try again.");
    } finally {
      setNewTplSaving(false);
    }
  };

  const dialogSx = { borderRadius: "16px" };

  return (
    <>
      {/* STEP 1 — COMPOSE */}
      <Dialog
        open={open && step === "compose"}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1 }}>
          Send SMS
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                bgcolor: "#F8FAFC",
                borderRadius: "10px",
                px: 2,
                py: 1.5,
                border: "1px solid #E2E8F0",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="12px"
              >
                Sending to
              </Typography>
              <Typography fontWeight={600} fontSize="14px">
                {lead.full_name}
                {lead.contact_no && (
                  <Typography
                    component="span"
                    fontSize={12}
                    color="text.secondary"
                    fontWeight={400}
                    ml={1}
                  >
                    {lead.contact_no}
                  </Typography>
                )}
              </Typography>
            </Box>
            <TextField
              label="Message"
              multiline
              rows={4}
              value={smsMessage}
              onChange={(e) => {
                setSmsMsg(e.target.value);
                setSmsError(null);
              }}
              disabled={isSending}
              placeholder="Type your message here..."
              inputProps={{ maxLength: 1600 }}
              helperText={`${smsMessage.length}/1600`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
            {smsError && (
              <Alert
                severity="error"
                sx={{ borderRadius: "8px" }}
                onClose={() => setSmsError(null)}
              >
                {smsError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 0,
            flexDirection: "column",
            gap: 1,
            alignItems: "stretch",
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={openTemplates}
            disabled={isSending}
            sx={{
              height: 44,
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "8px",
              borderColor: "#D1D5DB",
              color: "#374151",
              "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" },
            }}
          >
            SMS Template
          </Button>
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button
              fullWidth
              onClick={onClose}
              disabled={isSending}
              sx={{
                height: 44,
                bgcolor: "#F3F4F6",
                color: "black",
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "8px",
                "&:hover": { bgcolor: "#E5E7EB" },
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleSend}
              disabled={isSending || !smsMessage.trim()}
              startIcon={
                isSending ? (
                  <CircularProgress size={16} sx={{ color: "white" }} />
                ) : null
              }
              sx={{
                height: 44,
                bgcolor: "#1F2937",
                color: "white",
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "8px",
                "&:hover": { bgcolor: "#111827" },
                "&:disabled": { bgcolor: "#9CA3AF", color: "white" },
              }}
            >
              {isSending ? "Sending..." : "Send SMS"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* STEP 2 — SELECT TEMPLATE */}
      <Dialog
        open={open && step === "templates"}
        onClose={() => setStep("compose")}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogSx }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={600}>Select SMS Template</Typography>
          <IconButton size="small" onClick={() => setStep("compose")}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 1, pb: 0 }}>
          {tplLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : templates.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <ChatBubbleOutlineIcon
                sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
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
                      sx={{
                        borderRadius: "8px",
                        px: 1.5,
                        py: 1.25,
                        "&:hover": { bgcolor: "#F8FAFC" },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              fontSize="14px"
                              fontWeight={600}
                              color="#1E293B"
                            >
                              {tpl.name}
                            </Typography>
                            {tpl.use_case && (
                              <Chip
                                label={tpl.use_case}
                                size="small"
                                sx={{
                                  ...getUseCaseSx(tpl.use_case),
                                  fontSize: "11px",
                                  height: 20,
                                  textTransform: "capitalize",
                                }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Typography
                            fontSize="12px"
                            color="#64748B"
                            sx={{
                              mt: 0.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
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
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            flexDirection: "column",
            gap: 1,
            alignItems: "stretch",
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setNewTplView("form");
              setStep("newTemplate");
            }}
            sx={{
              height: 44,
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "8px",
              borderColor: "#D1D5DB",
              color: "#374151",
              "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" },
            }}
          >
            + New Template
          </Button>
          <Button
            fullWidth
            onClick={() => setStep("compose")}
            sx={{
              height: 44,
              bgcolor: "#F3F4F6",
              color: "black",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#E5E7EB" },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* STEP 3 — PREVIEW TEMPLATE */}
      <Dialog
        open={open && step === "preview"}
        onClose={() => setStep("templates")}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogSx }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={600}>Preview Template</Typography>
          <IconButton size="small" onClick={() => setStep("templates")}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {selectedTpl && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontSize="13px" color="#64748B">
                  Template:
                </Typography>
                <Typography fontSize="13px" fontWeight={600} color="#1E293B">
                  {selectedTpl.name}
                </Typography>
                {selectedTpl.use_case && (
                  <Chip
                    label={selectedTpl.use_case}
                    size="small"
                    sx={{
                      ...getUseCaseSx(selectedTpl.use_case),
                      fontSize: "11px",
                      height: 20,
                      textTransform: "capitalize",
                    }}
                  />
                )}
              </Stack>
            )}
            {/* SMS bubble preview */}
            <Box
              sx={{
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                p: 2,
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <Box
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "0px 12px 12px 12px",
                  px: 2,
                  py: 1.25,
                  maxWidth: "90%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <Typography
                  fontSize="13px"
                  color="#1E293B"
                  sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
                >
                  {previewBody.split(/(\{[^}]+\})/g).map((part, i) =>
                    /^\{[^}]+\}$/.test(part) ? (
                      <Box
                        key={i}
                        component="span"
                        sx={{ color: "#4F46E5", fontWeight: 500 }}
                      >
                        {part}
                      </Box>
                    ) : (
                      part
                    ),
                  )}
                </Typography>
              </Box>
              <Typography
                fontSize="11px"
                color="#94A3B8"
                sx={{ mt: 0.75, alignSelf: "flex-end" }}
              >
                {new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
            <TextField
              label="Edit message before sending"
              multiline
              rows={4}
              value={previewBody}
              onChange={(e) => setPreviewBody(e.target.value)}
              inputProps={{ maxLength: 1600 }}
              helperText={`${previewBody.length}/1600`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            fullWidth
            onClick={() => setStep("templates")}
            sx={{
              height: 44,
              bgcolor: "#F3F4F6",
              color: "black",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#E5E7EB" },
            }}
          >
            Back
          </Button>
          <Button
            fullWidth
            onClick={handleUseTemplate}
            disabled={!previewBody.trim()}
            sx={{
              height: 44,
              bgcolor: "#1F2937",
              color: "white",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#111827" },
              "&:disabled": { bgcolor: "#9CA3AF", color: "white" },
            }}
          >
            Use Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* STEP 4 — NEW TEMPLATE */}
      <Dialog
        open={open && step === "newTemplate"}
        onClose={() => setStep("templates")}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogSx }}
      >
        {newTplView === "form" && (
          <>
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography fontWeight={700} fontSize="1.05rem">
                New SMS Template
              </Typography>
              <IconButton size="small" onClick={() => setStep("templates")}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <DialogContent sx={{ pt: 2 }}>
              <Stack spacing={2.5}>
                <TextField
                  placeholder="Name"
                  value={newTplName}
                  onChange={(e) => {
                    setNewTplName(e.target.value);
                    setNewTplError(null);
                  }}
                  fullWidth
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                />
                <Box>
                  <Typography
                    fontSize="13px"
                    fontWeight={500}
                    color="#374151"
                    mb={0.75}
                  >
                    Use Case
                  </Typography>
                  <Box
                    onClick={(e) =>
                      setUseCaseAnchor(e.currentTarget as HTMLElement)
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid",
                      borderColor: useCaseAnchor ? "#1976d2" : "#D1D5DB",
                      borderRadius: "8px",
                      px: 1.5,
                      cursor: "pointer",
                      minHeight: 42,
                      bgcolor: "#fff",
                      boxShadow: useCaseAnchor
                        ? "0 0 0 2px rgba(25,118,210,0.15)"
                        : "none",
                      "&:hover": { borderColor: "#9CA3AF" },
                      transition: "all 0.15s",
                    }}
                  >
                    {newTplUseCase ? (
                      <Chip
                        label={newTplUseCase}
                        size="small"
                        sx={getUseCaseSx(newTplUseCase)}
                      />
                    ) : (
                      <Typography fontSize="14px" color="#9CA3AF">
                        Select use case
                      </Typography>
                    )}
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "#6B7280",
                        transform: useCaseAnchor ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    >
                      ▼
                    </Typography>
                  </Box>
                  <Menu
                    anchorEl={useCaseAnchor}
                    open={!!useCaseAnchor}
                    onClose={() => setUseCaseAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    PaperProps={{
                      sx: {
                        borderRadius: "10px",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                        mt: 0.5,
                        minWidth: 220,
                      },
                    }}
                  >
                    {USE_CASE_OPTIONS.map((uc) => (
                      <MenuItem
                        key={uc}
                        selected={newTplUseCase === uc}
                        onClick={() => {
                          setNewTplUseCase(uc);
                          setUseCaseAnchor(null);
                        }}
                        sx={{
                          py: 1,
                          px: 1.5,
                          "&.Mui-selected": { bgcolor: "#F1F5F9" },
                          "&:hover": { bgcolor: "#F8FAFC" },
                        }}
                      >
                        <Chip label={uc} size="small" sx={getUseCaseSx(uc)} />
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
                <Box>
                  <Typography
                    fontSize="13px"
                    fontWeight={500}
                    color="#374151"
                    mb={0.75}
                  >
                    Body
                  </Typography>
                  <textarea
                    value={newTplBody}
                    onChange={(e) => {
                      setNewTplBody(e.target.value);
                      setNewTplError(null);
                    }}
                    placeholder="Type your message here..."
                    maxLength={1600}
                    rows={7}
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
                      background: "#fff",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#1976d2";
                      e.target.style.boxShadow =
                        "0 0 0 2px rgba(25,118,210,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#D1D5DB";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <Typography fontSize="11px" color="#94A3B8" mt={0.5}>
                    {newTplBody.length}/1600 — Use {"{variable_name}"} for
                    dynamic fields
                  </Typography>
                </Box>
                {newTplError && (
                  <Alert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>
                    {newTplError}
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
              <Button
                onClick={() => setStep("templates")}
                sx={{
                  height: 44,
                  px: 3,
                  textTransform: "none",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  color: "#374151",
                  bgcolor: "white",
                  "&:hover": { bgcolor: "#F9FAFB" },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!newTplName.trim()) {
                    setNewTplError("Name is required.");
                    return;
                  }
                  if (!newTplBody.trim()) {
                    setNewTplError("Body is required.");
                    return;
                  }
                  setNewTplError(null);
                  setNewTplView("preview");
                }}
                sx={{
                  height: 44,
                  px: 3,
                  textTransform: "none",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  color: "#374151",
                  bgcolor: "white",
                  "&:hover": { bgcolor: "#F9FAFB" },
                }}
              >
                Preview
              </Button>
              <Button
                onClick={handleSaveNewTemplate}
                disabled={
                  newTplSaving || !newTplName.trim() || !newTplBody.trim()
                }
                sx={{
                  height: 44,
                  px: 3,
                  textTransform: "none",
                  borderRadius: "8px",
                  bgcolor: "#1F2937",
                  color: "white",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#111827" },
                  "&:disabled": { bgcolor: "#9CA3AF", color: "white" },
                }}
              >
                {newTplSaving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </>
        )}
        {newTplView === "preview" && (
          <>
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography fontWeight={700} fontSize="1.05rem">
                Preview Template
              </Typography>
              <IconButton size="small" onClick={() => setStep("templates")}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <DialogContent sx={{ pt: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Typography fontSize="13px" color="#64748B">
                  Template:
                </Typography>
                <Typography fontSize="13px" fontWeight={600} color="#1E293B">
                  {newTplName}
                </Typography>
                {newTplUseCase && (
                  <Chip
                    label={newTplUseCase}
                    size="small"
                    sx={getUseCaseSx(newTplUseCase)}
                  />
                )}
              </Stack>
              <Box
                sx={{
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  p: 2,
                  minHeight: 160,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <Box
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "0px 12px 12px 12px",
                    px: 2,
                    py: 1.25,
                    maxWidth: "90%",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <Typography
                    fontSize="13px"
                    color="#1E293B"
                    sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}
                  >
                    {newTplBody.split(/(\{[^}]+\})/g).map((part, i) =>
                      /^\{[^}]+\}$/.test(part) ? (
                        <Box
                          key={i}
                          component="span"
                          sx={{ color: "#4F46E5", fontWeight: 600 }}
                        >
                          {part}
                        </Box>
                      ) : (
                        part
                      ),
                    )}
                  </Typography>
                </Box>
                <Typography
                  fontSize="11px"
                  color="#94A3B8"
                  sx={{ mt: 0.75, alignSelf: "flex-end" }}
                >
                  {new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
              <Button
                onClick={() => setNewTplView("form")}
                sx={{
                  height: 44,
                  px: 3,
                  textTransform: "none",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  color: "#374151",
                  bgcolor: "white",
                  "&:hover": { bgcolor: "#F9FAFB" },
                }}
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleSaveNewTemplate}
                disabled={newTplSaving}
                sx={{
                  height: 44,
                  px: 3,
                  textTransform: "none",
                  borderRadius: "8px",
                  bgcolor: "#1F2937",
                  color: "white",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#111827" },
                  "&:disabled": { bgcolor: "#9CA3AF", color: "white" },
                }}
              >
                {newTplSaving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Email — selector + rich compose dialog suite
   ════════════════════════════════════════════════════════════════════════════ */
interface EmailSuiteProps {
  open: boolean;
  lead: Lead;
  onClose: () => void;
  onSent: () => void;
}

type EmailStep = "selector" | "compose";

const EmailSuite: React.FC<EmailSuiteProps> = ({
  open,
  lead,
  onClose,
  onSent,
}) => {
  const [step, setStep] = React.useState<EmailStep>("selector");

  // selector state
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  const [templatesError, setTemplatesError] = React.useState<string | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    React.useState<EmailTemplate | null>(null);

  // compose state
  const [fromEmail, setFromEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [messageBody, setMessageBody] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);

  // TO / CC / BCC
  const [replyTo, setReplyTo] = React.useState<string[]>([]);
  const [replyCc, setReplyCc] = React.useState<string[]>([]);
  const [replyBcc, setReplyBcc] = React.useState<string[]>([]);
  const [showCc, setShowCc] = React.useState(false);
  const [showBcc, setShowBcc] = React.useState(false);
  const [toInput, setToInput] = React.useState("");
  const [ccInput, setCcInput] = React.useState("");
  const [bccInput, setBccInput] = React.useState("");

  // popover anchors
  const toRowRef = React.useRef<HTMLDivElement>(null);
  const ccFieldRef = React.useRef<HTMLDivElement>(null);
  const bccFieldRef = React.useRef<HTMLDivElement>(null);
  const toPickerPaperRef = React.useRef<HTMLDivElement | null>(null);
  const ccPickerPaperRef = React.useRef<HTMLDivElement | null>(null);
  const bccPickerPaperRef = React.useRef<HTMLDivElement | null>(null);
  const [toAnchorEl, setToAnchorEl] = React.useState<HTMLElement | null>(null);
  const [ccAnchorEl, setCcAnchorEl] = React.useState<HTMLElement | null>(null);
  const [bccAnchorEl, setBccAnchorEl] = React.useState<HTMLElement | null>(
    null,
  );

  // lead recipients (just this single lead for conversation view)
  const recipients = React.useMemo(
    () =>
      lead.email
        ? [{ id: lead.id, name: lead.full_name, email: lead.email }]
        : [],
    [lead.email, lead.id, lead.full_name],
  );

  const filteredToRecipients = recipients.filter(
    (r) => !replyTo.map(normalizeEmail).includes(normalizeEmail(r.email)),
  );
  const filteredCcRecipients = recipients.filter(
    (r) => !replyCc.map(normalizeEmail).includes(normalizeEmail(r.email)),
  );
  const filteredBccRecipients = recipients.filter(
    (r) => !replyBcc.map(normalizeEmail).includes(normalizeEmail(r.email)),
  );

  const toggleToRecipient = (email: string) => {
    setReplyTo((prev) =>
      prev.map(normalizeEmail).includes(normalizeEmail(email))
        ? prev.filter((e) => normalizeEmail(e) !== normalizeEmail(email))
        : [...prev, email],
    );
  };

  // ── FIX: renamed unused `list` parameter to `_list` to resolve TS6133 ──
  const toggleRecipient = (
    email: string,
    _list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.map(normalizeEmail).includes(normalizeEmail(email))
        ? prev.filter((e) => normalizeEmail(e) !== normalizeEmail(email))
        : [...prev, email],
    );
  };

  // load templates & from-email on open
  const loadTemplates = React.useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const data = await EmailTemplateAPI.list();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setTemplatesError("Failed to load templates.");
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setStep("selector");
    setSelectedTemplate(null);
    setPreviewTemplate(null);
    setSubject("");
    setMessageBody("");
    setSendError(null);
    setReplyTo(lead.email ? [lead.email] : []);
    setReplyCc([]);
    setReplyBcc([]);
    setShowCc(false);
    setShowBcc(false);
    setFromEmail("noreply@fertility.com");
    loadTemplates();
    fetchClinicEmail().then((e) => {
      setFromEmail(e || "noreply@fertility.com");
    });
  }, [open, lead.email, loadTemplates]);

  const handleSelectEmailTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t);
    setSubject(t.subject || "");
    setMessageBody(stripHtml(t.body || ""));
  };

  const goToCompose = () => {
    setReplyTo(lead.email ? [lead.email] : []);
    setStep("compose");
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !messageBody.trim() || replyTo.length === 0) return;
    setIsSending(true);
    setSendError(null);
    try {
      await LeadEmailAPI.sendNow({
        lead: lead.id,
        subject,
        email_body: messageBody.trim(),
        sender_email: fromEmail || null,
        scheduled_at: null,
        ...(replyCc.length > 0 && { cc: replyCc }),
        ...(replyBcc.length > 0 && { bcc: replyBcc }),
        ...(replyTo.filter((e) => e !== lead.email).length > 0 && {
          additional_to: replyTo.filter((e) => e !== lead.email),
        }),
      } as Parameters<typeof LeadEmailAPI.sendNow>[0]);
      toast.success(
        `Email sent to ${lead.full_name || "Patient"}!`,
        toastOptions,
      );
      setTimeout(() => {
        onSent();
        onClose();
      }, 800);
    } catch {
      setSendError("Failed to send email. Please try again.");
      toast.error("Failed to send email.", toastErrorOptions);
    } finally {
      setIsSending(false);
    }
  };

  const dialogSx = { borderRadius: "16px" };

  // suppress unused ref warnings — refs are passed to MUI PaperProps
  void toPickerPaperRef;
  void ccPickerPaperRef;
  void bccPickerPaperRef;

  return (
    <>
      {/* SELECTOR DIALOG */}
      <Dialog
        open={open && step === "selector"}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: dialogSx }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography fontWeight={600}>New Email</Typography>
            <Typography variant="caption" color="text.secondary">
              Sending to {lead.full_name}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent>
          {/* Compose from scratch */}
          <Box
            sx={{
              border: "1px dashed #D1D5DB",
              borderRadius: 2,
              py: 4,
              textAlign: "center",
              cursor: "pointer",
              mb: 3,
              "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" },
            }}
            onClick={() => {
              setSelectedTemplate(null);
              setSubject("");
              setMessageBody("");
              goToCompose();
            }}
          >
            <EditOutlinedIcon sx={{ color: "#6B7280" }} />
            <Typography fontWeight={500} mt={1} color="#374151">
              Compose New Email
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Write a custom message from scratch
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }}>OR USE A TEMPLATE</Divider>
          {templatesLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress size={22} />
            </Box>
          )}
          {!templatesLoading && templatesError && (
            <Alert
              severity="error"
              sx={{ borderRadius: "10px", mb: 2 }}
              action={
                <Button size="small" onClick={loadTemplates}>
                  Retry
                </Button>
              }
            >
              {templatesError}
            </Alert>
          )}
          {!templatesLoading && !templatesError && templates.length === 0 && (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <EmailOutlinedIcon
                sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                No active email templates found.
              </Typography>
            </Box>
          )}
          {!templatesLoading &&
            !templatesError &&
            templates.map((t) => (
              <Box
                key={t.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 2,
                  px: 1,
                  borderBottom: "1px solid #F3F4F6",
                  cursor: "pointer",
                  borderRadius: 1,
                  bgcolor:
                    selectedTemplate?.id === t.id ? "#F0F9FF" : "transparent",
                  "&:hover": {
                    bgcolor:
                      selectedTemplate?.id === t.id ? "#F0F9FF" : "#F9FAFB",
                  },
                }}
                onClick={() => handleSelectEmailTemplate(t)}
              >
                <Radio
                  checked={selectedTemplate?.id === t.id}
                  onChange={() => handleSelectEmailTemplate(t)}
                  size="small"
                />
                <Box sx={{ flex: 1, ml: 0.5, minWidth: 0 }}>
                  <Typography fontSize="14px" fontWeight={600} noWrap>
                    {t.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {t.subject}
                  </Typography>
                </Box>
                {(t as EmailTemplate & { use_case?: string }).use_case && (
                  <Chip
                    label={
                      (t as EmailTemplate & { use_case?: string }).use_case
                    }
                    size="small"
                    sx={{
                      ...getUseCaseSx(
                        (t as EmailTemplate & { use_case?: string }).use_case!,
                      ),
                      fontSize: "11px",
                      height: 20,
                      mr: 1,
                      textTransform: "capitalize",
                    }}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(t);
                  }}
                  sx={{ color: "#6B7280" }}
                >
                  <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ borderColor: "#D1D5DB", color: "#374151" }}
          >
            Cancel
          </Button>
          <Button
            onClick={goToCompose}
            variant="contained"
            disabled={!selectedTemplate}
            sx={{
              bgcolor: "#111827",
              "&:hover": { bgcolor: "#000" },
              "&:disabled": { bgcolor: "#E5E7EB", color: "#9CA3AF" },
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* TEMPLATE PREVIEW DIALOG */}
      <Dialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogSx }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography fontWeight={600}>{previewTemplate?.name}</Typography>
            {(previewTemplate as (EmailTemplate & { use_case?: string }) | null)
              ?.use_case && (
              <Chip
                label={
                  (previewTemplate as EmailTemplate & { use_case?: string })
                    .use_case
                }
                size="small"
                sx={{
                  ...getUseCaseSx(
                    (previewTemplate as EmailTemplate & { use_case?: string })
                      .use_case!,
                  ),
                  fontSize: "11px",
                  height: 20,
                  mt: 0.5,
                  textTransform: "capitalize",
                }}
              />
            )}
          </Box>
          <IconButton onClick={() => setPreviewTemplate(null)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ px: 3 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{
              textTransform: "uppercase",
              fontSize: "0.6rem",
              letterSpacing: "0.5px",
            }}
          >
            SUBJECT
          </Typography>
          <Typography fontWeight={600} fontSize="14px" mb={2} mt={0.5}>
            {previewTemplate?.subject}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{
              textTransform: "uppercase",
              fontSize: "0.6rem",
              letterSpacing: "0.5px",
            }}
          >
            BODY
          </Typography>
          <Typography
            component="pre"
            sx={{
              mt: 0.5,
              p: 2,
              bgcolor: "#F8FAFC",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              fontSize: "13px",
              lineHeight: 1.75,
              fontFamily: "inherit",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
            }}
          >
            {stripHtml(previewTemplate?.body ?? "")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPreviewTemplate(null)}
            variant="outlined"
            sx={{ borderColor: "#D1D5DB", color: "#374151" }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (previewTemplate) handleSelectEmailTemplate(previewTemplate);
              setPreviewTemplate(null);
            }}
            sx={{ bgcolor: "#111827", "&:hover": { bgcolor: "#000" } }}
          >
            Use This Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* COMPOSE DIALOG */}
      <Dialog
        open={open && step === "compose"}
        onClose={() => !isSending && onClose()}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: dialogSx }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography fontWeight={600}>
              {selectedTemplate ? selectedTemplate.name : "New Email"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sending to {replyTo.length} recipient
              {replyTo.length > 1 ? "s" : ""}
            </Typography>
          </Box>
          <IconButton onClick={onClose} disabled={isSending}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {sendError && (
            <Alert
              severity="error"
              sx={{ borderRadius: "10px", mb: 2 }}
              onClose={() => setSendError(null)}
            >
              {sendError}
            </Alert>
          )}

          {/* FROM */}
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            pb={1.2}
            borderBottom="1px solid #E6E6E6"
          >
            <Typography fontSize={14} color="#7A7A7A" minWidth={48}>
              From :
            </Typography>
            <TextField
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              variant="standard"
              placeholder="Enter sender email"
              sx={{ minWidth: 260, "& .MuiInputBase-input": { fontSize: 14 } }}
              InputProps={{ disableUnderline: true }}
            />
          </Box>

          {/* TO */}
          <Box
            ref={toRowRef}
            display="flex"
            alignItems="flex-start"
            gap={1}
            py={1.5}
            borderBottom="1px solid #E6E6E6"
            sx={{ flexWrap: "wrap" }}
          >
            <Typography fontSize={14} color="#7A7A7A" minWidth={48}>
              To :
            </Typography>
            <Box
              display="flex"
              gap={1}
              flexWrap="wrap"
              flex={1}
              minWidth={180}
              sx={{
                maxHeight: "90px",
                overflowY: "auto",
                paddingRight: "8px",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-track": {
                  bgcolor: "#F3F4F6",
                  borderRadius: "3px",
                },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "#D1D5DB",
                  borderRadius: "3px",
                },
              }}
            >
              {replyTo.map((email) => (
                <Box
                  key={email}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  px={1.2}
                  py={0.5}
                  borderRadius="16px"
                  bgcolor="#F1F3F5"
                >
                  <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>
                    {email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography fontSize={13} fontWeight={500}>
                    {email}
                  </Typography>
                  <Box
                    component="span"
                    onClick={() =>
                      setReplyTo(replyTo.filter((m) => m !== email))
                    }
                    sx={{
                      cursor: "pointer",
                      fontSize: 16,
                      color: "#7A7A7A",
                      "&:hover": { color: "#000" },
                    }}
                  >
                    ×
                  </Box>
                </Box>
              ))}
              <InputBase
                value={toInput}
                placeholder="Add TO recipients"
                onFocus={() => {
                  if (recipients.length > 0 && toRowRef.current)
                    setToAnchorEl(toRowRef.current);
                }}
                onChange={(e) => setToInput(e.target.value)}
                onBlur={() => {
                  addEmailsFromInput(toInput, replyTo, setReplyTo);
                  setToInput("");
                }}
                onKeyDown={(e) => {
                  if (["Enter", ",", "Tab"].includes(e.key)) {
                    e.preventDefault();
                    addEmailsFromInput(toInput, replyTo, setReplyTo);
                    setToInput("");
                  }
                }}
                sx={{ minWidth: 140, fontSize: 14, flex: 1 }}
              />
            </Box>
            <Box display="flex" gap={1} ml="auto" pt={0.5}>
              <Typography
                onClick={() => setShowCc(!showCc)}
                sx={{
                  fontSize: 13,
                  cursor: "pointer",
                  color: showCc || replyCc.length > 0 ? "#232323" : "#9E9E9E",
                  fontWeight: showCc || replyCc.length > 0 ? 600 : 400,
                }}
              >
                Cc
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: "#9E9E9E", fontWeight: 600 }}
              >
                |
              </Typography>
              <Typography
                onClick={() => setShowBcc(!showBcc)}
                sx={{
                  fontSize: 13,
                  cursor: "pointer",
                  color: showBcc || replyBcc.length > 0 ? "#232323" : "#9E9E9E",
                  fontWeight: showBcc || replyBcc.length > 0 ? 600 : 400,
                }}
              >
                Bcc
              </Typography>
            </Box>
            <Popover
              open={!!toAnchorEl}
              anchorEl={toAnchorEl}
              onClose={() => setToAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              disableAutoFocus
              disableEnforceFocus
              disableRestoreFocus
              PaperProps={{
                ref: (node: HTMLDivElement) => {
                  toPickerPaperRef.current = node;
                },
                onMouseDown: (e: React.MouseEvent<HTMLDivElement>) =>
                  e.preventDefault(),
              }}
            >
              <Box sx={{ width: 320, maxHeight: 260, overflowY: "auto", p: 1 }}>
                {filteredToRecipients.length === 0 ? (
                  <Typography fontSize={13} color="text.secondary" p={1}>
                    No recipients available
                  </Typography>
                ) : (
                  filteredToRecipients.map((r) => (
                    <Box
                      key={r.id}
                      onClick={() => toggleToRecipient(r.email)}
                      sx={{
                        p: 0.8,
                        borderRadius: 1,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        "&:hover": { bgcolor: "#F5F5F5" },
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={replyTo
                          .map(normalizeEmail)
                          .includes(normalizeEmail(r.email))}
                        onChange={() => toggleToRecipient(r.email)}
                      />
                      <Box>
                        <Typography fontSize={13} fontWeight={500}>
                          {r.name}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                          {r.email}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Popover>
          </Box>

          {/* CC */}
          {(showCc || replyCc.length > 0) && (
            <Box
              ref={ccFieldRef}
              display="flex"
              alignItems="center"
              gap={1}
              py={1}
              borderBottom="1px solid #E6E6E6"
            >
              <Typography fontSize={14} color="#7A7A7A" minWidth={35}>
                Cc :
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" flex={1}>
                {replyCc.map((mail) => (
                  <Box
                    key={mail}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    px={1.2}
                    py={0.4}
                    borderRadius="16px"
                    bgcolor="#F1F3F5"
                  >
                    <Typography fontSize={13}>{mail}</Typography>
                    <Box
                      component="span"
                      sx={{ cursor: "pointer", fontSize: 15, color: "#666" }}
                      onClick={() =>
                        setReplyCc(
                          replyCc.filter(
                            (item) =>
                              normalizeEmail(item) !== normalizeEmail(mail),
                          ),
                        )
                      }
                    >
                      ×
                    </Box>
                  </Box>
                ))}
                <InputBase
                  value={ccInput}
                  placeholder="Add CC recipients"
                  onFocus={() => setCcAnchorEl(ccFieldRef.current)}
                  onChange={(e) => setCcInput(e.target.value)}
                  onBlur={() => {
                    addEmailsFromInput(ccInput, replyCc, setReplyCc);
                    setCcInput("");
                  }}
                  onKeyDown={(e) => {
                    if (["Enter", ",", "Tab"].includes(e.key)) {
                      e.preventDefault();
                      addEmailsFromInput(ccInput, replyCc, setReplyCc);
                      setCcInput("");
                    }
                  }}
                  sx={{ minWidth: 180, fontSize: 14, flex: 1 }}
                />
              </Box>
              <Popover
                open={!!ccAnchorEl}
                anchorEl={ccAnchorEl}
                onClose={() => setCcAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                disableAutoFocus
                disableEnforceFocus
                disableRestoreFocus
                PaperProps={{
                  ref: (node: HTMLDivElement) => {
                    ccPickerPaperRef.current = node;
                  },
                  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) =>
                    e.preventDefault(),
                }}
              >
                <Box
                  sx={{ width: 320, maxHeight: 240, overflowY: "auto", p: 1 }}
                >
                  {filteredCcRecipients.length === 0 ? (
                    <Typography fontSize={12} color="text.secondary" p={1}>
                      No matching recipients
                    </Typography>
                  ) : (
                    filteredCcRecipients.map((r) => (
                      <Box
                        key={`cc-${r.id}`}
                        onClick={() =>
                          toggleRecipient(r.email, replyCc, setReplyCc)
                        }
                        sx={{
                          p: 0.8,
                          borderRadius: 1,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          "&:hover": { bgcolor: "#F5F5F5" },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={replyCc
                            .map(normalizeEmail)
                            .includes(normalizeEmail(r.email))}
                          onChange={() =>
                            toggleRecipient(r.email, replyCc, setReplyCc)
                          }
                        />
                        <Box>
                          <Typography fontSize={13} fontWeight={500}>
                            {r.name}
                          </Typography>
                          <Typography fontSize={12} color="text.secondary">
                            {r.email}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Popover>
            </Box>
          )}

          {/* BCC */}
          {(showBcc || replyBcc.length > 0) && (
            <Box
              ref={bccFieldRef}
              display="flex"
              alignItems="center"
              gap={1}
              py={1}
              borderBottom="1px solid #E6E6E6"
            >
              <Typography fontSize={14} color="#7A7A7A" minWidth={40}>
                Bcc :
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" flex={1}>
                {replyBcc.map((mail) => (
                  <Box
                    key={mail}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    px={1.2}
                    py={0.4}
                    borderRadius="16px"
                    bgcolor="#F1F3F5"
                  >
                    <Typography fontSize={13}>{mail}</Typography>
                    <Box
                      component="span"
                      sx={{ cursor: "pointer", fontSize: 15, color: "#666" }}
                      onClick={() =>
                        setReplyBcc(
                          replyBcc.filter(
                            (item) =>
                              normalizeEmail(item) !== normalizeEmail(mail),
                          ),
                        )
                      }
                    >
                      ×
                    </Box>
                  </Box>
                ))}
                <InputBase
                  value={bccInput}
                  placeholder="Add BCC recipients"
                  onFocus={() => setBccAnchorEl(bccFieldRef.current)}
                  onChange={(e) => setBccInput(e.target.value)}
                  onBlur={() => {
                    addEmailsFromInput(bccInput, replyBcc, setReplyBcc);
                    setBccInput("");
                  }}
                  onKeyDown={(e) => {
                    if (["Enter", ",", "Tab"].includes(e.key)) {
                      e.preventDefault();
                      addEmailsFromInput(bccInput, replyBcc, setReplyBcc);
                      setBccInput("");
                    }
                  }}
                  sx={{ minWidth: 180, fontSize: 14, flex: 1 }}
                />
              </Box>
              <Popover
                open={!!bccAnchorEl}
                anchorEl={bccAnchorEl}
                onClose={() => setBccAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                disableAutoFocus
                disableEnforceFocus
                disableRestoreFocus
                PaperProps={{
                  ref: (node: HTMLDivElement) => {
                    bccPickerPaperRef.current = node;
                  },
                  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) =>
                    e.preventDefault(),
                }}
              >
                <Box
                  sx={{ width: 320, maxHeight: 240, overflowY: "auto", p: 1 }}
                >
                  {filteredBccRecipients.length === 0 ? (
                    <Typography fontSize={12} color="text.secondary" p={1}>
                      No matching recipients
                    </Typography>
                  ) : (
                    filteredBccRecipients.map((r) => (
                      <Box
                        key={`bcc-${r.id}`}
                        onClick={() =>
                          toggleRecipient(r.email, replyBcc, setReplyBcc)
                        }
                        sx={{
                          p: 0.8,
                          borderRadius: 1,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          "&:hover": { bgcolor: "#F5F5F5" },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={replyBcc
                            .map(normalizeEmail)
                            .includes(normalizeEmail(r.email))}
                          onChange={() =>
                            toggleRecipient(r.email, replyBcc, setReplyBcc)
                          }
                        />
                        <Box>
                          <Typography fontSize={13} fontWeight={500}>
                            {r.name}
                          </Typography>
                          <Typography fontSize={12} color="text.secondary">
                            {r.email}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Popover>
            </Box>
          )}

          {/* Subject */}
          <TextField
            fullWidth
            variant="standard"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            InputProps={{ disableUnderline: true }}
            sx={{ py: 1.5, borderBottom: "1px solid #E5E7EB", mt: 1 }}
            disabled={isSending}
          />

          {/* Body */}
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            placeholder="Type your message here..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontFamily: "inherit",
                fontSize: "13px",
                lineHeight: 1.75,
              },
            }}
            disabled={isSending}
          />
        </DialogContent>
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Toolbar icons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              border: "1px solid #E5E7EB",
              borderRadius: 2,
              px: 1,
              py: 0.5,
            }}
          >
            <IconButton size="small" disabled={isSending}>
              <Typography fontWeight="bold" fontSize="1.2rem">
                A
              </Typography>
            </IconButton>
            <IconButton size="small" disabled={isSending}>
              <AttachFileOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={isSending}>
              <LinkOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={isSending}>
              <EmojiEmotionsOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={isSending}>
              <ChangeHistoryIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={isSending}>
              <ImageOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={isSending}>
              <LockClockOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={isSending}>
              <CreateOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => setStep("selector")}
              variant="outlined"
              disabled={isSending}
              sx={{ borderColor: "#D1D5DB", color: "#374151" }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              disabled
              sx={{ bgcolor: "#F3F4F6", color: "#9CA3AF" }}
            >
              Save as Template
            </Button>
            <Button
              variant="contained"
              endIcon={
                isSending ? (
                  <CircularProgress size={16} sx={{ color: "white" }} />
                ) : (
                  <SendOutlinedIcon />
                )
              }
              onClick={handleSendEmail}
              disabled={
                !subject.trim() ||
                !messageBody.trim() ||
                replyTo.length === 0 ||
                isSending
              }
              sx={{
                bgcolor: "#4B5563",
                "&:hover": { bgcolor: "#374151" },
                "&:disabled": { bgcolor: "#E5E7EB", color: "#9CA3AF" },
                minWidth: 90,
              }}
            >
              {isSending ? "Sending..." : "Send"}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Main component — LeadsConversation
   ════════════════════════════════════════════════════════════════════════════ */
export default function LeadsConversation() {
  const allLeads = useSelector(selectLeads);
  const leads = React.useMemo(
    () => allLeads.filter((l) => l.is_active !== false),
    [allLeads],
  );

  const [search, setSearch] = React.useState("");
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>("email");

  const [emailHistory, setEmailHistory] = React.useState<LeadMailListItem[]>(
    [],
  );
  const [emailLoading, setEmailLoading] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [emailOpen, setEmailOpen] = React.useState(false);

  const [smsHistory, setSmsHistory] = React.useState<TwilioSMS[]>([]);
  const [smsLoading, setSmsLoading] = React.useState(false);
  const [smsError, setSmsError] = React.useState<string | null>(null);
  const [smsOpen, setSmsOpen] = React.useState(false);

  const [callHistory, setCallHistory] = React.useState<TwilioCall[]>([]);
  const [callLoading, setCallLoading] = React.useState(false);
  const [callError, setCallError] = React.useState<string | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (leads.length > 0 && !activeLead) setActiveLead(leads[0]);
  }, [leads, activeLead]);

  React.useEffect(() => {
    if (!activeLead) return;
    if (activeTab === "email") fetchEmails(activeLead.id);
    if (activeTab === "sms") fetchSMS(activeLead.id);
    if (activeTab === "call") fetchCalls(activeLead.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLead?.id, activeTab]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [emailHistory, smsHistory, callHistory]);

  const fetchEmails = async (id: string) => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      const data = await LeadEmailAPI.listByLead(id);
      setEmailHistory(Array.isArray(data) ? data : []);
    } catch {
      setEmailError("Failed to load email history.");
    } finally {
      setEmailLoading(false);
    }
  };

  const fetchSMS = async (id: string) => {
    setSmsLoading(true);
    setSmsError(null);
    try {
      const res = await fetch(
        `${(import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"}/twilio/sms/?lead_uuid=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
          },
        },
      );
      const data = await res.json();
      setSmsHistory(Array.isArray(data) ? data : []);
    } catch {
      setSmsError("Failed to load SMS history.");
    } finally {
      setSmsLoading(false);
    }
  };

  const fetchCalls = async (id: string) => {
    setCallLoading(true);
    setCallError(null);
    try {
      const res = await fetch(
        `${(import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"}/twilio/calls/?lead_uuid=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
          },
        },
      );
      const data = await res.json();
      setCallHistory(Array.isArray(data) ? data : []);
    } catch {
      setCallError("Failed to load call history.");
    } finally {
      setCallLoading(false);
    }
  };

  const handleCompose = () => {
    if (activeTab === "sms") setSmsOpen(true);
    else setEmailOpen(true);
  };

  const filteredLeads = React.useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.full_name.toLowerCase().includes(q) ||
        l.contact_no.includes(q) ||
        l.id.toLowerCase().includes(q),
    );
  }, [leads, search]);

  const activeStyle =
    statusMap[activeLead?.lead_status ?? "New"] ?? statusMap["New"];

  const tabBadge: Record<TabType, number> = {
    email: emailHistory.length,
    sms: smsHistory.length,
    call: callHistory.length,
  };

  const TAB_CONFIG: {
    key: TabType;
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
  }[] = [
    {
      key: "email",
      label: "Email",
      icon: <EmailOutlinedIcon sx={{ fontSize: 15 }} />,
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
    {
      key: "sms",
      label: "SMS",
      icon: <SmsOutlinedIcon sx={{ fontSize: 15 }} />,
      color: "#8B5CF6",
      bg: "#F5F3FF",
    },
    {
      key: "call",
      label: "Calls",
      icon: <CallOutlinedIcon sx={{ fontSize: 15 }} />,
      color: "#10B981",
      bg: "#F0FDF4",
    },
  ];

  return (
    <Box sx={{ display: "flex", gap: 2, height: "78vh" }}>
      {/* SIDEBAR */}
      <Paper
        sx={{
          width: 300,
          flexShrink: 0,
          p: 2,
          borderRadius: "20px",
          border: "1px solid #f1f1f1",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Typography fontWeight={700} mb={2}>
          Leads ({filteredLeads.length})
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search name / number / ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": { borderRadius: "14px", height: 40 },
            "& fieldset": { borderColor: "#e5e7eb" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9aa0b4", fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {filteredLeads.length === 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "center", mt: 4 }}
            >
              No leads found.
            </Typography>
          ) : (
            filteredLeads.map((lead) => {
              const isActive = activeLead?.id === lead.id;
              const style =
                statusMap[lead.lead_status ?? "New"] ?? statusMap["New"];
              return (
                <Box
                  key={lead.id}
                  onClick={() => {
                    setActiveLead(lead);
                    setActiveTab("email");
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    mb: 1,
                    borderRadius: "14px",
                    cursor: "pointer",
                    background: "#fff",
                    border: isActive
                      ? "1px solid #ff9c6b"
                      : "1px solid transparent",
                    boxShadow: isActive
                      ? "0 4px 12px rgba(255,140,90,0.2)"
                      : "none",
                    transition: "all 0.15s",
                    "&:hover": { border: "1px solid #e5e7eb" },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                      bgcolor: isActive ? "#7b61ff" : "#ede9fe",
                      color: isActive ? "#fff" : "#7b61ff",
                    }}
                  >
                    {getInitials(lead.full_name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        fontSize={13}
                        fontWeight={600}
                        noWrap
                        sx={{ flex: 1, mr: 0.5 }}
                      >
                        {lead.full_name}
                      </Typography>
                      <Chip
                        label={lead.lead_status ?? "New"}
                        size="small"
                        sx={{
                          bgcolor: style.bg,
                          color: style.color,
                          border: `1px solid ${style.border}`,
                          height: 17,
                          fontSize: 10,
                          flexShrink: 0,
                        }}
                      />
                    </Stack>
                    <Typography fontSize={11} color="#8b8fa3" noWrap>
                      {lead.contact_no}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Paper>

      {/* MAIN PANEL */}
      {activeLead ? (
        <Paper
          sx={{
            flex: 1,
            borderRadius: "20px",
            border: "1px solid #eee",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: "1px solid #f4f5f9", flexShrink: 0 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "#7b61ff",
                    width: 42,
                    height: 42,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {getInitials(activeLead.full_name)}
                </Avatar>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={700} fontSize={15}>
                      {activeLead.full_name}
                    </Typography>
                    <Chip
                      label={activeLead.lead_status ?? "New"}
                      size="small"
                      sx={{
                        bgcolor: activeStyle.bg,
                        color: activeStyle.color,
                        border: `1px solid ${activeStyle.border}`,
                        height: 20,
                        fontSize: 11,
                      }}
                    />
                  </Stack>
                  <Typography fontSize={12} color="#8b8fa3">
                    {activeLead.contact_no}
                    {activeLead.email ? ` · ${activeLead.email}` : ""}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {activeLead.department_name && (
                  <Chip
                    label={activeLead.department_name}
                    size="small"
                    sx={{ bgcolor: "#f3f4f6", color: "#374151", fontSize: 11 }}
                  />
                )}
                {activeLead.treatment_interest && (
                  <Chip
                    label={activeLead.treatment_interest}
                    size="small"
                    sx={{ bgcolor: "#ede9fe", color: "#7b61ff", fontSize: 11 }}
                  />
                )}
                {activeLead.source && (
                  <Chip
                    label={`Source: ${activeLead.source}`}
                    size="small"
                    sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontSize: 11 }}
                  />
                )}
                {activeLead.assigned_to_name && (
                  <Chip
                    label={`Assigned: ${activeLead.assigned_to_name}`}
                    size="small"
                    sx={{ bgcolor: "#fff7ed", color: "#ea580c", fontSize: 11 }}
                  />
                )}
              </Stack>
            </Stack>
          </Box>

          {/* Tab bar */}
          <Box
            sx={{
              px: 2,
              pt: 1.5,
              pb: 0,
              borderBottom: "1px solid #f4f5f9",
              flexShrink: 0,
            }}
          >
            <Stack direction="row" spacing={1}>
              {TAB_CONFIG.map((t) => (
                <Box
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 1.8,
                    py: 0.8,
                    borderRadius: "10px 10px 0 0",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    borderBottom:
                      activeTab === t.key
                        ? `2px solid ${t.color}`
                        : "2px solid transparent",
                    color: activeTab === t.key ? t.color : "#6B7280",
                    bgcolor: activeTab === t.key ? t.bg : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {t.icon} {t.label}
                  {tabBadge[t.key] > 0 && (
                    <Box
                      sx={{
                        ml: 0.5,
                        px: 0.8,
                        py: 0.1,
                        borderRadius: "6px",
                        bgcolor: t.bg,
                        color: t.color,
                        fontSize: 11,
                        border: `1px solid ${t.color}22`,
                      }}
                    >
                      {tabBadge[t.key]}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Content area */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, bgcolor: "#F8FAFC" }}>
            {/* EMAIL TAB */}
            {activeTab === "email" && (
              <>
                {emailLoading && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 6 }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" color="text.secondary">
                        Loading emails…
                      </Typography>
                    </Stack>
                  </Box>
                )}
                {!emailLoading && emailError && (
                  <Alert
                    severity="error"
                    sx={{ borderRadius: "10px" }}
                    action={
                      <Button
                        size="small"
                        onClick={() => fetchEmails(activeLead.id)}
                      >
                        Retry
                      </Button>
                    }
                  >
                    {emailError}
                  </Alert>
                )}
                {!emailLoading && !emailError && emailHistory.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <EmailOutlinedIcon
                      sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }}
                    />
                    <Typography color="text.secondary" fontWeight={600}>
                      No emails yet
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mt={0.5}
                    >
                      Emails sent to this lead will appear here.
                    </Typography>
                  </Box>
                )}
                {!emailLoading && !emailError && emailHistory.length > 0 && (
                  <Stack spacing={2}>
                    {emailHistory.map((mail) => (
                      <Paper
                        key={mail.id}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: "14px",
                          border: "1px solid #E2E8F0",
                          bgcolor: "#fff",
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={1.5}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 38,
                                height: 38,
                                bgcolor: "#FEF2F2",
                                color: "#EF4444",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              CC
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                Crysta Clinic
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {mail.sender_email || "team@crystaivf.com"}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip
                              label={mail.status}
                              size="small"
                              sx={{
                                ...getEmailStatusSx(mail.status),
                                fontWeight: 600,
                                fontSize: 11,
                                height: 20,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontSize={11}
                            >
                              {mail.created_at
                                ? new Date(mail.created_at).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : ""}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={1}
                          mb={1}
                          alignItems="center"
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{
                              fontSize: "0.6rem",
                              textTransform: "uppercase",
                              minWidth: 20,
                            }}
                          >
                            To:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="#374151"
                            fontWeight={500}
                          >
                            {activeLead.full_name}
                            {activeLead.email ? ` <${activeLead.email}>` : ""}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="#1E293B"
                          mb={1}
                        >
                          {mail.subject}
                        </Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography
                          component="pre"
                          sx={{
                            fontSize: 13,
                            color: "text.secondary",
                            lineHeight: 1.75,
                            fontFamily: "inherit",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            margin: 0,
                          }}
                        >
                          {stripHtml(mail.email_body || "")}
                        </Typography>
                        {mail.sent_at && (
                          <Box
                            sx={{
                              mt: 1.5,
                              pt: 1.5,
                              borderTop: "1px solid #F1F5F9",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontSize={11}
                            >
                              ✅ Sent at{" "}
                              {new Date(mail.sent_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                )}
                <div ref={bottomRef} />
              </>
            )}

            {/* SMS TAB */}
            {activeTab === "sms" && (
              <>
                {smsLoading && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 6 }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" color="text.secondary">
                        Loading SMS…
                      </Typography>
                    </Stack>
                  </Box>
                )}
                {!smsLoading && smsError && (
                  <Alert
                    severity="error"
                    sx={{ borderRadius: "10px" }}
                    action={
                      <Button
                        size="small"
                        onClick={() => fetchSMS(activeLead.id)}
                      >
                        Retry
                      </Button>
                    }
                  >
                    {smsError}
                  </Alert>
                )}
                {!smsLoading && !smsError && smsHistory.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <SmsOutlinedIcon
                      sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }}
                    />
                    <Typography color="text.secondary" fontWeight={600}>
                      No SMS yet
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mt={0.5}
                    >
                      SMS messages sent to this lead will appear here.
                    </Typography>
                  </Box>
                )}
                {!smsLoading && !smsError && smsHistory.length > 0 && (
                  <Stack spacing={2}>
                    {smsHistory.map((sms) => {
                      const statusStyle = getSMSStatusColor(sms.status ?? "");
                      return (
                        <Paper
                          key={sms.id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            bgcolor: "#fff",
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            mb={1.5}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  p: 0.8,
                                  bgcolor: "#F5F3FF",
                                  borderRadius: "8px",
                                }}
                              >
                                <SmsOutlinedIcon
                                  sx={{ color: "#8B5CF6", fontSize: 16 }}
                                />
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight={600}
                                  sx={{
                                    fontSize: "0.6rem",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {sms.direction === "outbound"
                                    ? "Sent To"
                                    : "Received From"}
                                </Typography>
                                <Typography fontWeight={600} fontSize={13}>
                                  {sms.to_number}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip
                                label={sms.status || "sent"}
                                size="small"
                                sx={{
                                  bgcolor: statusStyle.bg,
                                  color: statusStyle.color,
                                  fontWeight: 600,
                                  fontSize: 11,
                                  height: 20,
                                  textTransform: "capitalize",
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontSize={11}
                              >
                                {formatDateTime(sms.created_at)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: "#F8FAFC",
                              borderRadius: "8px",
                              border: "1px solid #F1F5F9",
                            }}
                          >
                            <Typography fontSize={13} sx={{ lineHeight: 1.6 }}>
                              {sms.body}
                            </Typography>
                          </Box>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            mt={1}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              From: {sms.from_number}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: "monospace", fontSize: 10 }}
                            >
                              SID: {sms.sid.slice(0, 20)}…
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
                <div ref={bottomRef} />
              </>
            )}

            {/* CALL TAB */}
            {activeTab === "call" && (
              <>
                {callLoading && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 6 }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" color="text.secondary">
                        Loading calls…
                      </Typography>
                    </Stack>
                  </Box>
                )}
                {!callLoading && callError && (
                  <Alert
                    severity="error"
                    sx={{ borderRadius: "10px" }}
                    action={
                      <Button
                        size="small"
                        onClick={() => fetchCalls(activeLead.id)}
                      >
                        Retry
                      </Button>
                    }
                  >
                    {callError}
                  </Alert>
                )}
                {!callLoading && !callError && callHistory.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <CallOutlinedIcon
                      sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }}
                    />
                    <Typography color="text.secondary" fontWeight={600}>
                      No calls yet
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mt={0.5}
                    >
                      Calls made to this lead will appear here.
                    </Typography>
                  </Box>
                )}
                {!callLoading && !callError && callHistory.length > 0 && (
                  <Stack spacing={2}>
                    {callHistory.map((call) => {
                      const statusStyle = getCallStatusColor(call.status ?? "");
                      return (
                        <Paper
                          key={call.id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            bgcolor: "#fff",
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  p: 1,
                                  bgcolor: "#F0FDF4",
                                  borderRadius: "8px",
                                }}
                              >
                                <CallOutlinedIcon
                                  sx={{ color: "#10B981", fontSize: 20 }}
                                />
                              </Box>
                              <Box>
                                <Typography fontWeight={700} fontSize={13}>
                                  Outbound Call
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  To: {call.to_number}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Chip
                                label={call.status || "initiated"}
                                size="small"
                                sx={{
                                  bgcolor: statusStyle.bg,
                                  color: statusStyle.color,
                                  fontWeight: 600,
                                  fontSize: 11,
                                  height: 20,
                                  textTransform: "capitalize",
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontSize={11}
                              >
                                {formatDateTime(call.created_at)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Divider sx={{ my: 1.5 }} />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              From: {call.from_number}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: "monospace", fontSize: 10 }}
                            >
                              SID: {call.sid.slice(0, 20)}…
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </Box>

          {/* Bottom action bar */}
          <Box sx={{ p: 2, borderTop: "1px solid #f1f2f6", flexShrink: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                onClick={handleCompose}
                title={activeTab === "sms" ? "New SMS" : "New Email"}
                sx={{
                  bgcolor: "#f3f4f6",
                  borderRadius: "12px",
                  width: 40,
                  height: 40,
                  "&:hover": { bgcolor: "#e5e7eb" },
                }}
              >
                <AddIcon sx={{ fontSize: 20, color: "#374151" }} />
              </IconButton>
              <IconButton
                onClick={() => {
                  if (activeTab === "email") fetchEmails(activeLead.id);
                  if (activeTab === "sms") fetchSMS(activeLead.id);
                  if (activeTab === "call") fetchCalls(activeLead.id);
                }}
                title="Refresh"
                sx={{
                  bgcolor: "#f3f4f6",
                  borderRadius: "12px",
                  width: 40,
                  height: 40,
                  "&:hover": { bgcolor: "#e5e7eb" },
                }}
              >
                <RefreshIcon sx={{ fontSize: 18, color: "#374151" }} />
              </IconButton>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "#f6f7fb",
                  borderRadius: "14px",
                  px: 2,
                  py: 1,
                  cursor: "pointer",
                  gap: 1,
                }}
                onClick={handleCompose}
              >
                {activeTab === "sms" ? (
                  <SmsOutlinedIcon sx={{ color: "#9ca3af", fontSize: 16 }} />
                ) : (
                  <EmailOutlinedIcon sx={{ color: "#9ca3af", fontSize: 16 }} />
                )}
                <Typography fontSize={13} color="#9ca3af">
                  {activeTab === "sms"
                    ? `Send an SMS to ${activeLead.full_name}…`
                    : `Send an email to ${activeLead.full_name}…`}
                </Typography>
              </Box>
              <IconButton
                onClick={handleCompose}
                sx={{
                  bgcolor: "#2f2f2f",
                  color: "#fff",
                  borderRadius: "12px",
                  width: 40,
                  height: 40,
                  "&:hover": { bgcolor: "#111" },
                }}
              >
                <SendRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      ) : (
        <Paper
          sx={{
            flex: 1,
            borderRadius: "20px",
            border: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography fontSize={36}>💬</Typography>
          <Typography fontWeight={600} color="text.secondary">
            Select a lead to view conversations
          </Typography>
        </Paper>
      )}

      {/* Dialog suites — only rendered when a lead is active */}
      {activeLead && (
        <EmailSuite
          open={emailOpen}
          lead={activeLead}
          onClose={() => setEmailOpen(false)}
          onSent={() => fetchEmails(activeLead.id)}
        />
      )}
      {activeLead && (
        <SMSSuite
          open={smsOpen}
          lead={activeLead}
          onClose={() => setSmsOpen(false)}
          onSent={() => fetchSMS(activeLead.id)}
        />
      )}
    </Box>
  );
}
