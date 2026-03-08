import { useState } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import MenuItem from "@mui/material/MenuItem";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

const modes = ["WhatsApp", "Email", "SMS"];
const statuses = ["Sent", "Schedule", "Draft"];

type Props = {
  onOpen: () => void;
};

const ReputationFilter = ({ onOpen }: Props) => {

  /* FILTER DIALOG STATE */
  const [open, setOpen] = useState(false);

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
                borderRadius: 2,
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
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 2,
              width: 40,
              height: 40,
              background: "#fff",
            }}
          >
            <FilterListIcon />
          </IconButton>

          {/* New Review Request Button */}
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onOpen}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              backgroundColor: "#4A4A4A",
              fontWeight: 500,
              px: 2,
              height: 40,
              "&:hover": {
                backgroundColor: "#333",
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
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 2 },
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
          <Typography fontWeight={600}>Filter By</Typography>

          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Form Fields */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          <TextField
            label="From Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="To Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField select label="Mode" fullWidth>
            {modes.map((mode) => (
              <MenuItem key={mode} value={mode}>
                {mode}
              </MenuItem>
            ))}
          </TextField>

          <TextField select label="Status" fullWidth>
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Box>

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
            sx={{
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            Clear All
          </Button>

          <Button
            fullWidth
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              background: "#4A4A4A",
              "&:hover": { background: "#333" },
            }}
          >
            Apply
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default ReputationFilter;