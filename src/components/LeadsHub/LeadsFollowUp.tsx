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

import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";

import "../../styles/Leads/leads.css";
import type { Lead, FilterValues } from "../../types/leads.types";
import { MenuButton, CallButton, Dialogs } from "./LeadsMenuDialogs";
import BulkActionBar from "./BulkActionBar";

interface Props {
  search: string;
  filters?: FilterValues;
}

const rowsPerPage = 10;

// ====================== Quality Derivation ======================
const deriveQuality = (lead: any): "Hot" | "Warm" | "Cold" => {
  const hasAssignee = Boolean(
    lead.assigned_to_id || lead.assigned_to_name
  );
  const hasNextAction = Boolean(
    lead.next_action_description &&
    lead.next_action_description.trim() !== ""
  );
  const nextActionPending = lead.next_action_status === "pending";

  if (hasAssignee && hasNextAction && nextActionPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

const LeadsFollowUp: React.FC<Props> = ({ search, filters }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // ====================== Redux State ======================
  const reduxLeads = useSelector(selectLeads);
  const loading = useSelector(selectLeadsLoading);
  const error = useSelector(selectLeadsError);

  // ====================== Local State ======================
  const [leads, setLeads] = React.useState<any[]>([]);

  // ====================== Fetch Leads on Mount ======================
  React.useEffect(() => {
    dispatch(fetchLeads() as any);
  }, [dispatch]);

  // ====================== Sync Redux leads → Local State with Full Field Mapping ======================
  React.useEffect(() => {
    if (reduxLeads && reduxLeads.length > 0) {
      const mappedLeads = reduxLeads.map((lead: any) => ({
        ...lead,
        // Core fields
        name: lead.full_name || lead.name || "",
        full_name: lead.full_name || lead.name || "",
        
        // Assignment
        assigned: lead.assigned_to_name || "Unassigned",
        assigned_to_name: lead.assigned_to_name,
        assigned_to_id: lead.assigned_to_id,
        
        // Status
        status: lead.lead_status || lead.status || "New",
        lead_status: lead.lead_status || lead.status || "New",
        
        // Quality (derived)
        quality: deriveQuality(lead),
        
        // Location & Source
        location: lead.location || lead.city || lead.state || "N/A",
        source: lead.source || "N/A",
        
        // Task fields
        task: lead.next_action_type || lead.task_type || "N/A",
        taskStatus: lead.next_action_status || lead.task_status || "Pending",
        
        // Activity
        activity: lead.last_activity || lead.activity || "View Activity",
        
        // Score
        score: lead.score || lead.ai_score || 0,
        
        // Preserve all original fields
        initials: lead.initials || (lead.full_name || lead.name || "?").charAt(0).toUpperCase(),
      }));
      
      setLeads(mappedLeads);
      console.log("✅ Follow-up leads mapped:", mappedLeads.length);
    }
  }, [reduxLeads]);

  // ====================== Filter Follow-up Leads ======================
  const filteredLeads = React.useMemo(() => {
    // Follow-up statuses that should appear in this tab
    const followUpStatuses = ["new", "lost", "cycle conversion"];
    
    return leads.filter((lead) => {
      // Must be a follow-up status
      const leadStatus = (lead.lead_status || lead.status || "").toLowerCase().trim();
      const matchesStatus = followUpStatuses.includes(leadStatus);
      
      // Must be active (not archived)
      const isActive = lead.is_active !== false;
      
      // Search filter
      const searchStr = `${lead.full_name || lead.name || ""} ${lead.id || ""}`.toLowerCase();
      const matchesSearch = searchStr.includes(search.toLowerCase());
      
      // Advanced filters
      if (filters) {
        // Department filter
        if (filters.department && lead.department_id !== Number(filters.department)) {
          return false;
        }

        // Assignee filter
        if (filters.assignee && lead.assigned_to_id !== Number(filters.assignee)) {
          return false;
        }

        // Status filter (additional refinement)
        if (filters.status) {
          const filterStatus = filters.status.toLowerCase();
          if (leadStatus !== filterStatus) {
            return false;
          }
        }

        // Quality filter
        if (filters.quality && lead.quality !== filters.quality) {
          return false;
        }

        // Source filter
        if (filters.source && lead.source !== filters.source) {
          return false;
        }

        // Date range filter
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
      }
      
      return matchesStatus && matchesSearch && isActive;
    });
  }, [leads, search, filters]);

  // ====================== Reset Pagination on Filter Change ======================
  React.useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, filters]);

  // ====================== Pagination ======================
  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);

  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [totalPages, page]);

  const currentLeads = filteredLeads.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const startEntry = totalEntries === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  // ====================== Selection Handlers ======================
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  // ====================== Bulk Actions ======================
  const handleBulkDelete = () => {
    setLeads((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
    setSelectedIds([]);
  };

  const handleBulkArchive = (archive: boolean) => {
    setLeads((prev) =>
      prev.map((l) =>
        selectedIds.includes(l.id) ? { ...l, is_active: !archive } : l
      )
    );
    setSelectedIds([]);
  };

  // ====================== Loading State ======================
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
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
          sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">No follow-ups found</Typography>
          <Typography variant="body2" color="text.secondary">
            Follow-ups will appear here when leads require attention
          </Typography>
        </Stack>
      </Box>
    );
  }

  // ====================== Empty Filtered State ======================
  if (filteredLeads.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">
            No follow-ups found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? `No results for "${search}"`
              : filters && Object.values(filters).some(v => v !== "" && v !== null)
              ? "No follow-ups match the selected filters"
              : "No active follow-ups requiring attention"}
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
              {/* Checkbox Column */}
              <TableCell padding="checkbox">
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
                    if (e.target.checked) setSelectedIds(currentLeads.map((l) => l.id));
                    else setSelectedIds([]);
                  }}
                />
              </TableCell>
              
              {/* All Columns - Same as LeadsTable */}
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
            {currentLeads.map((lead: any) => (
              <TableRow
                key={lead.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(`/leads/${encodeURIComponent(lead.id.replace(/^#/, ""))}`)
                }
              >
                {/* Checkbox */}
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected(lead.id)} onChange={() => toggleSelect(lead.id)} />
                </TableCell>

                {/* Lead Name & ID */}
                <TableCell>
                  <Stack direction="row" spacing={2}>
                    <Avatar className="lead-avatar">
                      {lead.initials || lead.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </Avatar>
                    <Box>
                      <Typography className="lead-name-text">
                        {lead.full_name || "Unnamed Lead"}
                      </Typography>
                      <Typography className="lead-id-text">{lead.id}</Typography>
                    </Box>
                  </Stack>
                </TableCell>

                {/* Date & Time */}
                <TableCell>
                  <Typography className="lead-date">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleDateString("en-GB")
                      : "N/A"}
                  </Typography>
                  <Typography className="lead-time">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </Typography>
                </TableCell>

                {/* Location */}
                <TableCell>{lead.location || "N/A"}</TableCell>

                {/* Source */}
                <TableCell>{lead.source || "N/A"}</TableCell>

                {/* Status */}
                <TableCell>
                  <Chip
                    label={lead.status}
                    size="small"
                    className={`lead-chip status-${lead.status?.toLowerCase()?.replace(/\s+/g, "-")}`}
                  />
                </TableCell>

                {/* Quality */}
                <TableCell>
                  <Chip
                    label={lead.quality}
                    size="small"
                    className={`lead-chip quality-${lead.quality?.toLowerCase()}`}
                  />
                </TableCell>

                {/* AI Score */}
                <TableCell className="score">
                  {String(lead.score || 0).includes("%")
                    ? lead.score
                    : `${lead.score || 0}%`}
                </TableCell>

                {/* Assigned */}
                <TableCell>{lead.assigned}</TableCell>

                {/* Task Type */}
                <TableCell>{lead.task || "N/A"}</TableCell>

                {/* Task Status */}
                <TableCell>
                  <Chip
                    label={lead.taskStatus || "Pending"}
                    size="small"
                    className="lead-chip"
                  />
                </TableCell>

                {/* Activity */}
                <TableCell
                  sx={{ color: "primary.main", fontWeight: 700 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/leads/activity", { state: { lead } });
                  }}
                >
                  {lead.activity || "View Activity"}
                </TableCell>

                {/* Contact Actions */}
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

                {/* Menu */}
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <MenuButton lead={lead} setLeads={setLeads} tab="active" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, px: 2 }}>
        <Typography color="text.secondary">
          Showing {startEntry} to {endEntry} of {totalEntries} Follow-Ups
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
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        tab="active"
        onDelete={handleBulkDelete}
        onArchive={handleBulkArchive}
      />

      {/* Dialogs */}
      <Dialogs />
    </>
  );
};

export default LeadsFollowUp;