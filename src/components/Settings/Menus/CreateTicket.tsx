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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import type { CreateTicketProps } from "../../../types/Settings.types";

import {
  createTicketFocusedFieldSx,
  createTicketDialogPaperSx,
  createTicketCloseButtonSx,
  createTicketUploadButtonSx,
  createTicketCancelButtonSx,
  createTicketSaveButtonSx,
} from "../../../styles/Settings/Tickets.styles";

const CreateTicket = ({ open, onClose }: CreateTicketProps) => {
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [labName, setLabName] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: createTicketDialogPaperSx }}
    >
      <DialogTitle sx={{ position: "relative" }}>
        <Typography fontWeight={600}>New Ticket</Typography>

        <IconButton onClick={onClose} sx={createTicketCloseButtonSx}>
          <CloseIcon fontSize="small" />
        </IconButton>

        <Divider sx={{ mt: 2, mx: -3 }} />
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} mt={2}>
          <TextField
            label="Subject"
            InputLabelProps={{ shrink: true }}
            placeholder="Enter subject"
            fullWidth
            sx={createTicketFocusedFieldSx}
          />

          <TextField
            label="Description"
            InputLabelProps={{ shrink: true }}
            placeholder="Enter description"
            multiline
            rows={1}
            fullWidth
            sx={createTicketFocusedFieldSx}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Lab Name"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={createTicketFocusedFieldSx}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) =>
                  selected === "" ? (
                    <span style={{ color: "#9E9E9E" }}>Select Lab Name</span>
                  ) : (
                    String(selected)
                  ),
              }}
            >
              <MenuItem value="">Select Lab Name</MenuItem>
              <MenuItem value="Health Lab">Health Lab</MenuItem>
            </TextField>

            <TextField
              select
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={createTicketFocusedFieldSx}
            >
              <MenuItem value="">Select Department</MenuItem>
              <MenuItem value="Andrology">Andrology</MenuItem>
              <MenuItem value="Embryology">Embryology</MenuItem>
            </TextField>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Requested By"
              InputLabelProps={{ shrink: true }}
              placeholder="Enter Name"
              fullWidth
              sx={createTicketFocusedFieldSx}
            />

            <TextField
              select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={createTicketFocusedFieldSx}
            >
              <MenuItem value="">Select Priority</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Assign To"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={createTicketFocusedFieldSx}
            >
              <MenuItem value="">Select Assignee</MenuItem>
              <MenuItem value="John">Anil</MenuItem>
              <MenuItem value="Emma">Reddy</MenuItem>
            </TextField>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(v) => setDueDate(v)}
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

          <Box sx={{ width: "50%" }}>
            <TextField
              label="Upload Documents"
              fullWidth
              sx={createTicketFocusedFieldSx}
              InputProps={{
                startAdornment: (
                  <Button component="label" sx={createTicketUploadButtonSx}>
                    Choose File
                    <input hidden type="file" />
                  </Button>
                ),
                readOnly: true,
              }}
              placeholder="No File Chosen"
            />
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={2} mt={2}>
            <Button variant="outlined" onClick={onClose} sx={createTicketCancelButtonSx}>
              Cancel
            </Button>

            <Button variant="contained" sx={createTicketSaveButtonSx}>
              Save
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicket;
