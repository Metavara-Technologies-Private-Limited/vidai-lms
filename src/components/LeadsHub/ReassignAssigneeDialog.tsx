import * as React from "react";
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
  CircularProgress,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch } from "react-redux";
import { EmployeeAPI, LeadAPI } from "../../services/leads.api";
import type { Employee, LeadPayload } from "../../services/leads.api";
import { fetchLeads } from "../../store/leadSlice";

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

// ── Sanitize helpers — narrow loose strings to literal unions ───────────────
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

const toNextActionStatus = (v: string | undefined): "pending" | "completed" => {
  if (v === "completed") return "completed";
  return "pending";
};

// ── LeadProp — fields kept as loose strings; sanitized before hitting LeadPayload
interface LeadProp {
  id: string;
  clinic_id?: number;
  department_id?: number;
  full_name?: string;
  name?: string;
  contact_no?: string;
  contact?: string;
  source?: string;
  treatment_interest?: string;
  treatmentInterest?: string;
  appointment_date?: string;
  appointmentDate?: string;
  date?: string;
  slot?: string;
  assigned_to_id?: number;
  next_action_type?: string;
  next_action_status?: string; // loose — sanitized via toNextActionStatus()
  next_action_description?: string;
  email?: string;
  age?: number;
  marital_status?: string; // loose — sanitized via toMaritalStatus()
  marital?: string;
  location?: string;
  address?: string;
  partner_inquiry?: boolean;
  partner_full_name?: string;
  partnerName?: string;
  partner_age?: number;
  partnerAge?: number;
  partner_gender?: string; // loose — sanitized via toPartnerGender()
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

// ── Constants ───────────────────────────────────────────────────────────────
const nextActionTypes = [
  "Follow Up",
  "Call Patient",
  "Send Message",
  "Send Email",
  "Book Appointment",
  "Review Details",
  "No Action",
] as const;

const nextActionStatuses: { value: "pending" | "completed"; label: string }[] =
  [
    { value: "pending", label: "To Do" },
    { value: "completed", label: "Completed" },
  ];

// ════════════════════════════════════════════════════════════════════════════
const ReassignAssigneeDialog: React.FC<Props> = ({ open, lead, onClose }) => {
  const dispatch = useDispatch();

  // ── State ────────────────────────────────────────────────────────────────
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<
    number | null
  >(null);
  const [nextActionType, setNextActionType] = React.useState("");
  const [nextActionStatus, setNextActionStatus] = React.useState<
    "pending" | "completed"
  >("pending");
  const [nextActionDesc, setNextActionDesc] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [fetchingEmployees, setFetchingEmployees] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Fetch employees & pre-populate ──────────────────────────────────────
  React.useEffect(() => {
    const load = async () => {
      if (!open || !lead.clinic_id) return;
      try {
        setFetchingEmployees(true);
        setError(null);
        const list = await EmployeeAPI.listByClinic(lead.clinic_id);
        setEmployees(list);
        if (lead.assigned_to_id) setSelectedEmployeeId(lead.assigned_to_id);
        if (lead.next_action_type) setNextActionType(lead.next_action_type);
        if (lead.next_action_status)
          setNextActionStatus(toNextActionStatus(lead.next_action_status));
        if (lead.next_action_description)
          setNextActionDesc(lead.next_action_description);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load employees"));
      } finally {
        setFetchingEmployees(false);
      }
    };
    load();
  }, [
    open,
    lead.clinic_id,
    lead.assigned_to_id,
    lead.next_action_type,
    lead.next_action_status,
    lead.next_action_description,
  ]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedEmployeeId) {
      setError("Please select an assignee");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ All literal-union fields sanitized — fully assignable to Partial<LeadPayload>
      const updatePayload: Partial<LeadPayload> = {
        full_name: lead.full_name ?? lead.name,
        contact_no: lead.contact_no ?? lead.contact,
        source: lead.source,
        treatment_interest:
          lead.treatment_interest ?? lead.treatmentInterest ?? "",
        appointment_date:
          lead.appointment_date ??
          lead.appointmentDate ??
          lead.date ??
          new Date().toISOString().split("T")[0],
        slot: lead.slot ?? "10:00 AM",

        // Reassign fields
        assigned_to_id: selectedEmployeeId,
        next_action_type: nextActionType || undefined,
        next_action_status: nextActionStatus, // "pending" | "completed" ✅
        next_action_description: nextActionDesc || undefined,

        // Preserved fields — all sanitized to match LeadPayload literals
        clinic_id: lead.clinic_id,
        department_id: lead.department_id,
        email: lead.email ?? undefined,
        age: lead.age ?? undefined,
        marital_status: toMaritalStatus(lead.marital_status ?? lead.marital), // ✅
        location: lead.location ?? undefined,
        address: lead.address ?? undefined,
        partner_inquiry: lead.partner_inquiry ?? false,
        partner_full_name:
          lead.partner_full_name ?? lead.partnerName ?? undefined,
        partner_age: lead.partner_age ?? lead.partnerAge ?? undefined,
        partner_gender: toPartnerGender(
          lead.partner_gender ?? lead.partnerGender,
        ), // ✅
        sub_source: lead.sub_source ?? lead.subSource ?? undefined,
        book_appointment:
          lead.book_appointment ?? lead.wantAppointment === "yes",
        remark: lead.remark ?? undefined,
        is_active: lead.is_active !== false,
      };

      // ⚡ Optimistic close for snappy UX
      onClose();

      LeadAPI.update(lead.id, updatePayload)
        .then(() => {
          dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
          window.dispatchEvent(
            new CustomEvent("lead-updated", {
              detail: {
                id: lead.id,
                assigned_to_id: selectedEmployeeId,
                next_action_type: nextActionType,
                next_action_status: nextActionStatus,
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

  // ── Close / reset ────────────────────────────────────────────────────────
  const handleClose = () => {
    if (loading) return;
    setError(null);
    setSelectedEmployeeId(lead.assigned_to_id ?? null);
    setNextActionType(lead.next_action_type ?? "");
    setNextActionStatus(toNextActionStatus(lead.next_action_status));
    setNextActionDesc(lead.next_action_description ?? "");
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
          <FormControl
            fullWidth
            disabled={fetchingEmployees || loading}
            size="small"
          >
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
              {fetchingEmployees ? (
                <MenuItem disabled>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography fontSize="14px">
                      Loading employees...
                    </Typography>
                  </Box>
                </MenuItem>
              ) : employees.length === 0 ? (
                <MenuItem disabled>
                  <Typography fontSize="14px">
                    No employees available
                  </Typography>
                </MenuItem>
              ) : (
                employees.map((emp) => (
                  <MenuItem
                    key={emp.id}
                    value={emp.id}
                    sx={{ fontSize: "14px" }}
                  >
                    {emp.emp_name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Next Action Type */}
          <FormControl fullWidth disabled={loading} size="small">
            <InputLabel
              sx={{ fontSize: "14px", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Next Action Type
            </InputLabel>
            <Select
              value={nextActionType}
              onChange={(e) => setNextActionType(e.target.value)}
              label="Next Action Type"
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
              {nextActionTypes.map((type) => (
                <MenuItem key={type} value={type} sx={{ fontSize: "14px" }}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Next Action Status */}
          <FormControl fullWidth disabled={loading} size="small">
            <InputLabel
              sx={{ fontSize: "14px", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Next Action Status
            </InputLabel>
            <Select
              value={nextActionStatus}
              onChange={(e) =>
                setNextActionStatus(e.target.value as "pending" | "completed")
              }
              label="Next Action Status"
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
              {nextActionStatuses.map((s) => (
                <MenuItem
                  key={s.value}
                  value={s.value}
                  sx={{ fontSize: "14px" }}
                >
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Description */}
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
          disabled={loading || fetchingEmployees || !selectedEmployeeId}
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
