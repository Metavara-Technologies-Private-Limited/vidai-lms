import { useState } from "react";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import SearchIcon from "@mui/icons-material/Search";
import Filter_Leads from "../../assets/icons/Filter_Leads.svg";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
<<<<<<< Updated upstream
import {
  filterTicketsFocusedFieldSx,
  filterTicketsCloseButtonSx,
  filterTicketsClearButtonSx,
  filterTicketsApplyButtonSx,
  filterTicketsSelectFieldSx,
} from "../../styles/Settings/Tickets.styles";
const modes = ["WhatsApp", "Email", "SMS"];
const statuses = ["Sent", "Schedule", "Draft"];
=======

const platforms = ["instagram", "facebook", "linkedin"];
const statuses  = ["Live", "Scheduled", "Draft"];
>>>>>>> Stashed changes

const getStatusChipStyle = (status: string) => {
  switch (status) {
    case "Sent":
      return {
        color: "#34A853",
        border: "1px solid #34A853",
        background: "#E6F4EA",
      };
    case "Draft":
      return {
        color: "#8A8A8A",
        border: "1px solid #BDBDBD",
        background: "#F5F5F5",
      };
    case "Schedule":
      return {
        color: "#6B5AE0",
        border: "1px solid #6B5AE0",
        background: "#ECE9FF",
      };
    default:
      return {};
  }
};

type Props = {
  onOpen: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterMode: string;
  onModeChange: (v: string) => void;
  filterStatus: string;
  onStatusChange: (v: string) => void;
  filterFrom: string;
  onFromChange: (v: string) => void;
  filterTo: string;
  onToChange: (v: string) => void;
};

const ReputationFilter = ({
  onOpen,
  searchQuery,
  onSearchChange,
  filterMode,
  onModeChange,
  filterStatus,
  onStatusChange,
  filterFrom,
  onFromChange,
  filterTo,
  onToChange,
}: Props) => {
  const [open, setOpen] = useState(false);
const [status, setStatus] = useState("");

  const handleClearAll = () => {
    onModeChange("");
    onStatusChange("");
    onFromChange("");
    onToChange("");
    setOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          mt: 2, mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1A1A1A" }}>
          Social Media Campaigns
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search by Campaign name"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              width: 260,
<<<<<<< Updated upstream
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                background: "#fff",
              },
=======
              "& .MuiOutlinedInput-root": { borderRadius: 2, background: "#fff" },
>>>>>>> Stashed changes
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#8A8A8A" }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton
<<<<<<< Updated upstream
            onClick={handleOpen}
=======
            onClick={() => setOpen(true)}
            sx={{
              border: "1px solid #E5E7EB", borderRadius: 2,
              width: 40, height: 40, background: "#fff",
            }}
>>>>>>> Stashed changes
          >
            <img src={Filter_Leads} alt="Filter" />
          </IconButton>

          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onOpen}
            sx={{
<<<<<<< Updated upstream
              textTransform: "none",
              borderRadius: 1,
              backgroundColor: "#505050",
              fontWeight: 600,
              px: 2,
              height: 40,
              "&:hover": {
                backgroundColor: "#232323",
              },
=======
              textTransform: "none", borderRadius: 2,
              backgroundColor: "#4A4A4A", fontWeight: 500,
              px: 2, height: 40,
              "&:hover": { backgroundColor: "#333" },
>>>>>>> Stashed changes
            }}
          >
            New Review Request
          </Button>
        </Box>
      </Box>

<<<<<<< Updated upstream
      {/* FILTER DIALOG */}
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="sm"
  PaperProps={{
    sx: {
      borderRadius: 2,
      p: 2,
      width: 500,   
    },
  }}
>
        {/* Header */}
=======
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
      >
>>>>>>> Stashed changes
        <Box
          sx={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", mb: 2,
          }}
        >
<<<<<<< Updated upstream
<Typography fontWeight={700}>Filter By</Typography>

<IconButton
  onClick={handleClose}
  sx={filterTicketsCloseButtonSx}
>
  <CloseIcon />
</IconButton>

=======
          <Typography fontWeight={600}>Filter By</Typography>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
>>>>>>> Stashed changes
        </Box>
<Divider sx={{ my: 1, mx: -2, mb: 2 }} />

<<<<<<< Updated upstream
<LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* Form Fields */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
<DatePicker
  label="From Date"
  slotProps={{
    textField: {
      fullWidth: true,
      sx: filterTicketsFocusedFieldSx,
    },
  }}
/>

<DatePicker
  label="To Date"
  slotProps={{
    textField: {
      fullWidth: true,
      sx: filterTicketsFocusedFieldSx,
    },
  }}
/>
          <TextField
  select
  label="Mode"
  fullWidth
  sx={filterTicketsSelectFieldSx}
>
            {modes.map((mode) => (
              <MenuItem key={mode} value={mode}>
                {mode}
              </MenuItem>
            ))}
          </TextField>

{/* STATUS SELECT WITH CHIPS */}

<TextField
  select
  label="Status"
  fullWidth
    sx={filterTicketsSelectFieldSx}
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  SelectProps={{
    renderValue: (selected) => (
      <Chip
        label={selected as string}
        sx={{
          ...getStatusChipStyle(selected as string),
          fontWeight: 600,
          borderRadius: "16px",
          height: 28,
        }}
      />
    ),
  }}
>
  {statuses.map((item) => (
<MenuItem key={item} value={item}>
  <Chip
    label={item}
    sx={{
      ...getStatusChipStyle(item),
      fontWeight: 600,
      borderRadius: "16px",
      height: 26,
    }}
  />
</MenuItem>
  ))}
</TextField>

=======
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TextField
            label="From Date" type="date"
            value={filterFrom}
            onChange={(e) => onFromChange(e.target.value)}
            InputLabelProps={{ shrink: true }} fullWidth
          />
          <TextField
            label="To Date" type="date"
            value={filterTo}
            onChange={(e) => onToChange(e.target.value)}
            InputLabelProps={{ shrink: true }} fullWidth
          />
          <TextField
            select label="Platform"
            value={filterMode}
            onChange={(e) => onModeChange(e.target.value)}
            fullWidth
          >
            <MenuItem value="">All Platforms</MenuItem>
            {platforms.map((p) => (
              <MenuItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Status"
            value={filterStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            fullWidth
          >
            <MenuItem value="">All Statuses</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
>>>>>>> Stashed changes
        </Box>
        </LocalizationProvider>

<<<<<<< Updated upstream
        {/* Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 3,
          }}
        >
<Button
  fullWidth
  variant="outlined"
  sx={filterTicketsClearButtonSx}
>
            Clear All
          </Button>

<Button
  fullWidth
  variant="contained"
  sx={filterTicketsApplyButtonSx}
>
=======
        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Button
            fullWidth variant="outlined"
            onClick={handleClearAll}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Clear All
          </Button>
          <Button
            fullWidth variant="contained"
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: 2, textTransform: "none",
              background: "#4A4A4A", "&:hover": { background: "#333" },
            }}
          >
>>>>>>> Stashed changes
            Apply
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default ReputationFilter;