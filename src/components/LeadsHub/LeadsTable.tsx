import * as React from "react";
import {
  Box, Checkbox, Chip, IconButton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Avatar, Paper,
  CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import {
  fetchLeads,
  selectLeads, selectLeadsLoading, selectLeadsError,
} from "../../store/leadSlice";
import "../../styles/Leads/leads.css";
import type { FilterValues } from "../../types/leads.types";
import { MenuButton, Dialogs } from "./LeadsMenuDialogs";
import BulkActionBar from "./BulkActionBar";
import { TwilioAPI } from "../../services/leads.api";

// ====================== Types ======================
interface RawLead {
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
  nextActionType?: string;
  taskType?: string;
  action_type?: string;
  status?: string;
  lead_status?: string;
  is_active?: boolean;
  created_at?: string;
  location?: string;
  source?: string;
  score?: number | string;
  activity?: string;
  initials?: string;
  department_id?: number;
}

interface ProcessedLead extends RawLead {
  assigned: string;
  quality: "Hot" | "Warm" | "Cold";
  displayId: string;
  taskType: string;
  taskStatus: string;
}

interface Props {
  search: string;
  tab: "active" | "archived";
  filters?: FilterValues;
}

const rowsPerPage = 10;

// ====================== Sticky column styles ======================
const stickyContactStyle = {
  position: "sticky" as const, right: 48, zIndex: 2, bgcolor: "#FFFFFF",
};
const stickyMenuStyle = {
  position: "sticky" as const, right: 0, zIndex: 2, bgcolor: "#FFFFFF",
};
const stickyHeaderContactStyle = {
  position: "sticky" as const, right: 48, zIndex: 3, bgcolor: "#F8FAFC",
};
const stickyHeaderMenuStyle = {
  position: "sticky" as const, right: 0, zIndex: 3, bgcolor: "#F8FAFC",
};

// ====================== Phone normalizer ======================
const normalizePhone = (phone: string | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return `+${cleaned}`;
};

// ====================== Helpers ======================
const deriveQuality = (lead: RawLead): "Hot" | "Warm" | "Cold" => {
  const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
  const hasNextAction = Boolean(lead.next_action_description?.trim());
  const nextActionPending = lead.next_action_status === "pending";
  if (hasAssignee && hasNextAction && nextActionPending) return "Hot";
  if (hasAssignee || hasNextAction) return "Warm";
  return "Cold";
};

const formatLeadId = (id: string): string => {
  if (id.match(/^#?LN-\d+$/i)) return id.startsWith("#") ? id : `#${id}`;
  const lnMatch = id.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = id.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#LN-${(hash % 900) + 100}`;
};

const formatStatus = (status: string): string => {
  if (!status) return "New";
  const lower = status.toLowerCase().trim();
  const map: Record<string, string> = {
    new: "New", contacted: "Contacted", converted: "Converted",
    "follow up": "Follow Up", "follow-up": "Follow Up", "follow-ups": "Follow Up",
    follow_up: "Follow Up", appointment: "Appointment", lost: "Lost",
    "cycle conversion": "Cycle Conversion", cycle_conversion: "Cycle Conversion",
  };
  return map[lower] ?? (lower.charAt(0).toUpperCase() + lower.slice(1));
};

const getStatusChipSx = (status: string) => {
  const lower = (status || "").toLowerCase();
  const map: Record<string, { bg: string; color: string }> = {
    converted:          { bg: "rgba(22,163,74,0.10)",   color: "#16A34A" },
    appointment:        { bg: "rgba(16,185,129,0.10)",  color: "#10B981" },
    "follow up":        { bg: "rgba(245,158,11,0.10)",  color: "#F59E0B" },
    new:                { bg: "rgba(59,130,246,0.10)",  color: "#3B82F6" },
    contacted:          { bg: "rgba(99,102,241,0.10)",  color: "#6366F1" },
    lost:               { bg: "rgba(239,68,68,0.10)",   color: "#EF4444" },
    "cycle conversion": { bg: "rgba(139,92,246,0.10)",  color: "#8B5CF6" },
  };
  const s = map[lower] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
  return {
    borderRadius: "999px", fontWeight: 500, fontSize: "11px", height: 22,
    border: "1.5px solid", borderColor: s.color, backgroundColor: s.bg, color: s.color,
    "& .MuiChip-label": { px: 1 },
  };
};

const getTaskStatusChipSx = (status: string) => {
  const lower = (status || "").toLowerCase();
  if (lower === "done" || lower === "completed")
    return { borderRadius: "6px", fontWeight: 700, fontSize: "11px", height: 26, border: "2px solid #10B981", backgroundColor: "transparent", color: "#10B981", "& .MuiChip-label": { px: 1.5 } };
  if (lower === "to do" || lower === "todo" || lower === "pending")
    return { borderRadius: "6px", fontWeight: 700, fontSize: "11px", height: 26, border: "2px solid #3B82F6", backgroundColor: "transparent", color: "#3B82F6", "& .MuiChip-label": { px: 1.5 } };
  if (lower === "overdue")
    return { borderRadius: "6px", fontWeight: 700, fontSize: "11px", height: 26, border: "2px solid #EF4444", backgroundColor: "transparent", color: "#EF4444", "& .MuiChip-label": { px: 1.5 } };
  return { borderRadius: "6px", fontWeight: 600, fontSize: "11px", height: 26, border: "2px solid #94A3B8", backgroundColor: "transparent", color: "#64748B", "& .MuiChip-label": { px: 1.5 } };
};

const formatTaskStatus = (nextActionStatus: string | null | undefined, taskType: string | null | undefined): string => {
  if (taskType === "Book Appointment") return "Done";
  const s = (nextActionStatus || "").toLowerCase();
  if (s === "completed") return "Done";
  if (s === "pending") return "To Do";
  return "";
};

const VALID_TASK_TYPES = ["Follow Up","Call Patient","Book Appointment","Send Message","Send Email","Review Details","No Action"];

const formatTaskType = (raw: string | null | undefined): string => {
  if (!raw || raw.trim() === "") return "";
  const trimmed = raw.trim();
  if (VALID_TASK_TYPES.includes(trimmed)) return trimmed;
  const found = VALID_TASK_TYPES.find((p) => p.toLowerCase() === trimmed.toLowerCase());
  return found ?? trimmed;
};

// ====================== SMS Dialog ======================
interface SMSDialogProps {
  open: boolean;
  lead: ProcessedLead | null;
  onClose: () => void;
}

const SMSDialog: React.FC<SMSDialogProps> = ({ open, lead, onClose }) => {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleClose = () => {
    if (sending) return;
    setMessage("");
    setError(null);
    onClose();
  };

  const handleSend = async () => {
    if (!message.trim()) { setError("Message cannot be empty."); return; }
    const phone = normalizePhone(lead?.contact_no);
    if (!phone) { setError("This lead has no contact number."); return; }
    setSending(true);
    setError(null);
    try {
      await TwilioAPI.sendSMS({ to: phone, message: message.trim() });
      setSuccess(true);
      setMessage("");
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send SMS. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem", pb: 1 }}>Send SMS</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Box sx={{ backgroundColor: "#F8FAFC", borderRadius: "10px", px: 2, py: 1.5, border: "1px solid #E2E8F0" }}>
              <Typography variant="body2" color="text.secondary" fontSize="12px">Sending to</Typography>
              <Typography fontWeight={600} fontSize="14px">{lead?.full_name || lead?.name || "Unknown"}</Typography>
              <Typography color="text.secondary" fontSize="13px">{lead?.contact_no || "No number"}</Typography>
            </Box>
            <TextField
              label="Message" multiline rows={4} value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending} placeholder="Type your message here..."
              inputProps={{ maxLength: 1600 }} helperText={`${message.length}/1600`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
            {error && <Alert severity="error" sx={{ borderRadius: "8px" }}>{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth onClick={handleClose} disabled={sending}
            sx={{ height: 44, backgroundColor: "#F3F4F6", color: "black", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#E5E7EB" } }}>
            Cancel
          </Button>
          <Button fullWidth onClick={handleSend} disabled={sending || !message.trim()}
            startIcon={sending ? <CircularProgress size={16} sx={{ color: "white" }} /> : null}
            sx={{ height: 44, backgroundColor: "#1F2937", color: "white", fontWeight: 500, textTransform: "none", borderRadius: "8px", "&:hover": { backgroundColor: "#111827" }, "&:disabled": { backgroundColor: "#9CA3AF", color: "white" } }}>
            {sending ? "Sending..." : "Send SMS"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ borderRadius: "10px" }}>
          SMS sent to {lead?.full_name || lead?.name}!
        </Alert>
      </Snackbar>
    </>
  );
};

// ====================== Main Component ======================
const LeadsTable: React.FC<Props> = ({ search, tab, filters }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const leads = useSelector(selectLeads) as RawLead[] | null;
  const loading = useSelector(selectLeadsLoading) as boolean;
  const error = useSelector(selectLeadsError) as string | null;

  const [localLeads, setLocalLeads] = React.useState<ProcessedLead[]>([]);
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // ── Call state ──────────────────────────────────────────────────────
  const [callingId, setCallingId] = React.useState<string | null>(null);
  const [callSnackbar, setCallSnackbar] = React.useState<{
    open: boolean; message: string; severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // ── SMS state ───────────────────────────────────────────────────────
  const [smsLead, setSmsLead] = React.useState<ProcessedLead | null>(null);

  React.useEffect(() => {
    dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  React.useEffect(() => {
    if (leads) {
      setLocalLeads(
        leads.map((lead: RawLead): ProcessedLead => {
          const rawTaskType = lead.next_action_type || lead.task_type || lead.nextActionType || lead.taskType || lead.action_type || "";
          const taskType = formatTaskType(rawTaskType);
          const taskStatus = formatTaskStatus(lead.next_action_status, taskType);
          return {
            ...lead,
            assigned: lead.assigned_to_name || "Unassigned",
            status: formatStatus(lead.status || lead.lead_status || "New"),
            name: lead.full_name || lead.name || "",
            quality: deriveQuality(lead),
            displayId: formatLeadId(lead.id),
            taskType,
            taskStatus,
          };
        })
      );
    }
  }, [leads]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const isSelected = (id: string) => selectedIds.includes(id);

  // ── Call ────────────────────────────────────────────────────────────
  const handleCall = async (e: React.MouseEvent, lead: ProcessedLead) => {
    e.stopPropagation();
    const phone = normalizePhone(lead.contact_no);
    if (!phone) {
      setCallSnackbar({ open: true, message: "No contact number for this lead.", severity: "error" });
      return;
    }
    setCallingId(lead.id);
    try {
      await TwilioAPI.makeCall({ to: phone });
      setCallSnackbar({
        open: true,
        message: `📞 Call initiated to ${lead.full_name || lead.name} (${phone})`,
        severity: "success",
      });
    } catch (err: any) {
      setCallSnackbar({
        open: true,
        message: err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to initiate call.",
        severity: "error",
      });
    } finally {
      setCallingId(null);
    }
  };

  // ── SMS ─────────────────────────────────────────────────────────────
  const handleSMSOpen = (e: React.MouseEvent, lead: ProcessedLead) => {
    e.stopPropagation();
    setSmsLead(lead);
  };

  const filteredLeads = React.useMemo(() => {
    return localLeads.filter((lead: ProcessedLead) => {
      const searchStr = `${lead.name || ""} ${lead.displayId || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      const matchTab = tab === "archived" ? lead.is_active === false : lead.is_active !== false;
      if (filters) {
        if (filters.department && lead.department_id !== Number(filters.department)) return false;
        if (filters.assignee && lead.assigned_to_id !== Number(filters.assignee)) return false;
        if (filters.status) {
          const ls = (lead.lead_status || lead.status || "").toLowerCase();
          if (ls !== filters.status.toLowerCase()) return false;
        }
        if (filters.quality && lead.quality !== filters.quality) return false;
        if (filters.source && lead.source !== filters.source) return false;
        if (filters.dateFrom || filters.dateTo) {
          const leadDate = lead.created_at ? new Date(lead.created_at) : null;
          if (!leadDate) return false;
          if (filters.dateFrom) { const f = new Date(filters.dateFrom); f.setHours(0,0,0,0); if (leadDate < f) return false; }
          if (filters.dateTo)   { const t = new Date(filters.dateTo);   t.setHours(23,59,59,999); if (leadDate > t) return false; }
        }
      }
      return matchSearch && matchTab;
    });
  }, [localLeads, search, tab, filters]);

  React.useEffect(() => { setPage(1); setSelectedIds([]); }, [search, tab, filters]);

  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  React.useEffect(() => { if (page > totalPages && totalPages > 0) setPage(totalPages); }, [totalPages, page]);

  const currentLeads = filteredLeads.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  const handleBulkDelete  = () => { setLocalLeads((p) => p.filter((l) => !selectedIds.includes(l.id))); setSelectedIds([]); };
  const handleBulkArchive = (archive: boolean) => { setLocalLeads((p) => p.map((l) => selectedIds.includes(l.id) ? { ...l, is_active: !archive } : l)); setSelectedIds([]); };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}><CircularProgress /><Typography color="text.secondary">Loading leads...</Typography></Stack>
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load leads</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0])}>Try again</Typography>
      </Alert>
    );

  if (localLeads.length === 0)
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

  if (filteredLeads.length === 0)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">
            No {tab === "archived" ? "archived" : "active"} leads found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? `No results for "${search}"`
              : filters && Object.values(filters).some((v) => v !== "" && v !== null)
              ? "No leads match the selected filters"
              : tab === "archived" ? "No archived leads yet" : "No active leads"}
          </Typography>
        </Stack>
      </Box>
    );

  return (
    <>
      <TableContainer component={Paper} elevation={0} className="leads-table" sx={{ overflowX: "auto" }}>
        <Table stickyHeader sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" className="checkbox-cell">
                <Checkbox
                  indeterminate={currentLeads.some((l) => selectedIds.includes(l.id)) && !currentLeads.every((l) => selectedIds.includes(l.id))}
                  checked={currentLeads.length > 0 && currentLeads.every((l) => selectedIds.includes(l.id))}
                  onChange={(e) => { if (e.target.checked) setSelectedIds(currentLeads.map((l) => l.id)); else setSelectedIds([]); }}
                />
              </TableCell>
              <TableCell>Lead Name | No</TableCell>
              <TableCell>Date | Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Lead Status</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>AI Score</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Task Type</TableCell>
              <TableCell>Task Status</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell align="center" sx={stickyHeaderContactStyle}>Contact Option</TableCell>
              <TableCell align="center" sx={stickyHeaderMenuStyle} />
            </TableRow>
          </TableHead>

          <TableBody>
            {currentLeads.map((lead: ProcessedLead) => (
              <TableRow
                key={lead.id}
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/leads/${encodeURIComponent(lead.id.replace(/^#/, ""))}`)}
                className={isSelected(lead.id) ? "row-selected" : ""}
              >
                <TableCell padding="checkbox" className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected(lead.id)} onChange={() => toggleSelect(lead.id)} />
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar className="lead-avatar">{lead.initials || lead.full_name?.charAt(0)?.toUpperCase()}</Avatar>
                    <Box>
                      <Typography className="lead-name-text">{lead.full_name}</Typography>
                      <Typography className="lead-id-text">{lead.displayId}</Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography className="lead-date">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-GB") : "N/A"}
                  </Typography>
                  <Typography className="lead-time">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                      : "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>{lead.location || "N/A"}</TableCell>
                <TableCell>{lead.source || "N/A"}</TableCell>

                <TableCell>
                  <Chip label={lead.status} size="small" sx={getStatusChipSx(lead.status ?? "")} />
                </TableCell>

                <TableCell>
                  <Chip label={lead.quality} size="small" className={`lead-chip quality-${lead.quality?.toLowerCase()}`} />
                </TableCell>

                <TableCell className="score">
                  {String(lead.score || 0).includes("%") ? lead.score : `${lead.score || 0}%`}
                </TableCell>

                <TableCell>{lead.assigned}</TableCell>

                <TableCell>
                  <Typography sx={{ fontSize: "13px", color: lead.taskType ? "#1E293B" : "#94A3B8", fontWeight: lead.taskType ? 500 : 400 }}>
                    {lead.taskType || "—"}
                  </Typography>
                </TableCell>

                <TableCell>
                  {lead.taskStatus
                    ? <Chip label={lead.taskStatus} size="small" sx={getTaskStatusChipSx(lead.taskStatus)} />
                    : <Typography sx={{ fontSize: "13px", color: "#94A3B8" }}>—</Typography>}
                </TableCell>

                <TableCell
                  sx={{ color: "primary.main", fontWeight: 700 }}
                  onClick={(e) => { e.stopPropagation(); navigate("/leads/activity", { state: { lead } }); }}
                >
                  {lead.activity || "View Activity"}
                </TableCell>

                {/* ====================================================
                    CONTACT OPTION COLUMN
                    📞 Call  → POST /twilio/make-call/
                    💬 SMS   → dialog → POST /twilio/send-sms/
                    ✉️ Email → mailto: link
                ===================================================== */}
                <TableCell align="center" sx={stickyContactStyle} onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={1} justifyContent="center">

                    {/* 📞 CALL */}
                    <Tooltip title={`Call ${lead.contact_no || "N/A"}`}>
                      <span>
                        <IconButton
                          className="action-btn"
                          size="small"
                          disabled={callingId === lead.id}
                          onClick={(e) => handleCall(e, lead)}
                        >
                          {callingId === lead.id
                            ? <CircularProgress size={16} />
                            : <PhoneIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>

                    {/* 💬 SMS */}
                    <Tooltip title={`SMS ${lead.contact_no || "N/A"}`}>
                      <IconButton
                        className="action-btn"
                        size="small"
                        onClick={(e) => handleSMSOpen(e, lead)}
                      >
                        <ChatBubbleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* ✉️ EMAIL */}
                    <Tooltip title={lead.email ? `Email ${lead.email}` : "No email"}>
                      <span>
                        <IconButton
                          className="action-btn"
                          size="small"
                          disabled={!lead.email}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (lead.email) window.location.href = `mailto:${lead.email}`;
                          }}
                        >
                          <EmailOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                  </Stack>
                </TableCell>

                {/* 3-dot menu — completely untouched */}
                <TableCell align="center" sx={stickyMenuStyle} onClick={(e) => e.stopPropagation()}>
                  <MenuButton lead={lead} setLeads={setLocalLeads} tab={tab} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, px: 2 }}>
        <Typography color="text.secondary">Showing {startEntry} to {endEntry} of {totalEntries}</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeftIcon /></IconButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Box key={p} onClick={() => setPage(p)} className={`page-number ${page === p ? "active" : ""}`}>{p}</Box>
          ))}
          <IconButton disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => p + 1)}><ChevronRightIcon /></IconButton>
        </Stack>
      </Stack>

      <BulkActionBar selectedIds={selectedIds} tab={tab} onDelete={handleBulkDelete} onArchive={handleBulkArchive} />
      <Dialogs />

      {/* SMS Dialog — one instance shared across all rows */}
      <SMSDialog open={Boolean(smsLead)} lead={smsLead} onClose={() => setSmsLead(null)} />

      {/* Call feedback snackbar */}
      <Snackbar
        open={callSnackbar.open} autoHideDuration={4000}
        onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setCallSnackbar((s) => ({ ...s, open: false }))} severity={callSnackbar.severity} sx={{ borderRadius: "10px" }}>
          {callSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LeadsTable;