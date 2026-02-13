import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputBase,
  Stack,
  Tab,
  Tabs,
  Typography,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import Filter_Leads from "../../../assets/icons/Filter_Leads.svg";
import AddIcon from "@mui/icons-material/Add";
import CreateTicket from "./CreateTicket";
import FilterTickets from "./FilterTicket";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { TicketStatus } from "../../../types/Settings.types";

import {
  ticketsSearchBoxSx,
  createTicketButtonSx,
  ticketsTabsSx,
  ticketsTableHeaderSx,
  ticketsRowSx,
  priorityChipSx,
  paginationButtonSx,
} from "../../../styles/Settings/Tickets.styles";

import { TICKETS_MOCK } from "./mockData";

const Tickets = () => {
  const [tab, setTab] = useState<TicketStatus>("New");
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
const navigate = useNavigate();

  const [filters, setFilters] = useState<{
    fromDate: Dayjs | null;
    toDate: Dayjs | null;
    priority: string;
    department: string;
  } | null>(null);

  const [page, setPage] = useState(1);

  const statusCount = (status: TicketStatus) =>
    TICKETS_MOCK.filter((t) => t.status === status).length;

  const filteredTickets = TICKETS_MOCK.filter((t) => {
    if (t.status !== tab) return false;

    if (search && !t.ticketNo.toLowerCase().includes(search.toLowerCase()))
      return false;

    if (filters) {
      const ticketDate = dayjs(t.createdDate, "DD/MM/YYYY");

      if (filters.fromDate && ticketDate.isBefore(filters.fromDate, "day"))
        return false;

      if (filters.toDate && ticketDate.isAfter(filters.toDate, "day"))
        return false;

      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.department && t.department !== filters.department)
        return false;
    }

    return true;
  });

const ROWS_PER_PAGE = 8;
const totalEntries = filteredTickets.length;
const totalPages = Math.ceil(totalEntries / ROWS_PER_PAGE);

const safePage = Math.min(page, totalPages || 1);
const startIndex = (safePage - 1) * ROWS_PER_PAGE;
const endRow = Math.min(startIndex + ROWS_PER_PAGE, totalEntries);

const paginatedTickets = filteredTickets.slice(
  startIndex,
  startIndex + ROWS_PER_PAGE
);


  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Tickets</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={ticketsSearchBoxSx}>
            <SearchIcon fontSize="small" />
            <InputBase
              placeholder="Search by Ticket no."
              sx={{ ml: 1, flex: 1 }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </Box>

          <IconButton onClick={() => setOpenFilter(true)}>
            <img src={Filter_Leads} />
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

      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setPage(1);
        }}
        TabIndicatorProps={{ style: { display: "none" } }}
        sx={ticketsTabsSx}
      >
        <Tab value="New" label={`New (${statusCount("New")})`} />
        <Tab value="Pending" label={`Pending (${statusCount("Pending")})`} />
        <Tab value="Resolved" label={`Resolved (${statusCount("Resolved")})`} />
        <Tab value="Closed" label={`Closed (${statusCount("Closed")})`} />
      </Tabs>

      {/* Table */}
      <Box sx={{ background: "#fff", borderRadius: 2 }}>
        <Stack direction="row" px={2} py={1.5} sx={ticketsTableHeaderSx}>
          {[
            "Ticket No",
            "Lab Name",
            "Subject",
            "Created Date",
            "Due Date",
            "Requested By",
            "Department",
            "Priority",
            "Assigned To",
          ].map((h) => (
            <Box key={h} flex={1}>
              {h}
            </Box>
          ))}
        </Stack>

        {paginatedTickets.map((t) => (
          <Stack
            key={t.ticketNo}
            direction="row"
            px={2}
            py={1.5}
            alignItems="center"
            onClick={() => navigate(`/settings/tickets/${t.ticketNo}`)}
            sx={{ ...ticketsRowSx, cursor: "pointer" }}
          >
<Box
  flex={1}
  color="#5a8aea"
  fontWeight="500"
  
>
  {t.ticketNo}
</Box>

            <Box flex={1}>{t.labName}</Box>
            <Box flex={1.5}>{t.subject}</Box>
            <Box flex={1}>{t.createdDate}</Box>
            <Box flex={1}>{t.dueDate}</Box>
            <Box flex={1.2}>{t.requestedBy}</Box>
            <Box flex={1}>{t.department}</Box>
            <Box flex={1}>
              <Chip label={t.priority} size="small" sx={priorityChipSx(t.priority)} />
            </Box>
            <Box flex={1} display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 28, height: 28 }}>{t.assignedTo[0]}</Avatar>
              {t.assignedTo}
            </Box>
          </Stack>
        ))}
      </Box>

      {/* Pagination */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
  <Typography fontSize={13} color="#9E9E9E">
    Showing {totalEntries === 0 ? 0 : startIndex + 1} to{" "}
    {endRow} of {totalEntries} entries
  </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="large" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ‹
          </IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} onClick={() => setPage(p)} sx={paginationButtonSx(p === page)}>
              {p}
            </Button>
          ))}

          <IconButton
            size="large"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </IconButton>
        </Stack>
      </Stack>

      <CreateTicket open={openCreate} onClose={() => setOpenCreate(false)} />
      <FilterTickets
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        onApply={(appliedFilters) => {
          setFilters(appliedFilters);
          setPage(1);
        }}
      />
    </Box>
  );
};

export default Tickets;
