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

const STORAGE_KEY = "vidai_leads_data";
const ROWS_PER_PAGE = 10;

/* ---------- Status Chip Colors ---------- */
const statusMap: Record<string, any> = {
  New: { bg: "#F3F3FF", color: "#6C6CFF", border: "#7C7CFF" },
  Appointment: { bg: "#EEF4FF", color: "#2F6FFF", border: "#4C8DFF" },
  "Follow-Ups": { bg: "#FFF6E5", color: "#FF9F0A", border: "#FFB020" },
  Converted: { bg: "#EAFBF1", color: "#16A34A", border: "#22C55E" },
  Lost: { bg: "#FDECEC", color: "#E5484D", border: "#FF5A5F" },
};

const Activity = () => {
  const [page, setPage] = React.useState(1);
  const [leads, setLeads] = React.useState<any[]>([]);

  /* ---------- Fetch REAL Leads ---------- */
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setLeads([]);
      return;
    }

    const allLeads = JSON.parse(stored);

    // Only To Do activities
    const todoLeads = allLeads.filter(
      (lead: any) =>
        lead.taskStatus === "To Do" && lead.archived !== true,
    );

    setLeads(todoLeads);
  }, []);

  /* ---------- Pagination ---------- */
  const total = leads.length;
  const totalPages = Math.ceil(total / ROWS_PER_PAGE);

  const visibleRows = leads.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  );

  const start = total === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(page * ROWS_PER_PAGE, total);

  return (
    <Card sx={{ p: 2, borderRadius: "16px" }}>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Assignees</TableCell>
              <TableCell>Lead Name | No.</TableCell>
              <TableCell>Lead Status</TableCell>
              <TableCell>Last Activity</TableCell>
              <TableCell>Next Action</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.map((lead) => {
              const status =
                statusMap[lead.status] || statusMap["New"];

              return (
                <TableRow key={lead.id}>
                  {/* Assignee */}
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {lead.assigned?.charAt(0)}
                      </Avatar>
                      <Typography fontWeight={500}>
                        {lead.assigned || "-"}
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Lead Info */}
                  <TableCell>
                    <Typography fontWeight={600}>
                      {lead.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lead.id}
                    </Typography>
                  </TableCell>

                  {/* Lead Status */}
                  <TableCell>
                    <Chip
                      label={lead.status}
                      size="small"
                      sx={{
                        bgcolor: status.bg,
                        color: status.color,
                        border: `1px solid ${status.border}`,
                        height: 22,
                      }}
                    />
                  </TableCell>

                  {/* Last Activity */}
                  <TableCell>
                    <Typography fontWeight={500}>
                      {lead.activity || "No activity"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          lead.activity === "No activity"
                            ? "#E5484D"
                            : "#6B7280",
                      }}
                    >
                      {lead.activityTime || "Needs Attention"}
                    </Typography>
                  </TableCell>

                  {/* Next Action */}
                  <TableCell>
                    <Typography fontWeight={500}>
                      {lead.task}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {lead.taskHint}
                    </Typography>
                  </TableCell>

                  {/* Due Date */}
                  <TableCell>{lead.dueDate}</TableCell>

                  {/* Task Status */}
                  <TableCell>
                    <Chip
                      label="To Do"
                      size="small"
                      sx={{
                        bgcolor: "#EEF4FF",
                        color: "#2F6FFF",
                        border: "1px solid #4C8DFF",
                        height: 22,
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
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
        <Typography variant="caption">
          Showing {start} to {end} of {total} entries
        </Typography>

        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeftIcon />
          </IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (p) => (
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
                }}
              >
                {p}
              </Box>
            ),
          )}

          <IconButton
            size="small"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};

export default Activity;
