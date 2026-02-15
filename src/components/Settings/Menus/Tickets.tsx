import { useState, useEffect, useMemo } from "react";
import {
  Box, Button, Chip, IconButton, InputBase, Stack, Tab, Tabs, Typography, Avatar, CircularProgress, Alert, Divider
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SearchIcon from "@mui/icons-material/Search";
import Filter_Leads from "../../../assets/icons/Filter_Leads.svg";
import AddIcon from "@mui/icons-material/Add";
import CreateTicket from "./CreateTicket";
import FilterTickets from "./FilterTicket";
import dayjs, { Dayjs } from "dayjs";

// Types & Styles
import type { TicketListItem, TicketFilters, FilterTicketsPayload } from "../../../types/tickets.types";
import {
  ticketsSearchBoxSx, createTicketButtonSx, ticketsTabsSx,
  ticketsTableHeaderSx, ticketsRowSx, priorityChipSx, paginationButtonSx,
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


        if (results[0].status === 'fulfilled') {
          setEmployees(Array.isArray(results[0].value) ? results[0].value : (results[0].value as any).results || []);
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

  // Normalize data: Ensure we are always working with an array
  const ticketsFromDb = useMemo(() => {
    if (Array.isArray(rawTickets)) return rawTickets;
    if (rawTickets && typeof rawTickets === 'object' && 'results' in rawTickets) {
      return (rawTickets as any).results as TicketListItem[];
    }
    return [] as TicketListItem[];
  }, [rawTickets]);

  // 2. Tab Count Logic (Prioritizes Dashboard API over local filtering)
  const getCount = (status: string) => {
    const key = status.toLowerCase();
    if (dashboardCounts && typeof dashboardCounts === 'object' && key in dashboardCounts) {
      return (dashboardCounts as any)[key] || 0;
    }
    // Fallback to local calculation if dashboard API hasn't loaded
    return ticketsFromDb.filter((t) => t.status?.toLowerCase() === key).length;
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

  return (
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>Tickets</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={ticketsSearchBoxSx}>
            <SearchIcon fontSize="small" />
            <InputBase
              placeholder="Search by Ticket no."
              sx={{ ml: 1, flex: 1 }}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </Box>
          <IconButton onClick={() => setOpenFilter(true)}>
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

      {/* Status Tabs Section */}
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

      {/* Table Section */}
      <Box sx={{ background: "#fff", borderRadius: 2, overflowX: "auto", boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" }}>
        <Stack direction="row" px={2} py={2} sx={ticketsTableHeaderSx}>
          {["Ticket No", "Lab Name", "Subject", "Created Date", "Due Date", "Requested By", "Department", "Priority", "Assigned To"].map((h) => (
            <Box key={h} flex={h === "Subject" ? 1.5 : 1} fontWeight={600} fontSize="0.85rem" color="text.secondary">
              {h}
            </Box>
          ))}
        </Stack>

        <Divider />

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
              sx={{ ...ticketsRowSx, cursor: "pointer", borderBottom: '1px solid #f9f9f9' }}
            >
              <Box flex={1} color="#5a8aea" fontWeight="600" fontSize="0.9rem">{t.ticket_no}</Box>
              <Box flex={1} fontSize="0.9rem">{t.lab_name}</Box>
              <Box flex={1.5} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pr: 2 }}>
                {t.subject}
              </Box>
              <Box flex={1} fontSize="0.85rem">{dayjs(t.created_at).format("DD/MM/YYYY")}</Box>
              <Box flex={1} fontSize="0.85rem">{t.due_date ? dayjs(t.due_date).format("DD/MM/YYYY") : "—"}</Box>
              <Box flex={1} fontSize="0.9rem">{t.requested_by}</Box>
              <Box flex={1} fontSize="0.9rem">{t.department_name}</Box>
              <Box flex={1}>
                <Chip label={t.priority} size="small" sx={priorityChipSx(t.priority)} />
              </Box>
              <Box flex={1} display="flex" alignItems="center" gap={1.5}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#5a8aea' }}>
                  {t.assigned_to ? employees.find(item => item.id === t.assigned_to)?.emp_name[0] : "?"}
                </Avatar>
                <Typography variant="body2" fontWeight={500}>
                  {employees.find(item => item.id === t.assigned_to)?.emp_name || "Unassigned"}
                </Typography>
              </Box>
            </Stack>
          ))
        )}
      </Box>

      {/* Pagination View */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3} px={1}>
        <Typography fontSize={13} color="text.secondary">
          Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + ROWS_PER_PAGE, totalEntries)} of {totalEntries} entries
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton disabled={page === 1} onClick={() => setPage((p) => p - 1)} sx={{ border: '1px solid #E0E0E0' }}>‹</IconButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              onClick={() => setPage(p)}
              sx={paginationButtonSx(p === page)}
            >
              {p}
            </Button>
          ))}
          <IconButton
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
            sx={{ border: '1px solid #E0E0E0' }}
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