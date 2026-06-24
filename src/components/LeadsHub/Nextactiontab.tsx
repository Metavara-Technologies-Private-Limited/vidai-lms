import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  Chip,
  Divider,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  MenuItem,
  Dialog,
  DialogContent,
  Snackbar,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import SendIcon from "@mui/icons-material/Send";
import PhoneIcon from "@mui/icons-material/Phone";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import type { LeadRecord, NoteData } from "./LeadDetailTypes";
import { TwilioAPI } from "../../services/leads.api";
import type { TwilioCall, TwilioSMS } from "../../services/leads.api";
import { selectClinic } from "../../store/clinicSlice";
import {
  pipelineApi,
  isActiveStageStatus,
  type Pipeline,
  type PipelineRuleActionType,
  type PipelineStage,
} from "../../services/pipeline.api";
import CallDialog from "./CallDialog";

import { SMSDialog } from "./SmsDialogs";
import BookAppointmentModal from "./BookAppointmentModal";
import type { AppointmentResult } from "./BookAppointmentModal";
import type { ProcessedLead } from "./LeadsTable.types";

interface NextActionTabProps {
  lead: LeadRecord;
  nextActionType: string;
  nextActionStatus: string;
  nextActionDescription: string;
  isAppointment: boolean;
  isFollowUp: boolean;
  availableActions: { value: string; label: string }[];
  openAddActionDialog: boolean;
  setOpenAddActionDialog: (open: boolean) => void;
  actionType: string;
  setActionType: (v: string) => void;
  actionStatus: string;
  setActionStatus: (v: string) => void;
  actionDescription: string;
  setActionDescription: (v: string) => void;
  actionSubmitting: boolean;
  actionError: string | null;
  setActionError: (err: string | null) => void;
  onAddNextAction: () => void;
  onCloseActionDialog: () => void;
  taskStatus?: string;
  onMarkDone?: () => Promise<void>;
  /**
   * Call activity for this lead — used to derive whether the "Call" channel
   * is considered complete. Any recorded call means the channel is done.
   * Already fetched in LeadDetailView; just pass callHistory={callHistory}.
   */
  callHistory?: TwilioCall[];
  /**
   * SMS activity for this lead — used to derive whether the "SMS" channel
   * is considered complete. Any recorded SMS means the channel is done.
   * Already fetched in LeadDetailView; just pass smsHistory={smsHistory}.
   */
  smsHistory?: TwilioSMS[];
  notes: NoteData[];
  notesLoading: boolean;
  notesError: string | null;
  setNotesError: (err: string | null) => void;
  editingNoteId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editContent: string;
  setEditContent: (v: string) => void;
  editSubmitting: boolean;
  newNoteTitle: string;
  setNewNoteTitle: (v: string) => void;
  newNoteContent: string;
  setNewNoteContent: (v: string) => void;
  noteSubmitting: boolean;
  deleteNoteDialog: string | null;
  setDeleteNoteDialog: (id: string | null) => void;
  onStartEditNote: (note: NoteData) => void;
  onCancelEditNote: () => void;
  onSaveEditNote: (noteId: string) => void;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onAppointmentBooked?: (result: AppointmentResult) => void;
  onSmsSent?: (sentItem: TwilioSMS) => void;
}

// ── Phone normalizer ──
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
  return (
    e?.response?.data?.detail ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

// ── Status chip config ──
const STATUS_CHIP_STYLES: Record<string, { bgcolor: string; color: string }> = {
  completed: { bgcolor: "#F0FDF4", color: "#16A34A" },
  pending: { bgcolor: "#EFF6FF", color: "#3B82F6" },
  default: { bgcolor: "#EFF6FF", color: "#3B82F6" },
};

function getStatusChipStyle(status: string) {
  const key = status?.toLowerCase();
  return STATUS_CHIP_STYLES[key] ?? STATUS_CHIP_STYLES.default;
}

const STORAGE_KEY_SELECTED_INDUSTRY = "leads_selected_industry";
const STORAGE_KEY_SELECTED_PIPELINE = "leads_selected_pipeline_id";
const STORAGE_KEY_DEFAULT_PIPELINE = "leads_default_pipeline_id";

type PipelineOption = { value: string; label: string };
type ChannelKey = "call" | "sms" | "appointment";

const normalizeStageName = (value?: string | null): string =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const deriveActionTypeOptions = (stage: PipelineStage): PipelineOption[] => {
  const labels = Array.from(
    new Set(
      stage.rules
        .filter((r) => r.is_enabled)
        .map((r) =>
          r.custom_label?.trim() ? r.custom_label.trim() : r.action_type,
        ),
    ),
  );
  return labels.map((label) => ({ value: label, label }));
};

const deriveAllActionTypeOptions = (stages: PipelineStage[]): PipelineOption[] => {
  const labels = Array.from(
    new Set(
      stages.flatMap((s) =>
        s.rules
          .filter((r) => r.is_enabled)
          .map((r) =>
            r.custom_label?.trim() ? r.custom_label.trim() : r.action_type,
          ),
      ),
    ),
  );
  return labels.map((label) => ({ value: label, label }));
};

type ActionChannel = {
  key: ChannelKey;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  buttonLabel: string;
  buttonIcon: React.ReactNode;
  buttonColor: string;
  buttonBg: string;
  buttonHoverBg: string;
  onTrigger: () => void;
};

const CHANNEL_RULE_TYPES: Record<ChannelKey, PipelineRuleActionType[]> = {
  call: ["call"],
  sms: ["sms", "whatsapp"],
  appointment: ["appointment"],
};

// Stable empty arrays so useMemo deps don't fire on every render when
// the parent hasn't passed these props yet.
const EMPTY_CALL_HISTORY: TwilioCall[] = [];
const EMPTY_SMS_HISTORY: TwilioSMS[] = [];

const NextActionTab: React.FC<NextActionTabProps> = ({
  lead,
  nextActionType,
  nextActionStatus,
  nextActionDescription,
  isAppointment,
  isFollowUp,
  availableActions,
  openAddActionDialog,
  setOpenAddActionDialog,
  actionType,
  setActionType,
  actionStatus,
  setActionStatus,
  actionDescription,
  setActionDescription,
  actionSubmitting,
  actionError,
  setActionError,
  onAddNextAction,
  onCloseActionDialog,
  taskStatus = "",
  onMarkDone,
  callHistory = EMPTY_CALL_HISTORY,
  smsHistory = EMPTY_SMS_HISTORY,
  notes,
  notesLoading,
  notesError,
  setNotesError,
  editingNoteId,
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  editSubmitting,
  newNoteTitle,
  setNewNoteTitle,
  newNoteContent,
  setNewNoteContent,
  noteSubmitting,
  deleteNoteDialog,
  setDeleteNoteDialog,
  onStartEditNote,
  onCancelEditNote,
  onSaveEditNote,
  onAddNote,
  onDeleteNote,
  onAppointmentBooked,
  onSmsSent,
}) => {
  void nextActionType;
  void taskStatus;

  const [callDialogOpen, setCallDialogOpen] = React.useState(false);
  const [actionSnackbar, setActionSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "error" | "info" | "success";
  }>({ open: false, message: "", severity: "error" });

  const [smsDialogOpen, setSmsDialogOpen] = React.useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = React.useState(false);

  const [markDoneLoading, setMarkDoneLoading] = React.useState<ChannelKey | null>(null);
  const [markDoneError, setMarkDoneError] = React.useState<string | null>(null);

  // ── FIX: completion derived from real persisted backend data ─────────────
  // Each channel's "done" state is computed from actual activity records that
  // already exist and are already fetched in LeadDetailView. This survives
  // page reloads and tab switches because it re-derives from real data on
  // every render instead of relying on local-only React state.
  //
  //  Call        → at least one call record exists in callHistory
  //  SMS         → at least one SMS record exists in smsHistory
  //  Appointment → lead.book_appointment is true
  const derivedCompleted = React.useMemo<Record<ChannelKey, boolean>>(
    () => ({
      call: (callHistory?.length ?? 0) > 0,
      sms: (smsHistory?.length ?? 0) > 0,
      appointment: lead?.book_appointment === true,
    }),
    [callHistory, smsHistory, lead?.book_appointment],
  );

  // ── Manual overrides ─────────────────────────────────────────────────────
  // Provides optimistic UI feedback the moment a user clicks "Mark Done"
  // (or sends an SMS / books appointment), before the parent's refetch
  // completes and the derived value catches up. Only ever forces true —
  // once the derived value confirms completion it takes over naturally.
  const [manualOverrides, setManualOverrides] = React.useState<
    Partial<Record<ChannelKey, boolean>>
  >({});

  // Clear overrides when navigating to a different lead so stale optimistic
  // state from a previous lead never leaks into the new one.
  React.useEffect(() => {
    setManualOverrides({});
  }, [lead?.id]);

  const completedChannels = React.useMemo<Record<ChannelKey, boolean>>(
    () => ({
      call: derivedCompleted.call || manualOverrides.call === true,
      sms: derivedCompleted.sms || manualOverrides.sms === true,
      appointment: derivedCompleted.appointment || manualOverrides.appointment === true,
    }),
    [derivedCompleted, manualOverrides],
  );

  const isChannelCompleted = (key: ChannelKey) => completedChannels[key] === true;

  // ── Pipeline state ────────────────────────────────────────────────────────
  const selectedClinic = useSelector(selectClinic);
  const clinicId =
    selectedClinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 1);

  const [pipelineStages, setPipelineStages] = React.useState<PipelineStage[]>([]);
  const [pipelineLoading, setPipelineLoading] = React.useState(false);

  React.useEffect(() => {
    const loadPipelineStages = async () => {
      const selectedIndustry =
        localStorage.getItem(STORAGE_KEY_SELECTED_INDUSTRY) ?? "";
      const selectedPipelineId =
        localStorage.getItem(STORAGE_KEY_SELECTED_PIPELINE) ??
        localStorage.getItem(STORAGE_KEY_DEFAULT_PIPELINE) ??
        "";

      try {
        setPipelineLoading(true);
        let selectedPipeline: Pipeline | null = null;

        if (selectedPipelineId) {
          try {
            selectedPipeline = await pipelineApi.getById(selectedPipelineId);
          } catch {
            selectedPipeline = null;
          }
        }

        if (!selectedPipeline) {
          const pipelines = await pipelineApi.list(clinicId);
          const byIndustry = selectedIndustry
            ? pipelines.filter((p) => p.industry_type === selectedIndustry)
            : pipelines;
          const leadStageId = String(
            (lead as { stage_id?: unknown; pipeline_stage_id?: unknown })?.stage_id ??
              (lead as { stage_id?: unknown; pipeline_stage_id?: unknown })
                ?.pipeline_stage_id ??
              "",
          );
          const byLeadStage = leadStageId
            ? pipelines.find((p) =>
                p.stages?.some((s) => String(s.id) === leadStageId),
              )
            : undefined;

          selectedPipeline =
            byLeadStage ??
            pipelines.find((p) => p.id === selectedPipelineId) ??
            byIndustry.find((p) => p.is_active) ??
            byIndustry[0] ??
            pipelines.find((p) => p.is_active) ??
            pipelines[0] ??
            null;
        }

        const rawStages = selectedPipeline?.stages ?? [];
        const activeStages = rawStages
          .filter((s) => isActiveStageStatus(s.stage_status))
          .filter((s) => s.stage_name.trim())
          .sort((a, b) => {
            const aOrder = typeof a.stage_order === "number" ? a.stage_order : 0;
            const bOrder = typeof b.stage_order === "number" ? b.stage_order : 0;
            if (aOrder === bOrder) return 0;
            return aOrder - bOrder;
          });

        setPipelineStages(activeStages);
      } catch {
        setPipelineStages([]);
      } finally {
        setPipelineLoading(false);
      }
    };

    void loadPipelineStages();
  }, [clinicId]);

  const currentStage = React.useMemo(() => {
    const currentName = normalizeStageName(lead?.lead_status || lead?.status);
    if (!currentName) return null;
    return (
      pipelineStages.find(
        (s) => normalizeStageName(s.stage_name) === currentName,
      ) ?? null
    );
  }, [pipelineStages, lead?.lead_status, lead?.status]);

  const statusOptions = React.useMemo<PipelineOption[]>(() => {
    const upcoming = currentStage
      ? pipelineStages.filter((s) => s.stage_order > currentStage.stage_order)
      : pipelineStages;
    return [...upcoming]
      .sort((a, b) => a.stage_order - b.stage_order)
      .map((s) => ({ value: s.stage_name.trim(), label: s.stage_name.trim() }));
  }, [pipelineStages, currentStage]);

  const selectedStatusStage = React.useMemo(() => {
    const trimmed = normalizeStageName(actionStatus);
    if (!trimmed) return null;
    return (
      pipelineStages.find(
        (s) => normalizeStageName(s.stage_name) === trimmed,
      ) ?? null
    );
  }, [pipelineStages, actionStatus]);

  const pipelineActionTypeOptions = React.useMemo<PipelineOption[]>(() => {
    if (selectedStatusStage) return deriveActionTypeOptions(selectedStatusStage);
    if (pipelineStages.length > 0) return deriveAllActionTypeOptions(pipelineStages);
    return availableActions;
  }, [selectedStatusStage, pipelineStages, availableActions]);

  React.useEffect(() => {
    if (!actionType) return;
    if (pipelineActionTypeOptions.some((o) => o.value === actionType)) return;
    setActionType("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType, pipelineActionTypeOptions]);

  // ── Mark Done — sets manual override for instant UI, calls backend ────────
  const handleMarkDone = async (channelKey: ChannelKey) => {
    if (!onMarkDone || isChannelCompleted(channelKey) || markDoneLoading) return;
    setMarkDoneLoading(channelKey);
    setMarkDoneError(null);
    setManualOverrides((prev) => ({ ...prev, [channelKey]: true }));
    try {
      await onMarkDone();
      toast.success("Task status updated to Completed", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (err: unknown) {
      setManualOverrides((prev) => ({ ...prev, [channelKey]: false }));
      setMarkDoneError(
        extractErrorMessage(err, "Failed to mark action as done. Please try again.")
      );
    } finally {
      setMarkDoneLoading(null);
    }
  };

  const handleCallOpen = async () => {
    const phone = normalizePhone(lead?.contact_no);
    if (!phone) {
      setActionSnackbar({ open: true, message: "No contact number for this lead.", severity: "error" });
      return;
    }
    if (!lead?.id) {
      setActionSnackbar({ open: true, message: "Lead ID is missing. Cannot initiate call.", severity: "error" });
      return;
    }
    setCallDialogOpen(true);
    try {
      await TwilioAPI.makeCall({ lead_uuid: lead.id, to: phone });
    } catch (err: unknown) {
      setCallDialogOpen(false);
      setActionSnackbar({
        open: true,
        message: extractErrorMessage(err, "Failed to initiate call."),
        severity: "error",
      });
    }
  };

  const handleSmsOpen = () => {
    const phone = normalizePhone(lead?.contact_no);
    if (!phone) {
      setActionSnackbar({ open: true, message: "No contact number for this lead.", severity: "error" });
      return;
    }
    if (!lead?.id) {
      setActionSnackbar({ open: true, message: "Lead ID is missing. Cannot send SMS.", severity: "error" });
      return;
    }
    setSmsDialogOpen(true);
  };

  const handleSmsDialogClose = (sent?: boolean, sentItem?: TwilioSMS) => {
    setSmsDialogOpen(false);
    if (sent) {
      setManualOverrides((prev) => ({ ...prev, sms: true }));
      setActionSnackbar({ open: true, message: "SMS sent successfully!", severity: "success" });
      if (sentItem) onSmsSent?.(sentItem);
    }
  };

  const handleAppointmentOpen = () => {
    if (!lead?.id) {
      setActionSnackbar({ open: true, message: "Lead ID is missing. Cannot book appointment.", severity: "error" });
      return;
    }
    setAppointmentDialogOpen(true);
  };

  const handleAppointmentSaved = (result: AppointmentResult) => {
    setManualOverrides((prev) => ({ ...prev, appointment: true }));
    setActionSnackbar({ open: true, message: "Appointment booked successfully!", severity: "success" });
    onAppointmentBooked?.(result);
  };

  const chipStyle = getStatusChipStyle(nextActionStatus);

  const actionChannels: ActionChannel[] = [
    {
      key: "call",
      title: "Call",
      icon: <CallOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />,
      iconBg: "#EFF6FF",
      buttonLabel: "Call",
      buttonIcon: <PhoneIcon sx={{ fontSize: 14 }} />,
      buttonColor: "#10B981",
      buttonBg: "#F0FDF4",
      buttonHoverBg: "#DCFCE7",
      onTrigger: handleCallOpen,
    },
    {
      key: "sms",
      title: "SMS",
      icon: <SmsOutlinedIcon sx={{ color: "#8B5CF6", fontSize: 20 }} />,
      iconBg: "#F5F3FF",
      buttonLabel: "Send SMS",
      buttonIcon: <SmsOutlinedIcon sx={{ fontSize: 14 }} />,
      buttonColor: "#7C3AED",
      buttonBg: "#F5F3FF",
      buttonHoverBg: "#EDE9FE",
      onTrigger: handleSmsOpen,
    },
    {
      key: "appointment",
      title: "Appointment",
      icon: <EventAvailableOutlinedIcon sx={{ color: "#F59E0B", fontSize: 20 }} />,
      iconBg: "#FFFBEB",
      buttonLabel: "Book Appt",
      buttonIcon: <EventAvailableOutlinedIcon sx={{ fontSize: 14 }} />,
      buttonColor: "#D97706",
      buttonBg: "#FFFBEB",
      buttonHoverBg: "#FEF3C7",
      onTrigger: handleAppointmentOpen,
    },
  ];

  const visibleActionChannels = React.useMemo(() => {
    if (!currentStage?.rules?.length) return actionChannels;

    const enabledRuleTypes = new Set(
      currentStage.rules
        .filter((rule) => rule.is_enabled)
        .map((rule) => rule.action_type),
    );

    if (enabledRuleTypes.size === 0) return actionChannels;

    return actionChannels.filter((channel) =>
      CHANNEL_RULE_TYPES[channel.key].some((ruleType) =>
        enabledRuleTypes.has(ruleType),
      ),
    );
  }, [actionChannels, currentStage]);

  return (
    <>
      <Stack direction="row" spacing={3} alignItems="flex-start">
        {/* ── LEFT: Next Action Panel ── */}
        <Box sx={{ width: 340, flexShrink: 0 }}>
          <Card sx={{ borderRadius: "16px", overflow: "hidden" }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ px: 2.5, py: 2, borderBottom: "1px solid #F1F5F9" }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                Next Action
              </Typography>
              <IconButton size="small" onClick={() => setOpenAddActionDialog(true)}>
                <AddCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Box sx={{ p: 2 }}>
              {markDoneError && (
                <Alert
                  severity="error"
                  onClose={() => setMarkDoneError(null)}
                  sx={{ mb: 2, borderRadius: "10px", fontSize: "12px", py: 0.5 }}
                >
                  {markDoneError}
                </Alert>
              )}

              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: "0.8px", display: "block", mb: 1.5 }}
              >
                Next Action
              </Typography>

              <Stack spacing={2} sx={{ mb: 3 }}>
                {visibleActionChannels.map((channel) => {
                  const channelCompleted = isChannelCompleted(channel.key);
                  const channelLoading = markDoneLoading === channel.key;

                  return (
                    <Card
                      key={channel.key}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        border: channelCompleted ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                        bgcolor: channelCompleted ? "#F0FDF4" : "transparent",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            p: 1,
                            bgcolor: channelCompleted ? "#DCFCE7" : channel.iconBg,
                            borderRadius: "8px",
                            mt: 0.25,
                            transition: "background-color 0.3s ease",
                          }}
                        >
                          {channelCompleted ? (
                            <CheckCircleOutlineIcon sx={{ color: "#16A34A", fontSize: 20 }} />
                          ) : (
                            channel.icon
                          )}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight={700} mb={1.5}>
                            {channel.title}
                          </Typography>
                          <Stack direction="row" spacing={4} mb={1}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}
                              >
                                DUE
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>Today</Typography>
                            </Box>
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}
                              >
                                STATUS
                              </Typography>
                              <Box mt={0.25}>
                                <Chip
                                  label={
                                    nextActionStatus
                                      ? nextActionStatus.charAt(0).toUpperCase() + nextActionStatus.slice(1)
                                      : nextActionStatus
                                  }
                                  size="small"
                                  sx={{
                                    ...chipStyle,
                                    fontWeight: 600,
                                    borderRadius: "6px",
                                    height: 22,
                                    fontSize: "0.7rem",
                                    transition: "all 0.3s ease",
                                  }}
                                />
                              </Box>
                            </Box>
                          </Stack>
                          <Box mb={2}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}
                            >
                              DESCRIPTION
                            </Typography>
                            <Typography variant="body2">{nextActionDescription}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={
                                channelLoading ? (
                                  <CircularProgress size={12} sx={{ color: "inherit" }} />
                                ) : (
                                  <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
                                )
                              }
                              onClick={() => handleMarkDone(channel.key)}
                              disabled={channelCompleted || markDoneLoading !== null || !onMarkDone}
                              sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                fontSize: "0.72rem",
                                px: 1,
                                py: 0.5,
                                flex: 1,
                                minWidth: 0,
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                display: "flex",
                                justifyContent: "center",
                                "& .MuiButton-startIcon": { mr: 0.5, flexShrink: 0 },
                                transition: "all 0.2s ease",
                                ...(channelCompleted
                                  ? {
                                      borderColor: "#BBF7D0",
                                      color: "#16A34A",
                                      bgcolor: "#F0FDF4",
                                      "&.Mui-disabled": {
                                        borderColor: "#BBF7D0",
                                        color: "#16A34A",
                                        bgcolor: "#F0FDF4",
                                        opacity: 0.8,
                                      },
                                    }
                                  : {
                                      borderColor: "#E2E8F0",
                                      color: "#475569",
                                      "&:hover": {
                                        borderColor: "#BBF7D0",
                                        color: "#16A34A",
                                        bgcolor: "#F0FDF4",
                                      },
                                    }),
                              }}
                            >
                              {channelCompleted ? "Completed" : "Mark Done"}
                            </Button>

                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={channel.buttonIcon}
                              onClick={channel.onTrigger}
                              sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                borderColor: `${channel.buttonColor}55`,
                                color: channel.buttonColor,
                                bgcolor: channel.buttonBg,
                                fontSize: "0.72rem",
                                px: 1,
                                py: 0.5,
                                flex: 1,
                                minWidth: 0,
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                display: "flex",
                                justifyContent: "center",
                                "& .MuiButton-startIcon": { mr: 0.5, flexShrink: 0 },
                                "&:hover": {
                                  bgcolor: channel.buttonHoverBg,
                                  borderColor: channel.buttonColor,
                                },
                              }}
                            >
                              {channel.buttonLabel}
                            </Button>
                          </Stack>
                        </Box>
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>

              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: "0.8px", display: "block", mb: 1.5 }}
              >
                Previous Actions
              </Typography>
              <Card variant="outlined" sx={{ p: 2, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ p: 1, bgcolor: "#F0FDF4", borderRadius: "8px", mt: 0.25 }}>
                    <CallOutlinedIcon sx={{ color: "#10B981", fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={700} mb={1.5}>Follow-Up Call</Typography>
                    <Stack direction="row" spacing={4} mb={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>DUE</Typography>
                        <Typography variant="body2" fontWeight={600}>16/01/2026</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>STATUS</Typography>
                        <Box mt={0.25}>
                          <Chip label="Completed" size="small" sx={{ bgcolor: "#F0FDF4", color: "#16A34A", fontWeight: 600, borderRadius: "6px", height: 22, fontSize: "0.7rem" }} />
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Card>
            </Box>
          </Card>
        </Box>

        {/* ── RIGHT: Notes Panel ── */}
        <Box sx={{ flexGrow: 1 }}>
          <Card sx={{ borderRadius: "16px", overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #F1F5F9" }}>
              <Typography variant="subtitle2" fontWeight={700}>Notes</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              {notesError && (
                <Alert severity="error" onClose={() => setNotesError(null)} sx={{ mb: 2, borderRadius: "10px" }}>
                  {notesError}
                </Alert>
              )}
              {notesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={24} />
                    <Typography variant="caption" color="text.secondary">Loading notes...</Typography>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
                  {notes.map((note) =>
                    editingNoteId === note.id ? (
                      <Card key={note.id} variant="outlined" sx={{ p: 2, borderRadius: "12px", border: "2px solid #6366F1", bgcolor: "#FAFAFE" }}>
                        <TextField
                          fullWidth
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          variant="standard"
                          placeholder="Title"
                          inputProps={{ style: { fontWeight: 700, fontSize: "0.875rem" } }}
                          sx={{
                            mb: 1,
                            "& .MuiInput-underline:before": { borderBottomColor: "#E2E8F0" },
                            "& .MuiInput-underline:after": { borderBottomColor: "#6366F1" },
                          }}
                        />
                        <TextField
                          fullWidth multiline minRows={3}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          variant="standard"
                          placeholder="Note content..."
                          inputProps={{ style: { fontSize: "0.875rem", color: "#475569", lineHeight: 1.6 } }}
                          sx={{
                            mb: 2,
                            "& .MuiInput-underline:before": { borderBottom: "none" },
                            "& .MuiInput-underline:after": { borderBottom: "none" },
                            "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                          }}
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={onCancelEditNote} disabled={editSubmitting} sx={{ textTransform: "none", fontSize: "0.75rem", color: "#64748B", borderRadius: "8px", "&:hover": { bgcolor: "#F1F5F9" } }}>Cancel</Button>
                          <Button size="small" variant="contained" onClick={() => onSaveEditNote(note.id)} disabled={editSubmitting} sx={{ textTransform: "none", fontSize: "0.75rem", bgcolor: "#334155", borderRadius: "8px", boxShadow: "none", minWidth: 64, "&:hover": { bgcolor: "#1E293B", boxShadow: "none" } }}>
                            {editSubmitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : "Save"}
                          </Button>
                        </Stack>
                      </Card>
                    ) : (
                      <Card key={note.id} variant="outlined" sx={{ p: 2, borderRadius: "12px", border: "1px solid #E2E8F0", position: "relative" }}>
                        <Typography variant="body2" fontWeight={700} mb={0.5}>{note.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", mb: 1.5, lineHeight: 1.6 }}>{note.content}</Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">{note.time}</Typography>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={() => onStartEditNote(note)} sx={{ color: "#3B82F6", "&:hover": { bgcolor: "#EFF6FF" } }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => setDeleteNoteDialog(note.id)} sx={{ color: "#EF4444", "&:hover": { bgcolor: "#FEF2F2" } }}>
                              <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Card>
                    )
                  )}
                </Box>
              )}

              <Card variant="outlined" sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <TextField
                  fullWidth placeholder="Title" value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  variant="standard"
                  sx={{
                    px: 2, pt: 1.5,
                    "& .MuiInputBase-root": { fontSize: "0.875rem", fontWeight: 600 },
                    "& .MuiInput-underline:before": { borderBottom: "none" },
                    "& .MuiInput-underline:after": { borderBottom: "none" },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                  }}
                />
                <Divider sx={{ mx: 2, borderColor: "#F1F5F9" }} />
                <Stack direction="row" alignItems="flex-end">
                  <TextField
                    fullWidth multiline minRows={2} placeholder="Write note here..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    variant="standard"
                    sx={{
                      px: 2, py: 1,
                      "& .MuiInputBase-root": { fontSize: "0.875rem", color: "#64748B" },
                      "& .MuiInput-underline:before": { borderBottom: "none" },
                      "& .MuiInput-underline:after": { borderBottom: "none" },
                      "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                    }}
                  />
                  <Box sx={{ p: 1.5, flexShrink: 0 }}>
                    <IconButton
                      onClick={onAddNote}
                      disabled={noteSubmitting}
                      sx={{
                        bgcolor: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "#334155" : "#F1F5F9",
                        color: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "white" : "#94A3B8",
                        width: 36, height: 36, transition: "all 0.2s",
                        "&:hover": { bgcolor: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "#1E293B" : "#E2E8F0" },
                      }}
                    >
                      {noteSubmitting ? <CircularProgress size={16} sx={{ color: "#94A3B8" }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Box>
                </Stack>
              </Card>
            </Box>
          </Card>
        </Box>

        {/* ══ ADD NEXT ACTION DIALOG ══ */}
        <Dialog open={openAddActionDialog} onClose={onCloseActionDialog} PaperProps={{ sx: { borderRadius: "16px", p: 3, maxWidth: "500px", width: "100%" } }}>
          <DialogContent sx={{ p: 0 }}>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" fontWeight={700}>Add Next Action</Typography>
                  <Typography fontSize="12px" color="#64748B" mt={0.5}>
                    Lead status:{" "}
                    <Chip
                      label={lead?.status || lead?.lead_status || "New"}
                      size="small"
                      sx={{
                        height: 18, fontSize: "11px", fontWeight: 600,
                        bgcolor: isAppointment ? "#EFF6FF" : isFollowUp ? "#FEF3C7" : "#F0FDF4",
                        color: isAppointment ? "#3B82F6" : isFollowUp ? "#F59E0B" : "#16A34A",
                      }}
                    />
                  </Typography>
                </Box>
              </Stack>

              {isAppointment && (
                <Alert severity="info" sx={{ borderRadius: "10px", fontSize: "13px" }}>
                  This lead already has an <strong>Appointment</strong> status. Fields are disabled.
                </Alert>
              )}
              {actionError && (
                <Alert severity="error" onClose={() => setActionError(null)} sx={{ borderRadius: "10px", fontSize: "13px" }}>
                  {actionError}
                </Alert>
              )}

              <Box>
                <Typography fontSize="13px" fontWeight={600} mb={1}>
                  Status *
                  {!isAppointment && (
                    <Typography component="span" fontSize="11px" color="#94A3B8" fontWeight={400} ml={1}>
                      pipeline stage this lead will move to
                    </Typography>
                  )}
                </Typography>
                <TextField
                  select fullWidth size="small" value={actionStatus}
                  onChange={(e) => { setActionStatus(e.target.value); setActionType(""); }}
                  disabled={isAppointment || pipelineLoading}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                  InputProps={{ endAdornment: pipelineLoading ? <CircularProgress size={16} sx={{ mr: 3 }} /> : null }}
                >
                  <MenuItem value="">-- Select --</MenuItem>
                  {statusOptions.length === 0 ? (
                    <MenuItem value="" disabled>{pipelineLoading ? "Loading pipeline..." : "No further stages configured"}</MenuItem>
                  ) : (
                    statusOptions.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)
                  )}
                </TextField>
              </Box>

              <Box>
                <Typography fontSize="13px" fontWeight={600} mb={1}>
                  Action Type *
                  {!isAppointment && (
                    <Typography component="span" fontSize="11px" color="#94A3B8" fontWeight={400} ml={1}>
                      {actionStatus ? `actions configured for "${actionStatus}"` : "select a status first"}
                    </Typography>
                  )}
                </Typography>
                <TextField
                  select fullWidth size="small" value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  disabled={isAppointment || pipelineActionTypeOptions.length === 0}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                >
                  <MenuItem value="">-- Select --</MenuItem>
                  {pipelineActionTypeOptions.length === 0 ? (
                    <MenuItem value="" disabled>{actionStatus ? "No actions configured for this stage" : "Select a status first"}</MenuItem>
                  ) : (
                    pipelineActionTypeOptions.map((a) => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)
                  )}
                </TextField>
              </Box>

              <Box>
                <Typography fontSize="13px" fontWeight={600} mb={1}>Description *</Typography>
                <TextField
                  fullWidth multiline rows={3} size="small" value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder="Enter action description..."
                  disabled={isAppointment}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                />
              </Box>

              {!isAppointment && actionStatus && actionType && (
                <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "8px", px: 2, py: 1.25, border: "1px solid #E2E8F0" }}>
                  <Typography fontSize="11px" color="#64748B">
                    This lead will move to{" "}
                    <Typography component="span" fontWeight={700} color="#0F172A" fontSize="11px">{actionStatus}</Typography>
                    {" "}with next action{" "}
                    <Typography component="span" fontWeight={700} color="#0F172A" fontSize="11px">{actionType}</Typography>
                  </Typography>
                </Box>
              )}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={onCloseActionDialog} variant="outlined" disabled={actionSubmitting} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, color: "#475569", borderColor: "#E2E8F0" }}>Cancel</Button>
                <Button
                  onClick={onAddNextAction} variant="contained"
                  disabled={isAppointment || !actionStatus || !actionType || !actionDescription || actionSubmitting}
                  sx={{ bgcolor: "#334155", borderRadius: "8px", textTransform: "none", fontWeight: 600, boxShadow: "none", "&:hover": { bgcolor: "#1E293B" }, "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}
                >
                  {actionSubmitting ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Save"}
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* ══ DELETE NOTE DIALOG ══ */}
        <Dialog open={deleteNoteDialog !== null} onClose={() => setDeleteNoteDialog(null)} PaperProps={{ sx: { borderRadius: "24px", p: 4, textAlign: "center", maxWidth: "420px", boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)" } }}>
          <DialogContent sx={{ p: 0 }}>
            <Stack alignItems="center" spacing={2.5}>
              <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DeleteOutlineIcon sx={{ fontSize: 32, color: "#EF4444" }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>Delete Note</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, lineHeight: 1.6 }}>
                  This action cannot be undone. Are you sure you want to delete this note permanently?
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 2 }}>
                <Button fullWidth onClick={() => setDeleteNoteDialog(null)} variant="outlined" sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, color: "#475569", borderColor: "#E2E8F0", py: 1.2 }}>Cancel</Button>
                <Button fullWidth variant="contained" onClick={() => deleteNoteDialog && onDeleteNote(deleteNoteDialog)} sx={{ bgcolor: "#EF4444", borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, boxShadow: "none", "&:hover": { bgcolor: "#DC2626" } }}>Delete</Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>
      </Stack>

      <CallDialog open={callDialogOpen} name={lead?.full_name || lead?.name || "Unknown"} onClose={() => setCallDialogOpen(false)} />

      <SMSDialog open={smsDialogOpen} lead={lead as unknown as ProcessedLead} onClose={handleSmsDialogClose} />

      <BookAppointmentModal open={appointmentDialogOpen} lead={lead} onClose={() => setAppointmentDialogOpen(false)} onSaved={handleAppointmentSaved} />

      <Snackbar
        open={actionSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setActionSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setActionSnackbar((s) => ({ ...s, open: false }))} severity={actionSnackbar.severity} sx={{ borderRadius: "10px" }}>
          {actionSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NextActionTab;
