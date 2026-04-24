// LeadsboardModals.tsx
// SmsModal, BookAppointmentModal, SuccessToast
// NOTE: MailModal has been removed — use EmailDialog from LeadsTableEmailDialogs instead.

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fade,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SendIcon from "@mui/icons-material/Send";
import EventIcon from "@mui/icons-material/Event";

import type { LeadItem, AppointmentState } from "./Leadsboardtypes";
import { TIME_SLOTS } from "./Leadsboardtypes";
import { IS_MEDICAL_APP } from "../../config/appType";

// ── Shared field style ────────────────────────────────────────────────────────
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 500,
    color: "#111827",
    bgcolor: "#FFFFFF",
    "& fieldset": { borderColor: "#D1D5DB" },
    "&:hover fieldset": { borderColor: "#9CA3AF" },
    "&.Mui-focused fieldset": { borderColor: "#6B7280", borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": {
    fontSize: "13px",
    color: "#9CA3AF",
    "&.Mui-focused": { color: "#374151" },
  },
  "& .MuiSelect-icon": { color: "#374151" },
};

// ══════════════════════════════════════════════════════════════════════════════
// SuccessToast
// ══════════════════════════════════════════════════════════════════════════════
interface SuccessToastProps { show: boolean; message: string; }

export const SuccessToast: React.FC<SuccessToastProps> = ({ show, message }) => (
  <Fade in={show}>
    <Box sx={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      bgcolor: "#10B981", color: "white", px: 3, py: 1.5, borderRadius: "12px",
      display: "flex", alignItems: "center", gap: 1.5, zIndex: 10000,
      boxShadow: "0px 10px 20px rgba(16,185,129,0.2)",
    }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
      <Typography variant="body2" fontWeight={600}>{message}</Typography>
    </Box>
  </Fade>
);

// ══════════════════════════════════════════════════════════════════════════════
// SmsModal (unchanged)
// ══════════════════════════════════════════════════════════════════════════════
interface SmsModalProps {
  open: boolean;
  selectedLead: LeadItem | null;
  smsMessage: string;
  setSmsMessage: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
}

export const SmsModal: React.FC<SmsModalProps> = ({
  open, selectedLead, smsMessage, setSmsMessage, onClose, onSend,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}>
    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3 }}>
      <Typography variant="h6" fontWeight={800} color="#1E293B">Send SMS</Typography>
      <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} color="#475569" sx={{ mb: 1 }}>To:</Typography>
        <Chip
          label={selectedLead?.full_name || (selectedLead as unknown as { name?: string })?.name}
          size="small"
          sx={{ bgcolor: "#EEF2FF", color: "#6366F1", fontWeight: 600, borderRadius: "8px", height: 32, fontSize: "0.875rem" }}
        />
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={600} color="#475569" sx={{ mb: 1 }}>Message:</Typography>
        <TextField
          fullWidth multiline rows={6} placeholder="Type your message here..." value={smsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", "& fieldset": { borderColor: "#E2E8F0" }, "&:hover fieldset": { borderColor: "#CBD5E1" }, "&.Mui-focused fieldset": { borderColor: "#6366F1", borderWidth: "2px" } } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "right" }}>
          {smsMessage.length} / 160 characters
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions sx={{ p: 3, borderTop: "1px solid #F1F5F9", gap: 2 }}>
      <Button onClick={onClose} sx={{ flex: 1, color: "#64748B", textTransform: "none", fontWeight: 700, borderRadius: "12px", border: "1px solid #E2E8F0", py: 1.2 }}>Cancel</Button>
      <Button variant="contained" onClick={onSend} disabled={!smsMessage.trim()} endIcon={<SendIcon sx={{ fontSize: 16 }} />}
        sx={{ flex: 1, bgcolor: "#334155", borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.2, "&:hover": { bgcolor: "#1e293b" }, "&:disabled": { bgcolor: "#CBD5E1" } }}>
        Send
      </Button>
    </DialogActions>
  </Dialog>
);

// ══════════════════════════════════════════════════════════════════════════════
// BookAppointmentModal (unchanged)
// ══════════════════════════════════════════════════════════════════════════════
interface BookAppointmentModalProps {
  open: boolean;
  selectedLead: LeadItem | null;
  appointment: AppointmentState;
  setSelectedDepartmentId: (id: number | "") => void;
  setSelectedEmployeeId: (id: number | "") => void;
  setDate: (d: Date | null) => void;
  setSlot: (s: string) => void;
  setRemark: (r: string) => void;
  clearError: () => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  open, appointment, setSelectedDepartmentId, setSelectedEmployeeId,
  setDate, setSlot, setRemark, clearError, onClose, onSubmit,
}) => (
  <Dialog open={open} onClose={!appointment.submitting ? onClose : undefined} fullWidth maxWidth="sm"
    PaperProps={{ sx: { borderRadius: "20px", boxShadow: "0px 24px 48px rgba(0,0,0,0.14)", overflow: "hidden", bgcolor: "#FFFFFF" } }}>

    <DialogTitle sx={{ px: 3, pt: 3, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography fontWeight={800} fontSize="1.2rem" color="#111827">Book an Appointment</Typography>
      <IconButton onClick={onClose} disabled={appointment.submitting} size="small"
        sx={{ bgcolor: "#F3F4F6", borderRadius: "8px", width: 32, height: 32, "&:hover": { bgcolor: "#E5E7EB" } }}>
        <CloseIcon sx={{ fontSize: 16, color: "#374151" }} />
      </IconButton>
    </DialogTitle>

    <Divider />

    <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
      {appointment.error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: "0.82rem" }} onClose={clearError}>
          {appointment.error}
        </Alert>
      )}

      <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", mb: 2.5 }}>
        Appointment Details
      </Typography>

      <Stack spacing={2.5}>
        <Box sx={{ display: "grid", gridTemplateColumns: IS_MEDICAL_APP ? "1fr 1fr" : "1fr", gap: 2 }}>
          {IS_MEDICAL_APP && (
            <FormControl size="small" fullWidth sx={fieldSx}>
              <InputLabel shrink>Department&nbsp;<span style={{ color: "#EF4444" }}>*</span></InputLabel>
              <Select value={appointment.selectedDepartmentId} label="Department *" notched
                onChange={(e) => setSelectedDepartmentId(Number(e.target.value))}
                disabled={appointment.submitting || appointment.loadingDepartments}
                endAdornment={appointment.loadingDepartments ? <CircularProgress size={14} sx={{ mr: 2 }} /> : null}>
                <MenuItem value="" disabled><Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Select Department</Typography></MenuItem>
                {appointment.departments.map((d) => <MenuItem key={d.id} value={d.id} sx={{ fontSize: "0.9rem" }}>{d.name}</MenuItem>)}
                {appointment.departments.length === 0 && !appointment.loadingDepartments && (
                  <MenuItem disabled sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}>No departments found</MenuItem>
                )}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" fullWidth sx={fieldSx}>
            <InputLabel shrink>Personnel&nbsp;<span style={{ color: "#EF4444" }}>*</span></InputLabel>
            <Select value={appointment.selectedEmployeeId} label="Personnel *" notched
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              disabled={appointment.submitting || appointment.loadingEmployees || (IS_MEDICAL_APP && !appointment.selectedDepartmentId)}
              endAdornment={appointment.loadingEmployees ? <CircularProgress size={14} sx={{ mr: 2 }} /> : null}>
              {IS_MEDICAL_APP && !appointment.selectedDepartmentId ? (
                <MenuItem value="" disabled sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}>Select department first</MenuItem>
              ) : [
                <MenuItem key="__empty__" value=""><Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Select Personnel</Typography></MenuItem>,
                ...(IS_MEDICAL_APP ? appointment.filteredEmployees : appointment.employees).map((emp) => (
                  <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: "0.9rem" }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{emp.emp_name}</Typography>
                      {emp.emp_type && <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{emp.emp_type}</Typography>}
                    </Box>
                  </MenuItem>
                )),
              ]}
              {IS_MEDICAL_APP && appointment.selectedDepartmentId && appointment.filteredEmployees.length === 0 && !appointment.loadingEmployees && (
                <MenuItem disabled sx={{ fontSize: "0.85rem", color: "#9CA3AF" }}>No personnel in this department</MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <DatePicker value={appointment.date} onChange={(v) => setDate(v ? new Date(v as unknown as string) : null)}
            minDate={new Date()} slots={{ openPickerIcon: EventIcon }}
            label={<span>Date&nbsp;<span style={{ color: "#EF4444" }}>*</span></span>}
            slotProps={{
              textField: { size: "small", fullWidth: true, sx: fieldSx, InputLabelProps: { shrink: true } },
              popper: { sx: { "& .MuiPaper-root": { borderRadius: "14px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }, "& .MuiPickersDay-root.Mui-selected": { bgcolor: "#334155" }, "& .MuiPickersDay-root.Mui-selected:hover": { bgcolor: "#1E293B" } } },
            }}
          />

          <FormControl size="small" fullWidth sx={fieldSx}>
            <InputLabel shrink>Select Slot&nbsp;<span style={{ color: "#EF4444" }}>*</span></InputLabel>
            <Select value={appointment.slot} label="Select Slot *" notched
              onChange={(e) => setSlot(e.target.value)} disabled={appointment.submitting}>
              <MenuItem value="" disabled><Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Select Time Slot</Typography></MenuItem>
              {TIME_SLOTS.map((s) => <MenuItem key={s} value={s} sx={{ fontSize: "0.9rem" }}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <TextField label="Remark" size="small" fullWidth multiline minRows={2}
          value={appointment.remark} onChange={(e) => setRemark(e.target.value)}
          disabled={appointment.submitting} placeholder="Type Here...."
          InputLabelProps={{ shrink: true }} sx={fieldSx} />
      </Stack>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1.5, justifyContent: "flex-end" }}>
      <Button onClick={onClose} disabled={appointment.submitting} variant="outlined"
        sx={{ textTransform: "none", borderRadius: "12px", fontWeight: 600, fontSize: "15px", px: 4, py: 1.1, borderColor: "#D1D5DB", color: "#374151", "&:hover": { bgcolor: "#F9FAFB", borderColor: "#9CA3AF" } }}>
        Cancel
      </Button>
      <Button onClick={onSubmit}
        disabled={(IS_MEDICAL_APP && !appointment.selectedDepartmentId) || !appointment.date || !appointment.slot || appointment.submitting}
        variant="contained"
        sx={{ textTransform: "none", borderRadius: "12px", fontWeight: 600, fontSize: "15px", px: 4, py: 1.1, minWidth: 100, bgcolor: "#1F2937", boxShadow: "none", "&:hover": { bgcolor: "#111827", boxShadow: "none" }, "&:disabled": { bgcolor: "#E5E7EB", color: "#9CA3AF" } }}>
        {appointment.submitting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Save"}
      </Button>
    </DialogActions>
  </Dialog>
);