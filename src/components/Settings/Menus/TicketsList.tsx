import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CreateTicket from "./CreateTicket";

// ✅ Logic Integration
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../store";
import { 
  fetchTickets, 
  fetchTicketDashboard, 
  selectTickets, 
  selectTicketLoading 
} from "../../../store/ticketSlice";
import { ticketsApi } from "../../../services/tickets.api";
import type { TicketFilters } from "../../../types/tickets.types";

const TicketsList = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // ✅ Selectors for Redux State
  const tickets = useSelector(selectTickets);
  const loading = useSelector(selectTicketLoading);
  
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // ✅ 1. Updated Fetch Logic (Uses Redux)
  const getTicketData = (filters?: TicketFilters) => {
    dispatch(fetchTickets(filters));
    dispatch(fetchTicketDashboard()); // Keep KPI cards updated
  };

  useEffect(() => {
    getTicketData();
  }, []);

  // ✅ 2. Handle ticket deletion
  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await ticketsApi.deleteTicket(ticketId);
        getTicketData(); // Refresh list & dashboard
      } catch (error) {
        console.error("Error deleting ticket:", error);
      }
    }
  };

  // ✅ Status and Priority Helpers (Same as before)
  const getStatusColor = (status: string): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status.toLowerCase()) {
      case "new": return "primary";
      case "pending": return "warning";
      case "resolved": return "success";
      case "closed": return "default";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string): "default" | "warning" | "error" => {
    switch (priority.toLowerCase()) {
      case "high": return "error";
      case "medium": return "warning";
      case "low": return "default";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Support Tickets</Typography>
        <Button variant="contained" onClick={() => setOpenCreateDialog(true)}>
          Create Ticket
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Ticket No</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Lab</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body2" component="span" color="textSecondary">
                    Fetching records from database...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1" color="textSecondary">No tickets found in the database.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell><strong>{ticket.ticket_no}</strong></TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.lab_name}</TableCell>
                  <TableCell>{ticket.department_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority.toUpperCase()}
                      color={getPriorityColor(ticket.priority)}
                      size="small"
                      sx={{ fontWeight: 500, borderRadius: "4px" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status.toUpperCase()}
                      color={getStatusColor(ticket.status)}
                      size="small"
                      sx={{ fontWeight: 500, borderRadius: "4px" }}
                    />
                  </TableCell>
                  <TableCell>{ticket.assigned_to_name || <Typography variant="caption" color="textSecondary">Unassigned</Typography>}</TableCell>
                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteTicket(ticket.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateTicket
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
      />
    </Box>
  );
};

export default TicketsList;