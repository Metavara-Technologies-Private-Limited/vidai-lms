import * as React from "react";
import { useSelector } from "react-redux";
import { selectUsers } from "../../store/userSlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Box,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch } from "react-redux";
import { LeadAPI } from "../../services/leads.api";
import type { LeadPayload } from "../../services/leads.api";
import { fetchLeads } from "../../store/leadSlice";
import { selectClinic } from "../../store/clinicSlice";
import {
  pipelineApi,
  isActiveStageStatus,
  type PipelineStage,
} from "../../services/pipeline.api";
import {
  TASK_TYPES,
  TASK_STATUS_OPTIONS,
  type TaskStatusValue,
} from "../LeadsHub/addNewLead.constants";

const STORAGE_KEY_SELECTED_INDUSTRY = "leads_selected_industry";
const STORAGE_KEY_SELECTED_PIPELINE = "leads_selected_pipeline_id";

// ── Typed error helper ──────────────────────────────────────────────────────
interface ApiError {
  response?: { data?: { detail?: string; message?: string } };
  message?: string;
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiError;
  return (
    e?.response?.data?.detail ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

type AssigneeOption = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  role?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeUsersList = (users: any[]): AssigneeOption[] => {
  return users.map((u) => ({
    id: u.id,
    first_name: u.first_name || u.firstName,
    last_name: u.last_name || u.lastName,
    username: u.username,
    role: u.role?.name || u.role || "",
  }));
};

const assigneeLabel = (option: AssigneeOption): string => {
  const fullName =
    `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  return option.role ? `${primary} (${option.role})` : primary;
};

const getSelectedAssigneeName = (
  assignees: AssigneeOption[],
  id: number | null,
): string | null => {
  if (!id) return null;
  const matched = assignees.find((a) => a.id === id);
  return matched ? assigneeLabel(matched) : null;
};

const normalizeTreatmentInterest = (
  value: string | string[] | { id: string; name: string }[] | undefined,
): string[] => {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "object" ? item.id : item));
  }
  return [];
};

const toMaritalStatus = (
  v: string | undefined,
): "single" | "married" | undefined => {
  if (v === "single" || v === "married") return v;
  return undefined;
};

const toPartnerGender = (
  v: string | undefined,
): "male" | "female" | undefined => {
  if (v === "male" || v === "female") return v;
  return undefined;
};

// ── Derive action type labels from a single stage's enabled rules ────────────
const deriveActionTypeOptions = (stage: PipelineStage): string[] => {
  const labels = stage.rules
    .filter((r) => r.is_enabled)
    .map((r) =>
      r.custom_label?.trim() ? r.custom_label.trim() : r.action_type,
    );
  return labels.length > 0 ? labels : [...TASK_TYPES];
};

// ── Derive union of action type labels across all stages ─────────────────────
const deriveAllActionTypeOptions = (stages: PipelineStage[]): string[] => {
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
  return labels.length > 0 ? labels : [...TASK_TYPES];
};

// ── LeadProp ─────────────────────────────────────────────────────────────────
interface LeadProp {
  id: string;
  clinic_id?: number;
  department_id?: number;
  full_name?: string;
  name?: string;
  contact_no?: string;
  contact?: string;
  source?: string;
  treatment_interest?: string | string[] | { id: string; name: string }[];
  treatmentInterest?: string | string[] | { id: string; name: string }[];
  appointment_date?: string;
  appointmentDate?: string;
  date?: string;
  slot?: string;
  assigned_to_id?: number;
  next_action_type?: string;
  /** Maps to action_status on the payload — same as form.taskStatus in AddNewLead */
  action_status?: string;
  next_action_description?: string;
  email?: string;
  age?: number;
  marital_status?: string;
  marital?: string;
  location?: string;
  address?: string;
  partner_inquiry?: boolean;
  partner_full_name?: string;
  partnerName?: string;
  partner_age?: number;
  partnerAge?: number;
  partner_gender?: string;
  partnerGender?: string;
  sub_source?: string;
  subSource?: string;
  lead_status?: string;
  status?: string;
  book_appointment?: boolean;
  wantAppointment?: string;
  remark?: string;
  is_active?: boolean;
}

interface Props {
  open: boolean;
  lead: LeadProp;
  onClose: () => void;
}

// ════════════════════════════════════════════════════════════════════════════
const ReassignAssigneeDialog: React.FC<Props> = ({ open, lead, onClose }) => {
  const dispatch = useDispatch();

  const users = useSelector(selectUsers);
  const selectedClinic = useSelector(selectClinic);
  const clinicId =
    selectedClinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 1);

  // ── State ────────────────────────────────────────────────────────────────
  const [assignees, setAssignees] = React.useState<AssigneeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<
    number | null
  >(null);
  const [nextActionType, setNextActionType] = React.useState("");
  const [taskStatus, setTaskStatus] = React.useState<TaskStatusValue | "">("");
  // Always blank on open — never pre-filled from the lead
  const [nextActionDesc, setNextActionDesc] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Pipeline-derived next action type options ────────────────────────────
  const [nextActionTypeOptions, setNextActionTypeOptions] = React.useState<
    string[]
  >([]);
  const [loadingPipeline, setLoadingPipeline] = React.useState(false);

  // ── Load pipeline stages (same logic as AddNewLead) ──────────────────────
  React.useEffect(() => {
    if (!open) return;

    const loadFromPipeline = async () => {
      const selectedIndustry =
        localStorage.getItem(STORAGE_KEY_SELECTED_INDUSTRY) ?? "";
      const selectedPipelineId =
        localStorage.getItem(STORAGE_KEY_SELECTED_PIPELINE) ?? "";

      try {
        setLoadingPipeline(true);

        let selectedPipeline = null;

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

          selectedPipeline =
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
            const aOrder =
              typeof a.stage_order === "number" ? a.stage_order : 0;
            const bOrder =
              typeof b.stage_order === "number" ? b.stage_order : 0;
            if (aOrder === bOrder) return 0;
            return aOrder - bOrder;
          });

        // Scope next action type options to the stage after the lead's current status
        const currentLeadStatus = lead.lead_status ?? lead.status ?? "";
        const matchedStage = currentLeadStatus
          ? activeStages.find(
              (s) =>
                s.stage_name.trim().toLowerCase() ===
                currentLeadStatus.trim().toLowerCase(),
            )
          : null;

        const nextStage = matchedStage
          ? activeStages.find(
              (s) => s.stage_order > matchedStage.stage_order,
            ) ?? null
          : activeStages[1] ?? null;

        const options = nextStage
          ? deriveActionTypeOptions(nextStage)
          : deriveAllActionTypeOptions(activeStages);

        setNextActionTypeOptions(options);
      } catch {
        setNextActionTypeOptions([...TASK_TYPES]);
      } finally {
        setLoadingPipeline(false);
      }
    };

    void loadFromPipeline();
  }, [open, clinicId, lead.lead_status, lead.status]);

  // ── Pre-populate from lead (description intentionally excluded) ──────────
  React.useEffect(() => {
    if (!open) return;

    const normalized = normalizeUsersList(users);
    setAssignees(normalized);

    if (lead.assigned_to_id) {
      setSelectedEmployeeId(lead.assigned_to_id);
    }

    if (lead.next_action_type) {
      setNextActionType(lead.next_action_type);
    }

    // Pre-populate task status from lead's action_status field
    const existingTaskStatus = (lead.action_status ?? "").trim().toLowerCase();
    const isValidTaskStatus = TASK_STATUS_OPTIONS.some(
      (opt) => opt.value === existingTaskStatus,
    );
    setTaskStatus(
      isValidTaskStatus ? (existingTaskStatus as TaskStatusValue) : "",
    );

    // ── next_action_description is deliberately NOT read from the lead ──
    // The dialog always opens with a blank description so the user writes
    // a fresh note for the reassignment, not a stale/system-generated one.
    setNextActionDesc("");
  }, [
    open,
    users,
    lead.assigned_to_id,
    lead.next_action_type,
    lead.action_status,
  ]);

  // ── Auto-clear nextActionType if no longer valid after pipeline loads ─────
  React.useEffect(() => {
    if (!nextActionType) return;
    if (nextActionTypeOptions.includes(nextActionType)) return;
    if (!loadingPipeline && nextActionTypeOptions.length > 0) {
      setNextActionType("");
    }
  }, [nextActionType, nextActionTypeOptions, loadingPipeline]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedEmployeeId) {
      setError("Please select an assignee");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updatePayload: Partial<LeadPayload> = {
        full_name: lead.full_name ?? lead.name,
        contact_no: lead.contact_no ?? lead.contact,
        source: lead.source,
        treatment_interest: normalizeTreatmentInterest(
          lead.treatment_interest ?? lead.treatmentInterest,
        ),
        appointment_date:
          lead.appointment_date ??
          lead.appointmentDate ??
          lead.date ??
          new Date().toISOString().split("T")[0],
        slot: lead.slot ?? "10:00 AM",

        // Reassign fields
        assigned_to_id: selectedEmployeeId,
        assigned_to_name: getSelectedAssigneeName(
          assignees,
          selectedEmployeeId,
        ),
        next_action_type: nextActionType || undefined,
        next_action_description: nextActionDesc || undefined,

        // Task Status → action_status (same mapping as AddNewLead buildPayload)
        action_status: (taskStatus as TaskStatusValue) || null,

        // Preserved fields
        clinic_id: lead.clinic_id,
        department_id: lead.department_id,
        email: lead.email ?? undefined,
        age: lead.age ?? undefined,
        marital_status: toMaritalStatus(lead.marital_status ?? lead.marital),
        location: lead.location ?? undefined,
        address: lead.address ?? undefined,
        partner_inquiry: lead.partner_inquiry ?? false,
        partner_full_name:
          lead.partner_full_name ?? lead.partnerName ?? undefined,
        partner_age: lead.partner_age ?? lead.partnerAge ?? undefined,
        partner_gender: toPartnerGender(
          lead.partner_gender ?? lead.partnerGender,
        ),
        sub_source: lead.sub_source ?? lead.subSource ?? undefined,
        book_appointment:
          lead.book_appointment ?? lead.wantAppointment === "yes",
        remark: lead.remark ?? undefined,
        is_active: lead.is_active !== false,
      };

      // ⚡ Optimistic close for snappy UX
      onClose();

      await LeadAPI.update(lead.id, updatePayload)
        .then(() => {
          dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
          window.dispatchEvent(
            new CustomEvent("lead-updated", {
              detail: {
                id: lead.id,
                assigned_to_id: selectedEmployeeId,
                assigned_to_name: getSelectedAssigneeName(
                  assignees,
                  selectedEmployeeId,
                ),
                next_action_type: nextActionType,
                action_status: taskStatus,
                next_action_description: nextActionDesc,
              },
            }),
          );
        })
        .catch((err: unknown) => {
          setError(getErrorMessage(err, "Failed to update lead"));
        })
        .finally(() => setLoading(false));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update lead"));
      setLoading(false);
    }
  };

  // ── Close / reset ─────────────────────────────────────────────────────────
  const handleClose = () => {
    if (loading) return;
    setError(null);
    setSelectedEmployeeId(lead.assigned_to_id ?? null);
    setNextActionType(lead.next_action_type ?? "");
    const existingTaskStatus = (lead.action_status ?? "").trim().toLowerCase();
    const isValidTaskStatus = TASK_STATUS_OPTIONS.some(
      (opt) => opt.value === existingTaskStatus,
    );
    setTaskStatus(
      isValidTaskStatus ? (existingTaskStatus as TaskStatusValue) : "",
    );
    // Always reset to blank on close too
    setNextActionDesc("");
    onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "8px", width: "450px", maxWidth: "90vw" },
      }}
    >
      {/* Title */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
          pt: 2.5,
          px: 3,
          borderBottom: "1px solid #E0E0E0",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}
        >
          Reassign Assignee
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
          sx={{ color: "#666", "&:hover": { bgcolor: "#F5F5F5" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 1 }}
            >
              {error}
            </Alert>
          )}

          {/* Assignee */}
          <FormControl fullWidth disabled={loading} size="small">
            <InputLabel
              sx={{ fontSize: "14px", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Assignee
            </InputLabel>
            <Select
              value={selectedEmployeeId ?? ""}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              label="Assignee"
              sx={{
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D0D0D0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#999",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              {assignees.map((user) => (
                <MenuItem
                  key={user.id}
                  value={user.id}
                  sx={{ fontSize: "14px" }}
                >
                  {assigneeLabel(user)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Next Action Type — dynamic from pipeline */}
          <FormControl
            fullWidth
            disabled={loading || loadingPipeline}
            size="small"
          >
            <InputLabel
              sx={{ fontSize: "14px", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Next Action Type
            </InputLabel>
            <Select
              value={nextActionType}
              onChange={(e) => setNextActionType(e.target.value)}
              label="Next Action Type"
              endAdornment={
                loadingPipeline ? (
                  <CircularProgress size={16} sx={{ mr: 3, color: "#999" }} />
                ) : null
              }
              sx={{
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D0D0D0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#999",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: "14px" }}>
                -- Select --
              </MenuItem>
              {loadingPipeline ? (
                <MenuItem value="" disabled sx={{ fontSize: "14px" }}>
                  Loading…
                </MenuItem>
              ) : nextActionTypeOptions.length === 0 ? (
                <MenuItem value="" disabled sx={{ fontSize: "14px" }}>
                  No actions configured
                </MenuItem>
              ) : (
                nextActionTypeOptions.map((type) => (
                  <MenuItem key={type} value={type} sx={{ fontSize: "14px" }}>
                    {type}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Task Status — matches form.taskStatus / action_status in AddNewLead */}
          <FormControl fullWidth disabled={loading} size="small">
            <InputLabel
              sx={{ fontSize: "14px", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Task Status
            </InputLabel>
            <Select
              value={taskStatus}
              onChange={(e) =>
                setTaskStatus(e.target.value as TaskStatusValue | "")
              }
              label="Task Status"
              sx={{
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D0D0D0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#999",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: "14px" }}>
                -- Select --
              </MenuItem>
              {TASK_STATUS_OPTIONS.map((opt) => (
                <MenuItem
                  key={opt.value}
                  value={opt.value}
                  sx={{ fontSize: "14px" }}
                >
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Next Action Description — always starts blank */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Next Action Description"
            placeholder="Enter Description"
            value={nextActionDesc}
            onChange={(e) => setNextActionDesc(e.target.value)}
            disabled={loading}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                "& fieldset": { borderColor: "#D0D0D0" },
                "&:hover fieldset": { borderColor: "#999" },
                "&.Mui-focused fieldset": { borderColor: "#1976d2" },
              },
              "& .MuiInputLabel-root": {
                fontSize: "14px",
                "&.Mui-focused": { color: "#1976d2" },
              },
              "& .MuiInputBase-input::placeholder": {
                fontSize: "14px",
                color: "#999",
              },
            }}
          />
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{ px: 3, pb: 2.5, pt: 2, gap: 1.5, justifyContent: "flex-end" }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{
            minWidth: 100,
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            borderColor: "#D0D0D0",
            color: "#666",
            "&:hover": { borderColor: "#999", bgcolor: "#F5F5F5" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !selectedEmployeeId}
          sx={{
            minWidth: 100,
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            bgcolor: "#2C2C2C",
            color: "#FFFFFF",
            "&:hover": { bgcolor: "#1A1A1A" },
            "&.Mui-disabled": { bgcolor: "#E0E0E0", color: "#999" },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReassignAssigneeDialog;