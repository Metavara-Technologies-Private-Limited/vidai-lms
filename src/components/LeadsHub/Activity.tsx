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

interface ActivityRow {
  assignee: string;
  assigneeAvatar: string;
  leadName: string;
  leadId: string;
  leadStatus: string;
  lastActivity: string;
  lastActivityTime: string;
  nextAction: string;
  nextActionHint: string;
  dueDate: string;
  taskStatus: string;
}

const activityData: ActivityRow[] = [
  {
    assignee: "Emilia Clarke",
    assigneeAvatar: "EC",
    leadName: "Alex Johnson",
    leadId: "#LN-201",
    leadStatus: "New",
    lastActivity: "WhatsApp — Message Sent",
    lastActivityTime: "10 min ago",
    nextAction: "Call Patient",
    nextActionHint: "Call patient to confirm preferred consultation time",
    dueDate: "17/01/2026",
    taskStatus: "To Do",
  },
  {
    assignee: "Lily Foster",
    assigneeAvatar: "LF",
    leadName: "Daniel Wilson",
    leadId: "#LN-201",
    leadStatus: "Appointment",
    lastActivity: "Call — Connected",
    lastActivityTime: "2 hours ago",
    nextAction: "Book Appointment",
    nextActionHint: "Book initial IVF consultation",
    dueDate: "18/01/2026",
    taskStatus: "To Do",
  },
  {
    assignee: "Merry Parker",
    assigneeAvatar: "MP",
    leadName: "Sophia Davis",
    leadId: "#LN-201",
    leadStatus: "Cycle Conversion",
    lastActivity: "No activity from last 30 days",
    lastActivityTime: "Needs Attention",
    nextAction: "Book Appointment",
    nextActionHint: "Book initial IVF consultation",
    dueDate: "22/01/2026",
    taskStatus: "To Do",
  },
  // 👉 duplicate more rows if needed to test pagination
];

const leadStatusColor = (status: string) => {
  switch (status) {
    case "New":
      return "primary";
    case "Appointment":
      return "info";
    case "Converted":
      return "success";
    case "Lost":
      return "error";
    default:
      return "success";
  }
};

const Activity: React.FC = () => {
  const rowsPerPage = 5;
  const [page, setPage] = React.useState(1);

  const totalEntries = activityData.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);

  const currentRows = activityData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const startEntry = (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  return (
    <Card sx={{ p: 2, borderRadius: "16px" }}>
      {/* ===== TABLE ===== */}
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
            {currentRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {row.assigneeAvatar}
                    </Avatar>
                    <Typography>{row.assignee}</Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography fontWeight={600}>{row.leadName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.leadId}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={row.leadStatus}
                    size="small"
                    color={leadStatusColor(row.leadStatus)}
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>
                  <Typography fontWeight={500}>
                    {row.lastActivity}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      row.lastActivity.includes("No activity")
                        ? "error"
                        : "text.secondary"
                    }
                  >
                    {row.lastActivityTime}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontWeight={500}>
                    {row.nextAction}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {row.nextActionHint}
                  </Typography>
                </TableCell>

                <TableCell>{row.dueDate}</TableCell>

                <TableCell>
                  <Chip
                    label={row.taskStatus}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ===== PAGINATION ===== */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 2 }}
      >
        <Typography variant="caption">
          Showing {startEntry} to {endEntry} of {totalEntries}
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
                color: page === p ? "#fff" : "#555",
                fontSize: "13px",
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
