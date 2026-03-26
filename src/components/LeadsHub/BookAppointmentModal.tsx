// ============================================================
// BookAppointmentModal.tsx
// - MUI DatePicker  →  identical to EditLead.tsx Step 3
//   (LocalizationProvider + AdapterDayjs + slotProps.textField)
// - Slot  →  TextField select, same inputStyle as EditLead
// - DepartmentAPI / EmployeeAPI  →  consistent with useEditLead
// - onSaved(AppointmentResult)  →  parent updates state immediately,
//   appointment visible without any page refresh
// ============================================================
import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";

import { toast } from "react-toastify";

import { api, DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import type { Department, Employee } from "../../services/leads.api";
import type { LeadRecord } from "./LeadDetailTypes";
import { IS_MEDICAL_APP } from "../../config/appType";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface BookAppointmentModalProps {
  open: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
  /**
   * Called immediately after a successful API save.
   * Parent should merge this into its local lead/appointment state
   * so the UI reflects the new booking without a full page refresh.
   */
  onSaved?: (result: AppointmentResult) => void;
}

/** Returned to the parent so it can update its state optimistically */
export interface AppointmentResult {
  leadId: number | string;
  book_appointment: true;
  appointment_date: string;   // "YYYY-MM-DD"
  slot: string;
  remark: string;
  personal_id: number | null;
  department_id: number | null;
  personnelName: string;
  departmentName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SLOT_OPTIONS = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  "11:30 AM - 12:00 PM",
  "12:00 PM - 12:30 PM",
  "12:30 PM - 01:00 PM",
  "01:00 PM - 01:30 PM",
  "01:30 PM - 02:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:00 PM - 03:30 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
  "04:30 PM - 05:00 PM",
  "05:00 PM - 05:30 PM",
];

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

// ── Field style matching the screenshot: outlined, rounded, floated label ──
const modalFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: "14px",
    bgcolor: "#FFFFFF",
    "& fieldset": { borderColor: "#D1D5DB" },
    "&:hover fieldset": { borderColor: "#9CA3AF" },
    "&.Mui-focused fieldset": { borderColor: "#6B7280", borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontSize: "13px", color: "#9CA3AF" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#374151" },
};

const floatLabelSx = {
  fontSize: "13px",
  color: "#9CA3AF",
  "&.Mui-focused": { color: "#374151" },
};


// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  open,
  lead,
  onClose,
  onSaved,
}) => {
  // ── Form state ──
  const [department, setDepartment] = React.useState("");
  const [personnel, setPersonnel]   = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);
  const [slot, setSlot]             = React.useState("");
  const [remark, setRemark]         = React.useState("");
  const [saving, setSaving]         = React.useState(false);
  const [error, setError]           = React.useState<string | null>(null);

  // ── Lookup data ──
  const [departments, setDepartments]       = React.useState<Department[]>([]);
  const [employees, setEmployees]           = React.useState<Employee[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingEmployees, setLoadingEmployees]     = React.useState(false);

  const clinicId = lead?.clinic_id ?? 1;
  const today    = dayjs().startOf("day");

  // ── Reset form when modal opens ──
  React.useEffect(() => {
    if (open) {
      setDepartment("");
      setPersonnel("");
      setSelectedDate(null);
      setSlot("");
      setRemark("");
      setError(null);
    }
  }, [open]);

  // ── Fetch departments (medical app only) ──
  React.useEffect(() => {
    if (!open || !IS_MEDICAL_APP || !clinicId) return;
    (async () => {
      try {
        setLoadingDepartments(true);
        const list = await DepartmentAPI.listActiveByClinic(clinicId);
        setDepartments(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Departments fetch failed:", e);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, [open, clinicId]);

  // ── Fetch employees ──
  React.useEffect(() => {
    if (!open || !clinicId) return;
    (async () => {
      try {
        setLoadingEmployees(true);
        const list = await EmployeeAPI.listByClinic(clinicId);
        setEmployees(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Employees fetch failed:", e);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    })();
  }, [open, clinicId]);

  // ── Clear personnel when department changes ──
  React.useEffect(() => {
    setPersonnel("");
  }, [department]);

  // ── Filter personnel by department (medical) or return all (contracts) ──
  const filteredPersonnel = React.useMemo<Employee[]>(() => {
    if (!IS_MEDICAL_APP) return employees;
    if (!department || employees.length === 0) return [];
    const selectedDept = departments.find((d) => d.id === Number(department));
    if (!selectedDept) return [];
    const norm = (s: string) => (s ?? "").trim().toLowerCase().normalize("NFC");
    return employees.filter(
      (emp) => norm(emp.department_name) === norm(selectedDept.name),
    );
  }, [department, employees, departments]);

  // ─────────────────────────────────────────────────────────────────────────
  // Save handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!lead) return;

    // Validation
    if (IS_MEDICAL_APP && !department) { setError("Please select a department."); return; }
    if (!personnel)    { setError("Please select a personnel."); return; }
    if (!selectedDate) { setError("Please select a date."); return; }
    if (!slot)         { setError("Please select a time slot."); return; }

    const appointmentDateStr = selectedDate.format("YYYY-MM-DD");
    const deptId      = IS_MEDICAL_APP ? Number(department) : (lead.department_id ?? 0);
    const personnelId = Number(personnel);

    // Lookup display names for the optimistic update
    const selectedDept = departments.find((d) => d.id === deptId);
    const selectedEmp  = employees.find((e) => e.id === personnelId);

    setSaving(true);
    setError(null);

    try {
      await api.put(`/leads/${lead.id}/update/`, {
        clinic_id:          clinicId,
        department_id:      deptId,
        full_name:          lead.full_name || lead.name,
        contact_no:         lead.contact_no || lead.phone || lead.phone_number || "",
        source:             lead.source || "Unknown",
        treatment_interest: lead.treatment_interest || "N/A",
        book_appointment:   true,
        appointment_date:   appointmentDateStr,
        slot,
        remark:             remark.trim(),
        is_active:          lead.is_active !== false,
        partner_inquiry:    lead.partner_inquiry || false,
        personal_id:        personnelId,
      });

      toast.success("Appointment booked successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });

      // ── Notify parent with full result — no page refresh needed ──
      onSaved?.({
        leadId:           lead.id,
        book_appointment: true,
        appointment_date: appointmentDateStr,
        slot,
        remark:           remark.trim(),
        personal_id:      personnelId,
        department_id:    deptId,
        personnelName:    selectedEmp?.emp_name ?? "",
        departmentName:   selectedDept?.name ?? "",
      });

      onClose();
    } catch (err) {
      setError(extractErr(err, "Failed to book appointment. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render  –  UI matches the screenshot exactly (pure cosmetic, no logic change)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          overflow: "hidden",
          bgcolor: "#FFFFFF",
        },
      }}
    >
      {/* ══ Header ══════════════════════════════════════════════════════════ */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 2.5,
          pb: 1.5,
          px: 3,
          bgcolor: "#FFFFFF",
        }}
      >
        <Typography fontWeight={700} fontSize="17px" color="#111827">
          Book an Appointment
        </Typography>

        <IconButton
          size="small"
          onClick={onClose}
          disabled={saving}
          sx={{
            color: "#6B7280",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            width: 30,
            height: 30,
            "&:hover": { bgcolor: "#F3F4F6" },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      {/* ══ Body ════════════════════════════════════════════════════════════ */}
      <DialogContent sx={{ px: 3, pt: 0, pb: 2 }}>

        {/* Error banner */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ borderRadius: "8px", fontSize: "13px", mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* ── "APPOINTMENT DETAILS" section label ── */}
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#9CA3AF",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            mb: 2,
          }}
        >
          Appointment Details
        </Typography>

        {/* ── Row 1: Department + Personnel ── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: IS_MEDICAL_APP ? "1fr 1fr" : "1fr",
            gap: 2,
            mb: 2,
          }}
        >
          {/* Department — medical only */}
          {IS_MEDICAL_APP && (
            <FormControl size="small" fullWidth sx={modalFieldSx} required>
              <InputLabel shrink sx={floatLabelSx}>
                Department <span style={{ color: "#EF4444" }}>*</span>
              </InputLabel>
              <Select
                value={department}
                label="Department *"
                notched
                onChange={(e) => setDepartment(e.target.value)}
                disabled={saving || loadingDepartments}
                endAdornment={
                  loadingDepartments
                    ? <CircularProgress size={14} sx={{ mr: 2 }} />
                    : null
                }
              >
                <MenuItem value=""><em>Select Department</em></MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Personnel */}
          <FormControl size="small" fullWidth sx={modalFieldSx} required>
            <InputLabel shrink sx={floatLabelSx}>
              Personnel <span style={{ color: "#EF4444" }}>*</span>
            </InputLabel>
            <Select
              value={personnel}
              label="Personnel *"
              notched
              onChange={(e) => setPersonnel(e.target.value)}
              disabled={
                saving ||
                loadingEmployees ||
                (IS_MEDICAL_APP && !department)
              }
              endAdornment={
                loadingEmployees
                  ? <CircularProgress size={14} sx={{ mr: 2 }} />
                  : null
              }
            >
              {IS_MEDICAL_APP && !department ? (
                <MenuItem value="" disabled>Select department first</MenuItem>
              ) : filteredPersonnel.length === 0 && IS_MEDICAL_APP ? (
                <MenuItem value="" disabled>No employees in this department</MenuItem>
              ) : (
                [
                  <MenuItem key="__empty__" value=""><em>Select Personnel</em></MenuItem>,
                  ...filteredPersonnel.map((emp) => (
                    <MenuItem key={emp.id} value={String(emp.id)}>
                      {emp.emp_name}{emp.emp_type ? ` (${emp.emp_type})` : ""}
                    </MenuItem>
                  )),
                ]
              )}
            </Select>
          </FormControl>
        </Box>

        {/* ── Row 2: Date + Slot ── */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>

          {/* DatePicker — same as EditLead.tsx Step 3, floated label */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={selectedDate}
              onChange={(val) => setSelectedDate(val ? dayjs(val) : null)}
              minDate={today}
              disabled={saving}
              label={
                <span>
                  Date <span style={{ color: "#EF4444" }}>*</span>
                </span>
              }
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: modalFieldSx,
                  InputLabelProps: { shrink: true, sx: floatLabelSx },
                },
              }}
            />
          </LocalizationProvider>

          {/* Slot */}
          <FormControl size="small" fullWidth sx={modalFieldSx} required>
            <InputLabel shrink sx={floatLabelSx}>
              Select Slot <span style={{ color: "#EF4444" }}>*</span>
            </InputLabel>
            <Select
              value={slot}
              label="Select Slot *"
              notched
              onChange={(e) => setSlot(e.target.value)}
              disabled={saving}
            >
              <MenuItem value=""><em>Select Time Slot</em></MenuItem>
              {SLOT_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>

        </Box>

        {/* ── Remark ── */}
        <TextField
          label="Remark"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          disabled={saving}
          placeholder="Type Here...."
          InputLabelProps={{ shrink: true, sx: floatLabelSx }}
          sx={modalFieldSx}
        />

      </DialogContent>

      {/* ══ Footer ══════════════════════════════════════════════════════════ */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          gap: 1.5,
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            px: 3,
            py: 1,
            borderColor: "#D1D5DB",
            color: "#374151",
            bgcolor: "#FFFFFF",
            "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" },
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          sx={{
            textTransform: "none",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            px: 3,
            py: 1,
            minWidth: 90,
            bgcolor: "#1F2937",
            boxShadow: "none",
            "&:hover": { bgcolor: "#111827", boxShadow: "none" },
          }}
        >
          {saving
            ? <CircularProgress size={16} sx={{ color: "#fff" }} />
            : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookAppointmentModal;