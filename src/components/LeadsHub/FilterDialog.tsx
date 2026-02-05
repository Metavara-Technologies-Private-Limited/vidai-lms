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
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 52,
    borderRadius: "10px",
    color: "#9E9E9E", // 🔒 dialog text color
    "& fieldset": {
      borderColor: "#D1D5DB",
    },
    "&:hover fieldset": {
      borderColor: "#D1D5DB", // ❌ no hover border change
    },
    "&.Mui-focused fieldset": {
      borderColor: "#D1D5DB", // ❌ no focus border change
    },
  },

  "& .MuiOutlinedInput-input": {
    color: "#9E9E9E",
    "&:hover": {
      color: "#9E9E9E",
    },
    "&:focus": {
      color: "#9E9E9E",
    },
  },

  "& .MuiSelect-select": {
    color: "#9E9E9E",
    "&:hover": {
      color: "#9E9E9E",
    },
    "&:focus": {
      color: "#9E9E9E",
    },
  },

  "& .MuiInputLabel-root": {
    color: "#9CA3AF",
    fontSize: "14px",
    "&.Mui-focused": {
      color: "#9CA3AF",
    },
  },
};

const FilterDialog: React.FC<FilterDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: 2,
        },
      }}
    >
      {/* HEADER */}
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

      <DialogContent sx={{ pt: 3, color: "#9E9E9E" }}>
        <Stack spacing={3}>
          {/* DATE RANGE */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="From Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
            <TextField
              label="To Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
          </Stack>

          {/* QUALITY + STATUS */}
          <Stack direction="row" spacing={2}>
            <TextField label="Lead Quality" select fullWidth sx={fieldSx}>
              <MenuItem value="Hot">Hot</MenuItem>
              <MenuItem value="Warm">Warm</MenuItem>
              <MenuItem value="Cold">Cold</MenuItem>
            </TextField>

            <TextField label="Status" select fullWidth sx={fieldSx}>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Converted">Converted</MenuItem>
              <MenuItem value="Lost">Lost</MenuItem>
            </TextField>
          </Stack>

          {/* LOCATION + ASSIGNEE */}
          <Stack direction="row" spacing={2}>
            <TextField label="Location" select fullWidth sx={fieldSx}>
              <MenuItem value="LA">LA Jolla, California</MenuItem>
              <MenuItem value="NY">New York</MenuItem>
            </TextField>

            <TextField label="Assignee" select fullWidth sx={fieldSx}>
              <MenuItem value="Henry">Henry Cavill</MenuItem>
              <MenuItem value="Chris">Chris Evans</MenuItem>
            </TextField>
          </Stack>

          {/* SOURCE + SUB SOURCE */}
          <Stack direction="row" spacing={2}>
            <TextField label="Source" select fullWidth sx={fieldSx}>
              <MenuItem value="Social">Social Media</MenuItem>
              <MenuItem value="Website">Website</MenuItem>
            </TextField>

            <TextField label="Sub-Source" select fullWidth sx={fieldSx}>
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
                fontWeight: 500,
                "&:hover": {
                  borderColor: "#D1D5DB",
                  backgroundColor: "transparent",
                },
              }}
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
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: "#4B5563",
                },
              }}
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
