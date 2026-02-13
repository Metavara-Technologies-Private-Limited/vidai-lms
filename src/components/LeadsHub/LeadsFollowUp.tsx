import * as React from "react";
import {
  Box, Checkbox, Chip, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
  Avatar, Paper, CircularProgress, Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

// ✅ INTEGRATION: Import Redux actions and selectors
import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";

import "../../styles/Leads/leads.css";
import type { Lead } from "../../types/leads.types";
import { MenuButton, CallButton, Dialogs } from "./LeadsMenuDialogs";

interface Props {
  search: string;
}

const LeadsFollowUp: React.FC<Props> = ({ search }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const rowsPerPage = 10;
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // ✅ INTEGRATION: Using Redux state
  const reduxLeads = useSelector(selectLeads);
  const loading = useSelector(selectLeadsLoading);
  const error = useSelector(selectLeadsError);

  // ✅ INTEGRATION: Local state for managing leads
  const [leads, setLeads] = React.useState<Lead[]>([]);

  // ✅ INTEGRATION: Fetch leads on mount
  React.useEffect(() => {
    dispatch(fetchLeads() as any);
  }, [dispatch]);

  // ✅ INTEGRATION: Sync Redux leads to local state
  React.useEffect(() => {
    if (reduxLeads && reduxLeads.length > 0) {
      const leadsWithArchived = reduxLeads.map((lead) => ({
        ...lead,
        archived: lead.archived ?? false,
      }));
      setLeads(leadsWithArchived);
    }
  }, [reduxLeads]);

  // ✅ INTEGRATION: FILTER LOGIC - Status must be "New", "Lost", or "Cycle Conversion"
  const filteredLeads = React.useMemo(() => {
    const followUpStatuses = ["new", "lost", "cycle conversion", "no status"];
    
    return leads.filter((lead) => {
      const leadStatus = (lead.status || "no status").toLowerCase().trim();
      const matchesStatus = followUpStatuses.includes(leadStatus);
      
      const searchStr = `${lead.full_name || lead.name || ""} ${lead.id || ""}`.toLowerCase();
      const matchesSearch = searchStr.includes(search.toLowerCase());
      
      return matchesStatus && matchesSearch && !lead.archived;
    });
  }, [leads, search]);

  // ====================== Reset Pagination on Filter Change ======================
  React.useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search]);

  // Pagination Logic
  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);

  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const currentLeads = filteredLeads.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  // ====================== Toggle Selection ======================
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  // ====================== Loading State ======================
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading follow-ups...</Typography>
        </Stack>
      </Box>
    );
  }

  // ====================== Error State ======================
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load follow-ups</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            color: "primary.main",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={() => dispatch(fetchLeads() as any)}
        >
          Try again
        </Typography>
      </Alert>
    );
  }

  // ====================== Empty State ======================
  if (leads.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">
            No follow-ups found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Follow-ups will appear here when leads require attention
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} elevation={0} className="leads-table">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" className="checkbox-cell">
                <Checkbox
                  indeterminate={
                    currentLeads.some((l) => selectedIds.includes(l.id)) &&
                    !currentLeads.every((l) => selectedIds.includes(l.id))
                  }
                  checked={
                    currentLeads.length > 0 &&
                    currentLeads.every((l) => selectedIds.includes(l.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(currentLeads.map((l) => l.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </TableCell>
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
              <TableRow 
                key={lead.id} 
                hover 
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/leads/${encodeURIComponent(lead.id.replace("#", ""))}`)}
              >
                <TableCell 
                  padding="checkbox" 
                  className="checkbox-cell"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox 
                    checked={isSelected(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={2}>
                    <Avatar className="lead-avatar">
                      {lead.initials || (lead.full_name || lead.name)?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography className="lead-name-text">
                        {lead.full_name || lead.name}
                      </Typography>
                      <Typography className="lead-id-text">
                        {lead.id}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography className="lead-date">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleDateString("en-GB")
                      : lead.date || "N/A"}
                  </Typography>
                  <Typography className="lead-time">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : lead.time || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={lead.status || "New"} 
                    size="small" 
                    className={`lead-chip status-${
                      (lead.status || "new")
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                    }`} 
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={lead.quality || "N/A"} 
                    size="small" 
                    className={`lead-chip quality-${
                      (lead.quality || "")?.toLowerCase() || ""
                    }`} 
                  />
                </TableCell>
                <TableCell className="score">
                  {String(lead.score || 0).includes("%")
                    ? lead.score
                    : `${lead.score || 0}%`}
                </TableCell>
                <TableCell>{lead.assigned || "Unassigned"}</TableCell>
                <TableCell align="center">
                  <Stack 
                    direction="row" 
                    spacing={1} 
                    justifyContent="center" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CallButton lead={lead} />
                    <IconButton className="action-btn">
                      <ChatBubbleOutlineIcon fontSize="small" />
                    </IconButton>
                    <IconButton className="action-btn">
                      <EmailOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <MenuButton lead={lead} setLeads={setLeads} tab="active" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ====================== Pagination ====================== */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, px: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startEntry} to {endEntry} of {totalEntries} Follow-Ups
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton 
            disabled={page === 1} 
            onClick={() => setPage((p) => p - 1)}
          >
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
            disabled={page === totalPages || totalPages === 0} 
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* ✅ INTEGRATION: Dialogs component renders CallDialog */}
      <Dialogs />
    </>
  );
};

export default LeadsFollowUp;