import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Button,
  Divider,
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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CloseIcon from "@mui/icons-material/Close";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
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

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { MenuButton, CallButton, Dialogs } from "./LeadsMenuDialogs";

import {
  fetchLeads,
  bookAppointment,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";

import { DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import type { Department, Employee } from "../../services/leads.api";
import type { FilterValues } from "../../types/leads.types";

interface Props {
  search: string;
  filters?: FilterValues;
}

// ====================== Time Slots ======================
const TIME_SLOTS = [
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
  "05:30 PM - 06:00 PM",
];

// ====================== Quality Derivation ======================
const deriveQuality = (lead: any): "Hot" | "Warm" | "Cold" => {
  const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
  const hasNextAction = Boolean(
    lead.next_action_description && lead.next_action_description.trim() !== ""
  );
  const nextActionPending = lead.next_action_status === "pending";
  if (hasAssignee && hasNextAction && nextActionPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

const LeadsBoard: React.FC<Props> = ({ search, filters }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const reduxLeads = useSelector(selectLeads);
  const loading = useSelector(selectLeadsLoading);
  const error = useSelector(selectLeadsError);

  const [leads, setLeads] = React.useState<any[]>([]);

  React.useEffect(() => {
    dispatch(fetchLeads() as any);
  }, [dispatch]);

  // ── Sync Redux → local board state ──
  React.useEffect(() => {
    if (reduxLeads && reduxLeads.length > 0) {
      const mappedLeads = reduxLeads.map((lead: any) => ({
        ...lead,
        id: lead.id || "",
        full_name: lead.full_name || lead.name || "",
        name: lead.full_name || lead.name || "",
        initials: lead.initials || (lead.full_name || lead.name || "?").charAt(0).toUpperCase(),
        email: lead.email || lead.email_address || "",
        phone: lead.phone || lead.mobile || lead.phone_number || "",
        phone_number: lead.phone || lead.mobile || lead.phone_number || "",
        location: lead.location || lead.city || lead.state || lead.address || "Not specified",
        city: lead.city || "",
        state: lead.state || "",
        address: lead.address || "",
        source: lead.source || lead.lead_source || "Unknown",
        lead_source: lead.source || lead.lead_source || "",
        campaign: lead.campaign || "",
        // ✅ Read status from Redux — slice patches "Appointment"/"Converted" directly
        status: lead.status || lead.lead_status || "New",
        lead_status: lead.status || lead.lead_status || "New",
        quality: deriveQuality(lead),
        assigned: lead.assigned_to_name || "Unassigned",
        assigned_to_name: lead.assigned_to_name || "",
        assigned_to_id: lead.assigned_to_id || null,
        score: lead.score || lead.ai_score || lead.lead_score || 0,
        ai_score: lead.score || lead.ai_score || 0,
        department: lead.department || lead.department_name || "",
        department_id: lead.department_id || null,
        department_name: lead.department || lead.department_name || "",
        created_at: lead.created_at || lead.created_date || null,
        updated_at: lead.updated_at || lead.modified_date || null,
        last_contacted: lead.last_contacted || lead.last_contact_date || null,
        task: lead.next_action_type || lead.task_type || lead.task || "N/A",
        task_type: lead.next_action_type || lead.task_type || "",
        taskStatus: lead.next_action_status || lead.task_status || "Pending",
        task_status: lead.next_action_status || lead.task_status || "",
        next_action_description: lead.next_action_description || "",
        next_action_due_date: lead.next_action_due_date || null,
        activity: lead.last_activity || lead.activity || "View Activity",
        last_activity: lead.last_activity || lead.activity || "",
        activity_count: lead.activity_count || 0,
        medical_history: lead.medical_history || "",
        treatment_type: lead.treatment_type || "",
        consultation_date: lead.consultation_date || null,
        notes: lead.notes || lead.remarks || "",
        remarks: lead.notes || lead.remarks || "",
        archived: lead.is_active === false,
        is_active: lead.is_active !== false,
        tags: lead.tags || [],
        priority: lead.priority || "Medium",
        converted: lead.converted || false,
        conversion_date: lead.conversion_date || null,
        estimated_value: lead.estimated_value || 0,
        actual_value: lead.actual_value || 0,
        appointment_date: lead.appointment_date || null,
        slot: lead.slot || "",
        remark: lead.remark || "",
        book_appointment: lead.book_appointment || false,
        contact_no: lead.contact_no || lead.phone || lead.mobile || lead.phone_number || "",
        treatment_interest: lead.treatment_interest || "",
        partner_inquiry: lead.partner_inquiry || false,
        clinic_id: lead.clinic_id || null,
        campaign_id: lead.campaign_id || null,
      }));
      setLeads(mappedLeads);
    }
  }, [reduxLeads]);

  // ── Modal States ──
  const [openBookModal, setOpenBookModal] = React.useState(false);
  const [openMailModal, setOpenMailModal] = React.useState(false);
  const [openSmsModal, setOpenSmsModal] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<any | null>(null);

  // ── Appointment Modal States ──
  const [apptDepartments, setApptDepartments] = React.useState<Department[]>([]);
  const [apptEmployees, setApptEmployees] = React.useState<Employee[]>([]);
  const [apptFilteredEmployees, setApptFilteredEmployees] = React.useState<Employee[]>([]);
  const [apptSelectedDeptId, setApptSelectedDeptId] = React.useState<number | "">("");
  const [apptSelectedEmpId, setApptSelectedEmpId] = React.useState<number | "">("");
  const [apptDate, setApptDate] = React.useState<Date | null>(null);
  const [apptSlot, setApptSlot] = React.useState("");
  const [apptRemark, setApptRemark] = React.useState("");
  const [apptLoadingDepts, setApptLoadingDepts] = React.useState(false);
  const [apptLoadingEmps, setApptLoadingEmps] = React.useState(false);
  const [apptSubmitting, setApptSubmitting] = React.useState(false);
  const [apptError, setApptError] = React.useState<string | null>(null);
  const [apptSuccess, setApptSuccess] = React.useState(false);

  // ── Mail/SMS States ──
  const [mailStep, setMailStep] = React.useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);
  const [smsMessage, setSmsMessage] = React.useState("");

  const templates = [
    { id: "1", title: "IVF Next Steps Form Request", desc: "Requests the patient to fill out a form to share medical and contact details." },
    { id: "2", title: "IVF Treatment Information", desc: "Provides an overview of IVF process, timelines, and general treatment details." },
    { id: "3", title: "IVF Follow-Up Reminder", desc: "Gentle reminder for patients who have not responded or taken action." },
    { id: "4", title: "New Consultation Confirmation", desc: "Confirms appointment date, time, and doctor details." },
    { id: "5", title: "Welcome Email – Patient Inquiry", desc: "Introduces the clinic and builds trust after the first inquiry." },
  ];

  const columns = [
    { label: "NEW LEADS",        statusKey: ["New", "new", "no status", ""],                                                             color: "#6366F1" },
    { label: "FOLLOW-UPS",       statusKey: ["Follow-Ups", "Follow-up", "follow-ups", "follow-up", "Contacted", "contacted"],            color: "#F59E0B" },
    { label: "APPOINTMENT",      statusKey: ["Appointment", "appointment", "Scheduled", "scheduled"],                                   color: "#10B981" },
    { label: "CONVERTED LEADS",  statusKey: ["Converted", "converted", "Won", "won"],                                                   color: "#8B5CF6" },
    { label: "CYCLE CONVERSION", statusKey: ["Cycle Conversion", "cycle conversion"],                                                   color: "#EC4899" },
    { label: "LOST LEADS",       statusKey: ["Lost", "lost", "Disqualified", "disqualified"],                                           color: "#64748B" },
  ];

  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      const searchStr = `${lead.full_name || lead.name || ""} ${lead.id || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      const isActive = lead.is_active !== false;

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
      return matchSearch && isActive;
    });
  }, [leads, search, filters]);

  // ── Fetch depts + employees when modal opens ──
  React.useEffect(() => {
    if (!openBookModal || !selectedLead?.clinic_id) return;
    const fetchAll = async () => {
      setApptLoadingDepts(true);
      setApptLoadingEmps(true);
      setApptError(null);
      try {
        const [depts, emps] = await Promise.all([
          DepartmentAPI.listActiveByClinic(selectedLead.clinic_id),
          EmployeeAPI.listByClinic(selectedLead.clinic_id),
        ]);
        setApptDepartments(depts);
        setApptEmployees(emps);
      } catch {
        setApptError("Failed to load departments/personnel. Please try again.");
      } finally {
        setApptLoadingDepts(false);
        setApptLoadingEmps(false);
      }
    };
    fetchAll();
  }, [openBookModal, selectedLead]);

  // ── Filter employees by dept ──
  React.useEffect(() => {
    if (!apptSelectedDeptId) {
      setApptFilteredEmployees(apptEmployees);
      return;
    }
    const deptName = apptDepartments.find((d) => d.id === apptSelectedDeptId)?.name || "";
    const filtered = apptEmployees.filter(
      (emp) => emp.department_name?.toLowerCase() === deptName.toLowerCase()
    );
    setApptFilteredEmployees(filtered);
    if (apptSelectedEmpId && !filtered.find((e) => e.id === apptSelectedEmpId)) {
      setApptSelectedEmpId("");
    }
  }, [apptSelectedDeptId, apptEmployees, apptDepartments]);

  // ====================== Book Appointment Submit ======================
  // ✅ Dispatches Redux bookAppointment thunk — optimistically patches status
  // to "Appointment" in Redux immediately (pending handler in slice), so BOTH
  // LeadsBoard AND LeadsTable reflect the change at the same time.
  const handleBookAppointmentSubmit = async () => {
    if (!selectedLead?.id) { setApptError("Lead ID is missing."); return; }
    if (!apptSelectedDeptId) { setApptError("Please select a department."); return; }
    if (!apptDate) { setApptError("Please select an appointment date."); return; }
    if (!apptSlot) { setApptError("Please select a time slot."); return; }

    setApptSubmitting(true);
    setApptError(null);

    const leadId = selectedLead.id.replace(/^#/, "");
    const formattedDate = apptDate.toISOString().split("T")[0];

    // Dispatch thunk — Redux pending handler patches status to "Appointment" instantly
    const result = await dispatch(
      bookAppointment({
        leadId,
        payload: {
          department_id: Number(apptSelectedDeptId),
          appointment_date: formattedDate,
          slot: apptSlot,
          remark: apptRemark,
          ...(apptSelectedEmpId && { assigned_to_id: Number(apptSelectedEmpId) }),
        },
      }) as any
    );

    setApptSubmitting(false);

    if (bookAppointment.rejected.match(result)) {
      // Redux already reverted — show error in modal
      setApptError(result.payload || "Failed to book appointment. Please try again.");
      return;
    }

    // Success — Redux state now has status: "Appointment", board re-renders via useEffect
    setApptSuccess(true);
    handleCloseAll();
    setTimeout(() => setApptSuccess(false), 2000);
  };

  // ── Handlers ──
  const handleOpenBookModal = (lead: any) => {
    setSelectedLead(lead);
    setApptDepartments([]);
    setApptEmployees([]);
    setApptFilteredEmployees([]);
    setApptSelectedDeptId(lead.department_id || "");
    setApptSelectedEmpId(lead.assigned_to_id || "");
    setApptDate(lead.appointment_date ? new Date(lead.appointment_date) : null);
    setApptSlot(lead.slot || "");
    setApptRemark(lead.remark || "");
    setApptSubmitting(false);
    setApptError(null);
    setApptSuccess(false);
    setOpenBookModal(true);
  };

  const handleOpenMail = (lead: any) => { setSelectedLead(lead); setMailStep(1); setOpenMailModal(true); };
  const handleOpenSms  = (lead: any) => { setSelectedLead(lead); setSmsMessage(""); setOpenSmsModal(true); };
  const handleNextToCompose = () => setMailStep(2);
  const handleSaveAsTemplate = () => {
    setShowSaveSuccess(true);
    setTimeout(() => { setShowSaveSuccess(false); handleCloseAll(); }, 2500);
  };
  const handleSendSms = () => { handleCloseAll(); };
  const handleCloseAll = () => {
    setOpenBookModal(false);
    setOpenMailModal(false);
    setOpenSmsModal(false);
    setSelectedLead(null);
    setMailStep(1);
    setSelectedTemplate("");
    setSmsMessage("");
    setApptError(null);
    setApptSubmitting(false);
  };

  // ── Styles ──
  const modalFieldStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      backgroundColor: "#FAFBFC",
      "& fieldset": { borderColor: "#E2E8F0", borderWidth: "1px" },
      "&:hover fieldset": { borderColor: "#CBD5E1" },
      "&.Mui-focused fieldset": { borderColor: "#6366F1", borderWidth: "1.5px" },
    },
    "& .MuiInputBase-input": { fontSize: "0.85rem", py: 1 },
    "& .MuiSelect-select": { fontSize: "0.85rem" },
  };

  const apptLabelStyle = {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#64748B",
    letterSpacing: "0.4px",
    mb: 0.6,
    display: "block",
    textTransform: "uppercase" as const,
  };

  const renderCardContent = (lead: any, columnLabel: string, isHovered: boolean) => {
    const iconBtnStyle = {
      border: "1px solid #E2E8F0",
      p: 0.5,
      borderRadius: "8px",
      color: "#64748B",
      "&:hover": { bgcolor: "#F8FAFC", color: "#6366F1" },
    };

    // Show "Book an Appointment" button only on NEW LEADS and FOLLOW-UPS columns
    const showButton = (columnLabel === "NEW LEADS" || columnLabel === "FOLLOW-UPS") && isHovered;

    if (!isHovered) {
      return (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: "#64748B", fontSize: "0.7rem" }}>
            Score: <Box component="span" sx={{ color: "#1E293B" }}>{lead.score || 0}%</Box>
          </Typography>
        </Box>
      );
    }

    const formattedDate = lead.created_at
      ? new Date(lead.created_at).toLocaleDateString("en-GB")
      : "Not specified";
    const formattedTime = lead.created_at
      ? new Date(lead.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : "";

    return (
      <Box sx={{ width: "100%", mt: 1.5 }}>
        <Stack spacing={1} sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              {lead.location}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              {`${formattedDate}${formattedTime ? `, ${formattedTime}` : ""}`}
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}>
              ASSIGNED TO
            </Typography>
            <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: "0.75rem" }}>
              {lead.assigned}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}>
              LEAD SOURCE
            </Typography>
            <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: "0.75rem" }}>
              {lead.source}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700, mb: 1 }}>
          CONTACT OPTION
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ mb: showButton ? 2 : 0 }}>
          <Box sx={iconBtnStyle} onClick={(e) => e.stopPropagation()}>
            <CallButton lead={lead} />
          </Box>
          <IconButton size="small" sx={iconBtnStyle} onClick={(e) => { e.stopPropagation(); handleOpenSms(lead); }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" sx={iconBtnStyle} onClick={(e) => { e.stopPropagation(); handleOpenMail(lead); }}>
            <MailOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        {showButton && (
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={(e) => { e.stopPropagation(); handleOpenBookModal(lead); }}
            sx={{
              bgcolor: "#334155",
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 600,
              py: 1.2,
              mt: 1,
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Book an Appointment
          </Button>
        )}
      </Box>
    );
  };

  // ── Loading ──
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading leads...</Typography>
        </Stack>
      </Box>
    );

  // ── Error ──
  if (error)
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load leads</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => dispatch(fetchLeads() as any)}
        >
          Try again
        </Typography>
      </Alert>
    );

  // ── Empty ──
  if (leads.length === 0)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">No leads found</Typography>
          <Typography variant="body2" color="text.secondary">Create your first lead to get started</Typography>
        </Stack>
      </Box>
    );

  // ====================== Render ======================
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: "flex",
          overflowX: "auto",
          gap: 3,
          p: 4,
          bgcolor: "#F8FAFC",
          height: "calc(100vh - 64px)",
          alignItems: "flex-start",
          "&::-webkit-scrollbar": { height: "10px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "10px" },
        }}
      >
        {columns.map((col) => {
          const leadsInCol = filteredLeads.filter((l) => {
            const leadStatus = (l.status || l.lead_status || "no status").toLowerCase().trim();
            return col.statusKey.some(
              (key) => leadStatus === (key || "no status").toLowerCase().trim()
            );
          });

          return (
            <Box
              key={col.label}
              sx={{
                minWidth: 350,
                maxWidth: 350,
                bgcolor: "#F1F5F9",
                borderRadius: "20px",
                display: "flex",
                flexDirection: "column",
                maxHeight: "100%",
                p: 2,
                border: "1px solid #E2E8F0",
                flexShrink: 0,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={800}
                sx={{ color: "#64748B", mb: 2.5, px: 1, display: "flex", alignItems: "center", gap: 1, letterSpacing: 0.5 }}
              >
                {col.label}{" "}
                <Box component="span" sx={{ color: "#94A3B8", fontWeight: 500 }}>
                  ({leadsInCol.length.toString().padStart(2, "0")})
                </Box>
              </Typography>

              <Stack
                spacing={2}
                sx={{
                  overflowY: "auto",
                  px: 0.5,
                  pb: 1,
                  "&::-webkit-scrollbar": { display: "none" },
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {leadsInCol.map((lead) => (
                  <Paper
                    key={lead.id}
                    onMouseEnter={() => setHoveredId(lead.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => navigate(`/leads/${lead.id.replace("#", "")}`)}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: "16px",
                      border: "1px solid #EAECF0",
                      transition: "all 0.3s ease",
                      width: "100%",
                      backgroundColor: "#FFFFFF",
                      cursor: "pointer",
                      ...(hoveredId === lead.id && {
                        boxShadow: "0px 12px 24px -4px rgba(145, 158, 171, 0.16)",
                        borderColor: col.color,
                        transform: "translateY(-2px)",
                        zIndex: 10,
                      }),
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, fontSize: "0.8rem", bgcolor: "#EEF2FF", color: "#6366F1", fontWeight: 700 }}>
                          {lead.initials}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.9rem", color: "#1E293B" }}>
                            {lead.full_name || lead.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                            {lead.id}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip
                          label={lead.quality}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            bgcolor: lead.quality === "Hot" ? "#FEE2E2" : lead.quality === "Warm" ? "#FEF3C7" : "#F1F5F9",
                            color: lead.quality === "Hot" ? "#B91C1C" : lead.quality === "Warm" ? "#B45309" : "#475569",
                          }}
                        />
                        <Box onClick={(e) => e.stopPropagation()}>
                          <MenuButton lead={lead} setLeads={setLeads} tab="active" />
                        </Box>
                      </Stack>
                    </Stack>
                    {renderCardContent(lead, col.label, hoveredId === lead.id)}
                  </Paper>
                ))}
              </Stack>
            </Box>
          );
        })}

        <Dialogs />

        {/* Save template toast */}
        <Fade in={showSaveSuccess}>
          <Box sx={{
            position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
            bgcolor: "#10B981", color: "white", px: 3, py: 1.5, borderRadius: "12px",
            display: "flex", alignItems: "center", gap: 1.5, zIndex: 10000,
            boxShadow: "0px 10px 20px rgba(16,185,129,0.2)",
          }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2" fontWeight={600}>Saved as A Template successfully!</Typography>
          </Box>
        </Fade>

        {/* Appointment success toast */}
        <Fade in={apptSuccess}>
          <Box sx={{
            position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
            bgcolor: "#10B981", color: "white", px: 3, py: 1.5, borderRadius: "12px",
            display: "flex", alignItems: "center", gap: 1.5, zIndex: 10000,
            boxShadow: "0px 10px 20px rgba(16,185,129,0.25)",
          }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2" fontWeight={600}>Appointment booked successfully!</Typography>
          </Box>
        </Fade>

        {/* ====================== SMS MODAL ====================== */}
        <Dialog open={openSmsModal} onClose={handleCloseAll} fullWidth maxWidth="sm"
          PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3 }}>
            <Typography variant="h6" fontWeight={800} color="#1E293B">Send SMS</Typography>
            <IconButton onClick={handleCloseAll} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} color="#475569" sx={{ mb: 1 }}>To:</Typography>
              <Chip
                label={selectedLead?.full_name || selectedLead?.name}
                size="small"
                sx={{ bgcolor: "#EEF2FF", color: "#6366F1", fontWeight: 600, borderRadius: "8px", height: 32, fontSize: "0.875rem" }}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} color="#475569" sx={{ mb: 1 }}>Message:</Typography>
              <TextField
                fullWidth multiline rows={6}
                placeholder="Type your message here..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": { borderColor: "#E2E8F0" },
                    "&:hover fieldset": { borderColor: "#CBD5E1" },
                    "&.Mui-focused fieldset": { borderColor: "#6366F1", borderWidth: "2px" },
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "right" }}>
                {smsMessage.length} / 160 characters
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: "1px solid #F1F5F9", gap: 2 }}>
            <Button onClick={handleCloseAll} sx={{ flex: 1, color: "#64748B", textTransform: "none", fontWeight: 700, borderRadius: "12px", border: "1px solid #E2E8F0", py: 1.2 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSendSms} disabled={!smsMessage.trim()}
              endIcon={<SendIcon sx={{ fontSize: 16 }} />}
              sx={{ flex: 1, bgcolor: "#334155", borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.2, "&:hover": { bgcolor: "#1e293b" }, "&:disabled": { bgcolor: "#CBD5E1" } }}>
              Send
            </Button>
          </DialogActions>
        </Dialog>

        {/* ====================== MAIL MODAL ====================== */}
        <Dialog open={openMailModal} onClose={handleCloseAll} fullWidth maxWidth={mailStep === 1 ? "sm" : "md"}
          PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}>
          {mailStep === 1 ? (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3 }}>
                <Typography variant="h6" fontWeight={800} color="#1E293B">New Email</Typography>
                <IconButton onClick={handleCloseAll} size="small"><CloseIcon /></IconButton>
              </DialogTitle>
              <DialogContent sx={{ p: 0 }}>
                <Box onClick={handleNextToCompose}
                  sx={{ p: 3, textAlign: "center", borderBottom: "1px solid #F1F5F9", cursor: "pointer", "&:hover": { bgcolor: "#F8FAFC" } }}>
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <BorderColorIcon sx={{ fontSize: 20, color: "#64748B" }} />
                    <Typography fontWeight={600} color="#64748B">Compose New Email</Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    SELECT EMAIL TEMPLATE
                  </Typography>
                  <RadioGroup value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                    {templates.map((tmp) => (
                      <Box key={tmp.id} onClick={() => setSelectedTemplate(tmp.title)}
                        sx={{
                          display: "flex", alignItems: "flex-start", p: 2, mb: 1.5,
                          border: "1px solid", borderColor: selectedTemplate === tmp.title ? "#6366F1" : "#E2E8F0",
                          borderRadius: "12px", cursor: "pointer", bgcolor: selectedTemplate === tmp.title ? "#F5F7FF" : "transparent",
                        }}>
                        <Radio size="small" value={tmp.title} sx={{ mt: -0.5 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={700} color="#1E293B">{tmp.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{tmp.desc}</Typography>
                        </Box>
                        <IconButton size="small"><VisibilityOutlinedIcon sx={{ fontSize: 18, color: "#94A3B8" }} /></IconButton>
                      </Box>
                    ))}
                  </RadioGroup>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3, borderTop: "1px solid #F1F5F9" }}>
                <Button onClick={handleCloseAll} sx={{ color: "#64748B", textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                <Button variant="contained" onClick={handleNextToCompose}
                  sx={{ bgcolor: "#334155", borderRadius: "10px", px: 4, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#1e293b" } }}>
                  Next
                </Button>
              </DialogActions>
            </>
          ) : (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2.5 }}>
                <Typography variant="h6" fontWeight={800} color="#1E293B">New Email</Typography>
                <IconButton onClick={handleCloseAll} size="small"><CloseIcon /></IconButton>
              </DialogTitle>
              <DialogContent sx={{ px: 3, py: 0 }}>
                <Stack spacing={0.5}>
                  <Box sx={{ display: "flex", alignItems: "center", borderBottom: "1px solid #F1F5F9", py: 1.5 }}>
                    <Typography variant="body2" sx={{ width: 40, color: "#94A3B8", fontWeight: 500 }}>To :</Typography>
                    <Chip label={selectedLead?.full_name || selectedLead?.name} size="small" onDelete={() => {}}
                      sx={{ bgcolor: "#EEF2FF", color: "#6366F1", fontWeight: 600, borderRadius: "6px" }} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", borderBottom: "1px solid #F1F5F9", py: 1.5 }}>
                    <Typography variant="body2" sx={{ width: 70, color: "#94A3B8", fontWeight: 500 }}>Subject :</Typography>
                    <TextField fullWidth variant="standard" defaultValue="Thank You for Your IVF Inquiry - Next Steps"
                      InputProps={{ disableUnderline: true, sx: { fontSize: "0.85rem", fontWeight: 600 } }} />
                  </Box>
                  <Box sx={{ py: 3, minHeight: 320, overflowY: "auto" }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>Hi {selectedLead?.full_name || selectedLead?.name},</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Thank you for reaching out to <strong>Crysta IVF, Bangalore</strong>. We are honored to be part of your journey toward parenthood.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      To ensure we provide the most accurate guidance tailored to your medical history, please complete our secure intake form:
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6366F1", textDecoration: "underline", mb: 2, display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
                      👉 Fill the IVF Inquiry Form<br />https://example.com/ivf-inquiry-form
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ mt: 2, color: "#1E293B" }}>
                      What happens next? After you submit the form, our specialist team will:
                    </Typography>
                    <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", color: "#475569", lineHeight: 1.8 }}>
                      <li><strong>Review:</strong> A senior consultant will evaluate your requirements.</li>
                      <li><strong>Connect:</strong> We will schedule a 15-minute discovery call.</li>
                    </ul>
                  </Box>
                </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 2, justifyContent: "space-between", bgcolor: "#F8FAFC", borderTop: "1px solid #F1F5F9" }}>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small"><TextFormatIcon sx={{ fontSize: 20 }} /></IconButton>
                  <IconButton size="small"><AttachFileIcon sx={{ fontSize: 20 }} /></IconButton>
                  <IconButton size="small"><InsertLinkIcon sx={{ fontSize: 20 }} /></IconButton>
                  <IconButton size="small"><InsertEmoticonIcon sx={{ fontSize: 20 }} /></IconButton>
                  <IconButton size="small"><InsertPhotoIcon sx={{ fontSize: 20 }} /></IconButton>
                  <IconButton size="small"><HistoryIcon sx={{ fontSize: 20 }} /></IconButton>
                  <IconButton size="small"><AddCircleOutlineIcon sx={{ fontSize: 20 }} /></IconButton>
                </Stack>
                <Stack direction="row" spacing={1.5}>
                  <Button onClick={() => setMailStep(1)} sx={{ color: "#64748B", textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                  <Button variant="outlined" onClick={handleSaveAsTemplate}
                    sx={{ borderColor: "#E2E8F0", color: "#1E293B", textTransform: "none", borderRadius: "10px", fontWeight: 700 }}>
                    Save as Template
                  </Button>
                  <Button variant="contained" onClick={handleCloseAll} endIcon={<SendIcon sx={{ fontSize: 16 }} />}
                    sx={{ bgcolor: "#334155", borderRadius: "10px", px: 3, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#1e293b" } }}>
                    Send
                  </Button>
                </Stack>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* ====================== BOOK APPOINTMENT MODAL ====================== */}
        <Dialog open={openBookModal} onClose={!apptSubmitting ? handleCloseAll : undefined}
          fullWidth maxWidth="xs"
          PaperProps={{ sx: { borderRadius: "20px", boxShadow: "0px 24px 48px rgba(0,0,0,0.12)", overflow: "visible" } }}>

          <DialogTitle sx={{ p: 2.5, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.05rem", color: "#1E293B" }}>
                Book an Appointment
              </Typography>
              {selectedLead && (
                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.4 }}>
                  <PersonOutlineIcon sx={{ fontSize: 13, color: "#94A3B8" }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                    {selectedLead.full_name || selectedLead.name}
                    {selectedLead.id ? ` · ${selectedLead.id}` : ""}
                  </Typography>
                </Stack>
              )}
            </Box>
            <IconButton onClick={handleCloseAll} disabled={apptSubmitting} size="small" sx={{ color: "#94A3B8", mt: 0.3 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
            {apptError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: "0.8rem" }} onClose={() => setApptError(null)}>
                {apptError}
              </Alert>
            )}
            <Stack spacing={2}>
              {/* Department */}
              <Box>
                <Typography sx={apptLabelStyle}>Department *</Typography>
                {apptLoadingDepts ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.2 }}>
                    <CircularProgress size={15} sx={{ color: "#6366F1" }} />
                    <Typography variant="caption" color="text.secondary">Loading departments...</Typography>
                  </Box>
                ) : (
                  <TextField select fullWidth size="small" value={apptSelectedDeptId}
                    onChange={(e) => setApptSelectedDeptId(Number(e.target.value))} sx={modalFieldStyle}>
                    <MenuItem value="" disabled>
                      <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Select Department</Typography>
                    </MenuItem>
                    {apptDepartments.map((d) => (
                      <MenuItem key={d.id} value={d.id} sx={{ fontSize: "0.85rem" }}>{d.name}</MenuItem>
                    ))}
                    {apptDepartments.length === 0 && !apptLoadingDepts && (
                      <MenuItem disabled sx={{ fontSize: "0.85rem", color: "#94A3B8" }}>No departments found</MenuItem>
                    )}
                  </TextField>
                )}
              </Box>

              {/* Personnel */}
              <Box>
                <Typography sx={apptLabelStyle}>
                  Personnel
                  {apptSelectedDeptId && apptFilteredEmployees.length > 0 && (
                    <Box component="span" sx={{ color: "#94A3B8", fontWeight: 400, textTransform: "none", ml: 0.5 }}>
                      ({apptFilteredEmployees.length} available)
                    </Box>
                  )}
                </Typography>
                {apptLoadingEmps ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.2 }}>
                    <CircularProgress size={15} sx={{ color: "#6366F1" }} />
                    <Typography variant="caption" color="text.secondary">Loading personnel...</Typography>
                  </Box>
                ) : (
                  <TextField select fullWidth size="small" value={apptSelectedEmpId}
                    onChange={(e) => setApptSelectedEmpId(Number(e.target.value))} sx={modalFieldStyle}
                    disabled={!apptSelectedDeptId}>
                    <MenuItem value="">
                      <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Select Personnel (Optional)</Typography>
                    </MenuItem>
                    {apptFilteredEmployees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: "0.85rem" }}>
                        <Box>
                          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#1E293B", lineHeight: 1.3 }}>
                            {emp.emp_name}
                          </Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: "#94A3B8" }}>{emp.emp_type}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    {apptSelectedDeptId && apptFilteredEmployees.length === 0 && !apptLoadingEmps && (
                      <MenuItem disabled sx={{ fontSize: "0.85rem", color: "#94A3B8" }}>No personnel in this department</MenuItem>
                    )}
                  </TextField>
                )}
              </Box>

              {/* Date + Slot */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography sx={apptLabelStyle}>Date *</Typography>
                  <DatePicker value={apptDate} onChange={(v) => setApptDate(v)} minDate={new Date()}
                    slots={{ openPickerIcon: CalendarMonthIcon }}
                    slotProps={{
                      textField: {
                        size: "small", fullWidth: true,
                        sx: { ...modalFieldStyle, "& .MuiInputAdornment-root .MuiIconButton-root": { color: "#94A3B8", p: 0.5 } },
                      },
                      popper: {
                        sx: {
                          "& .MuiPaper-root": { borderRadius: "16px", boxShadow: "0px 12px 24px rgba(0,0,0,0.1)" },
                          "& .MuiPickersDay-root.Mui-selected": { bgcolor: "#6366F1" },
                          "& .MuiPickersDay-root.Mui-selected:hover": { bgcolor: "#4F46E5" },
                          "& .MuiPickersDay-root:hover": { bgcolor: "#EEF2FF" },
                        },
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={apptLabelStyle}>Time Slot *</Typography>
                  <TextField select fullWidth size="small" value={apptSlot}
                    onChange={(e) => setApptSlot(e.target.value)} sx={modalFieldStyle} disabled={!apptDate}>
                    <MenuItem value="" disabled>
                      <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>Select Slot</Typography>
                    </MenuItem>
                    {TIME_SLOTS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem" }}>{s}</MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>

              {/* Summary */}
              {apptDate && apptSlot && (
                <Box sx={{ bgcolor: "#EEF2FF", borderRadius: "10px", p: 1.5, border: "1px solid #C7D2FE" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonthIcon sx={{ fontSize: 15, color: "#6366F1" }} />
                    <Typography variant="caption" fontWeight={600} color="#4338CA" sx={{ fontSize: "0.78rem" }}>
                      {apptDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{apptSlot}
                    </Typography>
                  </Stack>
                </Box>
              )}

              {/* Remark */}
              <Box>
                <Typography sx={apptLabelStyle}>Remark</Typography>
                <TextField fullWidth multiline rows={2} size="small"
                  placeholder="Add any notes or special instructions..."
                  value={apptRemark}
                  onChange={(e) => setApptRemark(e.target.value)}
                  sx={{ ...modalFieldStyle, "& .MuiInputBase-input": { fontSize: "0.85rem", py: 0 } }}
                />
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1.5 }}>
            <Button onClick={handleCloseAll} disabled={apptSubmitting} variant="outlined"
              sx={{ flex: 1, textTransform: "none", borderRadius: "12px", color: "#64748B", borderColor: "#E2E8F0", fontWeight: 700, py: 1.2, "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" } }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleBookAppointmentSubmit}
              disabled={!apptSelectedDeptId || !apptDate || !apptSlot || apptSubmitting}
              sx={{ flex: 1, textTransform: "none", borderRadius: "12px", bgcolor: "#334155", fontWeight: 700, py: 1.2, "&:hover": { bgcolor: "#1E293B" }, "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
              {apptSubmitting ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Book Appointment"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default LeadsBoard;