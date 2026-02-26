import {
  Dialog, DialogContent, DialogTitle, IconButton, TextField, Box, Button,
  MenuItem, Stack, Typography, Divider, CircularProgress, 
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import type { AppDispatch } from "../../../store";
import { fetchTickets, fetchTicketDashboard } from "../../../store/ticketSlice";
import { ticketsApi, labsApi, clinicsApi } from "../../../services/tickets.api";
import type { CreateTicketProps } from "../../../types/Settings.types";
import type { CreateTicketRequest, TicketPriority, Lab, Department, Employee, PaginatedResponse } from "../../../types/tickets.types";

import {
  createTicketFocusedFieldSx, createTicketDialogPaperSx, createTicketCloseButtonSx,
  createTicketCancelButtonSx, createTicketSaveButtonSx, createTicketUploadButtonSx,
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

  // 1. Fetch live data for dropdowns matching Swagger definitions
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setLoadingData(true);
        try {
          const results = await Promise.allSettled([
            labsApi.getLabs(),
            clinicsApi.getClinicDetail(CLINIC_ID),
            clinicsApi.getClinicEmployees(CLINIC_ID),
          ]);

          if (results[0].status === 'fulfilled') {
const labsData = results[0].value as Lab[] | PaginatedResponse<Lab>;
const labList = Array.isArray(labsData) ? labsData : labsData.results;
setLabs(labList.filter((l) => l.is_active));

          } else {
            console.error("Labs API failed. Using empty list.");
            setLabs([]);
          }

          if (results[1].status === 'fulfilled') {
            setDepartments(results[1].value?.department || []);
          }

          if (results[2].status === 'fulfilled') {
const empData = results[2].value as Employee[] | PaginatedResponse<Employee>;
setEmployees(Array.isArray(empData) ? empData : empData.results);
          }

} catch {
  const connError = "Connection error. Check backend server.";
  toast.error(connError);
}
 finally {
          setLoadingData(false);
        }
      };
      loadData();
    }
  }, [open]);

  // 2. Submit Logic matching TicketWrite definition
  const handleSubmit = async () => {
    // Check required fields
    // --- Field Wise Validation ---
    if (!subject.trim()) {
      toast.warn("Subject is required!");
      return;
    }

    if (!description.trim()) {
      toast.warn("Description is required!");
      return;
    }

    if (!labId) {
      toast.warn("Please select Lab!");
      return;
    }

    if (!departmentId) {
      toast.warn("Please select Department!");
      return;
    }

    if (!requestedBy.trim()) {
      toast.warn("Please select Requested By!");
      return;
    }

    if (!priority) {
      toast.warn("Please select Priority!");
      return;
    }

    if (!dueDate) {
      toast.warn("Please select Due Date!");
      return;
    }

    if (!assigneeId) {
      toast.warn("Please select Assignee!");
      return;
    }


    setLoading(true);
    try {
      const payload: CreateTicketRequest = {
        subject: subject.trim(),
        description: description.trim() || "No description provided",
        lab: labId,
        department: Number(departmentId),
        requested_by: requestedBy.trim(),
        priority: priority as TicketPriority,
        status: "new",
        assigned_to: assigneeId ? Number(assigneeId) : null,
        due_date: dueDate ? dueDate.format("YYYY-MM-DD") : null,
      };

      const res = await ticketsApi.createTicket(payload);

      if (selectedFile && res.id) {
        await ticketsApi.uploadDocument(res.id, selectedFile);
      }
      toast.success("Ticket created successfully!");

      dispatch(fetchTickets());
      dispatch(fetchTicketDashboard());

      setTimeout(() => {
        handleClose();
      }, 1500);

} catch (err: unknown) {
  let finalError = "Submission failed. Ensure Lab and Department IDs are valid.";

  if (typeof err === "object" && err !== null && "response" in err) {
    const serverData = (err as { response?: { data?: unknown } }).response?.data;

    if (serverData && typeof serverData === "object") {
      finalError = Object.entries(serverData as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
        .join(" | ");
    }
  }

  toast.error(finalError);
} finally {
  setLoading(false);
}

  };

  const reset = () => {
    setSubject(""); setDescription(""); setDueDate(null); setLabId("");
    setDepartmentId(""); setPriority(""); setAssigneeId(""); setRequestedBy("");
    setSelectedFile(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={false} PaperProps={{ sx: createTicketDialogPaperSx }}>
      <DialogTitle sx={{ position: "relative" }}>
        <Typography fontWeight={700} fontSize="1.1rem">New Ticket</Typography>
        <IconButton onClick={handleClose} sx={createTicketCloseButtonSx}><CloseIcon fontSize="small" /></IconButton>
        <Divider sx={{ mt: 2, mx: -3 }} />
      </DialogTitle>

      <DialogContent>

        {loadingData ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary">Fetching latest Lab & Assignee records...</Typography>
          </Box>
        ) : (
          <Stack spacing={2.5} mt={2}>
            <TextField 
            label="Subject" 
            placeholder="Enter subject" 
            value={subject} onChange={(e) => setSubject(e.target.value)} 
            fullWidth sx={createTicketFocusedFieldSx} 
            InputLabelProps={{ shrink: true }} 
            disabled={loading} />

            <TextField
              label="Detailed Description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={1}
              maxRows={3}
              fullWidth
              sx={createTicketFocusedFieldSx}
              InputLabelProps={{
                shrink: true,   
              }}
              disabled={loading}
            />


            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Lab Name"
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                fullWidth
                sx={createTicketFocusedFieldSx}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return <span className="ticket-select-placeholder">Select lab name</span>;
                    }
                    const lab = labs.find((l) => String(l.id) === String(selected));
                    return lab ? lab.name : "";
                  },
                }}
              >
                {labs.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Department"
                value={departmentId}
                onChange={(e) =>
                  setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))
                }
                fullWidth
                sx={createTicketFocusedFieldSx}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return (
                        <span className="ticket-select-placeholder">
                          Select department
                        </span>
                      );
                    }

                    const dept = departments.find(
                      (d) => String(d.id) === String(selected)
                    );
                    return dept ? dept.name : "";
                  },
                }}
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>

            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField 
              label="Requested By" 
              placeholder="Enter Name" 
              value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} 
              fullWidth sx={createTicketFocusedFieldSx} 
              InputLabelProps={{ shrink: true }} 
              disabled={loading} />

              <TextField
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                fullWidth
                sx={createTicketFocusedFieldSx}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return (
                        <span className="ticket-select-placeholder">
                          Select priority
                        </span>
                      );
                    }

                    const map: Record<string, string> = {
                      low: "Low",
                      medium: "Medium",
                      high: "High",
                    };

                    return map[selected as string];
                  },
                }}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>

            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Assign To"
                value={assigneeId}
                onChange={(e) =>
                  setAssigneeId(e.target.value === "" ? "" : Number(e.target.value))
                }
                fullWidth
                sx={createTicketFocusedFieldSx}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return (
                        <span className="ticket-select-placeholder">
                          Select assignee
                        </span>
                      );
                    }

                    const emp = employees.find(
                      (e) => String(e.id) === String(selected)
                    );

                    return emp
                      ? `${emp.emp_name} (${emp.department_name})`
                      : "";
                  },
                }}
              >
                {employees.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.emp_name} ({e.department_name})
                  </MenuItem>
                ))}
              </TextField>


<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Due Date"
    value={dueDate}
onChange={(v) => setDueDate(v as Dayjs | null)}    disabled={loading}
    slotProps={{
      textField: {
        fullWidth: true,
        sx: createTicketFocusedFieldSx,
        InputLabelProps: { shrink: true }
      }
    }}
  />
</LocalizationProvider>

            </Stack>

            <Box
              sx={{
                width: { xs: "100%", sm: "70%", md: "50%" }, 
              }}
            >
              <TextField
                label="Upload Documents"
                value={selectedFile?.name || ""}
                placeholder="No file Choosen"
                fullWidth
                sx={createTicketFocusedFieldSx}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <Button
                      component="label"
                      disabled={loading}
                      sx={createTicketUploadButtonSx}
                    >
                      Choose File
                      <input
                        hidden
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </Button>

                  ),
                  readOnly: true,
                }}
              />
            </Box>


            <Stack direction="row" justifyContent="flex-end" spacing={2} pt={1}>
              <Button onClick={handleClose} sx={createTicketCancelButtonSx} disabled={loading}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit} sx={createTicketSaveButtonSx} disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicket;