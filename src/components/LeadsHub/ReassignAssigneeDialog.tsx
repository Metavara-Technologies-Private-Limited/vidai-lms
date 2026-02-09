import * as React from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Lead } from "../../types/leads.types";

interface Props {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

const ReassignAssigneeDialog: React.FC<Props> = ({ open, onClose, lead }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          p: 3,
        },
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography fontSize={20} fontWeight={600}>
          Reassign Assignee
        </Typography>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Body */}
      <Stack spacing={2.5} mt={3}>
        <TextField
          label="Assignee"
          value={lead?.assigned || ""}
          fullWidth
          select
        >
          <MenuItem value="Henry Cavil">Henry Cavil</MenuItem>
          <MenuItem value="John Doe">John Doe</MenuItem>
        </TextField>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Next Action Type"
            fullWidth
            select
            value="Follow Up"
          >
            <MenuItem value="Follow Up">Follow Up</MenuItem>
            <MenuItem value="Call">Call</MenuItem>
          </TextField>

          <TextField
            label="Next Action Status"
            fullWidth
            select
            value="To Do"
            SelectProps={{
              renderValue: () => (
                <Chip
                  label="To Do"
                  sx={{
                    backgroundColor: "#EEF4FF",
                    color: "#2563EB",
                    fontWeight: 500,
                    borderRadius: "8px",
                  }}
                />
              ),
            }}
          >
            <MenuItem value="To Do">To Do</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Done">Done</MenuItem>
          </TextField>
        </Stack>

        <TextField
          label="Next Action Description"
          placeholder="Enter Description"
          fullWidth
          multiline
          rows={3}
        />
      </Stack>

      {/* Footer */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: "10px",
            px: 4,
            color: "#111827",
            borderColor: "#D1D5DB",
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          sx={{
            borderRadius: "10px",
            px: 4,
            backgroundColor: "#4B5563",
            "&:hover": {
              backgroundColor: "#374151",
            },
          }}
        >
          Save
        </Button>
      </Stack>
    </Dialog>
  );
};

export default ReassignAssigneeDialog;
