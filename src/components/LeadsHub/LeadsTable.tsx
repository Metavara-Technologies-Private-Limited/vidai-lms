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
  CircularProgress,
  Alert,
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
import type { Lead } from "../../types/leads.types";
import type { FilterValues } from "./FilterDialog";

import { MenuButton, CallButton, Dialogs } from "./LeadsMenuDialogs";
import BulkActionBar from "./BulkActionBar";

interface Props {
  search: string;
  tab: "active" | "archived";
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
  const nextActionPending =
    lead.next_action_status === "pending";

  if (hasAssignee && hasNextAction && nextActionPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

const LeadsTable: React.FC<Props> = ({ search, tab, filters }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================== Redux State ======================
  const leads = useSelector(selectLeads);
  const loading = useSelector(selectLeadsLoading);
  const error = useSelector(selectLeadsError);

  // ====================== Local State ======================
  const [localLeads, setLocalLeads] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // ====================== Fetch Leads ======================
  React.useEffect(() => {
    dispatch(fetchLeads() as any);
  }, [dispatch]);

  // ====================== Sync Redux leads → Local State ======================
  React.useEffect(() => {
    if (leads) {
      const leadsWithFix = leads.map((lead: any) => ({
        ...lead,
        assigned: lead.assigned_to_name || "Unassigned",
        status: lead.status || lead.lead_status || "New",
        name: lead.name || lead.full_name || "",
        quality: deriveQuality(lead),
      }));

      setLocalLeads(leadsWithFix);
    }
  }, [leads]);

  // ====================== Toggle Selection ======================
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  // ====================== Filter Leads with Search + Filters ======================
  const filteredLeads = React.useMemo(() => {
    return localLeads.filter((lead) => {
      // Search filter
      const searchStr = `${lead.name || ""} ${lead.id || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      
      // Tab filter (active vs archived)
      const matchTab = tab === "archived" 
        ? lead.is_active === false 
        : lead.is_active !== false;

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

        // Status filter
        if (filters.status) {
          const leadStatus = (lead.lead_status || lead.status || "").toLowerCase();
          if (leadStatus !== filters.status.toLowerCase()) {
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
      
      return matchSearch && matchTab;
    });
  }, [localLeads, search, tab, filters]);

  // ====================== Reset Pagination on Filter Change ======================
  React.useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, tab, filters]);

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

  // ====================== Bulk Actions ======================
  const handleBulkDelete = () => {
    setLocalLeads((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
    setSelectedIds([]);
  };

  const handleBulkArchive = (archive: boolean) => {
    setLocalLeads((prev) =>
      prev.map((l) =>
        selectedIds.includes(l.id) ? { ...l, is_active: !archive } : l
      )
    );
    setSelectedIds([]);
  };

  // ====================== Loading ======================
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading leads...</Typography>
        </Stack>
      </Box>
    );
  }

  // ====================== Error ======================
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load leads</Typography>
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

  // ====================== Empty ======================
  if (localLeads.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">No leads found</Typography>
          <Typography variant="body2" color="text.secondary">
            {tab === "archived" ? "No archived leads yet" : "Create your first lead to get started"}
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
            No {tab === "archived" ? "archived" : "active"} leads found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? `No results for "${search}"`
              : filters && Object.values(filters).some(v => v !== "" && v !== null)
              ? "No leads match the selected filters"
              : tab === "archived"
              ? "No archived leads yet"
              : "No active leads"}
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
            {currentLeads.map((lead: any) => (
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
                      {lead.initials || lead.full_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography className="lead-name-text">{lead.full_name}</Typography>
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
                    className={`lead-chip status-${lead.status?.toLowerCase()?.replace(/\s+/g, "-")}`}
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
                  <Chip
                    label={lead.taskStatus || "Pending"}
                    size="small"
                    className="lead-chip"
                  />
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
                  <MenuButton lead={lead} setLeads={setLocalLeads} tab={tab} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, px: 2 }}>
        <Typography color="text.secondary">
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
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <BulkActionBar
        selectedIds={selectedIds}
        tab={tab}
        onDelete={handleBulkDelete}
        onArchive={handleBulkArchive}
      />

      <Dialogs />
    </>
  );
};

export default LeadsTable;