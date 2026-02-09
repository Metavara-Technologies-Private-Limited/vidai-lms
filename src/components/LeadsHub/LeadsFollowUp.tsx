import * as React from "react";
import {
  Box, Checkbox, Chip, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
  Avatar, Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";

import { leadsMock } from "./leadsMock";
import "../../styles/Leads/leads.css";
import type { Lead } from "../../types/leads.types";
import { MenuButton, CallButton } from "./LeadsMenuDialogs";

interface Props {
  search: string;
}

const STORAGE_KEY = "vidai_leads_data";

const LeadsFollowUp: React.FC<Props> = ({ search }) => {
  const navigate = useNavigate();
  const rowsPerPage = 10;
  const [page, setPage] = React.useState(1);

  // FETCHING FROM YOUR ORIGINAL DATA SOURCE
  const [leads] = React.useState<Lead[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : leadsMock;
  });

  // FILTER LOGIC: Status must be "New", "Lost", or "Cycle Conversion"
  const filteredLeads = React.useMemo(() => {
    const followUpStatuses = ["new", "lost", "cycle conversion"];
    
    return leads.filter((lead) => {
      const matchesStatus = followUpStatuses.includes(lead.status.toLowerCase());
      const matchesSearch = `${lead.name} ${lead.id}`
        .toLowerCase()
        .includes(search.toLowerCase());
      
      return matchesStatus && matchesSearch && !lead.archived;
    });
  }, [leads, search]);

  // Pagination Logic
  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const currentLeads = filteredLeads.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startEntry = (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  return (
    <>
      <TableContainer component={Paper} elevation={0} className="leads-table">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" className="checkbox-cell"><Checkbox /></TableCell>
              <TableCell>Lead Name | No</TableCell>
              <TableCell>Date | Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>AI Score</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell align="center">Contact</TableCell>
              <TableCell align="center" />
            </TableRow>
          </TableHead>
          <TableBody>
            {currentLeads.map((lead) => (
              <TableRow key={lead.id} hover sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/leads/${encodeURIComponent(lead.id.replace("#", ""))}`)}>
                <TableCell padding="checkbox" className="checkbox-cell">
                  <Checkbox onClick={(e) => e.stopPropagation()} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={2}>
                    <Avatar className="lead-avatar">{lead.initials}</Avatar>
                    <Box>
                      <Typography className="lead-name-text">{lead.name}</Typography>
                      <Typography className="lead-id-text">{lead.id}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography>{lead.date}</Typography>
                  <Typography variant="caption">{lead.time}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={lead.status} size="small" 
                    className={`lead-chip status-${lead.status.toLowerCase().replace(/\s+/g, '-')}`} />
                </TableCell>
                <TableCell>
                  <Chip label={lead.quality} size="small" 
                    className={`lead-chip quality-${lead.quality.toLowerCase()}`} />
                </TableCell>
                <TableCell className="score">{lead.score}</TableCell>
                <TableCell>{lead.assigned}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center" onClick={(e) => e.stopPropagation()}>
                    <CallButton lead={lead} />
                    <IconButton className="action-btn"><ChatBubbleOutlineIcon fontSize="small" /></IconButton>
                    <IconButton className="action-btn"><EmailOutlinedIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                   {/* setLeads is omitted here since we aren't editing in this view, 
                       but you can pass a dummy function if MenuButton requires it */}
                  <MenuButton lead={lead} setLeads={() => {}} tab="active" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, px: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startEntry} to {endEntry} of {totalEntries} Follow-Ups
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Box key={p} onClick={() => setPage(p)} className={`page-number ${page === p ? "active" : ""}`}>
              {p}
            </Box>
          ))}
          <IconButton disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>
    </>
  );
};

export default LeadsFollowUp;