import * as React from "react";
import {
  Box,
  Card,
  Chip,
  Stack,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useSelector } from "react-redux";
import { selectLeads } from "../../store/leadSlice";
import type { Lead } from "../../services/leads.api";

const ROWS_PER_PAGE = 10;

/* ---------- Status Chip Colors ---------- */
const statusMap: Record<string, { bg: string; color: string; border: string }> = {
  New:              { bg: "#F3F3FF", color: "#6C6CFF", border: "#7C7CFF" },
  Appointment:      { bg: "#EEF4FF", color: "#2F6FFF", border: "#4C8DFF" },
  "Follow-Ups":     { bg: "#FFF6E5", color: "#FF9F0A", border: "#FFB020" },
  Converted:        { bg: "#EAFBF1", color: "#16A34A", border: "#22C55E" },
  Lost:             { bg: "#FDECEC", color: "#E5484D", border: "#FF5A5F" },
  Contacted:        { bg: "#F0FFF4", color: "#16A34A", border: "#22C55E" },
  "Cycle Conversion": { bg: "#FFF6E5", color: "#FF9F0A", border: "#FFB020" },
};

/* ---------- Format date helper ---------- */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/* ---------- Relative time helper ---------- */
const relativeTime = (dateStr?: string): string => {
  if (!dateStr) return "Needs Attention";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "Needs Attention";
  }
};

const Activity = () => {
  const [page, setPage] = React.useState<number>(1);

  const allLeads = useSelector(selectLeads);

  /* ---------- Filter: pending next actions, active leads only ---------- */
  const leads = React.useMemo<Lead[]>(() => {
    return allLeads.filter(
      (lead) =>
        lead.next_action_status === "pending" &&
        lead.is_active !== false
    );
  }, [allLeads]);

  /* ---------- Reset to page 1 when leads change ---------- */
  React.useEffect(() => {
    setPage(1);
  }, [leads.length]);

  /* ---------- Pagination ---------- */
  const total = leads.length;
  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));

  const visibleRows = leads.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  const start = total === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(page * ROWS_PER_PAGE, total);

  return (
    <Card sx={{ p: 2, borderRadius: "16px" }}>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Assignee</TableCell>
              <TableCell>Lead Name | No.</TableCell>
              <TableCell>Lead Status</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Next Action</TableCell>
              <TableCell>Appointment Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No pending activities found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((lead) => {
                const statusKey = lead.lead_status ?? "New";
                const statusStyle = statusMap[statusKey] ?? statusMap["New"];
                const hasActivity = Boolean(lead.modified_at);

                return (
                  <TableRow key={lead.id}>
                    {/* Assignee */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                          {lead.assigned_to_name?.charAt(0) ?? "?"}
                        </Avatar>
                        <Typography fontWeight={500} fontSize={13}>
                          {lead.assigned_to_name ?? "Unassigned"}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Lead Info */}
                    <TableCell>
                      <Typography fontWeight={600} fontSize={13}>
                        {lead.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lead.id}
                      </Typography>
                    </TableCell>

                    {/* Lead Status */}
                    <TableCell>
                      <Chip
                        label={lead.lead_status ?? "New"}
                        size="small"
                        sx={{
                          bgcolor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          height: 22,
                          fontSize: 11,
                        }}
                      />
                    </TableCell>

                    {/* Last Modified */}
                    <TableCell>
                      <Typography fontWeight={500} fontSize={13}>
                        {hasActivity ? "Updated" : "No activity"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: hasActivity ? "#6B7280" : "#E5484D",
                        }}
                      >
                        {relativeTime(lead.modified_at)}
                      </Typography>
                    </TableCell>

                    {/* Next Action */}
                    <TableCell>
                      <Typography fontWeight={500} fontSize={13}>
                        {lead.next_action_type ?? "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lead.next_action_description ?? ""}
                      </Typography>
                    </TableCell>

                    {/* Appointment Date */}
                    <TableCell>
                      <Typography fontSize={13}>
                        {formatDate(lead.appointment_date)}
                      </Typography>
                      {lead.slot && (
                        <Typography variant="caption" color="text.secondary">
                          {lead.slot}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Task Status — always "To Do" since next_action_status === "pending" */}
                    <TableCell>
                      <Chip
                        label="To Do"
                        size="small"
                        sx={{
                          bgcolor: "#EEF4FF",
                          color: "#2F6FFF",
                          border: "1px solid #4C8DFF",
                          height: 22,
                          fontSize: 11,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---------- Pagination ---------- */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 2 }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {start} to {end} of {total} entries
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeftIcon />
          </IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Box
              key={p}
              onClick={() => setPage(p)}
              sx={{
                px: 1.2,
                py: 0.4,
                borderRadius: "6px",
                cursor: "pointer",
                bgcolor: page === p ? "#111" : "transparent",
                color: page === p ? "#FFF" : "#6B7280",
                fontSize: "13px",
                userSelect: "none",
              }}
            >
              {p}
            </Box>
          ))}

          <IconButton
            size="small"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};

export default Activity;