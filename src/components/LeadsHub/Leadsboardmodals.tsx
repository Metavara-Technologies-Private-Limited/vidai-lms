// LeadsBoardModals.tsx
// SmsModal, MailModal, BookAppointmentModal, SuccessToast — no any, Date not Dayjs

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
  Radio,
  RadioGroup,
  Fade,
  CircularProgress,
  Alert,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import TextFormatIcon from "@mui/icons-material/TextFormat";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import HistoryIcon from "@mui/icons-material/History";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import type { LeadItem, AppointmentState } from "./Leadsboardtypes";
import {
  TIME_SLOTS,
  EMAIL_TEMPLATES,
  modalFieldStyle,
  fieldLabelStyle,
} from "./Leadsboardtypes";

// ====================== Success Toast ======================
interface SuccessToastProps {
  show: boolean;
  message: string;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  show,
  message,
}) => (
  <Fade in={show}>
    <Box
      sx={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        bgcolor: "#10B981",
        color: "white",
        px: 3,
        py: 1.5,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        zIndex: 10000,
        boxShadow: "0px 10px 20px rgba(16,185,129,0.2)",
      }}
    >
      <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
      <Typography variant="body2" fontWeight={600}>
        {message}
      </Typography>
    </Box>
  </Fade>
);

// ====================== SMS Modal ======================
interface SmsModalProps {
  open: boolean;
  selectedLead: LeadItem | null;
  smsMessage: string;
  setSmsMessage: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
}

export const SmsModal: React.FC<SmsModalProps> = ({
  open,
  selectedLead,
  smsMessage,
  setSmsMessage,
  onClose,
  onSend,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
    PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}
  >
    <DialogTitle
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 3,
      }}
    >
      <Typography variant="h6" fontWeight={800} color="#1E293B">
        Send SMS
      </Typography>
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          color="#475569"
          sx={{ mb: 1 }}
        >
          To:
        </Typography>
        <Chip
          label={selectedLead?.full_name || selectedLead?.name}
          size="small"
          sx={{
            bgcolor: "#EEF2FF",
            color: "#6366F1",
            fontWeight: 600,
            borderRadius: "8px",
            height: 32,
            fontSize: "0.875rem",
          }}
        />
      </Box>
      <Box>
        <Typography
          variant="body2"
          fontWeight={600}
          color="#475569"
          sx={{ mb: 1 }}
        >
          Message:
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Type your message here..."
          value={smsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": { borderColor: "#E2E8F0" },
              "&:hover fieldset": { borderColor: "#CBD5E1" },
              "&.Mui-focused fieldset": {
                borderColor: "#6366F1",
                borderWidth: "2px",
              },
            },
          }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1, textAlign: "right" }}
        >
          {smsMessage.length} / 160 characters
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions sx={{ p: 3, borderTop: "1px solid #F1F5F9", gap: 2 }}>
      <Button
        onClick={onClose}
        sx={{
          flex: 1,
          color: "#64748B",
          textTransform: "none",
          fontWeight: 700,
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          py: 1.2,
        }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onSend}
        disabled={!smsMessage.trim()}
        endIcon={<SendIcon sx={{ fontSize: 16 }} />}
        sx={{
          flex: 1,
          bgcolor: "#334155",
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 700,
          py: 1.2,
          "&:hover": { bgcolor: "#1e293b" },
          "&:disabled": { bgcolor: "#CBD5E1" },
        }}
      >
        Send
      </Button>
    </DialogActions>
  </Dialog>
);

// ====================== Mail Modal ======================
interface MailModalProps {
  open: boolean;
  selectedLead: LeadItem | null;
  mailStep: 1 | 2;
  selectedTemplate: string;
  setSelectedTemplate: (v: string) => void;
  onClose: () => void;
  onNextToCompose: () => void;
  onSaveAsTemplate: () => void;
  onBackToTemplates: () => void;
}

export const MailModal: React.FC<MailModalProps> = ({
  open,
  selectedLead,
  mailStep,
  selectedTemplate,
  setSelectedTemplate,
  onClose,
  onNextToCompose,
  onSaveAsTemplate,
  onBackToTemplates,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth={mailStep === 1 ? "sm" : "md"}
    PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}
  >
    {mailStep === 1 ? (
      <>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
          }}
        >
          <Typography variant="h6" fontWeight={800} color="#1E293B">
            New Email
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box
            onClick={onNextToCompose}
            sx={{
              p: 3,
              textAlign: "center",
              borderBottom: "1px solid #F1F5F9",
              cursor: "pointer",
              "&:hover": { bgcolor: "#F8FAFC" },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              alignItems="center"
            >
              <BorderColorIcon sx={{ fontSize: 20, color: "#64748B" }} />
              <Typography fontWeight={600} color="#64748B">
                Compose New Email
              </Typography>
            </Stack>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ display: "block", mb: 2 }}
            >
              SELECT EMAIL TEMPLATE
            </Typography>
            <RadioGroup
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {EMAIL_TEMPLATES.map((tmpl) => (
                <Box
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.title)}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    p: 2,
                    mb: 1.5,
                    border: "1px solid",
                    borderColor:
                      selectedTemplate === tmpl.title ? "#6366F1" : "#E2E8F0",
                    borderRadius: "12px",
                    cursor: "pointer",
                    bgcolor:
                      selectedTemplate === tmpl.title
                        ? "#F5F7FF"
                        : "transparent",
                  }}
                >
                  <Radio size="small" value={tmpl.title} sx={{ mt: -0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#1E293B"
                    >
                      {tmpl.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tmpl.desc}
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    <VisibilityOutlinedIcon
                      sx={{ fontSize: 18, color: "#94A3B8" }}
                    />
                  </IconButton>
                </Box>
              ))}
            </RadioGroup>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #F1F5F9" }}>
          <Button
            onClick={onClose}
            sx={{ color: "#64748B", textTransform: "none", fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onNextToCompose}
            sx={{
              bgcolor: "#334155",
              borderRadius: "10px",
              px: 4,
              textTransform: "none",
              fontWeight: 700,
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Next
          </Button>
        </DialogActions>
      </>
    ) : (
      <>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2.5,
          }}
        >
          <Typography variant="h6" fontWeight={800} color="#1E293B">
            New Email
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 0 }}>
          <Stack spacing={0.5}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #F1F5F9",
                py: 1.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ width: 40, color: "#94A3B8", fontWeight: 500 }}
              >
                To :
              </Typography>
              <Chip
                label={selectedLead?.full_name || selectedLead?.name}
                size="small"
                onDelete={() => {}}
                sx={{
                  bgcolor: "#EEF2FF",
                  color: "#6366F1",
                  fontWeight: 600,
                  borderRadius: "6px",
                }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #F1F5F9",
                py: 1.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ width: 70, color: "#94A3B8", fontWeight: 500 }}
              >
                Subject :
              </Typography>
              <TextField
                fullWidth
                variant="standard"
                defaultValue="Thank You for Your IVF Inquiry - Next Steps"
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: "0.85rem", fontWeight: 600 },
                }}
              />
            </Box>
            <Box sx={{ py: 3, minHeight: 320, overflowY: "auto" }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Hi {selectedLead?.full_name || selectedLead?.name},
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Thank you for reaching out to{" "}
                <strong>Crysta IVF, Bangalore</strong>. We are honored to be
                part of your journey toward parenthood.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                To ensure we provide the most accurate guidance tailored to your
                medical history, please complete our secure intake form:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6366F1",
                  textDecoration: "underline",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
              >
                👉 Fill the IVF Inquiry Form
                <br />
                https://example.com/ivf-inquiry-form
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ mt: 2, color: "#1E293B" }}
              >
                What happens next? After you submit the form, our specialist
                team will:
              </Typography>
              <ul
                style={{
                  paddingLeft: "20px",
                  fontSize: "0.85rem",
                  color: "#475569",
                  lineHeight: 1.8,
                }}
              >
                <li>
                  <strong>Review:</strong> A senior consultant will evaluate
                  your requirements.
                </li>
                <li>
                  <strong>Connect:</strong> We will schedule a 15-minute
                  discovery call.
                </li>
              </ul>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            justifyContent: "space-between",
            bgcolor: "#F8FAFC",
            borderTop: "1px solid #F1F5F9",
          }}
        >
          <Stack direction="row" spacing={0.5}>
            {[
              TextFormatIcon,
              AttachFileIcon,
              InsertLinkIcon,
              InsertEmoticonIcon,
              InsertPhotoIcon,
              HistoryIcon,
              AddCircleOutlineIcon,
            ].map((Icon, i) => (
              <IconButton key={i} size="small">
                <Icon sx={{ fontSize: 20 }} />
              </IconButton>
            ))}
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={onBackToTemplates}
              sx={{ color: "#64748B", textTransform: "none", fontWeight: 700 }}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={onSaveAsTemplate}
              sx={{
                borderColor: "#E2E8F0",
                color: "#1E293B",
                textTransform: "none",
                borderRadius: "10px",
                fontWeight: 700,
              }}
            >
              Save as Template
            </Button>
            <Button
              variant="contained"
              onClick={onClose}
              endIcon={<SendIcon sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: "#334155",
                borderRadius: "10px",
                px: 3,
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              Send
            </Button>
          </Stack>
        </DialogActions>
      </>
    )}
  </Dialog>
);

// ====================== Book Appointment Modal ======================
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
  open,
  selectedLead,
  appointment,
  setSelectedDepartmentId,
  setSelectedEmployeeId,
  setDate,
  setSlot,
  setRemark,
  clearError,
  onClose,
  onSubmit,
}) => (
  <Dialog
    open={open}
    onClose={!appointment.submitting ? onClose : undefined}
    fullWidth
    maxWidth="xs"
    PaperProps={{
      sx: {
        borderRadius: "20px",
        boxShadow: "0px 24px 48px rgba(0,0,0,0.12)",
        overflow: "visible",
      },
    }}
  >
    <DialogTitle
      sx={{
        p: 2.5,
        pb: 1.5,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ fontSize: "1.05rem", color: "#1E293B" }}
        >
          Book an Appointment
        </Typography>
        {selectedLead && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.8}
            sx={{ mt: 0.4 }}
          >
            <PersonOutlineIcon sx={{ fontSize: 13, color: "#94A3B8" }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.75rem" }}
            >
              {selectedLead.full_name || selectedLead.name}
              {selectedLead.id ? ` · ${selectedLead.id}` : ""}
            </Typography>
          </Stack>
        )}
      </Box>
      <IconButton
        onClick={onClose}
        disabled={appointment.submitting}
        size="small"
        sx={{ color: "#94A3B8", mt: 0.3 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </DialogTitle>

    <DialogContent sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
      {appointment.error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: "10px", fontSize: "0.8rem" }}
          onClose={clearError}
        >
          {appointment.error}
        </Alert>
      )}
      <Stack spacing={2}>
        {/* Department */}
        <Box>
          <Typography sx={fieldLabelStyle}>Department *</Typography>
          {appointment.loadingDepartments ? (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.2 }}
            >
              <CircularProgress size={15} sx={{ color: "#6366F1" }} />
              <Typography variant="caption" color="text.secondary">
                Loading departments...
              </Typography>
            </Box>
          ) : (
            <TextField
              select
              fullWidth
              size="small"
              value={appointment.selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(Number(e.target.value))}
              sx={modalFieldStyle}
            >
              <MenuItem value="" disabled>
                <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                  Select Department
                </Typography>
              </MenuItem>
              {appointment.departments.map((d) => (
                <MenuItem key={d.id} value={d.id} sx={{ fontSize: "0.85rem" }}>
                  {d.name}
                </MenuItem>
              ))}
              {appointment.departments.length === 0 &&
                !appointment.loadingDepartments && (
                  <MenuItem
                    disabled
                    sx={{ fontSize: "0.85rem", color: "#94A3B8" }}
                  >
                    No departments found
                  </MenuItem>
                )}
            </TextField>
          )}
        </Box>

        {/* Personnel */}
        <Box>
          <Typography sx={fieldLabelStyle}>
            Personnel
            {appointment.selectedDepartmentId &&
              appointment.filteredEmployees.length > 0 && (
                <Box
                  component="span"
                  sx={{
                    color: "#94A3B8",
                    fontWeight: 400,
                    textTransform: "none",
                    ml: 0.5,
                  }}
                >
                  ({appointment.filteredEmployees.length} available)
                </Box>
              )}
          </Typography>
          {appointment.loadingEmployees ? (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.2 }}
            >
              <CircularProgress size={15} sx={{ color: "#6366F1" }} />
              <Typography variant="caption" color="text.secondary">
                Loading personnel...
              </Typography>
            </Box>
          ) : (
            <TextField
              select
              fullWidth
              size="small"
              value={appointment.selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              sx={modalFieldStyle}
              disabled={!appointment.selectedDepartmentId}
            >
              <MenuItem value="">
                <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                  Select Personnel (Optional)
                </Typography>
              </MenuItem>
              {appointment.filteredEmployees.map((emp) => (
                <MenuItem
                  key={emp.id}
                  value={emp.id}
                  sx={{ fontSize: "0.85rem" }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#1E293B",
                        lineHeight: 1.3,
                      }}
                    >
                      {emp.emp_name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                      {emp.emp_type}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
              {appointment.selectedDepartmentId &&
                appointment.filteredEmployees.length === 0 &&
                !appointment.loadingEmployees && (
                  <MenuItem
                    disabled
                    sx={{ fontSize: "0.85rem", color: "#94A3B8" }}
                  >
                    No personnel in this department
                  </MenuItem>
                )}
            </TextField>
          )}
        </Box>

        {/* Date + Slot — FIX: DatePicker value typed as Date | null, convert PickerValue → Date */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography sx={fieldLabelStyle}>Date *</Typography>
            <DatePicker
              value={appointment.date}
              onChange={(v) =>
                setDate(v ? new Date(v as unknown as string) : null)
              }
              minDate={new Date()}
              slots={{ openPickerIcon: CalendarMonthIcon }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: {
                    ...modalFieldStyle,
                    "& .MuiInputAdornment-root .MuiIconButton-root": {
                      color: "#94A3B8",
                      p: 0.5,
                    },
                  },
                },
                popper: {
                  sx: {
                    "& .MuiPaper-root": {
                      borderRadius: "16px",
                      boxShadow: "0px 12px 24px rgba(0,0,0,0.1)",
                    },
                    "& .MuiPickersDay-root.Mui-selected": {
                      bgcolor: "#6366F1",
                    },
                    "& .MuiPickersDay-root.Mui-selected:hover": {
                      bgcolor: "#4F46E5",
                    },
                    "& .MuiPickersDay-root:hover": { bgcolor: "#EEF2FF" },
                  },
                },
              }}
            />
          </Box>
          <Box>
            <Typography sx={fieldLabelStyle}>Time Slot *</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={appointment.slot}
              onChange={(e) => setSlot(e.target.value)}
              sx={modalFieldStyle}
              disabled={!appointment.date}
            >
              <MenuItem value="" disabled>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                  Select Slot
                </Typography>
              </MenuItem>
              {TIME_SLOTS.map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem" }}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* Summary chip */}
        {appointment.date && appointment.slot && (
          <Box
            sx={{
              bgcolor: "#EEF2FF",
              borderRadius: "10px",
              p: 1.5,
              border: "1px solid #C7D2FE",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthIcon sx={{ fontSize: 15, color: "#6366F1" }} />
              <Typography
                variant="caption"
                fontWeight={600}
                color="#4338CA"
                sx={{ fontSize: "0.78rem" }}
              >
                {appointment.date.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {appointment.slot}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Remark */}
        <Box>
          <Typography sx={fieldLabelStyle}>Remark</Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            placeholder="Add any notes or special instructions..."
            value={appointment.remark}
            onChange={(e) => setRemark(e.target.value)}
            sx={{
              ...modalFieldStyle,
              "& .MuiInputBase-input": { fontSize: "0.85rem", py: 0 },
            }}
          />
        </Box>
      </Stack>
    </DialogContent>

    <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1.5 }}>
      <Button
        onClick={onClose}
        disabled={appointment.submitting}
        variant="outlined"
        sx={{
          flex: 1,
          textTransform: "none",
          borderRadius: "12px",
          color: "#64748B",
          borderColor: "#E2E8F0",
          fontWeight: 700,
          py: 1.2,
          "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
        }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={
          !appointment.selectedDepartmentId ||
          !appointment.date ||
          !appointment.slot ||
          appointment.submitting
        }
        sx={{
          flex: 1,
          textTransform: "none",
          borderRadius: "12px",
          bgcolor: "#334155",
          fontWeight: 700,
          py: 1.2,
          "&:hover": { bgcolor: "#1E293B" },
          "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" },
        }}
      >
        {appointment.submitting ? (
          <CircularProgress size={18} sx={{ color: "white" }} />
        ) : (
          "Book Appointment"
        )}
      </Button>
    </DialogActions>
  </Dialog>
);
