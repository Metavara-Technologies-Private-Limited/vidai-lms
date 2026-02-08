import { Dialog, Box, Typography, Button, Stack } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

interface Props {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  onConfirm: () => void;
}

const DeleteLeadDialog = ({ open, onClose, leadName, onConfirm }: Props) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <Box sx={{ p: 3, textAlign: "center" }}>
        {/* Icon */}
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: "auto",
            mb: 2,
            borderRadius: "50%",
            backgroundColor: "#FDECEC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DeleteOutlineRoundedIcon sx={{ color: "#E54848", fontSize: 28 }} />
        </Box>

        {/* Title */}
        <Typography fontWeight={600} fontSize={18} color="#111827" mb={1}>
          Delete Lead
        </Typography>

        {/* Description */}
        <Typography fontSize={14} color="#6B7280" mb={3}>
          This action cannot be undone. Are you sure you want to delete{" "}
          <strong>{leadName}</strong> Lead permanently?
        </Typography>

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              borderColor: "#E5E7EB",
              color: "#111827",
              "&:hover": {
                borderColor: "#D1D5DB",
                background: "#F9FAFB",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            onClick={onConfirm}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              backgroundColor: "#3F3F46",
              color: "#FFFFFF",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#27272A",
                boxShadow: "none",
              },
            }}
          >
            Delete
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default DeleteLeadDialog;
