import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Divider, Button, Avatar, Stack, Chip, 
  Tabs, Tab, MenuItem, Select, TextField, CircularProgress, Alert
} from "@mui/material";
import ReplyIcon from "@mui/icons-material/Reply";
import { ticketsApi, clinicsApi } from "../../../services/tickets.api";
import type { TicketDetail, Employee, TicketStatus, TicketPriority } from "../../../types/tickets.types";
import dayjs from "dayjs";

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  // Editable States
  const [status, setStatus] = useState<TicketStatus>("new");
  const [priority, setPriority] = useState<TicketPriority>("low");
  const [assignTo, setAssignTo] = useState<number | "">("");
  const [description, setDescription] = useState(""); // State for editable description

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ticketData, empData] = await Promise.all([
        ticketsApi.getTicketById(id),
        clinicsApi.getClinicEmployees("1") // Using hardcoded clinic ID
      ]);
      
      setTicket(ticketData);
      setEmployees(empData);
      
      // Sync local states with DB response
      setStatus(ticketData.status);
      setPriority(ticketData.priority);
      setAssignTo(ticketData.assigned_to || "");
      setDescription(ticketData.description);
    } catch (err) {
      setError("Failed to load ticket details from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Handle saving all changes to the Database
  const handleUpdate = async () => {
    if (!id || !ticket) return;
    setUpdating(true);
    setError(null);

    try {
      // 1. Update Status via specific endpoint if changed
      if (status !== ticket.status) {
        await ticketsApi.updateTicketStatus(id, status);
      }

      // 2. Update Assignee via specific endpoint if changed
      if (assignTo !== (ticket.assigned_to || "")) {
        await ticketsApi.assignTicket(id, String(assignTo));
      }

      // 3. Update Priority or Description via PUT update endpoint
      if (priority !== ticket.priority || description !== ticket.description) {
        await ticketsApi.updateTicket(id, {
          subject: ticket.subject,
          description: description.trim(),
          lab: ticket.lab, // UUID required
          department: ticket.department, // Integer required
          requested_by: ticket.requested_by,
          priority: priority,
          status: status
        });
      }

      await loadData(); // Refresh to show new Timeline activity
      alert("Ticket updated successfully!");
    } catch (err) {
      setError("Failed to save changes. Check database constraints.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (error || !ticket) return <Alert severity="error" sx={{ m: 3 }}>{error || "Ticket not found."}</Alert>;

  return (
    <Box p={3} bgcolor="#fff">
      <Typography variant="h5" fontWeight={700} mb={4}>{ticket.subject}</Typography>

      <Box display="flex" gap={4}>
        {/* LEFT PANEL: EDITABLE CONTENT */}
        <Box flex={2}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={`https://ui-avatars.com/api/?name=${ticket.requested_by}&background=random`} />
              <Box>
                <Typography fontWeight={700}>{ticket.requested_by}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {ticket.requested_by.toLowerCase().replace(/\s/g, '.')}@fertility.com
                </Typography>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {dayjs(ticket.created_at).format("ddd, MMM DD, h:mm A")}
            </Typography>
          </Box>

          {/* Editable Description Field */}
          <Typography variant="subtitle2" fontWeight={700} mb={1} color="text.secondary">Description</Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="outlined"
            placeholder="Describe the issue in detail..."
            sx={{ 
              mb: 4,
              "& .MuiOutlinedInput-root": {
                lineHeight: 1.6,
                fontSize: "0.95rem",
                backgroundColor: "#F9FAFB"
              }
            }}
          />
             
          <Stack direction="row" spacing={2} mb={4}>
            {ticket.documents?.map((doc) => (
              <Box key={doc.id} sx={{ p: 1.5, border: '1px solid #E0E0E0', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" fontWeight={600}>{doc.file?.split('/').pop()}</Typography>
                <Button size="small" component="a" href={doc.file} target="_blank">View</Button>
              </Box>
            ))}
          </Stack>

          <Button startIcon={<ReplyIcon />} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
            Reply .
          </Button>
        </Box>

        {/* RIGHT PANEL: PROPERTIES SIDEBAR */}
        <Box flex={1} bgcolor="#FAFAFA" p={3} borderRadius={2} border="1px solid #E0E0E0">
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Ticket Details" sx={{ textTransform: 'none', minWidth: '50%' }} />
            <Tab label="Timeline" sx={{ textTransform: 'none', minWidth: '50%' }} />
          </Tabs>

          {tab === 0 ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Details</Typography>
                <DetailRow label="Ticket ID" value={ticket.ticket_no} color="#5a8aea" />
                <DetailRow label="Lab Name" value={ticket.lab_name} />
                <DetailRow label="Subject" value={ticket.subject} />
                <DetailRow label="Created Date" value={dayjs(ticket.created_at).format("DD/MM/YYYY")} />
                <DetailRow label="Requested By" value={ticket.requested_by} />
                <DetailRow label="Department" value={ticket.department_name} />
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Properties</Typography>
                <PropertyField label="Status">
                  <Select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} size="small" fullWidth sx={{ bgcolor: '#fff' }}>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </PropertyField>

                <PropertyField label="Priority">
                  <Select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} size="small" fullWidth sx={{ bgcolor: '#fff' }}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </PropertyField>

                <PropertyField label="Assign To">
                  <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value as number)} size="small" fullWidth sx={{ bgcolor: '#fff' }}>
                    <MenuItem value=""><em>Unassigned</em></MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>{emp.emp_name}</MenuItem>
                    ))}
                  </Select>
                </PropertyField>
              </Box>

              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleUpdate}
                disabled={updating}
                sx={{ bgcolor: "#505050", py: 1.5, borderRadius: 2, '&:hover': { bgcolor: "#232323" } }}
              >
                {updating ? <CircularProgress size={24} color="inherit" /> : "Update"}
              </Button>
            </Stack>
          ) : (
            <Box>
              {ticket.timeline?.map((item) => (
                <Box key={item.id} sx={{ borderLeft: '2px solid #5a8aea', pl: 2, mb: 3 }}>
                  <Typography variant="body2" fontWeight={700}>{item.action}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    By {item.done_by_name} • {dayjs(item.created_at).format("DD MMM, hh:mm A")}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const DetailRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <Box display="flex" justifyContent="space-between" mb={1.5}>
    <Typography variant="body2" color="text.secondary">{label} :</Typography>
    <Typography variant="body2" fontWeight={600} sx={{ color: color || 'inherit' }}>{value}</Typography>
  </Box>
  
);

const PropertyField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box mb={2}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
    {children}
  </Box>
);

export default TicketView; 