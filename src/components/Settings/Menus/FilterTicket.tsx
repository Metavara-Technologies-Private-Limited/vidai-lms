import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  MenuItem,
  Stack,
  Button,
  Typography,
  Divider,
} from "@mui/material";

import { useEffect, useState } from "react";
import { clinicsApi } from "../../../services/tickets.api";
import CloseIcon from "@mui/icons-material/Close";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
// Styles and Types
import {
  filterTicketsFocusedFieldSx,
  filterTicketsTitleSx,
  filterTicketsCloseButtonSx,
  filterTicketsClearButtonSx,
  filterTicketsApplyButtonSx,
  filterTicketsSelectFieldSx,
} from "../../../styles/Settings/Tickets.styles";
import type { Department, TicketPriority, FilterTicketsProps } from "../../../types/tickets.types";
// Component 
const FilterTickets = ({ open, onClose, onApply }: FilterTicketsProps) => {
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs());
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs().add(1, "day"));

  const CLINIC_ID = "1";

  const [priority, setPriority] = useState<string>("");
  const [department, setDepartment] = useState<number | "">("");
  const [departments, setDepartments] = useState<Department[]>([]);

  const handleClear = () => {
    setFromDate(null);
    setToDate(null);
    setPriority("");
    setDepartment("");
    onApply?.(null);
    onClose();
  };

  const handleApply = () => {
    onApply?.({
      fromDate,
      toDate,
      priority: (priority as TicketPriority) || null,
      department_id: department || null,
    });
    onClose();
  };

  useEffect(() => {
    if (open) {
      const loadDepartments = async () => {
        try {
          const clinic = await clinicsApi.getClinicDetail(CLINIC_ID);
          setDepartments(clinic?.department || []);
        } catch (err) {
          console.error("Failed to fetch departments", err);
          setDepartments([]);
        }
      };

      loadDepartments();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ position: "relative", pb: 1 }}>
        <Typography variant="h6" sx={filterTicketsTitleSx}>
          Filter By
        </Typography>

        <IconButton onClick={onClose} sx={filterTicketsCloseButtonSx}>
          <CloseIcon fontSize="small" />
        </IconButton>

        <Divider sx={{ mt: 2, mx: -3 }} />
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} mt={2}>
          {/* Dates */}
          <Stack direction="row" spacing={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(v) => setFromDate(v)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: filterTicketsFocusedFieldSx,
                  },
                }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(v) => setToDate(v)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: filterTicketsFocusedFieldSx,
                  },
                }}
              />
            </LocalizationProvider>
          </Stack>

          {/* Dropdowns */}
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Priority"
              fullWidth
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              sx={filterTicketsSelectFieldSx}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>

            </TextField>

            <TextField
              select
              label="Department"
              fullWidth
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value === "" ? "" : Number(e.target.value))
              }
              sx={filterTicketsSelectFieldSx}
            >
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>

          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={2} mt={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClear}
              sx={filterTicketsClearButtonSx}
            >
              Clear All
            </Button>

            <Button
              fullWidth
              variant="contained"
              onClick={handleApply}
              sx={filterTicketsApplyButtonSx}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default FilterTickets;
