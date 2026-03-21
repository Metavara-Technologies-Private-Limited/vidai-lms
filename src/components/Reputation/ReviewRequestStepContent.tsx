import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import TitleIcon from "@mui/icons-material/Title";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatIndentDecreaseIcon from "@mui/icons-material/FormatIndentDecrease";
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import LinkIcon from "@mui/icons-material/Link";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AddIcon from "@mui/icons-material/Add";
import type { ReviewRequestFormData } from "./reviewRequest.utils";

type ReviewRequestStepContentProps = {
  formData: ReviewRequestFormData;
  fileName: string;
  coralRadio: Record<string, unknown>;
  onModeChange: (value: "email" | "sms" | "whatsapp") => void;
  onSubjectChange: (value: string) => void;
  onSubjectBlur: () => void;
  onMessageChange: (value: string) => void;
  onMessageBlur: () => void;
  onFileSelect: (file: File) => void;
};

const ReviewRequestStepContent = ({
  formData,
  fileName,
  coralRadio,
  onModeChange,
  onSubjectChange,
  onSubjectBlur,
  onMessageChange,
  onMessageBlur,
  onFileSelect,
}: ReviewRequestStepContentProps) => {
  return (
    <Box>
      <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
        Select Mode
      </Typography>
      <RadioGroup
        row
        value={formData.mode}
        onChange={(e) =>
          onModeChange(e.target.value as "email" | "sms" | "whatsapp")
        }
        sx={{ mb: 1.5 }}
      >
        <FormControlLabel
          value="email"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">Email</Typography>}
        />
        <FormControlLabel
          value="sms"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">SMS</Typography>}
        />
        <FormControlLabel
          value="whatsapp"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">WhatsApp</Typography>}
        />
      </RadioGroup>

      <TextField
        size="small"
        fullWidth
        label="Subject"
        placeholder="Type Here"
        value={formData.subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        onBlur={onSubjectBlur}
        InputProps={
          formData.mode === "email"
            ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        color: "#A855F7",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      AI Suggest
                    </Button>
                    <Typography
                      variant="caption"
                      sx={{ ml: 1, color: "#9CA3AF" }}
                    >
                      Cc | Bcc
                    </Typography>
                  </InputAdornment>
                ),
              }
            : undefined
        }
        sx={{ mb: 1.75 }}
      />

      <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
        Body
      </Typography>
      <Box
        sx={{
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          overflow: "hidden",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <Button
            startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
            sx={{ color: "#A855F7", textTransform: "none", fontWeight: 700 }}
          >
            AI Suggest
          </Button>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={formData.mode === "email" ? 7 : 5}
          placeholder="Type your message here..."
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { px: 1.75, pb: 1.5, fontSize: 14 },
          }}
          value={formData.message}
          onChange={(e) => onMessageChange(e.target.value)}
          onBlur={onMessageBlur}
        />

        {formData.mode === "email" && (
          <>
            <Divider />
            <Box sx={{ p: 1, bgcolor: "#FAFAFA" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 0.5,
                  mb: 1,
                }}
              >
                <IconButton size="small">
                  <UndoIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <RedoIcon fontSize="inherit" />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Typography variant="caption" sx={{ mx: 1, fontWeight: 600 }}>
                  Nunito
                </Typography>
                <KeyboardArrowDownIcon fontSize="inherit" />
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <TitleIcon fontSize="inherit" />
                <KeyboardArrowDownIcon fontSize="inherit" />
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <IconButton size="small">
                  <FormatBoldIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatItalicIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatUnderlinedIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatColorTextIcon fontSize="inherit" />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <IconButton size="small">
                  <FormatAlignLeftIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatListNumberedIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatListBulletedIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatIndentDecreaseIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatIndentIncreaseIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatQuoteIcon fontSize="inherit" />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <IconButton size="small">
                  <LinkIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <FormatClearIcon fontSize="inherit" />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton size="small">
                  <FormatColorFillIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <AttachFileIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <LinkIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <EmojiEmotionsIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <AddToDriveIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <InsertPhotoIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <ScheduleIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <HistoryEduIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small">
                  <AddIcon fontSize="inherit" />
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {(formData.mode === "sms" || formData.mode === "whatsapp") && (
        <Box sx={{ mt: 2 }}>
          <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
            Upload Documents
          </Typography>
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              p: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              component="label"
              sx={{
                bgcolor: "#9CA3AF",
                "&:hover": { bgcolor: "#6B7280" },
                textTransform: "none",
                fontSize: 12,
                boxShadow: "none",
                borderRadius: "4px",
              }}
            >
              Choose File
              <input
                type="file"
                hidden
                accept="*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  onFileSelect(file);
                  e.target.value = "";
                }}
              />
            </Button>
            <Typography variant="body2" color="textSecondary">
              {fileName || "No File Chosen"}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mt: 0.5, display: "block" }}
          >
            Accepted formats: Any | Max size: 25MB
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ReviewRequestStepContent;
