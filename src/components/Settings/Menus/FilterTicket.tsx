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
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import type { FilterTicketsProps } from "../../../types/Settings.types";

import {
  filterTicketsFocusedFieldSx,
  filterTicketsTitleSx,
  filterTicketsCloseButtonSx,
  filterTicketsClearButtonSx,
  filterTicketsApplyButtonSx,
  filterTicketsSelectFieldSx,
} from "../../../styles/Settings/Tickets.styles";

const FilterTickets = ({ open, onClose, onApply }: FilterTicketsProps) => {
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs());
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs().add(1, "day"));
  const [priority, setPriority] = useState("Low");
  const [department, setDepartment] = useState("Andrology");

  const handleClear = () => {
    setFromDate(null);
    setToDate(null);
    setPriority("");
    setDepartment("");
    onApply?.(null);
    onClose();
  };

  const handleApply = () => {
    onApply?.({ fromDate, toDate, priority, department });
    onClose();
  };

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
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>

            <TextField
              select
              label="Department"
              fullWidth
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              sx={filterTicketsSelectFieldSx}
            >
              <MenuItem value="Andrology">Andrology</MenuItem>
              <MenuItem value="Embryology">Embryology</MenuItem>
              <MenuItem value="Cryopreservation">
                Cryopreservation
              </MenuItem>
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
