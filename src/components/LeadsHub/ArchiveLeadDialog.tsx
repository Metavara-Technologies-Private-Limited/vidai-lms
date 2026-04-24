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
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";

interface Props {
  open: boolean;
  leadName: string;
  onClose: () => void;
  onConfirm: () => void;
  isUnarchive?: boolean;
  isArchiving?: boolean;
  error?: string | null;
}

const ArchiveLeadDialog: React.FC<Props> = ({
  open,
  leadName,
  onClose,
  onConfirm,
  isUnarchive = false,
  isArchiving = false,
  error = null,
}) => {
  // Dynamic content based on action type
  const title = isUnarchive ? "Unarchive Lead" : "Archive Lead";
  const actionText = isUnarchive ? "Unarchive" : "Archive";

  const description = isUnarchive
    ? `Are you sure you want to unarchive "${leadName}"? You can restore it anytime.`
    : `Are you sure you want to archive "${leadName}"? You can restore it anytime.`;

  const iconBgColor = isUnarchive ? "#DBEAFE" : "#FEF3C7";
  const iconColor = isUnarchive ? "#3B82F6" : "#F59E0B";

  return (
    <Dialog
      open={open}
      onClose={!isArchiving ? onClose : undefined}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
        },
      }}
    >
      <DialogContent
        sx={{
          textAlign: "center",
          pt: 4,
          pb: 3,
          px: 3,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: iconBgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          {isUnarchive ? (
            <UnarchiveOutlinedIcon
              sx={{
                fontSize: 32,
                color: iconColor,
              }}
            />
          ) : (
            <ArchiveOutlinedIcon
              sx={{
                fontSize: 32,
                color: iconColor,
              }}
            />
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={600}
          mb={1}
          sx={{
            fontSize: "1.125rem",
          }}
        >
          {title}
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              textAlign: "left",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
            >
              {error}
            </Typography>
          </Alert>
        )}

        {/* Description */}
        <Typography
          color="text.secondary"
          sx={{
            fontSize: "14px",
            lineHeight: 1.6,
            px: 1,
          }}
        >
          {description}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          gap: 1,
        }}
      >
        <Button
          fullWidth
          onClick={onClose}
          disabled={isArchiving}
          sx={{
            height: 44,
            backgroundColor: "#F3F4F6",
            color: "black",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#E5E7EB",
            },
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
          disabled={isArchiving}
          startIcon={
            isArchiving ? (
              <CircularProgress
                size={16}
                sx={{
                  color: "white",
                }}
              />
            ) : null
          }
          sx={{
            height: 44,
            backgroundColor: "#1F2937",
            color: "white",
            fontWeight: 500,
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#111827",
            },
            "&:disabled": {
              backgroundColor: "#9CA3AF",
              color: "white",
            },
          }}
        >
          {isArchiving
            ? isUnarchive
              ? "Restoring..."
              : "Archiving..."
            : actionText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveLeadDialog;
