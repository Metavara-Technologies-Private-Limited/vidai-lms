import { useState, useEffect, useMemo } from "react";
import {
  Box, Button, Chip, IconButton, InputBase, Stack, Tab, Tabs, Typography, Avatar, CircularProgress, Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SearchIcon from "@mui/icons-material/Search";
import Filter_Leads from "../../../assets/icons/Filter_Leads.svg";
import AddIcon from "@mui/icons-material/Add";
import CreateTicket from "./CreateTicket";
import FilterTickets from "./FilterTicket";
import dayjs from "dayjs";

// Types & Styles
import type { TicketListItem, TicketFilters, FilterTicketsPayload } from "../../../types/tickets.types";
import {
  ticketsSearchBoxSx,
  createTicketButtonSx,
  ticketsTabsSx,
  ticketsTableHeaderSx,
  ticketsRowSx,
  priorityChipSx,
  paginationButtonSx,
  ticketsTitleSx,
  ticketsActionsRowSx,
  ticketsColumnHeaderCellSx,
  ticketsEllipsisCellSx,
  ticketsNumberCellSx,
  ticketsAvatarSx,
  ticketsAssigneeTextSx,
  ticketsPaginationArrowSx,
  ticketsPaginationNumberOverrideSx,
} from "../../../styles/Settings/Tickets.styles";


// Redux & API
import {
  fetchTickets,
  fetchTicketDashboard,
  selectAllTickets,
  selectTicketsLoading,
  selectTicketsError,
  selectTicketDashboard
} from "../../../store/ticketSlice";
import type { AppDispatch } from "../../../store";
import type { Employee } from "../../../services/leads.api";
import { clinicsApi } from "../../../services/tickets.api";

const Tickets = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // --- Redux Data ---
  const rawTickets = useSelector(selectAllTickets);
  const dashboardCounts = useSelector(selectTicketDashboard);
  const loading = useSelector(selectTicketsLoading);
  const error = useSelector(selectTicketsError);
  const [employees, setEmployees] = useState<Employee[]>([]);
  // --- Local UI State ---
  const [tab, setTab] = useState<string>("New");
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TicketFilters | null>(null);

  console.log(employees);

  useEffect(() => {


    const loadData = async () => {

      try {
        const results = await Promise.allSettled([

          clinicsApi.getClinicEmployees(1),
        ]);


if (results[0].status === "fulfilled") {
  const value = results[0].value as
    | Employee[]
    | { results: Employee[] };

  setEmployees(
    Array.isArray(value) ? value : value.results ?? []
  );
}
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    loadData();

  }, []);


  // 1. Initial Data Fetch from DB
  useEffect(() => {
    dispatch(fetchTickets());
    dispatch(fetchTicketDashboard());
  }, [dispatch]);

const ticketsFromDb = useMemo((): TicketListItem[] => {
  if (Array.isArray(rawTickets)) return rawTickets;

  if (
    rawTickets &&
    typeof rawTickets === "object" &&
    "results" in rawTickets
  ) {
    const data = rawTickets as { results: TicketListItem[] };
    return data.results ?? [];
  }

  return [];
}, [rawTickets]);

const getCount = (status: string): number => {
  const key = status.toLowerCase() as keyof typeof dashboardCounts;

  if (dashboardCounts && key in dashboardCounts) {
    return dashboardCounts[key] ?? 0;
  }

  return ticketsFromDb.filter(
    (t) => t.status?.toLowerCase() === key
  ).length;
};

  // 3. Filtering and Search Logic
  const filteredTickets = useMemo(() => {
    return ticketsFromDb.filter((t) => {
      // Tab Filter (Backend "new" vs Frontend "New")
      if (t.status?.toLowerCase() !== tab.toLowerCase()) return false;

      // Search Filter (Ticket Number)
      if (search && !t.ticket_no?.toLowerCase().includes(search.toLowerCase())) return false;

      // Advanced Filters from FilterTickets component
      if (filters) {
        if (filters.priority && t.priority?.toLowerCase() !== filters.priority.toLowerCase()) return false;
        if (filters.department_id && Number(t.department) !== Number(filters.department_id)) return false;

        const ticketDate = dayjs(t.created_at);
        if (filters.from_date && ticketDate.isBefore(filters.from_date, "day")) return false;
        if (filters.to_date && ticketDate.isAfter(filters.to_date, "day")) return false;
      }
      return true;
    });
  }, [ticketsFromDb, tab, search, filters]);

  // Pagination Logic
  const ROWS_PER_PAGE = 8;
  const totalEntries = filteredTickets.length;
  const totalPages = Math.ceil(totalEntries / ROWS_PER_PAGE);
  const startIndex = (page - 1) * ROWS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (loading && ticketsFromDb.length === 0) {
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }

  const columns = [
    { key: "ticket_no", label: "Ticket No", flex: 1 },
    { key: "lab_name", label: "Lab Name", flex: 1.4 },
    { key: "subject", label: "Subject", flex: 1 },
    { key: "created_at", label: "Created Date", flex: 1.1 },
    { key: "due_date", label: "Due Date", flex: 1.1 },
    { key: "requested_by", label: "Requested By", flex: 1.2 },
    { key: "department", label: "Department", flex: 1.2 },
    { key: "priority", label: "Priority", flex: 0.96 },
    { key: "assigned_to", label: "Assigned To", flex: 1.5 },
  ];


  return (
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography sx={ticketsTitleSx}>Tickets</Typography>

      <Stack direction="row" alignItems="center" sx={ticketsActionsRowSx} mb={1.5}>

        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setPage(1); }}
          TabIndicatorProps={{ style: { display: "none" } }}
          sx={ticketsTabsSx}
        >
          <Tab value="New" label={`New (${getCount("new")})`} />
          <Tab value="Pending" label={`Pending (${getCount("pending")})`} />
          <Tab value="Resolved" label={`Resolved (${getCount("resolved")})`} />
          <Tab value="Closed" label={`Closed (${getCount("closed")})`} />
        </Tabs>

        {/* RIGHT → Actions */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
          <Box sx={ticketsSearchBoxSx}>
            <SearchIcon fontSize="small" />
            <InputBase
              placeholder="Search by Ticket no."
              sx={{ ml: 1, flex: 1 }}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </Box>

          <IconButton onClick={() => setOpenFilter(true)} sx={{ width: 50, height: 50 }}>
            <Box component="img" src={Filter_Leads} />
          </IconButton>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={createTicketButtonSx}
            onClick={() => setOpenCreate(true)}
          >
            Create New
          </Button>
        </Stack>

      </Stack>


      {/* Table Section */}
      <Box sx={{ overflowX: "auto" }}>
        <Stack direction="row" px={2} py={2} sx={ticketsTableHeaderSx}>
          {columns.map((col) => (
            <Box key={col.key} flex={col.flex} sx={ticketsColumnHeaderCellSx}>
              {col.label}
            </Box>
          ))}
        </Stack>


        {paginatedTickets.length === 0 ? (
          <Box p={6} textAlign="center">
            <Typography color="text.secondary">No tickets found in the database.</Typography>
          </Box>
        ) : (
          paginatedTickets.map((t: TicketListItem) => (
            <Stack
              key={t.id}
              direction="row"
              px={2}
              py={2}
              alignItems="center"
              onClick={() => navigate(`/settings/tickets/${t.id}`)}
              sx={{ ...ticketsRowSx, cursor: "pointer", borderBottom: "1px solid #f1f1f1" }}
            >
              <Box flex={columns[0].flex} sx={ticketsNumberCellSx}>
                {t.ticket_no?.replace("TICKET-", "TN-")}
              </Box>

              <Box flex={columns[1].flex} sx={ticketsEllipsisCellSx}>
                {t.lab_name}
              </Box>

              <Box flex={columns[2].flex} sx={ticketsEllipsisCellSx}>
                {t.subject}
              </Box>

              <Box flex={columns[3].flex} fontSize="13px">
                {dayjs(t.created_at).format("DD/MM/YYYY")}
              </Box>

              <Box flex={columns[4].flex} fontSize="13px">
                {t.due_date ? dayjs(t.due_date).format("DD/MM/YYYY") : "—"}
              </Box>

              <Box flex={columns[5].flex} fontSize="13px">
                {t.requested_by || "nil"}
              </Box>

              <Box flex={columns[6].flex} fontSize="13px">
                {t.department_name}
              </Box>

              <Box flex={columns[7].flex} display="flex" justifyContent="flex-start">
                <Chip
                  label={t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase() : ""}
                  sx={priorityChipSx(t.priority)}
                />
              </Box>


              <Box flex={columns[8].flex} display="flex" alignItems="center" gap={1}>
                <Avatar sx={ticketsAvatarSx}>
                  {t.assigned_to
                    ? employees.find(item => item.id === t.assigned_to)?.emp_name?.[0]
                    : "?"}
                </Avatar>

                <Typography sx={ticketsAssigneeTextSx}>

                  {employees.find(item => item.id === t.assigned_to)?.emp_name || "Unassigned"}
                </Typography>
              </Box>

            </Stack>

          ))
        )}
      </Box>

      {/* Pagination View */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3} px={0.5}>
        <Typography fontSize={13} color="text.secondary">
          Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + ROWS_PER_PAGE, totalEntries)} of {totalEntries} entries
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            sx={ticketsPaginationArrowSx}
          >
            ‹
          </IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              onClick={() => setPage(p)}
              sx={{
                ...paginationButtonSx(p === page),
                ...ticketsPaginationNumberOverrideSx,
              }}
            >
              {p}
            </Button>
          ))}

          <IconButton
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
            sx={{
              padding: '4px',
              fontWeight: "600",
              minWidth: '32px',
              height: '32px'
            }}
          >
            ›
          </IconButton>
        </Stack>
      </Stack>

      <CreateTicket open={openCreate} onClose={() => setOpenCreate(false)} />
      <FilterTickets
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        onApply={(appliedFilters: FilterTicketsPayload | null) => {

          if (!appliedFilters) {
            setFilters(null);
            setPage(1);
            return;
          }

          const apiFilters: TicketFilters = {
            priority: appliedFilters.priority || undefined,
            department_id: appliedFilters.department_id || undefined,
            from_date: appliedFilters.fromDate
              ? appliedFilters.fromDate.format("YYYY-MM-DD")
              : undefined,
            to_date: appliedFilters.toDate
              ? appliedFilters.toDate.format("YYYY-MM-DD")
              : undefined,
          };

          setFilters(apiFilters);
          setPage(1);
        }}
      />

    </Box>
  );
};

export default Tickets;