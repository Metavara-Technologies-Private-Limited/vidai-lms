// LeadsBoard.tsx
// Main component — no any, Date not Dayjs, exhaustive-deps fixed

import * as React from "react";
import { Box, Stack, Typography, CircularProgress, Alert } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";

import { Dialogs } from "./LeadsMenuDialogs";
import {
  fetchLeads,
  bookAppointment,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import { DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import type { FilterValues } from "../../types/leads.types";

import {
  type LeadItem,
  type RawLead,
  type AppointmentState,
  BOARD_COLUMNS,
  mapRawToLeadItem,
} from "./Leadsboardtypes";
import {
  SmsModal,
  MailModal,
  BookAppointmentModal,
  SuccessToast,
} from "./Leadsboardmodals";
import { LeadColumn } from "./Leadsboardcard";

// ====================== Props ======================
interface Props {
  search: string;
  filters?: FilterValues;
}

// ====================== Empty appointment state ======================
const emptyAppointment = (): AppointmentState => ({
  departments: [],
  employees: [],
  filteredEmployees: [],
  selectedDepartmentId: "",
  selectedEmployeeId: "",
  date: null,
  slot: "",
  remark: "",
  loadingDepartments: false,
  loadingEmployees: false,
  submitting: false,
  error: null,
  success: false,
});

// ====================== Component ======================
const LeadsBoard: React.FC<Props> = ({ search, filters }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const reduxLeads = useSelector(selectLeads);
  const loading    = useSelector(selectLeadsLoading);
  const error      = useSelector(selectLeadsError);

  const [leads, setLeads] = React.useState<LeadItem[]>([]);

  // Fetch on mount
  React.useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  // Sync Redux → local board state
  React.useEffect(() => {
    if (reduxLeads && reduxLeads.length > 0) {
      setLeads((reduxLeads as RawLead[]).map(mapRawToLeadItem));
    }
  }, [reduxLeads]);

  // ── Modal open flags ──────────────────────────────────────────────────────
  const [openBookModal, setOpenBookModal] = React.useState(false);
  const [openMailModal, setOpenMailModal] = React.useState(false);
  const [openSmsModal,  setOpenSmsModal ] = React.useState(false);
  const [selectedLead,  setSelectedLead ] = React.useState<LeadItem | null>(null);

  // ── Appointment state (consolidated) ─────────────────────────────────────
  const [appointment, setAppointment] = React.useState<AppointmentState>(emptyAppointment());

  // ── Mail / SMS state ──────────────────────────────────────────────────────
  const [mailStep,          setMailStep         ] = React.useState<1 | 2>(1);
  const [selectedTemplate,  setSelectedTemplate ] = React.useState("");
  const [showSaveSuccess,   setShowSaveSuccess  ] = React.useState(false);
  const [smsMessage,        setSmsMessage       ] = React.useState("");

  // ── Fetch departments + employees when book modal opens ───────────────────
  React.useEffect(() => {
    if (!openBookModal || !selectedLead?.clinic_id) return;

    const fetchAll = async () => {
      setAppointment((prev) => ({
        ...prev,
        loadingDepartments: true,
        loadingEmployees: true,
        error: null,
      }));
      try {
        const [departments, employees] = await Promise.all([
          DepartmentAPI.listActiveByClinic(selectedLead.clinic_id as number),
          EmployeeAPI.listByClinic(selectedLead.clinic_id as number),
        ]);
        setAppointment((prev) => ({ ...prev, departments, employees }));
      } catch {
        setAppointment((prev) => ({
          ...prev,
          error: "Failed to load departments/personnel. Please try again.",
        }));
      } finally {
        setAppointment((prev) => ({
          ...prev,
          loadingDepartments: false,
          loadingEmployees: false,
        }));
      }
    };
    fetchAll();
  }, [openBookModal, selectedLead]);

  // ── Filter employees by selected department ───────────────────────────────
  React.useEffect(() => {
    setAppointment((prev) => {
      if (!prev.selectedDepartmentId) {
        return { ...prev, filteredEmployees: prev.employees };
      }
      const deptName =
        prev.departments.find((d) => d.id === Number(prev.selectedDepartmentId))?.name ?? "";
      const filtered = prev.employees.filter(
        (emp) => emp.department_name?.toLowerCase() === deptName.toLowerCase(),
      );
      const empStillPresent = filtered.some((e) => e.id === Number(prev.selectedEmployeeId));
      return {
        ...prev,
        filteredEmployees: filtered,
        selectedEmployeeId: empStillPresent ? prev.selectedEmployeeId : "",
      };
    });
  }, [
    appointment.selectedDepartmentId,
    appointment.employees,
    appointment.departments,
  ]);

  // ── Filtered leads ────────────────────────────────────────────────────────
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      const searchStr = `${lead.full_name || lead.name || ""} ${lead.id || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      const isActive = lead.is_active !== false;

      if (filters) {
        if (filters.department && lead.department_id !== Number(filters.department)) return false;
        if (filters.assignee   && lead.assigned_to_id !== Number(filters.assignee))  return false;
        if (filters.status) {
          const ls = (lead.lead_status || lead.status || "").toLowerCase();
          if (ls !== filters.status.toLowerCase()) return false;
        }
        if (filters.quality && lead.quality !== filters.quality) return false;
        if (filters.source  && lead.source  !== filters.source)  return false;
        if (filters.dateFrom || filters.dateTo) {
          const leadDate = lead.created_at ? new Date(lead.created_at) : null;
          if (!leadDate) return false;
          if (filters.dateFrom) {
            const from = new Date(filters.dateFrom); from.setHours(0, 0, 0, 0);
            if (leadDate < from) return false;
          }
          if (filters.dateTo) {
            const to = new Date(filters.dateTo); to.setHours(23, 59, 59, 999);
            if (leadDate > to) return false;
          }
        }
      }
      return matchSearch && isActive;
    });
  }, [leads, search, filters]);

  // ── Book Appointment Submit ───────────────────────────────────────────────
  const handleBookAppointmentSubmit = async () => {
    if (!selectedLead?.id) {
      setAppointment((p) => ({ ...p, error: "Lead ID is missing." }));
      return;
    }
    if (!appointment.selectedDepartmentId) {
      setAppointment((p) => ({ ...p, error: "Please select a department." }));
      return;
    }
    if (!appointment.date) {
      setAppointment((p) => ({ ...p, error: "Please select an appointment date." }));
      return;
    }
    if (!appointment.slot) {
      setAppointment((p) => ({ ...p, error: "Please select a time slot." }));
      return;
    }

    setAppointment((p) => ({ ...p, submitting: true, error: null }));

    const leadId       = selectedLead.id.replace(/^#/, "");
    const formattedDate = appointment.date.toISOString().split("T")[0];

    const result = await dispatch(
      bookAppointment({
        leadId,
        payload: {
          department_id:    Number(appointment.selectedDepartmentId),
          appointment_date: formattedDate,
          slot:             appointment.slot,
          remark:           appointment.remark,
          ...(appointment.selectedEmployeeId && {
            assigned_to_id: Number(appointment.selectedEmployeeId),
          }),
        },
      }),
    );

    setAppointment((p) => ({ ...p, submitting: false }));

    if (bookAppointment.rejected.match(result)) {
      const errMsg =
        typeof result.payload === "string"
          ? result.payload
          : "Failed to book appointment. Please try again.";
      setAppointment((p) => ({ ...p, error: errMsg }));
      return;
    }

    setAppointment((p) => ({ ...p, success: true }));
    handleCloseAll();
    setTimeout(() => setAppointment((p) => ({ ...p, success: false })), 2000);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenBookModal = (lead: LeadItem) => {
    setSelectedLead(lead);
    setAppointment({
      ...emptyAppointment(),
      // Convert number | null → string to match AppointmentState
      selectedDepartmentId: lead.department_id != null ? String(lead.department_id) : "",
      selectedEmployeeId:   lead.assigned_to_id  != null ? String(lead.assigned_to_id)  : "",
      date:   lead.appointment_date ? new Date(lead.appointment_date) : null,
      slot:   lead.slot   || "",
      remark: lead.remark || "",
    });
    setOpenBookModal(true);
  };

  const handleOpenMail = (lead: LeadItem) => {
    setSelectedLead(lead);
    setMailStep(1);
    setOpenMailModal(true);
  };
  const handleOpenSms = (lead: LeadItem) => {
    setSelectedLead(lead);
    setSmsMessage("");
    setOpenSmsModal(true);
  };

  const handleCloseAll = () => {
    setOpenBookModal(false);
    setOpenMailModal(false);
    setOpenSmsModal(false);
    setSelectedLead(null);
    setMailStep(1);
    setSelectedTemplate("");
    setSmsMessage("");
    setAppointment((p) => ({ ...p, error: null, submitting: false }));
  };

  const handleSaveAsTemplate = () => {
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      handleCloseAll();
    }, 2500);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading leads...</Typography>
        </Stack>
      </Box>
    );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error)
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load leads</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => dispatch(fetchLeads())}
        >
          Try again
        </Typography>
      </Alert>
    );

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (leads.length === 0)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">No leads found</Typography>
          <Typography variant="body2" color="text.secondary">Create your first lead to get started</Typography>
        </Stack>
      </Box>
    );

  // ── Render ────────────────────────────────────────────────────────────────
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
        {BOARD_COLUMNS.map((col) => {
          const leadsInCol = filteredLeads.filter((l) => {
            const leadStatus = (l.status || l.lead_status || "no status").toLowerCase().trim();
            return col.statusKey.some(
              (key) => leadStatus === (key || "no status").toLowerCase().trim(),
            );
          });
          return (
            <LeadColumn
              key={col.label}
              col={col}
              leads={leadsInCol}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onOpenSms={handleOpenSms}
              onOpenMail={handleOpenMail}
              onOpenBook={handleOpenBookModal}
              setLeads={setLeads}
            />
          );
        })}

        <Dialogs />

        <SuccessToast show={showSaveSuccess} message="Saved as A Template successfully!" />
        <SuccessToast show={appointment.success} message="Appointment booked successfully!" />

        <SmsModal
          open={openSmsModal}
          selectedLead={selectedLead}
          smsMessage={smsMessage}
          setSmsMessage={setSmsMessage}
          onClose={handleCloseAll}
          onSend={handleCloseAll}
        />

        <MailModal
          open={openMailModal}
          selectedLead={selectedLead}
          mailStep={mailStep}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          onClose={handleCloseAll}
          onNextToCompose={() => setMailStep(2)}
          onSaveAsTemplate={handleSaveAsTemplate}
          onBackToTemplates={() => setMailStep(1)}
        />

        <BookAppointmentModal
          open={openBookModal}
          selectedLead={selectedLead}
          appointment={appointment}
          // Setters pass string values, matching AppointmentState.selectedDepartmentId/selectedEmployeeId
          setSelectedDepartmentId={(id) =>
            setAppointment((p) => ({ ...p, selectedDepartmentId: String(id) }))
          }
          setSelectedEmployeeId={(id) =>
            setAppointment((p) => ({ ...p, selectedEmployeeId: String(id) }))
          }
          setDate={(d)    => setAppointment((p) => ({ ...p, date: d }))}
          setSlot={(s)    => setAppointment((p) => ({ ...p, slot: s }))}
          setRemark={(r)  => setAppointment((p) => ({ ...p, remark: r }))}
          clearError={()  => setAppointment((p) => ({ ...p, error: null }))}
          onClose={handleCloseAll}
          onSubmit={handleBookAppointmentSubmit}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default LeadsBoard;