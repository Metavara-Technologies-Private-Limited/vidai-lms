/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Box,
  Button,
  MenuItem,
  Stack,
  Typography,
  Divider,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { AppDispatch } from "../../../store";
import { fetchTickets, fetchTicketDashboard } from "../../../store/ticketSlice";
import { ticketsApi, labsApi, clinicsApi } from "../../../services/tickets.api";
import { authApi } from "../../../services/auth.api";
import type { CreateTicketProps } from "../../../types/Settings.types";
import type {
  CreateTicketRequest,
  TicketPriority,
  Lab,
  Department,
  PaginatedResponse,
} from "../../../types/tickets.types";

import {
  createTicketFocusedFieldSx,
  createTicketDialogPaperSx,
  createTicketCloseButtonSx,
  createTicketCancelButtonSx,
  createTicketSaveButtonSx,
  createTicketUploadButtonSx,
} from "../../../styles/Settings/Tickets.styles";
import { selectUser } from "../../../store/authSlice";
import { selectClinic } from "../../../store/clinicSlice";
import { selectUsers } from "../../../store/userSlice";

type AssigneeOption = {
  id: number;
  first_name: string | undefined;
  last_name: string | undefined;
  username: string | undefined;
  role: string | undefined;
  designation: string | undefined;
  email?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeAssignees = (res: any): AssigneeOption[] => {
  const users = res?.data?.objects || [];

  return users.map((u: any) => ({
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    username: u.username,
    role: u.role_label || u.role,
    designation: u.designation,
    email:
      u.email ||
      u.emp_email ||
      u.user_email ||
      u.official_email ||
      u?.user?.email ||
      undefined,
  }));
};

const normalizeUsersList = (users: any[]): AssigneeOption[] => {
  return users.map((u) => ({
    id: u.id,
    first_name: u.first_name ?? u.firstName,
    last_name: u.last_name ?? u.lastName,
    username: u.username,
    role: u.role?.name || u.role,
    designation: undefined,
    email: u.email ?? undefined,
  }));
};

const isValidEmail = (email: string | undefined): email is string =>
  typeof email === "string" && EMAIL_REGEX.test(email.trim());

const assigneeLabel = (option: AssigneeOption): string => {
  const fullName =
    `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  return primary;
};

const MAX_TICKET_SUBJECT_LENGTH = 150;
const MAX_TICKET_DESCRIPTION_LENGTH = 500;
const MAX_TICKET_REQUESTED_BY_LENGTH = 50;
const MAX_TICKET_ASSIGNED_TO_LENGTH = 50;

const CreateTicket = ({ open, onClose }: CreateTicketProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const selectedClinic = useSelector(selectClinic);
  const clinicId =
    selectedClinic?.id ??
    (Number(localStorage.getItem("clinic_id") || 0) || null) ??
    user?.clinics?.find((clinic) => clinic.is_default)?.clinic_id ??
    user?.clinics?.[0]?.clinic_id ??
    1;

  // --- Form States ---
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [labId, setLabId] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [assigneeId, setAssigneeId] = useState<number | "">("");
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [requestedBy, setRequestedBy] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  // --- Data States (Dropdowns) ---
  const [labs, setLabs] = useState<Lab[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // --- UI States ---
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const users = useSelector(selectUsers);

  const authMode = localStorage.getItem("auth_mode");
  const isInternal = authMode === "INT";

  const getAssigneeEmailById = (id: number | "") => {
    if (!id) return "";

    const assigneeFromOptions = assigneeOptions.find(
      (option) => option.id === id,
    );
    if (assigneeFromOptions?.email) return assigneeFromOptions.email.trim();

    const assigneeFromUsers = users.find((u) => u.id === id);
    if (assigneeFromUsers?.email) return assigneeFromUsers.email.trim();

    return "";
  };

  const getRequestedByEmail = () => {
    // Always use the logged-in user's email as the requester
    if (user?.email && isValidEmail(user.email)) {
      return user.email.trim();
    }
    return "";
  };

  useEffect(() => {
    if (user?.first_name && user?.last_name) {
      setRequestedBy(
        `${user.first_name} ${user.last_name}`.slice(
          0,
          MAX_TICKET_REQUESTED_BY_LENGTH,
        ),
      );
    } else if (user?.username) {
      setRequestedBy(user.username.slice(0, MAX_TICKET_REQUESTED_BY_LENGTH));
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!assigneeSearch.trim()) {
        setAssigneeOptions([]);
        return;
      }

      try {
        setAssigneeLoading(true);

        if (isInternal) {
          const normalized = normalizeUsersList(users);

          const filtered = normalized.filter((u) =>
            `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.username ?? ""}`
              .toLowerCase()
              .includes(assigneeSearch.toLowerCase()),
          );

          setAssigneeOptions(filtered);
        } else {
          // API
          const response = await authApi.searchUsers({
            search: assigneeSearch,
            limit: 20,
            offset: 0,
          });

          setAssigneeOptions(normalizeAssignees(response));
        }
      } catch {
        setAssigneeOptions([]);
      } finally {
        setAssigneeLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assigneeSearch, isInternal, users]);

  // 1. Fetch live data for dropdowns matching Swagger definitions
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setLoadingData(true);
        try {
          const results = await Promise.allSettled([
            labsApi.getLabs(clinicId),
            clinicsApi.getClinicDetail(clinicId),
          ]);

          if (results[0].status === "fulfilled") {
            const labsData = results[0].value as Lab[] | PaginatedResponse<Lab>;
            const labList = Array.isArray(labsData)
              ? labsData
              : labsData.results;
            setLabs(labList.filter((l) => l.is_active));
          } else {
            console.error("Labs API failed. Using empty list.");
            setLabs([]);
          }

          if (results[1].status === "fulfilled") {
            setDepartments(results[1].value?.department || []);
          }
        } catch {
          const connError = "Connection error. Check backend server.";
          toast.error(connError);
        } finally {
          setLoadingData(false);
        }
      };
      loadData();
    }
  }, [open, clinicId]);

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

    if (subject.trim().length > MAX_TICKET_SUBJECT_LENGTH) {
      toast.warn("Subject cannot exceed 150 characters.");
      return;
    }

    if (description.trim().length > MAX_TICKET_DESCRIPTION_LENGTH) {
      toast.warn("Description cannot exceed 500 characters.");
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

    if (requestedBy.trim().length > MAX_TICKET_REQUESTED_BY_LENGTH) {
      toast.warn("Requested By cannot exceed 50 characters.");
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

    const assigneeEmail = getAssigneeEmailById(assigneeId);
    const requestedByEmail = getRequestedByEmail();

    if (!isValidEmail(assigneeEmail)) {
      toast.error(
        "Assigned user's email is invalid. Please choose a valid assignee.",
      );
      return;
    }

    if (!isValidEmail(requestedByEmail)) {
      toast.error(
        "Requested by user's email is invalid. Please verify your login email.",
      );
      return;
    }

    setLoading(true);
    try {
      const clinicName = selectedClinic?.name || "Clinic";
      const dueDateString = dueDate ? dueDate.format("YYYY-MM-DD") : "";
      const createdBodyLines = [
        `Hi ${assigneeName || "Team"},`,
        "",
        "A new support ticket has been created and assigned to you.",
        "",
        "Ticket Details:",
        `Ticket ID: Pending`,
        `Subject: ${subject.trim()}`,
        `Priority: ${priority}`,
        `Status: New`,
        `Due Date: ${dueDateString || "Not set"}`,
        "",
        "Description:",
        description.trim() || "No description provided.",
        "",
        "Requested By:",
        requestedBy.trim() || "Unknown",
        "",
        "Please review and respond to this ticket at your earliest convenience.",
        "",
        "Regards,",
        `${clinicName} Support Team`,
      ].join("\n");

      const payload: CreateTicketRequest = {
        subject: subject.trim(),
        description: description.trim() || "No description provided",
        lab: labId,
        department: Number(departmentId),
        requested_by: requestedBy.trim(),
        priority: priority as TicketPriority,
        status: "new",
        assigned_to: assigneeId ? Number(assigneeId) : null,
        assigned_to_name: assigneeName || undefined,
        due_date: dueDate ? dueDate.format("YYYY-MM-DD") : null,
        event: "ticket_created",
        clinicName,
        to: [assigneeEmail],
        cc: [requestedByEmail],
        email_body: createdBodyLines,
      };

      const res = await ticketsApi.createTicket(payload);

      if (selectedFile && res.id) {
        await ticketsApi.uploadDocument(res.id, selectedFile);
      }
      toast.success("Ticket created successfully!");
      handleClose();
      dispatch(fetchTickets());
      dispatch(fetchTicketDashboard());
    } catch (err: unknown) {
      let finalError =
        "Submission failed. Ensure Lab and Department IDs are valid.";

      if (typeof err === "object" && err !== null && "response" in err) {
        const serverData = (err as { response?: { data?: unknown } }).response
          ?.data;

        const stringifyError = (value: unknown): string => {
          if (value == null) return "Unknown error";
          if (typeof value === "string") return value;
          if (typeof value === "number" || typeof value === "boolean")
            return String(value);
          if (Array.isArray(value)) return value.map(stringifyError).join(", ");
          if (typeof value === "object") {
            return Object.entries(value as Record<string, unknown>)
              .map(
                ([key, nestedValue]) =>
                  `${key}: ${stringifyError(nestedValue)}`,
              )
              .join(" | ");
          }
          return String(value);
        };

        if (serverData && typeof serverData === "object") {
          finalError = stringifyError(serverData);
        }
      }

      toast.error(finalError);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size should be less than 25MB");
      return;
    }

    setSelectedFile(file);
  };

  const reset = () => {
    setSubject("");
    setDescription("");
    setDueDate(null);
    setLabId("");
    setDepartmentId("");
    setPriority("");
    setAssigneeId("");
    setAssigneeName("");
    setRequestedBy("");
    setAssigneeSearch("");
    setAssigneeOptions([]);
    setSelectedFile(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      scroll="paper"
      PaperProps={{ sx: createTicketDialogPaperSx }}
    >
      <DialogTitle sx={{ position: "relative" }}>
        <Typography fontWeight={700} fontSize="1.1rem">
          New Ticket
        </Typography>
        <IconButton onClick={handleClose} sx={createTicketCloseButtonSx}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Divider sx={{ mt: 2, mx: -3 }} />
      </DialogTitle>

      <DialogContent
        sx={{
          maxHeight: "calc(100vh - 180px)",
          overflowY: "auto",
        }}
      >
        {loadingData ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Fetching latest Lab & Assignee records...
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2.5} mt={2}>
            <TextField
              label="Subject"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => {
                const value = e.target.value;

                // Allow only alphanumeric + space
                const alphanumericRegex = /^[a-zA-Z0-9 ]*$/;

                if (!alphanumericRegex.test(value)) {
                  toast.error("Only letters and numbers are allowed");
                  return;
                }

                if (value.length === 1 && !/^[a-zA-Z]/.test(value)) {
                  toast.error("Subject must start with a letter");
                  return;
                }

                setSubject(value.slice(0, MAX_TICKET_SUBJECT_LENGTH));
              }}
              fullWidth
              sx={createTicketFocusedFieldSx}
              helperText={`${subject.length}/${MAX_TICKET_SUBJECT_LENGTH}`}
              FormHelperTextProps={{
                sx: {
                  textAlign: "right",
                  color:
                    subject.length >= MAX_TICKET_SUBJECT_LENGTH
                      ? "error.main"
                      : "text.secondary",
                },
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ maxLength: MAX_TICKET_SUBJECT_LENGTH }}
              disabled={loading}
            />

            <TextField
              label="Detailed Description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => {
                const value = e.target.value;

                if (value.length === 1 && !/^[a-zA-Z]/.test(value)) {
                  toast.error("Description must start with a letter");
                  return;
                }

                setDescription(value.slice(0, MAX_TICKET_DESCRIPTION_LENGTH));
              }}
              multiline
              minRows={1}
              maxRows={3}
              fullWidth
              sx={createTicketFocusedFieldSx}
              helperText={`${description.length}/${MAX_TICKET_DESCRIPTION_LENGTH}`}
              FormHelperTextProps={{
                sx: {
                  textAlign: "right",
                  color:
                    description.length >= MAX_TICKET_DESCRIPTION_LENGTH
                      ? "error.main"
                      : "text.secondary",
                },
              }}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{ maxLength: MAX_TICKET_DESCRIPTION_LENGTH }}
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
                      return (
                        <span className="ticket-select-placeholder">
                          Select lab name
                        </span>
                      );
                    }
                    const lab = labs.find(
                      (l) => String(l.id) === String(selected),
                    );
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
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? "" : Number(e.target.value);
                  setDepartmentId(value);
                  setAssigneeId("");
                }}
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
                      (d) => String(d.id) === String(selected),
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
                value={requestedBy}
                fullWidth
                sx={createTicketFocusedFieldSx}
                InputLabelProps={{ shrink: true }}
                inputProps={{ maxLength: MAX_TICKET_REQUESTED_BY_LENGTH }}
                disabled
              />

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
              <Autocomplete
                options={assigneeOptions}
                loading={assigneeLoading}
                value={
                  assigneeOptions.find((option) => option.id === assigneeId) ||
                  null
                }
                onInputChange={(_, value, reason) => {
                  if (reason === "input") {
                    setAssigneeSearch(
                      value.slice(0, MAX_TICKET_ASSIGNED_TO_LENGTH),
                    );
                  }
                }}
                onChange={(_, value) => {
                  setAssigneeId(value?.id ?? "");
                  if (value) {
                    const fullName = assigneeLabel(value);
                    setAssigneeName(fullName);
                  } else {
                    setAssigneeName("");
                  }
                }}
                getOptionLabel={assigneeLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                fullWidth
                disabled={loading}
                noOptionsText="Type to search assignee"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign To"
                    placeholder="Search assignee"
                    sx={createTicketFocusedFieldSx}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      ...params.inputProps,
                      maxLength: MAX_TICKET_ASSIGNED_TO_LENGTH,
                    }}
                  />
                )}
              />

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Due Date"
                  value={dueDate}
                  onChange={(v) => setDueDate(v as Dayjs | null)}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: createTicketFocusedFieldSx,
                      InputLabelProps: { shrink: true },
                    },
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
                fullWidth
                value=""
                placeholder="No file chosen"
                sx={{
                  ...createTicketFocusedFieldSx,

                  // 🔥 reduce height
                  "& .MuiInputBase-root": {
                    height: 40,
                    paddingRight: "8px",
                  },

                  "& input": {
                    padding: "6px 8px",
                  },
                }}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <Button
                      component="label"
                      disabled={loading}
                      sx={{
                        ...createTicketUploadButtonSx,
                        height: 28, // 🔥 smaller button
                        fontSize: 12,
                        px: 1.5,
                      }}
                    >
                      Choose File
                      <input
                        hidden
                        type="file"
                        onChange={(e) => handleFileChange(e)}
                      />
                    </Button>
                  ),

                  // ✅ FILE DISPLAY INSIDE BOX
                  endAdornment: selectedFile ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        maxWidth: "70%",
                      }}
                    >
                      {/* FILE NAME */}
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: 13,
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        onClick={() => {
                          const url = URL.createObjectURL(selectedFile);
                          window.open(url, "_blank");
                        }}
                      >
                        {selectedFile.name}
                      </Typography>

                      {/* ❌ SMALL REMOVE */}
                      <IconButton
                        size="small"
                        onClick={() => setSelectedFile(null)}
                        sx={{ p: 0.3 }}
                      >
                        ✕
                      </IconButton>
                    </Box>
                  ) : null,

                  readOnly: true,
                }}
              />

              {/* HELPER TEXT */}
              <Typography
                variant="caption"
                sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
              >
                All formats accepted. Max file size 25 MB
              </Typography>
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={2} pt={1}>
              <Button
                onClick={handleClose}
                sx={createTicketCancelButtonSx}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={createTicketSaveButtonSx}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Save"
                )}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicket;
