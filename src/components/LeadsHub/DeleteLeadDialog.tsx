import { Dialog, Box, Typography, Button, Stack, Alert, CircularProgress } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

interface Props {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  leadId?: string; // ✅ Added: Display lead ID
  isDeleting?: boolean; // ✅ Added: Loading state during deletion
  error?: string | null; // ✅ Added: Error message from API
  onConfirm: () => void;
}

const DeleteLeadDialog = ({ 
  open, 
  onClose, 
  leadName, 
  leadId, 
  isDeleting = false, 
  error = null, 
  onConfirm 
}: Props) => {
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

        {/* Description */}
        <Typography fontSize={14} color="#6B7280" mb={leadId ? 1 : 3}>
          This action cannot be undone. Are you sure you want to delete{" "}
          <strong>{leadName}</strong> Lead permanently?
        </Typography>

        {/* ✅ Lead ID Display */}
        {leadId && (
          <Typography 
            fontSize={12} 
            color="#9CA3AF" 
            mb={3}
            sx={{
              p: 1,
              bgcolor: "#F9FAFB",
              borderRadius: 1,
              border: "1px solid #E5E7EB",
            }}
          >
            ID: {leadId}
          </Typography>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            disabled={isDeleting} // ✅ Disable during deletion
            sx={{
              textTransform: "none",
              borderRadius: 2,
              borderColor: "#E5E7EB",
              color: "#111827",
              "&:hover": {
                borderColor: "#D1D5DB",
                background: "#F9FAFB",
              },
              "&:disabled": {
                borderColor: "#F3F4F6",
                color: "#D1D5DB",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            onClick={onConfirm}
            disabled={isDeleting} // ✅ Disable during deletion
            startIcon={
              isDeleting ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
              )
            }
            sx={{
              textTransform: "none",
              borderRadius: 2,
              backgroundColor: "#DC2626", // ✅ Changed to red for delete action
              color: "#FFFFFF",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#B91C1C",
                boxShadow: "none",
              },
              "&:disabled": {
                backgroundColor: "#FCA5A5",
                color: "#FFFFFF",
              },
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default DeleteLeadDialog;