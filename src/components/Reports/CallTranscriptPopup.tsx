import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, Divider, IconButton, Typography } from "@mui/material";
import { CALL_TRANSCRIPT_LINES } from "./reports.mockData";

interface CallTranscriptPopupProps {
  open: boolean;
  onClose: () => void;
  callerName?: string;
}

const CallTranscriptPopup = ({ open, onClose, callerName }: CallTranscriptPopupProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1.25 }}>
        <Typography sx={{ fontSize: "28px", fontWeight: 700, color: "#2A2D32" }}>
          Call Transcript
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ bgcolor: "#F2F4F7", width: 26, height: 26, "&:hover": { bgcolor: "#E9ECF1" } }}
        >
          <CloseIcon sx={{ fontSize: 16, color: "#7D828A" }} />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ px: 1.5, py: 1.5, maxHeight: "58vh", overflowY: "auto" }}>
        {callerName && (
          <Typography sx={{ fontSize: "13px", color: "#7D828A", mb: 1.25 }}>
            Transcript for: <strong>{callerName}</strong>
          </Typography>
        )}

        {CALL_TRANSCRIPT_LINES.map((line) => (
          <Box key={`${line.time}-${line.speaker}`} sx={{ display: "flex", gap: 1.25, mb: 1.1 }}>
            <Typography sx={{ width: 48, flexShrink: 0, fontSize: "12px", color: "#A0A4AA", mt: 0.2 }}>
              {line.time}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#4B4F55", lineHeight: 1.45 }}>
              <strong>{line.speaker}</strong> : {line.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Dialog>
  );
};

export default CallTranscriptPopup;
