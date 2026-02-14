import {
  Dialog, DialogContent, DialogTitle, IconButton, TextField, Box, Button,
  MenuItem, Stack, Typography, Divider, CircularProgress, Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../store";
import { fetchTickets, fetchTicketDashboard } from "../../../store/ticketSlice";
import { ticketsApi, labsApi, clinicsApi } from "../../../services/tickets.api";
import type { CreateTicketProps } from "../../../types/Settings.types";
import type { CreateTicketRequest, TicketPriority, Lab, Department, Employee } from "../../../types/tickets.types";

import {
  createTicketFocusedFieldSx, createTicketDialogPaperSx, createTicketCloseButtonSx,
  createTicketCancelButtonSx, createTicketSaveButtonSx,
} from "../../../styles/Settings/Tickets.styles";

const CreateTicket = ({ open, onClose }: CreateTicketProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const CLINIC_ID = "1"; 

  // --- Form States ---
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [labId, setLabId] = useState(""); 
  const [departmentId, setDepartmentId] = useState<number | "">(""); 
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [assigneeId, setAssigneeId] = useState<number | "">(""); 
  const [requestedBy, setRequestedBy] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- Data States (Dropdowns) ---
  const [labs, setLabs] = useState<Lab[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // --- UI States ---
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1. Fetch live data for dropdowns matching Swagger definitions
  useEffect(() => {
    if (open) {
      // Inside your useEffect -> loadData function
const loadData = async () => {
  setLoadingData(true);
  setError(null);
  try {
    const results = await Promise.allSettled([
      labsApi.getLabs(),               // GET /api/labs/
      clinicsApi.getClinicDetail(CLINIC_ID), // GET /api/clinics/1/detail/
      clinicsApi.getClinicEmployees(CLINIC_ID), // GET /api/clinics/1/employees/
    ]);
    
    // 1. Process Labs from DB (Matches restapi_lab table)
    if (results[0].status === 'fulfilled') {
      const labsData = results[0].value;
      // Extract array if backend uses pagination, otherwise use raw data
      const labList = Array.isArray(labsData) ? labsData : (labsData as any).results || [];
      setLabs(labList.filter((l: Lab) => l.is_active)); 
    } else {
      console.error("Labs API failed. Using empty list.");
      setLabs([]); // or use your mock fallback here if needed
    }

    // 2. Process Departments (Matches restapi_ticket department_id FK)
    if (results[1].status === 'fulfilled') {
      // ClinicRead schema: department is an array of objects
      setDepartments(results[1].value?.department || []);
    }

    // 3. Process Employees (Matches restapi_ticket assigned_to_id FK)
    if (results[2].status === 'fulfilled') {
      setEmployees(Array.isArray(results[2].value) ? results[2].value : (results[2].value as any).results || []);
    }

  } catch (err) { 
    setError("Connection error. Check if Django is running at 127.0.0.1:8000");
  } finally { 
    setLoadingData(false); 
  }
};
      loadData();
    }
  }, [open]);

  // 2. Submit Logic matching TicketWrite definition
  const handleSubmit = async () => {
    setError(null);
    if (!subject.trim() || !labId || !departmentId || !priority || !requestedBy.trim()) {
      setError("Please fill in all required fields (*)");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateTicketRequest = {
        subject: subject.trim(),
        description: description.trim() || "No description provided",
        lab: labId, // Expects UUID string
        department: Number(departmentId), // Expects Integer
        requested_by: requestedBy.trim(),
        priority: priority as TicketPriority,
        status: "new",
        assigned_to: assigneeId ? Number(assigneeId) : null,
        due_date: dueDate ? dueDate.format("YYYY-MM-DD") : null,
      };

      // POST /api/tickets/create/
      const res = await ticketsApi.createTicket(payload);

      // POST /api/tickets/{id}/documents/
      if (selectedFile && res.id) {
        await ticketsApi.uploadDocument(res.id, selectedFile);
      }

      setSuccess(true);
      dispatch(fetchTickets());
      dispatch(fetchTicketDashboard());

      setTimeout(() => { 
        handleClose();
      }, 1500);

    } catch (err: any) {
      const serverData = err.response?.data;
      if (serverData && typeof serverData === 'object') {
        // Correctly parse Django's nested error objects for the UI
        const errorMsg = Object.entries(serverData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(" | ");
        setError(errorMsg);
      } else {
        setError("Submission failed. Ensure Lab and Department IDs are valid.");
      }
    } finally { 
      setLoading(false); 
    }
  };

  const reset = () => {
    setSubject(""); setDescription(""); setDueDate(null); setLabId("");
    setDepartmentId(""); setPriority(""); setAssigneeId(""); setRequestedBy("");
    setSelectedFile(null); setError(null); setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={false} PaperProps={{ sx: createTicketDialogPaperSx }}>
      <DialogTitle sx={{ position: "relative" }}>
        <Typography fontWeight={700} fontSize="1.1rem">Create Support Ticket</Typography>
        <IconButton onClick={handleClose} sx={createTicketCloseButtonSx}><CloseIcon fontSize="small" /></IconButton>
        <Divider sx={{ mt: 2, mx: -3 }} />
      </DialogTitle>
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Ticket created successfully!</Alert>}

        {loadingData ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary">Fetching latest Lab & Assignee records...</Typography>
          </Box>
        ) : (
          <Stack spacing={2.5} mt={2}>
            <TextField label="Subject *" placeholder="Issue summary" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth sx={createTicketFocusedFieldSx} InputLabelProps={{ shrink: true }} disabled={loading} />
            
            <TextField label="Detailed Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} fullWidth sx={createTicketFocusedFieldSx} InputLabelProps={{ shrink: true }} disabled={loading} />
            
            <Stack direction="row" spacing={2}>
              <TextField select label="Lab Name *" value={labId} onChange={(e) => setLabId(e.target.value)} fullWidth sx={createTicketFocusedFieldSx} InputLabelProps={{ shrink: true }} disabled={loading}>
                {labs.length === 0 && <MenuItem disabled value="">No Labs Found</MenuItem>}
                {labs.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
              </TextField>
              
              <TextField select label="Department *" value={departmentId} onChange={(e) => setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))} fullWidth sx={createTicketFocusedFieldSx} InputLabelProps={{ shrink: true }} disabled={loading}>
                {departments.length === 0 && <MenuItem disabled value="">No Departments Found</MenuItem>}
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField label="Requested By *" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} fullWidth sx={createTicketFocusedFieldSx} InputLabelProps={{ shrink: true }} disabled={loading} />
              
              <TextField select label="Priority *" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} fullWidth sx={createTicketFocusedFieldSx} InputLabelProps={{ shrink: true }} disabled={loading}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField select label="Assign To (Optional)" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value === "" ? "" : Number(e.target.value))} fullWidth sx={createTicketFocusedFieldSx} InputLabelProps={{ shrink: true }} disabled={loading}>
                <MenuItem value=""><em>-- Unassigned --</em></MenuItem>
                {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.emp_name} ({e.department_name})</MenuItem>)}
              </TextField>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker label="Due Date" value={dueDate} onChange={(v) => setDueDate(v)} disabled={loading} slotProps={{ textField: { fullWidth: true, sx: createTicketFocusedFieldSx, InputLabelProps: { shrink: true } } }} />
              </LocalizationProvider>
            </Stack>

            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 600 }}>Attachments</Typography>
              <TextField fullWidth sx={createTicketFocusedFieldSx} value={selectedFile?.name || ""} placeholder="No file selected" InputLabelProps={{ shrink: true }}
                InputProps={{ 
                  startAdornment: ( 
                    <Button component="label" variant="text" size="small" sx={{ mr: 1, textTransform: 'none', fontWeight: 700 }} disabled={loading}>
                      Choose File
                      <input hidden type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </Button> 
                  ), 
                  readOnly: true 
                }} 
              />
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={2} pt={1}>
              <Button onClick={handleClose} sx={createTicketCancelButtonSx} disabled={loading}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit} sx={createTicketSaveButtonSx} disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Save Ticket"}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicket;