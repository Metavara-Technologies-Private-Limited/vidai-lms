import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  MenuItem,
  Button,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: {
    fromDate?: string;
    toDate?: string;
    quality?: string;
    status?: string;
    location?: string;
    assignee?: string;
    source?: string;
    subSource?: string;
  }) => void;
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 52,
    borderRadius: "10px",
    color: "#9E9E9E",
    "& fieldset": { borderColor: "#D1D5DB" },
    "&:hover fieldset": { borderColor: "#D1D5DB" },
    "&.Mui-focused fieldset": { borderColor: "#D1D5DB" },
  },
  "& .MuiOutlinedInput-input": { color: "#9E9E9E" },
  "& .MuiSelect-select": { color: "#9E9E9E" },
  "& .MuiInputLabel-root": { color: "#9CA3AF", fontSize: "14px" },
};

const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onClose,
  onApply,
}) => {
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [quality, setQuality] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [source, setSource] = React.useState("");
  const [subSource, setSubSource] = React.useState("");

  const handleApply = () => {
    onApply({
      fromDate,
      toDate,
      quality,
      status,
      location,
      assignee,
      source,
      subSource,
    });
    onClose();
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setQuality("");
    setStatus("");
    setLocation("");
    setAssignee("");
    setSource("");
    setSubSource("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px", padding: 2 } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 600,
          fontSize: "18px",
          color: "#9E9E9E",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        Filter By
        <IconButton onClick={onClose} sx={{ color: "#9E9E9E" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* DATE RANGE */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="From Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <TextField
              label="To Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Stack>

          {/* QUALITY + STATUS */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Lead Quality"
              select
              fullWidth
              sx={fieldSx}
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Hot">Hot</MenuItem>
              <MenuItem value="Warm">Warm</MenuItem>
              <MenuItem value="Cold">Cold</MenuItem>
            </TextField>

            <TextField
              label="Status"
              select
              fullWidth
              sx={fieldSx}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Converted">Converted</MenuItem>
              <MenuItem value="Lost">Lost</MenuItem>
            </TextField>
          </Stack>

          {/* LOCATION + ASSIGNEE */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Location"
              select
              fullWidth
              sx={fieldSx}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="LA">LA Jolla, California</MenuItem>
              <MenuItem value="NY">New York</MenuItem>
            </TextField>

            <TextField
              label="Assignee"
              select
              fullWidth
              sx={fieldSx}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Henry">Henry Cavill</MenuItem>
              <MenuItem value="Chris">Chris Evans</MenuItem>
            </TextField>
          </Stack>

          {/* SOURCE + SUB SOURCE */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Source"
              select
              fullWidth
              sx={fieldSx}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Social">Social Media</MenuItem>
              <MenuItem value="Website">Website</MenuItem>
            </TextField>

            <TextField
              label="Sub-Source"
              select
              fullWidth
              sx={fieldSx}
              value={subSource}
              onChange={(e) => setSubSource(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Facebook">Facebook</MenuItem>
              <MenuItem value="Instagram">Instagram</MenuItem>
            </TextField>
          </Stack>

          {/* ACTION BUTTONS */}
          <Stack direction="row" spacing={2} pt={1}>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                height: 52,
                borderRadius: "10px",
                borderColor: "#D1D5DB",
                color: "#9E9E9E",
              }}
              onClick={handleClear}
            >
              Clear All
            </Button>

            <Button
              variant="contained"
              fullWidth
              sx={{
                height: 52,
                borderRadius: "10px",
                backgroundColor: "#4B5563",
              }}
              onClick={handleApply}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;
