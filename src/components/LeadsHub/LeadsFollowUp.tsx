import * as React from "react";
import {
  Box, Checkbox, Chip, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
  Avatar, Paper, CircularProgress, Alert, Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { toast } from "react-toastify";

import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";

import "../../styles/Leads/leads.css";
import type { FilterValues } from "../../types/leads.types";
import { MenuButton, Dialogs } from "./LeadsMenuDialogs";
import { formatLeadId } from "./LeadDetailHelpers";
import BulkActionBar from "./BulkActionBar";
import { TwilioAPI } from "../../services/leads.api";
import { SMSDialog } from "./SmsDialogs";
import { EmailDialog } from "./EmailDialogs";
import CallDialog from "./CallDialog";
import type { ProcessedLead } from "./LeadsTable.types";
import {
  extractErrorMessage,
  hasUsablePhone,
  normalizePhone,
} from "./LeadsTable.helpers";

// ── App-type config (same import as LeadsTable) ───────────────────────────────
import { IS_CONTRACTS_APP } from "../../config/appType";

// ====================== Types ======================

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

interface MappedFollowUpLead extends RawFollowUpLead {
  assigned: string;
  quality: "Hot" | "Warm" | "Cold";
  task: string;
  taskType: string;
  taskStatus: string;
  displayId: string;
}

interface Props {
  search: string;
  filters?: FilterValues;
  canEditLeads?: boolean;
}

const rowsPerPage = 10;

// ====================== Helpers ======================

const deriveQuality = (lead: RawFollowUpLead): "Hot" | "Warm" | "Cold" => {
  const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
  const hasNextAction = Boolean(lead.next_action_description?.trim());
  const nextActionPending = lead.next_action_status === "pending";
  if (hasAssignee && hasNextAction && nextActionPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

const toastOptions = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "colored" as const,
};

// ====================== Component ======================
const LeadsFollowUp: React.FC<Props> = ({
  search,
  filters,
  canEditLeads = true,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // ── Dialog state — same types as LeadsTable ───────────────────────────────
  const [callLead, setCallLead] = React.useState<MappedFollowUpLead | null>(null);
  const [smsLead, setSmsLead] = React.useState<ProcessedLead | null>(null);
  const [emailLead, setEmailLead] = React.useState<ProcessedLead | null>(null);

  const reduxLeads = useSelector(selectLeads) as RawFollowUpLead[] | null;
  const loading = useSelector(selectLeadsLoading) as boolean;
  const error = useSelector(selectLeadsError) as string | null;

  const [leads, setLeads] = React.useState<MappedFollowUpLead[]>([]);

  React.useEffect(() => {
    dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  React.useEffect(() => {
    if (reduxLeads && reduxLeads.length > 0) {
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
          taskType: lead.next_action_type || lead.task_type || "",
          taskStatus: lead.next_action_status || lead.task_status || "Pending",
          activity: lead.last_activity || lead.activity || "View Activity",
          score: lead.score || lead.ai_score || 0,
          initials:
            lead.initials ||
            (lead.full_name || lead.name || "?").charAt(0).toUpperCase(),
          displayId: formatLeadId(lead.id),
        }),
      );
      setLeads(mappedLeads);
    }
  }, [reduxLeads]);

  // ====================== Filter ======================
  const filteredLeads = React.useMemo<MappedFollowUpLead[]>(() => {
    const followUpStatuses = ["new", "lost", "cycle conversion"];
    return leads.filter((lead: MappedFollowUpLead) => {
      const leadStatus = (lead.lead_status || lead.status || "").toLowerCase().trim();
      const matchesStatus = followUpStatuses.includes(leadStatus);
      const isActive = lead.is_active !== false;
      const searchStr = `${lead.full_name || lead.name || ""} ${lead.displayId || lead.id || ""}`.toLowerCase();
      const matchesSearch = searchStr.includes(search.toLowerCase());

      if (filters) {
        if (filters.department && lead.department_id !== Number(filters.department)) return false;
        if (filters.assignee && lead.assigned_to_id !== Number(filters.assignee)) return false;
        if (filters.status) { if (leadStatus !== filters.status.toLowerCase()) return false; }
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

  React.useEffect(() => { setPage(1); setSelectedIds([]); }, [search, filters]);

  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [totalPages, page]);

  const currentLeads = filteredLeads.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const isSelected = (id: string) => selectedIds.includes(id);

  const handleBulkDelete = () => {
    setLeads((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
    setSelectedIds([]);
  };
  const handleBulkArchive = (archive: boolean) => {
    setLeads((prev) => prev.map((l) => selectedIds.includes(l.id) ? { ...l, is_active: !archive } : l));
    setSelectedIds([]);
  };

  // ── Contact handlers — exactly mirroring LeadsTable ───────────────────────
  const handleCallOpen = async (e: React.MouseEvent, lead: MappedFollowUpLead) => {
    e.stopPropagation();
    const phone = normalizePhone(lead.contact_no);
    if (!phone) {
      toast.error("No contact number for this lead.", toastOptions);
      return;
    }
    if (!lead.id) {
      toast.error("Lead ID is missing. Cannot initiate call.", toastOptions);
      return;
    }
    setCallLead(lead);
    try {
      await TwilioAPI.makeCall({ lead_uuid: lead.id, to: phone });
    } catch (err: unknown) {
      setCallLead(null);
      toast.error(extractErrorMessage(err, "Failed to initiate call."), toastOptions);
    }
  };

  const handleSMSOpen = (e: React.MouseEvent, lead: MappedFollowUpLead) => {
    e.stopPropagation();
    setSmsLead(lead as unknown as ProcessedLead);
  };

  const handleEmailOpen = (e: React.MouseEvent, lead: MappedFollowUpLead) => {
    e.stopPropagation();
    setEmailLead(lead as unknown as ProcessedLead);
  };

  // ── Loading / Error / Empty states ────────────────────────────────────────
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading follow-ups...</Typography>
        </Stack>
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load follow-ups</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0])}
        >
          Try again
        </Typography>
      </Alert>
    );

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
              {/* AI Score — hidden for contracts app, same as LeadsTable */}
              {!IS_CONTRACTS_APP && <TableCell>AI Score</TableCell>}
              <TableCell>Assigned</TableCell>
              <TableCell>Task Type</TableCell>
              <TableCell>Task Status</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell align="center">Contact</TableCell>
              <TableCell align="center" />
            </TableRow>
          </TableHead>

          <TableBody>
            {currentLeads.map((lead: MappedFollowUpLead) => {
              const hasPhone = hasUsablePhone(lead.contact_no);
              return (
                <TableRow
                  key={lead.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  className={isSelected(lead.id) ? "row-selected" : ""}
                  onClick={() =>
                    navigate(`/leads/${encodeURIComponent(lead.id.replace(/^#/, ""))}`)
                  }
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected(lead.id)} onChange={() => toggleSelect(lead.id)} />
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar className="lead-avatar">
                        {lead.initials || lead.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </Avatar>
                      <Box>
                        <Typography className="lead-name-text">
                          {lead.full_name || "Unnamed Lead"}
                        </Typography>
                        <Typography className="lead-id-text">{lead.displayId}</Typography>
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

                  {/* AI Score — hidden for contracts app, same as LeadsTable */}
                  {!IS_CONTRACTS_APP && (
                    <TableCell className="score">
                      {String(lead.score || 0).includes("%")
                        ? lead.score
                        : `${lead.score || 0}%`}
                    </TableCell>
                  )}

                  <TableCell>{lead.assigned}</TableCell>
                  <TableCell>{lead.task || "N/A"}</TableCell>

                  <TableCell>
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

                  {/* ── Contact actions — same structure as LeadsTable ── */}
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title={hasPhone ? `Call ${lead.contact_no || "N/A"}` : "No contact number"}>
                        <span>
                          <IconButton
                            className="action-btn"
                            size="small"
                            disabled={!hasPhone}
                            onClick={(e) => { void handleCallOpen(e, lead); }}
                          >
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={hasPhone ? `SMS ${lead.contact_no || "N/A"}` : "No contact number"}>
                        <span>
                          <IconButton
                            className="action-btn"
                            size="small"
                            disabled={!hasPhone}
                            onClick={(e) => handleSMSOpen(e, lead)}
                          >
                            <ChatBubbleOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={lead.email ? `Email ${lead.email}` : "No email"}>
                        <span>
                          <IconButton
                            className="action-btn"
                            size="small"
                            disabled={!lead.email}
                            onClick={(e) => handleEmailOpen(e, lead)}
                          >
                            <EmailOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>

                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <MenuButton
                      lead={lead}
                      setLeads={setLeads}
                      tab="active"
                      canEditLeads={canEditLeads}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, px: 2 }}>
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

      {/*
        ── Dialogs — prop signatures match LeadsTable exactly:
           CallDialog : open, name, onClose         (NO lead prop)
           SMSDialog  : open, lead, onClose          (lead is ProcessedLead | null)
           EmailDialog: open, lead, onClose          (lead is ProcessedLead | null)
      */}
      <CallDialog
        open={Boolean(callLead)}
        name={callLead?.full_name || callLead?.name || "Unknown"}
        onClose={() => setCallLead(null)}
      />
      <SMSDialog
        open={Boolean(smsLead)}
        lead={smsLead}
        onClose={() => setSmsLead(null)}
      />
      <EmailDialog
        open={Boolean(emailLead)}
        lead={emailLead}
        onClose={() => setEmailLead(null)}
      />
    </>
  );
};

export default LeadsFollowUp;