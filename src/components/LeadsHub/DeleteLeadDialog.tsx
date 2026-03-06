import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

interface Props {
  open: boolean;
  leadName: string;
  leadId?: string;
  isDeleting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteLeadDialog: React.FC<Props> = ({
  open,
  leadName,
  leadId,
  isDeleting = false,
  error,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={!isDeleting ? onClose : undefined}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px" },
      }}
    >
      <DialogContent sx={{ textAlign: "center", pt: 4, pb: 3, px: 3 }}>
        {/* Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <DeleteOutlineOutlinedIcon sx={{ fontSize: 32, color: "#DC2626" }} />
        </Box>

        {/* Title */}
        <Typography fontWeight={700} fontSize="1.125rem" mb={1.5}>
          Delete Lead
        </Typography>

        {/* Lead ID */}
        {leadId && (
          <Typography fontSize="13px" color="text.secondary" mb={1}>
            ID: {leadId}
          </Typography>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left", borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600}>{error}</Typography>
          </Alert>
        )}

        {/* Message */}
        <Typography color="text.secondary" fontSize="14px" lineHeight={1.6} px={1}>
          This action cannot be undone. Are you sure you want to Delete{" "}
          <Typography component="span" fontWeight={700} color="text.primary" fontSize="14px">
            "{leadName}"
          </Typography>{" "}
          Lead permanently?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
        <Button
          fullWidth
          onClick={onClose}
          disabled={isDeleting}
          sx={{
            height: 44,
            backgroundColor: "#F3F4F6",
            color: "black",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#E5E7EB" },
            "&:disabled": { backgroundColor: "#F9FAFB", color: "#D1D5DB" },
          }}
        >
          Cancel
        </Button>

        <Button
          fullWidth
          onClick={onConfirm}
          disabled={isDeleting}
          sx={{
            height: 44,
            backgroundColor: "#1F2937",
            color: "white",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#111827" },
            "&:disabled": { backgroundColor: "#9CA3AF", color: "white" },
          }}
        >
          {isDeleting ? (
            <>
              <CircularProgress size={16} sx={{ color: "white", mr: 1 }} />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteLeadDialog;