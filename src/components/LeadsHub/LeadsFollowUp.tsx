import * as React from "react";
import {
  Box, Checkbox, Chip, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
  Avatar, Paper, CircularProgress, Alert,
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
// FIX: removed unused `Lead` import (ESLint no-unused-vars + TS 6196)
import type { FilterValues } from "../../types/leads.types";
import { MenuButton, CallButton, Dialogs } from "./LeadsMenuDialogs";
import BulkActionBar from "./BulkActionBar";

// ====================== Types ======================
// FIX: replaced all `any` with concrete interfaces

/** Shape of a lead as it arrives from Redux (raw API response). */
interface RawFollowUpLead {
  id: string;
  full_name?: string;
  name?: string;
  contact_no?: string;
  email?: string;
  assigned_to_id?: number;
  assigned_to_name?: string;
  next_action_description?: string;
  next_action_status?: string;
  next_action_type?: string;
  task_type?: string;
  task_status?: string;
  lead_status?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  location?: string;
  city?: string;
  state?: string;
  source?: string;
  score?: number | string;
  ai_score?: number | string;
  activity?: string;
  last_activity?: string;
  initials?: string;
  department_id?: number;
}

/** Shape after mapping — all display fields guaranteed present. */
interface MappedFollowUpLead extends RawFollowUpLead {
  assigned: string;
  quality: "Hot" | "Warm" | "Cold";
  task: string;
  taskStatus: string;
}

interface Props {
  search: string;
  filters?: FilterValues;
}

const rowsPerPage = 10;

// ====================== Quality Derivation ======================
// FIX: replaced `lead: any` with `lead: RawFollowUpLead`
const deriveQuality = (lead: RawFollowUpLead): "Hot" | "Warm" | "Cold" => {
  const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
  const hasNextAction = Boolean(lead.next_action_description?.trim());
  const nextActionPending = lead.next_action_status === "pending";
  if (hasAssignee && hasNextAction && nextActionPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

// ====================== Component ======================
const LeadsFollowUp: React.FC<Props> = ({ search, filters }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const reduxLeads = useSelector(selectLeads) as RawFollowUpLead[] | null;
  const loading = useSelector(selectLeadsLoading) as boolean;
  const error = useSelector(selectLeadsError) as string | null;

  // FIX: typed state — was `any[]`
  const [leads, setLeads] = React.useState<MappedFollowUpLead[]>([]);

  // ====================== Fetch on Mount ======================
  React.useEffect(() => {
    // FIX: was `fetchLeads() as any` — use the same unknown cast pattern
    dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  // ====================== Sync Redux → Local ======================
  React.useEffect(() => {
    if (reduxLeads && reduxLeads.length > 0) {
      // FIX: was `reduxLeads.map((lead: any)` — now typed
      const mappedLeads: MappedFollowUpLead[] = reduxLeads.map(
        (lead: RawFollowUpLead): MappedFollowUpLead => ({
          ...lead,
          name: lead.full_name || lead.name || "",
          full_name: lead.full_name || lead.name || "",
          assigned: lead.assigned_to_name || "Unassigned",
          assigned_to_name: lead.assigned_to_name,
          assigned_to_id: lead.assigned_to_id,
          status: lead.lead_status || lead.status || "New",
          lead_status: lead.lead_status || lead.status || "New",
          quality: deriveQuality(lead),
          location: lead.location || lead.city || lead.state || "N/A",
          source: lead.source || "N/A",
          task: lead.next_action_type || lead.task_type || "N/A",
          taskStatus: lead.next_action_status || lead.task_status || "Pending",
          activity: lead.last_activity || lead.activity || "View Activity",
          score: lead.score || lead.ai_score || 0,
          initials:
            lead.initials ||
            (lead.full_name || lead.name || "?").charAt(0).toUpperCase(),
        }),
      );
      setLeads(mappedLeads);
      console.log("✅ Follow-up leads mapped:", mappedLeads.length);
    }
  }, [reduxLeads]);

  // ====================== Filter ======================
  const filteredLeads = React.useMemo<MappedFollowUpLead[]>(() => {
    const followUpStatuses = ["new", "lost", "cycle conversion"];

    // FIX: was `leads.filter((lead)` — implicit any; now typed via state
    return leads.filter((lead: MappedFollowUpLead) => {
      const leadStatus = (lead.lead_status || lead.status || "").toLowerCase().trim();
      const matchesStatus = followUpStatuses.includes(leadStatus);
      const isActive = lead.is_active !== false;
      const searchStr = `${lead.full_name || lead.name || ""} ${lead.id || ""}`.toLowerCase();
      const matchesSearch = searchStr.includes(search.toLowerCase());

      if (filters) {
        if (filters.department && lead.department_id !== Number(filters.department))
          return false;
        if (filters.assignee && lead.assigned_to_id !== Number(filters.assignee))
          return false;
        if (filters.status) {
          if (leadStatus !== filters.status.toLowerCase()) return false;
        }
        if (filters.quality && lead.quality !== filters.quality) return false;
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
      }

      return matchesStatus && matchesSearch && isActive;
    });
  }, [leads, search, filters]);

  // ====================== Pagination reset ======================
  React.useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, filters]);

  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [totalPages, page]);

  const currentLeads = filteredLeads.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  // ====================== Selection ======================
  const toggleSelect = (id: string) =>
    setSelectedIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id],
    );
  const isSelected = (id: string) => selectedIds.includes(id);

  // ====================== Bulk actions ======================
  const handleBulkDelete = () => {
    setLeads((prev: MappedFollowUpLead[]) =>
      prev.filter((l: MappedFollowUpLead) => !selectedIds.includes(l.id)),
    );
    setSelectedIds([]);
  };
  const handleBulkArchive = (archive: boolean) => {
    setLeads((prev: MappedFollowUpLead[]) =>
      prev.map((l: MappedFollowUpLead) =>
        selectedIds.includes(l.id) ? { ...l, is_active: !archive } : l,
      ),
    );
    setSelectedIds([]);
  };

  // ====================== Loading ======================
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading follow-ups...</Typography>
        </Stack>
      </Box>
    );

  // ====================== Error ======================
  if (error)
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load follow-ups</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
          // FIX: was `fetchLeads() as any` → same unknown cast
          onClick={() => dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0])}
        >
          Try again
        </Typography>
      </Alert>
    );

  // ====================== Empty ======================
  if (leads.length === 0)
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

  if (filteredLeads.length === 0)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">No follow-ups found</Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? `No results for "${search}"`
              : filters && Object.values(filters).some((v) => v !== "" && v !== null)
                ? "No follow-ups match the selected filters"
                : "No active follow-ups requiring attention"}
          </Typography>
        </Stack>
      </Box>
    );

  // ====================== Table ======================
  return (
    <>
      <TableContainer component={Paper} elevation={0} className="leads-table">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
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
            {/* FIX: was `currentLeads.map((lead: any)` — now typed */}
            {currentLeads.map((lead: MappedFollowUpLead) => (
              <TableRow
                key={lead.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(`/leads/${encodeURIComponent(lead.id.replace(/^#/, ""))}`)
                }
              >
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected(lead.id)} onChange={() => toggleSelect(lead.id)} />
                </TableCell>

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

                <TableCell>{lead.location || "N/A"}</TableCell>
                <TableCell>{lead.source || "N/A"}</TableCell>

                <TableCell>
                  <Chip
                    label={lead.status}
                    size="small"
                    className={`lead-chip status-${(lead.status ?? "").toLowerCase().replace(/\s+/g, "-")}`}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={lead.quality}
                    size="small"
                    className={`lead-chip quality-${lead.quality?.toLowerCase()}`}
                  />
                </TableCell>

                <TableCell className="score">
                  {String(lead.score || 0).includes("%")
                    ? lead.score
                    : `${lead.score || 0}%`}
                </TableCell>

                <TableCell>{lead.assigned}</TableCell>
                <TableCell>{lead.task || "N/A"}</TableCell>

                <TableCell>
                  {/* FIX: was `(opt: any)` — Chip takes string label, no map needed */}
                  <Chip label={lead.taskStatus || "Pending"} size="small" className="lead-chip" />
                </TableCell>

                <TableCell
                  sx={{ color: "primary.main", fontWeight: 700 }}
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

      <BulkActionBar
        selectedIds={selectedIds}
        tab="active"
        onDelete={handleBulkDelete}
        onArchive={handleBulkArchive}
      />
      <Dialogs />
    </>
  );
};

export default LeadsFollowUp;