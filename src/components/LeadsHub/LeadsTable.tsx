import * as React from "react";
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { leadsMock } from "./leadsMock";
import "../../styles/Leads/leads.css";
import type { Lead } from "../../types/leads.types";

import { MenuButton, CallButton, Dialogs } from "./LeadsMenuDialogs";

interface Props {
  search: string;
  tab: "active" | "archived";
}

const STORAGE_KEY = "vidai_leads_data";

const LeadsTable: React.FC<Props> = ({ search, tab }) => {
  const navigate = useNavigate();
  const rowsPerPage = 10;

  const [leads, setLeads] = React.useState<Lead[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    const initial = leadsMock.map((l) => ({
      ...l,
      archived: l.archived ?? false,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  const [page, setPage] = React.useState(1);
  const [filteredLeads, setFilteredLeads] = React.useState<Lead[]>([]);

  React.useEffect(() => {
    const result = leads.filter((lead) => {
      const matchSearch = `${lead.name} ${lead.id}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchTab = tab === "archived" ? lead.archived : !lead.archived;
      return matchSearch && matchTab;
    });
    setFilteredLeads(result);
    setPage(1);
  }, [search, leads, tab]);

  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const currentLeads = filteredLeads.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const startEntry = (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  return (
    <>
      <TableContainer component={Paper} elevation={0} className="leads-table">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"><Checkbox /></TableCell>
              <TableCell>Lead Name | No</TableCell>
              <TableCell>Date | Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>AI Score</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell>Task Type</TableCell>
              <TableCell>Task Status</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell align="center">Contact</TableCell>
              <TableCell align="center" />
            </TableRow>
          </TableHead>

          <TableBody>
            {currentLeads.map((lead) => (
              <TableRow
                key={lead.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(`/leads/${encodeURIComponent(lead.id.replace("#", ""))}`)
                }
              >
                <TableCell padding="checkbox"><Checkbox /></TableCell>

                <TableCell>
                  <Stack direction="row" spacing={2}>
                    <Avatar className="lead-avatar">{lead.initials}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{lead.name}</Typography>
                      <Typography variant="caption">{lead.id}</Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography>{lead.date}</Typography>
                  <Typography variant="caption">{lead.time}</Typography>
                </TableCell>

                <TableCell>{lead.location}</TableCell>
                <TableCell>{lead.source}</TableCell>

                <TableCell>
                  <Chip
                    label={lead.status}
                    size="small"
                    className={`status-${lead.status.toLowerCase().replace(" ", "-")}`}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={lead.quality}
                    size="small"
                    className={`quality-${lead.quality.toLowerCase()}`}
                  />
                </TableCell>

                <TableCell>{lead.score}</TableCell>
                <TableCell>{lead.assigned}</TableCell>
                <TableCell>{lead.task}</TableCell>

                <TableCell>
                  <Chip label={lead.taskStatus || "Pending"} size="small" />
                </TableCell>

                <TableCell
                  sx={{ cursor: "pointer", color: "primary.main" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/leads/activity", { state: { lead } });
                  }}
                >
                  {lead.activity || "View Activity"}
                </TableCell>

                <TableCell align="center">
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CallButton lead={lead} />
                    <IconButton><ChatBubbleOutlineIcon fontSize="small" /></IconButton>
                    <IconButton><EmailOutlinedIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>

                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <MenuButton lead={lead} setLeads={setLeads} tab={tab} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
        <Typography>
          Showing {startEntry} to {endEntry} of {totalEntries}
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeftIcon />
          </IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Box
              key={p}
              onClick={() => setPage(p)}
              className={`page-number ${page === p ? "active" : ""}`}
            >
              {p}
            </Box>
          ))}

          <IconButton
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Dialogs />
    </>
  );
};

export default LeadsTable;
