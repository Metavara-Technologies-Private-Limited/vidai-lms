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
        sx: {
          borderRadius: "16px",
        },
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
        <Typography variant="h6" fontWeight={600} mb={1} sx={{ fontSize: "1.125rem" }}>
          Delete Lead
        </Typography>

        {/* ✅ Error Alert - Shows if API call fails */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              textAlign: "left",
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {error}
            </Typography>
          </Alert>
        )}

        {/* Message */}
        <Typography 
          color="text.secondary" 
          sx={{ fontSize: "14px", lineHeight: 1.6, px: 1, mb: leadId ? 1 : 0 }}
        >
          This action cannot be undone. Are you sure you want to Delete selected Lead permanently ?
        </Typography>

        {/* ✅ Lead ID Display (optional) */}
        {leadId && (
          <Typography 
            fontSize={12} 
            color="#9CA3AF" 
            sx={{
              mt: 1,
              p: 1,
              bgcolor: "#F9FAFB",
              borderRadius: 1,
              border: "1px solid #E5E7EB",
            }}
          >
            ID: {leadId}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
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
            "&:disabled": {
              backgroundColor: "#F9FAFB",
              color: "#D1D5DB",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          fullWidth
          onClick={onConfirm}
          disabled={isDeleting}
          startIcon={
            isDeleting ? (
              <CircularProgress size={16} sx={{ color: "white" }} />
            ) : (
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
            )
          }
          sx={{
            height: 44,
            backgroundColor: "#1F2937",
            color: "white",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#111827" },
            "&:disabled": {
              backgroundColor: "#9CA3AF",
              color: "white",
            },
          }}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteLeadDialog;