import * as React from "react";
import {
  Badge,
  Box,
  Card,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay, type PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import dayjs, { Dayjs } from "dayjs";

import type { Lead } from "../../services/leads.api";
import type { FilterValues } from "../../types/leads.types";

type Props = {
  leads: Lead[];
  search: string;
  filters?: FilterValues;
};

type AppointmentLead = Lead & {
  appointmentDate: Dayjs;
};

const normalizeStatusKey = (value: string): string =>
  value.toLowerCase().trim().replace(/[_\s-]+/g, "-");

const matchesStatusFilter = (leadValue: string, filterValue: string): boolean => {
  const normalizedLead = normalizeStatusKey(leadValue);
  const normalizedFilter = normalizeStatusKey(filterValue);

  const equivalentStatuses: Record<string, string[]> = {
    new: ["new"],
    contacted: ["contacted"],
    "follow-ups": ["follow-ups", "follow-up", "followup", "follow-up-leads", "follow-up-lead"],
    converted: ["converted", "converted-lead", "converted-leads"],
    lost: ["lost", "lost-lead", "lost-leads"],
    "cycle-conversion": ["cycle-conversion", "cycleconversion"],
    appointment: ["appointment", "appointments"],
    negotiation: ["negotiation"],
    "proposal-sent": ["proposal-sent", "proposal"],
    "contract-signed": ["contract-signed", "contractsigned"],
  };

  return (equivalentStatuses[normalizedFilter] ?? [normalizedFilter]).includes(normalizedLead);
};

const LeadsCalendar: React.FC<Props> = ({ leads, search, filters }) => {
  const appointments = React.useMemo<AppointmentLead[]>(() => {
    const query = search.trim().toLowerCase();

    // Same normalisation logic as LeadPipelineFunnel — appointment is identified
    // purely by lead_status, matching "appointment" or "appointments" variants.
    const isAppointmentLead = (lead: Lead) => {
      const raw = ((lead.lead_status as string | undefined) || (lead as { status?: string }).status || "")
        .toLowerCase()
        .trim()
        .replace(/[_\s]+/g, "-");
      return (raw === "appointment" || raw === "appointments") && Boolean(lead.appointment_date);
    };

    return leads
      .filter((lead) => lead.is_active !== false)
      .filter(isAppointmentLead)
      .filter((lead) => {
        const appointmentDate = dayjs(lead.appointment_date);
        return appointmentDate.isValid();
      })
      .filter((lead) => {
        const searchStr = `${lead.full_name || ""} ${lead.contact_no || ""} ${lead.email || ""} ${lead.id || ""}`.toLowerCase();
        if (query && !searchStr.includes(query)) return false;

        if (!filters) return true;

        if (filters.department && lead.department_id !== Number(filters.department)) return false;
        if (filters.assignee && lead.assigned_to_id !== Number(filters.assignee)) return false;

        if (filters.status) {
          const status = String(lead.lead_status || lead.status || "");
          if (!matchesStatusFilter(status, filters.status)) return false;
        }

        if (filters.source && lead.source !== filters.source) return false;

        if (filters.dateFrom || filters.dateTo) {
          const leadDate = lead.created_at ? new Date(lead.created_at) : null;
          if (!leadDate) return false;

          if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (leadDate < fromDate) return false;
          }

          if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (leadDate > toDate) return false;
          }
        }

        return true;
      })
      .map((lead) => ({ ...lead, appointmentDate: dayjs(lead.appointment_date) }))
      .sort((a, b) => a.appointmentDate.valueOf() - b.appointmentDate.valueOf());
  }, [filters, leads, search]);

  const appointmentCountByDay = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of appointments) {
      const key = item.appointmentDate.format("YYYY-MM-DD");
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [appointments]);

  // Auto-select nearest upcoming appointment; if none exist, use most recent past appointment.
  const defaultDate = React.useMemo(() => {
    const today = dayjs().startOf("day");
    const nearestUpcoming = appointments.find(
      (item) =>
        item.appointmentDate.startOf("day").isSame(today) ||
        item.appointmentDate.startOf("day").isAfter(today),
    );

    if (nearestUpcoming) {
      return nearestUpcoming.appointmentDate.startOf("day");
    }

    const mostRecentPast = appointments.length
      ? appointments[appointments.length - 1].appointmentDate.startOf("day")
      : null;

    return mostRecentPast ?? today;
  }, [appointments]);

  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  // Set initial selected date once appointments are ready.
  React.useEffect(() => {
    if (selectedDate === null) {
      setSelectedDate(defaultDate);
    }
  }, [defaultDate, selectedDate]);

  const upcomingAppointments = React.useMemo(() => {
    const todayStart = dayjs().startOf("day");
    return appointments
      .filter(
        (item) =>
          item.appointmentDate.startOf("day").isSame(todayStart) ||
          item.appointmentDate.startOf("day").isAfter(todayStart),
      )
      .slice(0, 3);
  }, [appointments]);

  const formatReminderLabel = React.useCallback((date: Dayjs) => {
    const today = dayjs().startOf("day");
    const diff = date.startOf("day").diff(today, "day");
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `In ${diff} day${diff === 1 ? "" : "s"}`;
  }, []);

  const selectedDateAppointments = React.useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((item) => item.appointmentDate.isSame(selectedDate, "day"))
      .sort((a, b) =>
        String(a.slot || "").toLowerCase().localeCompare(String(b.slot || "").toLowerCase()),
      );
  }, [appointments, selectedDate]);

  const isMissedAppointment = React.useCallback((lead: AppointmentLead) => {
    const status = String(lead.lead_status || (lead as { status?: string }).status || "")
      .toLowerCase()
      .trim()
      .replace(/[_\s]+/g, "-");
    const isAppointmentStatus = status === "appointment" || status === "appointments";
    const isPastDate = lead.appointmentDate.startOf("day").isBefore(dayjs().startOf("day"));
    return isAppointmentStatus && isPastDate;
  }, []);

  const renderDay = React.useCallback(
    (props: PickersDayProps) => {
      const rawDay = props.day as Dayjs | Date;
      // Use dayjs local formatting (not toISOString which is UTC) so the key
      // matches the ones in appointmentCountByDay which also use local time.
      const dayKey = dayjs(rawDay).format("YYYY-MM-DD");
      const hasAppointment = Boolean(appointmentCountByDay.get(dayKey));

      return (
        <Badge
          key={dayKey}
          overlap="circular"
          variant="dot"
          color="success"
          invisible={!hasAppointment}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            "& .MuiBadge-dot": {
              width: 6,
              height: 6,
              bottom: 4,
              right: 4,
            },
          }}
        >
          <PickersDay
            {...props}
            sx={{
              ...props.sx,
              // Highlight appointment days with a subtle green tint when not selected.
              ...(hasAppointment && !props.selected
                ? { bgcolor: "#D1FAE5", color: "#065F46", fontWeight: 700, borderRadius: "50%" }
                : {}),
            }}
          />
        </Badge>
      );
    },
    [appointmentCountByDay],
  );

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
      <Card sx={{ p: 2, borderRadius: "14px", minWidth: { lg: 360 } }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          Appointment Calendar
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            value={selectedDate}
            onChange={(value) => setSelectedDate(value as Dayjs | null)}
            slots={{ day: renderDay }}
          />
        </LocalizationProvider>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Reminders
        </Typography>

        {upcomingAppointments.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No upcoming appointments.
          </Typography>
        ) : (
          <Stack spacing={0.8}>
            {upcomingAppointments.map((lead) => (
              <Stack
                key={`reminder-${lead.id}-${lead.appointment_date}`}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  px: 1,
                  py: 0.75,
                  borderRadius: "8px",
                  bgcolor: "#F8FAFC",
                }}
              >
                <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 170 }}>
                  {lead.full_name || "Unnamed lead"}
                </Typography>
                <Chip
                  size="small"
                  label={formatReminderLabel(lead.appointmentDate)}
                  sx={{ height: 22, fontSize: "0.7rem", bgcolor: "#ECFDF5", color: "#047857", fontWeight: 700 }}
                />
              </Stack>
            ))}
          </Stack>
        )}
      </Card>

      <Card sx={{ p: 2, borderRadius: "14px", flex: 1, minHeight: 420 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {selectedDate ? selectedDate.format("DD MMM YYYY") : "Appointments"}
          </Typography>
          <Chip
            size="small"
            label={`${selectedDateAppointments.length} appointment${selectedDateAppointments.length !== 1 ? "s" : ""}`}
            sx={{ bgcolor: "#ECFDF5", color: "#10B981", fontWeight: 600 }}
          />
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        {selectedDateAppointments.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <EventNoteIcon sx={{ color: "#CBD5E1", fontSize: 42, mb: 1 }} />
            <Typography fontWeight={600} color="text.secondary">
              No appointments on this date
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pick another date to view scheduled leads.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {selectedDateAppointments.map((lead) => (
              <Box
                key={`${lead.id}-${lead.appointment_date}`}
                sx={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  p: 1.5,
                  bgcolor: "#FFFFFF",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight={700} fontSize="0.9rem">
                    {lead.full_name}
                  </Typography>
                  <Chip
                    size="small"
                    label={isMissedAppointment(lead) ? "Missed" : (lead.status || lead.lead_status || "Appointment")}
                    sx={isMissedAppointment(lead)
                      ? { bgcolor: "#FEF2F2", color: "#B91C1C", fontWeight: 700 }
                      : { bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 600 }}
                  />
                </Stack>

                <Stack spacing={0.7}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeIcon sx={{ fontSize: 15, color: "#64748B" }} />
                    <Typography fontSize="0.82rem" color="text.secondary">
                      {lead.appointmentDate.format("DD MMM YYYY")}
                      {lead.slot ? ` · ${lead.slot}` : " · Time not specified"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonOutlineIcon sx={{ fontSize: 15, color: "#64748B" }} />
                    <Typography fontSize="0.82rem" color="text.secondary">
                      {lead.assigned_to_name || "Unassigned"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RoomOutlinedIcon sx={{ fontSize: 15, color: "#64748B" }} />
                    <Typography fontSize="0.82rem" color="text.secondary">
                      {lead.location || "Location not provided"}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
};

export default LeadsCalendar;
