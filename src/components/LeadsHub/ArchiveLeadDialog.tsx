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

interface Props {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  onConfirm: () => void;
}

const ArchiveLeadDialog: React.FC<Props> = ({
  open,
  onClose,
  leadName,
  onConfirm,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Dynamic width
  const dialogWidth = isMobile ? "90vw" : 420;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: dialogWidth,
          maxWidth: "95vw",
          borderRadius: "20px",
          p: 3,
          textAlign: "center",
        },
      }}
    >
      <Stack spacing={3} alignItems="center" textAlign="center">
        {/* Icon */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#FFF7ED",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArchiveOutlinedIcon sx={{ color: "#F97316", fontSize: 28 }} />
        </Box>

        {/* Title */}
        <Typography fontSize={18} fontWeight={600}>
          Archive Lead
        </Typography>

        {/* Description */}
        <Typography fontSize={14} color="#6B7280" lineHeight={1.6}>
          Are you sure you want to Archive <br />
          <b>“{leadName}”</b> Lead? <br />
          You can restore it anytime.
        </Typography>

        {/* Buttons */}
        <Stack direction={isMobile ? "column" : "row"} spacing={2} width="100%">
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              height: 44,
              borderRadius: "10px",
              borderColor: "#D1D5DB",
              color: "#111827",
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
              borderRadius: "10px",
              backgroundColor: "#4B5563",
              "&:hover": {
                backgroundColor: "#374151",
              },
            }}
          >
            Archive
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
};

export default ArchiveLeadDialog;
