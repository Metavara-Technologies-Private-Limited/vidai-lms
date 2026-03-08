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
import {
  filterTicketsFocusedFieldSx,
  filterTicketsCloseButtonSx,
  filterTicketsClearButtonSx,
  filterTicketsApplyButtonSx,
  filterTicketsSelectFieldSx,
} from "../../styles/Settings/Tickets.styles";
const modes = ["WhatsApp", "Email", "SMS"];
const statuses = ["Sent", "Schedule", "Draft"];

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
};

const ReputationFilter = ({ onOpen }: Props) => {

  /* FILTER DIALOG STATE */
  const [open, setOpen] = useState(false);
const [status, setStatus] = useState("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Box
        sx={{
          mt: 2,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Title */}
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 600,
            color: "#1A1A1A",
          }}
        >
          Review Requests
        </Typography>

        {/* Right Controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search by Request name"
            sx={{
              width: 260,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                background: "#fff",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#8A8A8A" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Filter Button */}
          <IconButton
            onClick={handleOpen}
          >
            <img src={Filter_Leads} alt="Filter" />
          </IconButton>

          {/* New Review Request Button */}
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onOpen}
            sx={{
              textTransform: "none",
              borderRadius: 1,
              backgroundColor: "#505050",
              fontWeight: 600,
              px: 2,
              height: 40,
              "&:hover": {
                backgroundColor: "#232323",
              },
            }}
          >
            New Review Request
          </Button>
        </Box>
      </Box>

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
<Typography fontWeight={700}>Filter By</Typography>

<IconButton
  onClick={handleClose}
  sx={filterTicketsCloseButtonSx}
>
  <CloseIcon />
</IconButton>

        </Box>
<Divider sx={{ my: 1, mx: -2, mb: 2 }} />

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

        </Box>
        </LocalizationProvider>

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
            Apply
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default ReputationFilter;