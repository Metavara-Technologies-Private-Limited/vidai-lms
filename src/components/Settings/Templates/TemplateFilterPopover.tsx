import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  TextField,
  MenuItem,
  Divider,
} from "@mui/material";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import CloseIcon from "@mui/icons-material/Close";

export interface Filters {
  fromDate: string;
  toDate: string;
  priority: string;
  department: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  onClear: () => void;
}

export const TemplateFilterPopover: React.FC<Props> = ({
  open,
  onClose,
  onApply,
  onClear,
}) => {
  const [filters, setFilters] = useState<Filters>({
    fromDate: "2025-12-01",
    toDate: "2025-12-31",
    priority: "Low",
    department: "Andrology",
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: "12px",
          width: "380px",
          maxHeight: "calc(100vh - 48px)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>Filter By</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "#9CA3AF", mb: 0.5, display: "block" }}
            >
              From Date
            </Typography>
            <TextField
              size="small"
              type="date"
              value={filters.fromDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters({ ...filters, fromDate: e.target.value })
              }
              sx={{
                width: 160,
                "& .MuiInputBase-root": { height: 36 },
                "& .MuiInputBase-input": { fontSize: 13 },
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "#9CA3AF", mb: 0.5, display: "block" }}
            >
              To Date
            </Typography>
            <TextField
              size="small"
              type="date"
              value={filters.toDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters({ ...filters, toDate: e.target.value })
              }
              sx={{
                width: 160,
                "& .MuiInputBase-root": { height: 36 },
                "& .MuiInputBase-input": { fontSize: 13 },
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "#9CA3AF", mb: 0.5, display: "block" }}
            >
              Priority
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filters.priority}
              onChange={(e: SelectChangeEvent) =>
                setFilters({ ...filters, priority: e.target.value as string })
              }
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "#9CA3AF", mb: 0.5, display: "block" }}
            >
              Department
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filters.department}
              onChange={(e: SelectChangeEvent) =>
                setFilters({ ...filters, department: e.target.value as string })
              }
            >
              <MenuItem value="Andrology">Andrology</MenuItem>
              <MenuItem value="IVF">IVF</MenuItem>
            </Select>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              onClear();
              onClose();
            }}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Clear All
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onApply(filters)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              bgcolor: "#4B4B4B",
            }}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
