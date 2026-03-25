import * as React from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import Lead_Status_Edit from "../../assets/icons/Lead_Status_Edit.svg";

import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import "../../styles/Leads/leads.css";
import { MenuButton, Dialogs } from "./LeadsMenuDialogs";
import BulkActionBar from "./BulkActionBar";
import { LeadAPI, TwilioAPI } from "../../services/leads.api";
import CallDialog from "./CallDialog";

import type { RawLead, ProcessedLead, Props } from "./LeadsTable.types";
import {
  rowsPerPage,
  stickyContactStyle,
  stickyMenuStyle,
  stickyHeaderContactStyle,
  stickyHeaderMenuStyle,
} from "./LeadsTable.types";
import {
  extractErrorMessage,
  normalizePhone,
  processLead,
} from "./LeadsTable.helpers";
import { getTaskStatusChipSx } from "./LeadsTable.styles";
import { SMSDialog } from "./SmsDialogs";
import { EmailDialog } from "./EmailDialogs";

const toastOptions = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "colored" as const,
};

const LEAD_STATUS_OPTIONS = [
  "New",
  "Appointment",
  "Follow Up",
  "Negotiation",
  "Proposal Sent",
  "Contract Signed",
  "Converted Lead",
  "Lost Lead",
] as const;

const LEAD_STATUS_PILL_COLORS: Record<
  (typeof LEAD_STATUS_OPTIONS)[number],
  { color: string; bg: string }
> = {
  New: { color: "#5B8FF9", bg: "rgba(91,143,249,0.10)" },
  Appointment: { color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  "Follow Up": { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  Negotiation: { color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  "Proposal Sent": { color: "#4F46E5", bg: "rgba(79,70,229,0.10)" },
  "Contract Signed": { color: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  "Converted Lead": { color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
  "Lost Lead": { color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
};

const LEAD_STATUS_API_VALUES: Record<
  (typeof LEAD_STATUS_OPTIONS)[number],
  string
> = {
  New: "new",
  Appointment: "appointment",
  "Follow Up": "follow up",
  Negotiation: "negotiation",
  "Proposal Sent": "proposal sent",
  "Contract Signed": "contract signed",
  "Converted Lead": "converted",
  "Lost Lead": "lost",
};

const leadStatusChipSx = (color: string, bg: string) => ({
  borderRadius: "999px",
  fontWeight: 500,
  fontSize: "12px",
  height: 22,
  px: 1,
  width: "fit-content",
  border: "1.5px solid",
  borderColor: color,
  backgroundColor: bg,
  color,
  "& .MuiChip-label": { px: 1 },
});

function normalizeLeadStatusForPill(
  status: string | undefined,
): (typeof LEAD_STATUS_OPTIONS)[number] {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized === "appointment") return "Appointment";
  if (normalized === "follow up" || normalized === "follow-up")
    return "Follow Up";
  if (normalized === "negotiation") return "Negotiation";
  if (normalized === "proposal sent") return "Proposal Sent";
  if (normalized === "contract signed") return "Contract Signed";
  if (normalized === "converted" || normalized === "converted lead")
    return "Converted Lead";
  if (normalized === "lost" || normalized === "lost lead") return "Lost Lead";
  return "New";
}

const LeadsTable: React.FC<Props> = ({ search, tab, filters }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const leads = useSelector(selectLeads) as RawLead[] | null;
  const loading = useSelector(selectLeadsLoading) as boolean;
  const error = useSelector(selectLeadsError) as string | null;

  const [localLeads, setLocalLeads] = React.useState<ProcessedLead[]>([]);
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const [callLead, setCallLead] = React.useState<ProcessedLead | null>(null);
  const [smsLead, setSmsLead] = React.useState<ProcessedLead | null>(null);
  const [emailLead, setEmailLead] = React.useState<ProcessedLead | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [statusDialogLeadId, setStatusDialogLeadId] = React.useState<
    string | null
  >(null);
  const [draftLeadStatus, setDraftLeadStatus] =
    React.useState<(typeof LEAD_STATUS_OPTIONS)[number]>("New");
  const [statusSaving, setStatusSaving] = React.useState(false);

  React.useEffect(() => {
    dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  React.useEffect(() => {
    if (leads) setLocalLeads(leads.map(processLead));
  }, [leads]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const isSelected = (id: string) => selectedIds.includes(id);

  const handleCallOpen = async (e: React.MouseEvent, lead: ProcessedLead) => {
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
      toast.error(
        extractErrorMessage(err, "Failed to initiate call."),
        toastOptions,
      );
    }
  };

  const handleSMSOpen = (e: React.MouseEvent, lead: ProcessedLead) => {
    e.stopPropagation();
    setSmsLead(lead);
  };

  const openStatusDialog = (
    event: React.MouseEvent<HTMLElement>,
    leadId: string,
  ) => {
    event.stopPropagation();
    const currentLead = localLeads.find((lead) => lead.id === leadId);
    setDraftLeadStatus(
      normalizeLeadStatusForPill(
        currentLead?.status || currentLead?.lead_status,
      ),
    );
    setStatusDialogLeadId(leadId);
    setStatusDialogOpen(true);
  };

  const closeStatusDialog = () => {
    if (statusSaving) return;
    setStatusDialogOpen(false);
    setStatusDialogLeadId(null);
  };

  const saveLeadStatus = async () => {
    if (!statusDialogLeadId || statusSaving) return;

    const currentLead = localLeads.find((lead) => lead.id === statusDialogLeadId);
    if (!currentLead) return;

    const nextLeadStatus = LEAD_STATUS_API_VALUES[draftLeadStatus];

    try {
      setStatusSaving(true);
      const updatedLead = await LeadAPI.update(statusDialogLeadId, {
        clinic_id: (currentLead as ProcessedLead & { clinic_id?: number }).clinic_id ?? 0,
        department_id:
          (currentLead as ProcessedLead & { department_id?: number }).department_id ?? 0,
        full_name: currentLead.full_name || currentLead.name || "",
        contact_no: currentLead.contact_no || "",
        source: currentLead.source || "Unknown",
        treatment_interest:
          (currentLead as ProcessedLead & { treatment_interest?: string })
            .treatment_interest || "N/A",
        book_appointment:
          (currentLead as ProcessedLead & { book_appointment?: boolean })
            .book_appointment || false,
        appointment_date:
          (currentLead as ProcessedLead & { appointment_date?: string | null })
            .appointment_date || null,
        slot: (currentLead as ProcessedLead & { slot?: string }).slot || "",
        is_active: currentLead.is_active !== false,
        partner_inquiry:
          (currentLead as ProcessedLead & { partner_inquiry?: boolean })
            .partner_inquiry || false,
        lead_status: nextLeadStatus as "new" | "contacted",
      });

      setLocalLeads((prev) =>
        prev.map((lead) =>
          lead.id === statusDialogLeadId
            ? processLead(updatedLead as unknown as RawLead)
            : lead,
        ),
      );
      setStatusDialogOpen(false);
      setStatusDialogLeadId(null);
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
      toast.success("Lead status updated.", toastOptions);
    } catch (err: unknown) {
      toast.error(
        extractErrorMessage(err, "Failed to update lead status."),
        toastOptions,
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const filteredLeads = React.useMemo(() => {
    return localLeads.filter((lead: ProcessedLead) => {
      const searchStr =
        `${lead.name || ""} ${lead.displayId || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      const matchTab =
        tab === "archived"
          ? lead.is_active === false
          : lead.is_active !== false;
      if (filters) {
        if (
          filters.department &&
          lead.department_id !== Number(filters.department)
        )
          return false;
        if (
          filters.assignee &&
          lead.assigned_to_id !== Number(filters.assignee)
        )
          return false;
        if (filters.status) {
          const ls = (lead.lead_status || lead.status || "").toLowerCase();
          if (ls !== filters.status.toLowerCase()) return false;
        }
        if (filters.quality && lead.quality !== filters.quality) return false;
        if (filters.source && lead.source !== filters.source) return false;
        if (filters.dateFrom || filters.dateTo) {
          const leadDate = lead.created_at ? new Date(lead.created_at) : null;
          if (!leadDate) return false;
          if (filters.dateFrom) {
            const f = new Date(filters.dateFrom);
            f.setHours(0, 0, 0, 0);
            if (leadDate < f) return false;
          }
          if (filters.dateTo) {
            const t = new Date(filters.dateTo);
            t.setHours(23, 59, 59, 999);
            if (leadDate > t) return false;
          }
        }
      }
      return matchSearch && matchTab;
    });
  }, [localLeads, search, tab, filters]);

  React.useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, tab, filters]);

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

  const handleBulkDelete = () => {
    setLocalLeads((p) => p.filter((l) => !selectedIds.includes(l.id)));
    setSelectedIds([]);
  };
  const handleBulkArchive = (archive: boolean) => {
    setLocalLeads((p) =>
      p.map((l) =>
        selectedIds.includes(l.id) ? { ...l, is_active: !archive } : l,
      ),
    );
    setSelectedIds([]);
  };

  // ── Loading / Error / Empty states ──
  if (loading)
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
          <Typography color="text.secondary">Loading leads...</Typography>
        </Stack>
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load leads</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            color: "primary.main",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={() =>
            dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0])
          }
        >
          Try again
        </Typography>
      </Alert>
    );

  if (localLeads.length === 0)
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
            No leads found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tab === "archived"
              ? "No archived leads yet"
              : "Create your first lead to get started"}
          </Typography>
        </Stack>
      </Box>
    );

  if (filteredLeads.length === 0)
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
            No {tab === "archived" ? "archived" : "active"} leads found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? `No results for "${search}"`
              : filters &&
                  Object.values(filters).some((v) => v !== "" && v !== null)
                ? "No leads match the selected filters"
                : tab === "archived"
                  ? "No archived leads yet"
                  : "No active leads"}
          </Typography>
        </Stack>
      </Box>
    );

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        className="leads-table"
        sx={{ overflowX: "auto" }}
      >
        <Table stickyHeader sx={{ minWidth: 1200 }}>
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
                    if (e.target.checked)
                      setSelectedIds(currentLeads.map((l) => l.id));
                    else setSelectedIds([]);
                  }}
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
              <TableCell align="center" sx={stickyHeaderContactStyle}>
                Contact Option
              </TableCell>
              <TableCell align="center" sx={stickyHeaderMenuStyle} />
            </TableRow>
          </TableHead>

          <TableBody>
            {currentLeads.map((lead: ProcessedLead) => (
              <TableRow
                key={lead.id}
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(
                    `/leads/${encodeURIComponent(lead.id.replace(/^#/, ""))}`,
                  )
                }
                className={isSelected(lead.id) ? "row-selected" : ""}
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
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar className="lead-avatar">
                      {lead.initials ||
                        lead.full_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography className="lead-name-text">
                        {lead.full_name}
                      </Typography>
                      <Typography className="lead-id-text">
                        {lead.displayId}
                      </Typography>
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
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {(() => {
                      const currentStatus = normalizeLeadStatusForPill(
                        lead.status || lead.lead_status,
                      );
                      const statusStyle =
                        LEAD_STATUS_PILL_COLORS[currentStatus];
                      return (
                        <Chip
                          label={currentStatus}
                          size="small"
                          sx={leadStatusChipSx(
                            statusStyle.color,
                            statusStyle.bg,
                          )}
                        />
                      );
                    })()}
                    <IconButton
                      size="small"
                      onClick={(e) => openStatusDialog(e, lead.id)}
                      sx={{ p: 0.35 }}
                      aria-label="Edit lead status"
                    >
                      <Box
                        component="img"
                        src={Lead_Status_Edit}
                        alt="Edit Status"
                        sx={{ width: 14, height: 14 }}
                      />
                    </IconButton>
                  </Stack>
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

                <TableCell>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: lead.taskType ? "#1E293B" : "#94A3B8",
                      fontWeight: lead.taskType ? 500 : 400,
                    }}
                  >
                    {lead.taskType || "—"}
                  </Typography>
                </TableCell>

                <TableCell>
                  {lead.taskStatus ? (
                    <Chip
                      label={lead.taskStatus}
                      size="small"
                      sx={getTaskStatusChipSx(lead.taskStatus)}
                    />
                  ) : (
                    <Typography sx={{ fontSize: "13px", color: "#94A3B8" }}>
                      —
                    </Typography>
                  )}
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

                <TableCell
                  align="center"
                  sx={stickyContactStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title={`Call ${lead.contact_no || "N/A"}`}>
                      <span>
                        <IconButton
                          className="action-btn"
                          size="small"
                          onClick={(e) => handleCallOpen(e, lead)}
                        >
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={`SMS ${lead.contact_no || "N/A"}`}>
                      <IconButton
                        className="action-btn"
                        size="small"
                        onClick={(e) => handleSMSOpen(e, lead)}
                      >
                        <ChatBubbleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={lead.email ? `Email ${lead.email}` : "No email"}
                    >
                      <span>
                        <IconButton
                          className="action-btn"
                          size="small"
                          disabled={!lead.email}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmailLead(lead);
                          }}
                        >
                          <EmailOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>

                <TableCell
                  align="center"
                  sx={stickyMenuStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MenuButton lead={lead} setLeads={setLocalLeads} tab={tab} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={statusDialogOpen}
        onClose={closeStatusDialog}
        PaperProps={{
          sx: { borderRadius: "20px", width: 360, overflow: "hidden" },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 2,
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <Typography fontWeight={700} fontSize="1.2rem">
            Edit Status
          </Typography>
          <IconButton
            onClick={closeStatusDialog}
            size="small"
            sx={{ bgcolor: "#F3F4F6", width: 36, height: 36 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pt: 2.5, pb: 1 }}>
          <Stack spacing={1.1}>
            <Typography fontSize="13px" color="#8B8B8B" fontWeight={500}>
              Status
            </Typography>
            <Select
              value={draftLeadStatus}
              onChange={(event) =>
                setDraftLeadStatus(
                  event.target.value as (typeof LEAD_STATUS_OPTIONS)[number],
                )
              }
              size="small"
              renderValue={(value) => {
                const style =
                  LEAD_STATUS_PILL_COLORS[
                    value as (typeof LEAD_STATUS_OPTIONS)[number]
                  ];
                return (
                  <Chip
                    label={value}
                    size="small"
                    sx={leadStatusChipSx(style.color, style.bg)}
                  />
                );
              }}
              sx={{
                minHeight: 50,
                borderRadius: "12px",
                bgcolor: "#FFFFFF",
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  py: 1.25,
                },
              }}
            >
              {LEAD_STATUS_OPTIONS.map((statusOption) => {
                const style = LEAD_STATUS_PILL_COLORS[statusOption];
                return (
                  <MenuItem key={statusOption} value={statusOption}>
                    <Chip
                      label={statusOption}
                      size="small"
                      sx={leadStatusChipSx(style.color, style.bg)}
                    />
                  </MenuItem>
                );
              })}
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2.25, pt: 1.5, gap: 1.5 }}>
          <Button
            onClick={closeStatusDialog}
            variant="outlined"
            disabled={statusSaving}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              borderColor: "#5C5C5C",
              color: "#5C5C5C",
              minWidth: 140,
              height: 44,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveLeadStatus}
            variant="contained"
            disabled={statusSaving}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              backgroundColor: "#5C5C5C",
              minWidth: 140,
              height: 44,
              "&:hover": { backgroundColor: "#454545" },
            }}
          >
            {statusSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pagination */}
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ mt: 2, px: 2 }}
      >
        <Typography color="text.secondary">
          Showing {startEntry} to {endEntry} of {totalEntries}
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

      <BulkActionBar
        selectedIds={selectedIds}
        tab={tab}
        onDelete={handleBulkDelete}
        onArchive={handleBulkArchive}
      />
      <Dialogs />

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

export default LeadsTable;
