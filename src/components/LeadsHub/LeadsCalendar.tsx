import * as React from "react";
import {
  Box,
  Card,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";

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

type CalendarViewMode = "day" | "week" | "month";

const normalizeStatusKey = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, "-");

const matchesStatusFilter = (
  leadValue: string,
  filterValue: string,
): boolean => {
  const normalizedLead = normalizeStatusKey(leadValue);
  const normalizedFilter = normalizeStatusKey(filterValue);

  const equivalentStatuses: Record<string, string[]> = {
    new: ["new"],
    contacted: ["contacted"],
    "follow-ups": [
      "follow-ups",
      "follow-up",
      "followup",
      "follow-up-leads",
      "follow-up-lead",
    ],
    converted: ["converted", "converted-lead", "converted-leads"],
    lost: ["lost", "lost-lead", "lost-leads"],
    "cycle-conversion": ["cycle-conversion", "cycleconversion"],
    appointment: ["appointment", "appointments"],
    negotiation: ["negotiation"],
    "proposal-sent": ["proposal-sent", "proposal"],
    "contract-signed": ["contract-signed", "contractsigned"],
  };

  return (equivalentStatuses[normalizedFilter] ?? [normalizedFilter]).includes(
    normalizedLead,
  );
};

const LeadsCalendar: React.FC<Props> = ({ leads, search, filters }) => {
  const navigate = useNavigate();

  const appointments = React.useMemo<AppointmentLead[]>(() => {
    const query = search.trim().toLowerCase();
    const filterDepartmentId = filters?.department
      ? Number(filters.department)
      : null;
    const filterAssigneeId = filters?.assignee
      ? Number(filters.assignee)
      : null;
    const filterStatus = filters?.status ? String(filters.status) : "";
    const filterSource = filters?.source ? String(filters.source) : "";
    const fromDate = filters?.dateFrom ? new Date(filters.dateFrom) : null;
    const toDate = filters?.dateTo ? new Date(filters.dateTo) : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    // Same normalisation logic as LeadPipelineFunnel — appointment is identified
    // purely by lead_status, matching "appointment" or "appointments" variants.
    const isAppointmentLead = (lead: Lead) => {
      const raw = (
        (lead.lead_status as string | undefined) ||
        (lead as { status?: string }).status ||
        ""
      )
        .toLowerCase()
        .trim()
        .replace(/[_\s]+/g, "-");
      return (
        (raw === "appointment" || raw === "appointments") &&
        Boolean(lead.appointment_date)
      );
    };

    const result: AppointmentLead[] = [];

    for (const lead of leads) {
      if (lead.is_active === false) continue;
      if (!isAppointmentLead(lead)) continue;

      const appointmentDate = dayjs(lead.appointment_date);
      if (!appointmentDate.isValid()) continue;

      if (query) {
        const searchStr =
          `${lead.full_name || ""} ${lead.contact_no || ""} ${lead.email || ""} ${lead.id || ""}`.toLowerCase();
        if (!searchStr.includes(query)) continue;
      }

      if (
        filterDepartmentId !== null &&
        lead.department_id !== filterDepartmentId
      )
        continue;
      if (filterAssigneeId !== null && lead.assigned_to_id !== filterAssigneeId)
        continue;

      if (filterStatus) {
        const status = String(lead.lead_status || lead.status || "");
        if (!matchesStatusFilter(status, filterStatus)) continue;
      }

      if (filterSource && lead.source !== filterSource) continue;

      if (fromDate || toDate) {
        const leadDate = lead.created_at ? new Date(lead.created_at) : null;
        if (!leadDate) continue;
        if (fromDate && leadDate < fromDate) continue;
        if (toDate && leadDate > toDate) continue;
      }

      result.push({ ...lead, appointmentDate });
    }

    result.sort(
      (a, b) => a.appointmentDate.valueOf() - b.appointmentDate.valueOf(),
    );
    return result;
  }, [filters, leads, search]);

  const appointmentsByDay = React.useMemo(() => {
    const map = new Map<string, AppointmentLead[]>();
    for (const item of appointments) {
      const key = item.appointmentDate.format("YYYY-MM-DD");
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
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
  const [visibleMonth, setVisibleMonth] = React.useState<Dayjs>(
    dayjs().startOf("month"),
  );
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("month");
  const [todayOnlyMode, setTodayOnlyMode] = React.useState(false);

  // Set initial selected date once appointments are ready.
  React.useEffect(() => {
    if (selectedDate === null) {
      setSelectedDate(defaultDate);
      setVisibleMonth(defaultDate.startOf("month"));
    }
  }, [defaultDate, selectedDate]);

  const getAppointmentState = React.useCallback((date: Dayjs) => {
    const today = dayjs().startOf("day");
    const candidate = date.startOf("day");

    if (candidate.isBefore(today)) {
      return {
        label: "Completed",
        chipBg: "#FEE2E2",
        chipColor: "#B91C1C",
      };
    }

    if (candidate.isSame(today)) {
      return {
        label: "Today",
        chipBg: "#DCFCE7",
        chipColor: "#15803D",
      };
    }

    return {
      label: "Upcoming",
      chipBg: "#EDE9FE",
      chipColor: "#6D28D9",
    };
  }, []);

  const monthGridDays = React.useMemo(() => {
    const monthStart = visibleMonth.startOf("month");
    const gridStart = monthStart.startOf("week");
    return Array.from({ length: 42 }, (_, index) =>
      gridStart.add(index, "day"),
    );
  }, [visibleMonth]);

  const handleSelectDate = React.useCallback(
    (date: Dayjs) => {
      setSelectedDate(date.startOf("day"));
      if (!date.isSame(visibleMonth, "month")) {
        setVisibleMonth(date.startOf("month"));
      }
    },
    [visibleMonth],
  );

  const weekDays = React.useMemo(
    () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    [],
  );

  const appointmentDayTimeline = React.useMemo(() => {
    const start = dayjs().startOf("month");
    const end = dayjs().endOf("year");
    const grouped = new Map<string, AppointmentLead[]>();

    for (const item of appointments) {
      const d = item.appointmentDate.startOf("day");
      if (d.isBefore(start) || d.isAfter(end)) continue;
      const key = d.format("YYYY-MM-DD");
      const existing = grouped.get(key) ?? [];
      existing.push(item);
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => dayjs(a[0]).valueOf() - dayjs(b[0]).valueOf())
      .map(([key, items]) => ({
        date: dayjs(key),
        items: items.sort((a, b) =>
          String(a.slot || "")
            .toLowerCase()
            .localeCompare(String(b.slot || "").toLowerCase()),
        ),
      }));
  }, [appointments]);

  const todaysAppointments = React.useMemo(() => {
    const today = dayjs().startOf("day");
    return appointments
      .filter((item) => item.appointmentDate.startOf("day").isSame(today))
      .sort((a, b) =>
        String(a.slot || "")
          .toLowerCase()
          .localeCompare(String(b.slot || "").toLowerCase()),
      );
  }, [appointments]);

  const selectedBaseDate = selectedDate ?? dayjs();

  const weekDaysForSelected = React.useMemo(() => {
    const weekStart = selectedBaseDate.startOf("week");
    return Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day"));
  }, [selectedBaseDate]);

  const viewHeaderTitle = React.useMemo(() => {
    if (todayOnlyMode) {
      return "Today's Appointments";
    }

    if (viewMode === "month") {
      return visibleMonth.format("MMMM YYYY");
    }

    if (viewMode === "week") {
      const start = weekDaysForSelected[0];
      const end = weekDaysForSelected[6];
      if (start.isSame(end, "month")) {
        return `${start.format("DD")} - ${end.format("DD MMM YYYY")}`;
      }
      return `${start.format("DD MMM")} - ${end.format("DD MMM YYYY")}`;
    }

    return selectedBaseDate.format("DD MMM YYYY");
  }, [
    selectedBaseDate,
    todayOnlyMode,
    viewMode,
    visibleMonth,
    weekDaysForSelected,
  ]);

  const navigatePrevious = React.useCallback(() => {
    if (todayOnlyMode) return;

    if (viewMode === "month") {
      setVisibleMonth((prev) => prev.subtract(1, "month"));
      return;
    }

    if (viewMode === "week") {
      handleSelectDate(selectedBaseDate.subtract(1, "week"));
      return;
    }

    handleSelectDate(selectedBaseDate.subtract(1, "day"));
  }, [handleSelectDate, selectedBaseDate, todayOnlyMode, viewMode]);

  const navigateNext = React.useCallback(() => {
    if (todayOnlyMode) return;

    if (viewMode === "month") {
      setVisibleMonth((prev) => prev.add(1, "month"));
      return;
    }

    if (viewMode === "week") {
      handleSelectDate(selectedBaseDate.add(1, "week"));
      return;
    }

    handleSelectDate(selectedBaseDate.add(1, "day"));
  }, [handleSelectDate, selectedBaseDate, todayOnlyMode, viewMode]);

  const handleGoToToday = React.useCallback(() => {
    setTodayOnlyMode(true);
    setViewMode("day");
    handleSelectDate(dayjs());
  }, [handleSelectDate]);

  const segmentedTabs = React.useMemo(
    () => [
      { id: "day" as CalendarViewMode, label: "Day" },
      { id: "week" as CalendarViewMode, label: "Week" },
      { id: "month" as CalendarViewMode, label: "Month" },
    ],
    [],
  );

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2, borderRadius: "14px" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="h6" sx={{ color: "#E17E61", fontWeight: 700 }}>
            {viewHeaderTitle}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                p: 0.35,
                borderRadius: "10px",
                bgcolor: "#F1EEEC",
                border: "1px solid #E5E7EB",
              }}
            >
              {segmentedTabs.map((tab, index) => {
                const selected = tab.id === viewMode && !todayOnlyMode;
                return (
                  <Box
                    key={tab.id}
                    onClick={() => {
                      setTodayOnlyMode(false);
                      setViewMode(tab.id);
                    }}
                    sx={{
                      px: 2,
                      py: 0.45,
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      lineHeight: 1.3,
                      fontWeight: selected ? 700 : 500,
                      color: selected ? "#E17E61" : "#9e9e9e",
                      bgcolor: selected ? "#FFFFFF" : "transparent",
                      boxShadow: selected
                        ? "0 1px 2px rgba(0, 0, 0, 0.08)"
                        : "none",
                      cursor: "pointer",
                      userSelect: "none",
                      borderLeft:
                        index > 0
                          ? "1px solid rgba(148, 163, 184, 0.28)"
                          : "none",
                    }}
                  >
                    {tab.label}
                  </Box>
                );
              })}
            </Box>
            <Chip
              label="Today"
              size="small"
              onClick={handleGoToToday}
              sx={{
                borderRadius: "8px",
                bgcolor: todayOnlyMode ? "#E17E61" : "#FFF7ED",
                color: todayOnlyMode ? "#FFFFFF" : "#E17E61",
                border: "1px solid #F6D7CD",
                fontWeight: 700,
                cursor: "pointer",
              }}
            />
            <IconButton
              size="small"
              onClick={navigatePrevious}
              disabled={todayOnlyMode}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={navigateNext}
              disabled={todayOnlyMode}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {viewMode === "month" && (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              overflow: "hidden",
              bgcolor: "#FFFFFF",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                borderBottom: "1px solid #E5E7EB",
                bgcolor: "#FAFAFA",
              }}
            >
              {weekDays.map((day) => (
                <Box
                  key={day}
                  sx={{
                    py: 1,
                    textAlign: "center",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              }}
            >
              {monthGridDays.map((date) => {
                const dayKey = date.format("YYYY-MM-DD");
                const dayAppointments = appointmentsByDay.get(dayKey) ?? [];
                const isCurrentMonth = date.isSame(visibleMonth, "month");
                const isSelected = Boolean(selectedDate?.isSame(date, "day"));
                const isToday = date.isSame(dayjs(), "day");
                const isPastDay = date
                  .startOf("day")
                  .isBefore(dayjs().startOf("day"));

                const tooltipContent =
                  dayAppointments.length > 0 ? (
                    <Stack spacing={0.6} sx={{ p: 0.25 }}>
                      {dayAppointments.map((lead) => {
                        const tone = getAppointmentState(lead.appointmentDate);
                        return (
                          <Stack
                            key={`tip-${lead.id}`}
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                bgcolor: tone.chipColor,
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                color: "#F8FAFC",
                                fontWeight: 600,
                              }}
                            >
                              {lead.full_name || "Unnamed lead"}
                              {lead.slot ? ` · ${lead.slot}` : ""}
                            </Typography>
                          </Stack>
                        );
                      })}
                    </Stack>
                  ) : (
                    ""
                  );

                return (
                  <Tooltip
                    key={dayKey}
                    title={tooltipContent}
                    placement="top"
                    arrow
                    disableHoverListener={dayAppointments.length === 0}
                  >
                    <Box
                      onClick={() => handleSelectDate(date)}
                      sx={{
                        minHeight: { xs: 96, md: 114 },
                        p: 0.9,
                        borderRight: "1px solid #F1F5F9",
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        bgcolor: isSelected
                          ? "#FFF7ED"
                          : isPastDay
                            ? "#FAFAFA"
                            : "#FFFFFF",
                        transition: "background-color 120ms ease",
                        "&:hover": {
                          bgcolor: isSelected
                            ? "#FFF1E6"
                            : isPastDay
                              ? "#F3F4F6"
                              : "#FAFAFA",
                        },
                      }}
                    >
                      <Stack spacing={0.7}>
                        {isToday ? (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              bgcolor: "#E17E61",
                              color: "#FFFFFF",
                              fontSize: "0.9rem",
                              fontWeight: 800,
                            }}
                          >
                            {date.date()}
                          </Box>
                        ) : (
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: !isCurrentMonth ? "#94A3B8" : "#334155",
                            }}
                          >
                            {date.date()}
                          </Typography>
                        )}

                        {isToday && dayAppointments.length === 0 && (
                          <Typography
                            sx={{
                              fontSize: "0.67rem",
                              color: "#94A3B8",
                              fontStyle: "italic",
                              mt: 0.25,
                            }}
                          >
                            No Appointments
                          </Typography>
                        )}

                        {dayAppointments.length > 0 && (
                          <Box
                            sx={{
                              maxHeight: 90,
                              overflowY: "auto",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              pr: 0.25,
                              "&::-webkit-scrollbar": { width: 3 },
                              "&::-webkit-scrollbar-thumb": {
                                bgcolor: "#CBD5E1",
                                borderRadius: 4,
                              },
                            }}
                          >
                            {dayAppointments.map((lead) => {
                              const tone = getAppointmentState(
                                lead.appointmentDate,
                              );
                              return (
                                <Box
                                  key={`calendar-${lead.id}-${lead.appointment_date}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/leads/${String(lead.id).replace(/^#/, "")}`,
                                    );
                                  }}
                                  sx={{
                                    px: 0.7,
                                    py: 0.35,
                                    borderRadius: "6px",
                                    fontSize: "0.68rem",
                                    lineHeight: 1.25,
                                    fontWeight: 700,
                                    bgcolor: tone.chipBg,
                                    color: tone.chipColor,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                    "&:hover": { opacity: 0.78 },
                                  }}
                                >
                                  {lead.full_name || "Unnamed lead"}
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}

        {viewMode === "week" && (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              overflow: "hidden",
              bgcolor: "#FFFFFF",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                borderBottom: "1px solid #E5E7EB",
                bgcolor: "#FAFAFA",
              }}
            >
              {weekDaysForSelected.map((date) => (
                <Box
                  key={`week-head-${date.format("YYYY-MM-DD")}`}
                  sx={{ py: 1, textAlign: "center" }}
                >
                  <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                    {date.format("ddd")}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.84rem",
                      fontWeight: date.isSame(selectedBaseDate, "day")
                        ? 800
                        : 600,
                      color: date.isSame(dayjs(), "day")
                        ? "#E17E61"
                        : "#334155",
                    }}
                  >
                    {date.format("DD")}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              }}
            >
              {weekDaysForSelected.map((date) => {
                const dayKey = date.format("YYYY-MM-DD");
                const dayAppointments = appointmentsByDay.get(dayKey) ?? [];
                return (
                  <Box
                    key={`week-body-${dayKey}`}
                    onClick={() => handleSelectDate(date)}
                    sx={{
                      minHeight: 190,
                      p: 0.9,
                      borderRight: "1px solid #F1F5F9",
                      cursor: "pointer",
                      bgcolor: selectedDate?.isSame(date, "day")
                        ? "#FFF7ED"
                        : "#FFFFFF",
                    }}
                  >
                    <Stack spacing={0.7}>
                      {dayAppointments.length === 0 ? (
                        <Typography
                          sx={{ fontSize: "0.72rem", color: "#94A3B8" }}
                        >
                          No appointments
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            maxHeight: 160,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            pr: 0.25,
                            "&::-webkit-scrollbar": { width: 3 },
                            "&::-webkit-scrollbar-thumb": {
                              bgcolor: "#CBD5E1",
                              borderRadius: 4,
                            },
                          }}
                        >
                          {dayAppointments.map((lead) => {
                            const tone = getAppointmentState(
                              lead.appointmentDate,
                            );
                            return (
                              <Box
                                key={`week-${lead.id}-${lead.appointment_date}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/leads/${String(lead.id).replace(/^#/, "")}`,
                                  );
                                }}
                                sx={{
                                  px: 0.7,
                                  py: 0.4,
                                  borderRadius: "6px",
                                  fontSize: "0.68rem",
                                  lineHeight: 1.25,
                                  fontWeight: 700,
                                  bgcolor: tone.chipBg,
                                  color: tone.chipColor,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                  "&:hover": { opacity: 0.78 },
                                }}
                              >
                                {lead.full_name || "Unnamed lead"}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {viewMode === "day" && !todayOnlyMode && (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              bgcolor: "#FFFFFF",
              p: 1.2,
            }}
          >
            <Stack spacing={1.1}>
              <Typography sx={{ fontSize: "0.8rem", color: "#64748B" }}>
                Showing appointment days for current month to{" "}
                {dayjs().endOf("year").format("DD MMM YYYY")}.
              </Typography>

              {appointmentDayTimeline.length === 0 ? (
                <Typography sx={{ fontSize: "0.86rem", color: "#64748B" }}>
                  No appointment days found in this range.
                </Typography>
              ) : (
                <Box
                  sx={{
                    maxHeight: 520,
                    overflowY: "auto",
                    pr: 0.4,
                  }}
                >
                  <Stack spacing={0.9}>
                    {appointmentDayTimeline.map((entry) => {
                      const tone = getAppointmentState(entry.date);
                      return (
                        <Stack
                          key={`day-timeline-${entry.date.format("YYYY-MM-DD")}`}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          onClick={() => handleSelectDate(entry.date)}
                          sx={{
                            px: 1,
                            py: 0.85,
                            borderRadius: "8px",
                            border: "1px solid #E5E7EB",
                            cursor: "pointer",
                            bgcolor: selectedDate?.isSame(entry.date, "day")
                              ? "#FFF7ED"
                              : "#FFFFFF",
                          }}
                        >
                          <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: "0.84rem",
                                fontWeight: 700,
                                color: "#334155",
                              }}
                            >
                              {entry.date.format("DD MMM YYYY, ddd")}
                            </Typography>
                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              gap={0.5}
                              sx={{ mt: 0.25 }}
                            >
                              {entry.items.map((item) => {
                                const tone = getAppointmentState(
                                  item.appointmentDate,
                                );
                                return (
                                  <Box
                                    key={`tl-name-${item.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/leads/${String(item.id).replace(/^#/, "")}`,
                                      );
                                    }}
                                    sx={{
                                      px: 0.8,
                                      py: 0.2,
                                      borderRadius: "6px",
                                      fontSize: "0.72rem",
                                      fontWeight: 700,
                                      bgcolor: tone.chipBg,
                                      color: tone.chipColor,
                                      cursor: "pointer",
                                      "&:hover": { opacity: 0.78 },
                                    }}
                                  >
                                    {item.full_name || "Unnamed lead"}
                                    {item.slot ? ` · ${item.slot}` : ""}
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={0.7}
                            alignItems="center"
                          >
                            <Chip
                              size="small"
                              label={`${entry.items.length} appointment${entry.items.length > 1 ? "s" : ""}`}
                              sx={{
                                bgcolor: "#F1F5F9",
                                color: "#475569",
                                fontWeight: 700,
                              }}
                            />
                            <Chip
                              size="small"
                              label={tone.label}
                              sx={{
                                bgcolor: tone.chipBg,
                                color: tone.chipColor,
                                fontWeight: 700,
                              }}
                            />
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {viewMode === "day" && todayOnlyMode && (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              bgcolor: "#FFFFFF",
              p: 1.2,
            }}
          >
            <Stack spacing={0.9}>
              {todaysAppointments.length === 0 ? (
                <Typography sx={{ fontSize: "0.86rem", color: "#64748B" }}>
                  No appointments scheduled for today.
                </Typography>
              ) : (
                todaysAppointments.map((lead) => {
                  const tone = getAppointmentState(lead.appointmentDate);
                  return (
                    <Stack
                      key={`today-${lead.id}-${lead.appointment_date}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      onClick={() =>
                        navigate(`/leads/${String(lead.id).replace(/^#/, "")}`)
                      }
                      sx={{
                        px: 1,
                        py: 0.8,
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#FAFAFA" },
                      }}
                    >
                      <Stack spacing={0.1} sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {lead.full_name || "Unnamed lead"}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.74rem", color: "#64748B" }}
                        >
                          {lead.slot || "Time not specified"}
                        </Typography>
                      </Stack>
                      <Chip
                        size="small"
                        label={tone.label}
                        sx={{
                          bgcolor: tone.chipBg,
                          color: tone.chipColor,
                          fontWeight: 700,
                        }}
                      />
                    </Stack>
                  );
                })
              )}
            </Stack>
          </Box>
        )}
      </Card>
    </Stack>
  );
};

export default LeadsCalendar;
