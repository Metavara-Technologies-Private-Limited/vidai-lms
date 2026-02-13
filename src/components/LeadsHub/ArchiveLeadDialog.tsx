import * as React from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";

interface Props {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  onConfirm: () => void;
  isUnarchive?: boolean; // ✅ NEW: Support both archive and unarchive
}

const ArchiveLeadDialog: React.FC<Props> = ({
  open,
  onClose,
  leadName,
  onConfirm,
  isUnarchive = false, // ✅ NEW: Default to archive action
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Dynamic width
  const dialogWidth = isMobile ? "90vw" : 420;

  // ✅ Dynamic content based on action type
  const title = isUnarchive ? "Restore Lead" : "Archive Lead";
  const actionText = isUnarchive ? "Restore" : "Archive";
  const description = isUnarchive
    ? `Are you sure you want to restore "${leadName}" lead? It will be moved back to active leads.`
    : `Are you sure you want to archive "${leadName}" lead? You can restore it anytime.`;
  const iconBgColor = isUnarchive ? "#DBEAFE" : "#FFF7ED";
  const iconColor = isUnarchive ? "#3B82F6" : "#F97316";
  const buttonBgColor = isUnarchive ? "#3B82F6" : "#4B5563";
  const buttonHoverColor = isUnarchive ? "#2563EB" : "#374151";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: dialogWidth,
          maxWidth: "95vw",
          borderRadius: "24px", // ✅ Increased for consistency
          p: 4, // ✅ Increased padding
          textAlign: "center",
          boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)", // ✅ Better shadow
        },
      }}
    >
      <Stack spacing={2.5} alignItems="center" textAlign="center">
        {/* Icon */}
        <Box
          sx={{
            width: 64, // ✅ Slightly larger
            height: 64,
            borderRadius: "50%",
            backgroundColor: iconBgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isUnarchive ? (
            <UnarchiveOutlinedIcon sx={{ color: iconColor, fontSize: 32 }} />
          ) : (
            <ArchiveOutlinedIcon sx={{ color: iconColor, fontSize: 32 }} />
          )}
        </Box>

        {/* Title */}
        <Typography 
          variant="h6" 
          fontWeight={700} 
          sx={{ fontSize: "1.125rem" }}
        >
          {title}
        </Typography>

        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          lineHeight={1.6}
          sx={{ px: 2 }}
        >
          {description}
        </Typography>

        {/* Buttons */}
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={2} 
          width="100%" 
          sx={{ mt: 2 }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              height: 44,
              borderRadius: "12px", // ✅ Rounded for consistency
              borderColor: "#E2E8F0",
              color: "#475569",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                borderColor: "#CBD5E1",
                backgroundColor: "#F8FAFC",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={onConfirm}
            sx={{
              height: 44,
              borderRadius: "12px",
              backgroundColor: buttonBgColor,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: buttonHoverColor,
                boxShadow: "none",
              },
            }}
          >
            {actionText}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
};

export default ArchiveLeadDialog;