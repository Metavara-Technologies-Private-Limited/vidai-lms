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

import SearchIcon from "@mui/icons-material/Search";
import Filter_Leads from "../../assets/icons/Filter_Leads.svg";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

const platforms = ["instagram", "facebook", "linkedin"];
const statuses  = ["Live", "Scheduled", "Draft"];

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
              "& .MuiOutlinedInput-root": { borderRadius: 2, background: "#fff" },
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
            onClick={() => setOpen(true)}
            sx={{
              border: "1px solid #E5E7EB", borderRadius: 2,
              width: 40, height: 40, background: "#fff",
            }}
          >
            <img src={Filter_Leads} alt="Filter" />
          </IconButton>

          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onOpen}
            sx={{
              textTransform: "none", borderRadius: 2,
              backgroundColor: "#4A4A4A", fontWeight: 500,
              px: 2, height: 40,
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            New Review Request
          </Button>
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
      >
        <Box
          sx={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", mb: 2,
          }}
        >
          <Typography fontWeight={600}>Filter By</Typography>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ my: 1, mx: -2, mb: 2 }} />

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
        </Box>

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
            Apply
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default ReputationFilter;