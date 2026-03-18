import { useState } from "react";
import { reputationApi } from "../../services/reputation.api";
import type { Lead } from "../../services/leads.api";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";

import {
  fetchReviewRequests,
  fetchReputationDashboard,
} from "../../store/reputationSlice";

import {
  Box,
  Dialog,
  Typography,
  IconButton,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Avatar,
  Chip,
  InputAdornment,
  Divider,
  Paper,
  DialogContent,
} from "@mui/material";

import { useSelector } from "react-redux";
import { selectLeads } from "../../store/leadSlice";
import { Autocomplete } from "@mui/material";

// Standard Icons
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// Toolbar Row 1 Icons
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import TitleIcon from "@mui/icons-material/Title";
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

// Toolbar Row 2 Icons
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AddIcon from "@mui/icons-material/Add";

type ReviewRequestProps = {
  open: boolean;
  onClose: () => void;
};

const ReviewRequest = ({ open, onClose }: ReviewRequestProps) => {
  const [step, setStep] = useState(1);
  const dispatch = useDispatch<AppDispatch>();

  const allLeads = useSelector(selectLeads) || [];
  const [leadSelectionType, setLeadSelectionType] = useState("all");
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);

  const [fileName, setFileName] = useState<string>("");

  const [formData, setFormData] = useState({
    request_name: "",
    description: "",
    collect_on: "google",
    mode: "email",
    subject: "",
    message: "",
    schedule_date: "04/02/2026",
    schedule_time: "12:30 PM",
    is_scheduled: "yes",
    status: "draft",
  });

  const handleClose = () => {
    onClose();
    setStep(1);
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSaveRequest = async () => {
    try {
      const leadIds: string[] =
        leadSelectionType === "all"
          ? allLeads.map((lead) => lead.id)
          : selectedLeads.map((lead) => lead.id);

      const payload = {
        clinic: 1,
        request_name: formData.request_name,
        description: formData.description,
        collect_on: formData.collect_on as "google" | "form" | "both",
        mode: formData.mode as "email" | "sms" | "whatsapp",
        subject: formData.subject,
        message: formData.message,
        schedule_date: formData.schedule_date,
        schedule_time: formData.schedule_time,
        status: formData.status,
        lead_ids: leadIds,
      };

      await reputationApi.createRequest(payload);

      dispatch(fetchReviewRequests());
      dispatch(fetchReputationDashboard());

      handleClose();
    } catch (error) {
      console.error("Failed to create review request", error);
    }
  };

  const coralRadio = {
    color: "#D1D5DB",
    "&.Mui-checked": { color: "#E86A4A" },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography fontWeight={700} fontSize={18} color="#1F2937">
          New Review Request
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: "0 24px", overflowY: "auto" }}>
        {/* Stepper */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: "12px",
            border: "1px solid #F3F4F6",
            display: "flex",
            alignItems: "center",
          }}
        >
          {[
            { label: "Request Details", num: 1 },
            { label: "Request Content", num: 2 },
            { label: "Schedule Request", num: 3 },
          ].map((s, idx) => (
            <Box
              key={s.num}
              sx={{
                display: "flex",
                alignItems: "center",
                flex: idx === 2 ? 0 : 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {step > s.num ? (
                  <CheckCircleIcon sx={{ color: "#22C55E", fontSize: 22 }} />
                ) : (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: step === s.num ? "#E86A4A" : "#E5E7EB",
                      color: "#FFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {s.num}
                  </Box>
                )}
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color={
                    step >= s.num
                      ? step === s.num
                        ? "#E86A4A"
                        : "#22C55E"
                      : "#9CA3AF"
                  }
                >
                  {s.label}
                </Typography>
              </Box>
              {idx < 2 && (
                <Box
                  sx={{ flex: 1, height: "1px", bgcolor: "#E5E7EB", mx: 2 }}
                />
              )}
            </Box>
          ))}
        </Paper>

        {/* STEP 1 */}
        {step === 1 && (
          <Box>
            {/* Request Details Row */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Request Name"
                value={formData.request_name}
                onChange={(e) =>
                  setFormData({ ...formData, request_name: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Box>

            {/* Lead Selection Type */}
            <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
              Select Leads
            </Typography>
            <RadioGroup
              row
              value={leadSelectionType}
              onChange={(e) => setLeadSelectionType(e.target.value)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="all"
                control={<Radio sx={coralRadio} size="small" />}
                label={<Typography variant="body2">All Leads</Typography>}
              />
              <FormControlLabel
                value="manual"
                control={<Radio sx={coralRadio} size="small" />}
                label={<Typography variant="body2">Select Manually</Typography>}
              />
            </RadioGroup>

            {/* Workable Dropdown - Autocomplete */}
            <Autocomplete<Lead, true, false, false>
              multiple
              options={allLeads}
              disabled={leadSelectionType === "all"} // Logic: Disabled if 'All Leads' is picked
              getOptionLabel={(option) => option.full_name || ""}
              value={selectedLeads}
              onChange={(_, newValue) => setSelectedLeads(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignee"
                  placeholder={
                    leadSelectionType === "all"
                      ? "All leads selected"
                      : "Search & Select"
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small">
                          <FilterListIcon fontSize="small" />
                        </IconButton>
                        <KeyboardArrowDownIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              sx={{ mb: 2 }}
            />

            {/* Dynamic Chips List */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mb: 3,
                minHeight: "32px",
              }}
            >
              {(leadSelectionType === "all" ? allLeads : selectedLeads)
                .slice(0, 10)
                .map((lead) => (
                  <Chip
                    key={lead.id}
                    avatar={
                      <Avatar
                        sx={{
                          bgcolor: "#E86A4A",
                          color: "#FFF",
                          fontSize: "10px",
                        }}
                      >
                        {(lead.full_name || "U").charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    label={lead.full_name}
                    size="small"
                    // Only show delete button if we are in Manual mode
                    onDelete={
                      leadSelectionType === "manual"
                        ? () =>
                            setSelectedLeads((prev) =>
                              prev.filter((l) => l.id !== lead.id),
                            )
                        : undefined
                    }
                    sx={{
                      bgcolor: "#F5F3FF",
                      color: "#6D28D9",
                      fontWeight: 500,
                    }}
                  />
                ))}

              {/* Show the +Number avatar if there are more than 10 leads */}
              {(leadSelectionType === "all" ? allLeads : selectedLeads).length >
                10 && (
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: 10,
                    bgcolor: "#E5E7EB",
                    color: "#4B5563",
                  }}
                >
                  +
                  {(leadSelectionType === "all" ? allLeads : selectedLeads)
                    .length - 10}
                </Avatar>
              )}
            </Box>

            {/* Review Platform Selection */}
            <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
              Collect Reviews On
            </Typography>
            <RadioGroup
              row
              value={formData.collect_on}
              onChange={(e) =>
                setFormData({ ...formData, collect_on: e.target.value })
              }
            >
              <FormControlLabel
                value="google"
                control={<Radio sx={coralRadio} size="small" />}
                label={<Typography variant="body2">Google</Typography>}
              />
              <FormControlLabel
                value="form"
                control={<Radio sx={coralRadio} size="small" />}
                label={<Typography variant="body2">Feedback Form</Typography>}
              />
              <FormControlLabel
                value="both"
                control={<Radio sx={coralRadio} size="small" />}
                label={
                  <Typography variant="body2">
                    Both (With Rating Gate)
                  </Typography>
                }
              />
            </RadioGroup>
          </Box>
        )}

        {/* STEP 2: Request Content */}
        {step === 2 && (
          <Box>
            <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
              Select Mode
            </Typography>
            <RadioGroup
              row
              value={formData.mode}
              onChange={(e) =>
                setFormData({ ...formData, mode: e.target.value })
              }
              sx={{ mb: 2 }}
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

            {/* SUBJECT LINE: Only shows for Email */}
            {formData.mode === "email" && (
              <TextField
                fullWidth
                label="Subject"
                placeholder="Type Here"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                InputProps={{
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
                }}
                sx={{ mb: 3 }}
              />
            )}

            {/* BODY SECTION */}
            <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
              Body
            </Typography>
            <Box
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                overflow: "hidden",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
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
              </Box>
              <TextField
                fullWidth
                multiline
                rows={formData.mode === "email" ? 10 : 6}
                placeholder="Type your message here..."
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: { px: 2, pb: 2, fontSize: 14 },
                }}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />

              {/* TOOLBAR: Only shows for Email */}
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
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ mx: 0.5 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ mx: 1, fontWeight: 600 }}
                      >
                        Nunito
                      </Typography>
                      <KeyboardArrowDownIcon fontSize="inherit" />
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ mx: 0.5 }}
                      />
                      <TitleIcon fontSize="inherit" />
                      <KeyboardArrowDownIcon fontSize="inherit" />
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ mx: 0.5 }}
                      />
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
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ mx: 0.5 }}
                      />
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
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ mx: 0.5 }}
                      />
                      <IconButton size="small">
                        <LinkIcon fontSize="inherit" />
                      </IconButton>
                      <IconButton size="small">
                        <FormatClearIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
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

            {/* UPLOAD SECTION: Only shows for SMS and WhatsApp */}
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
                      accept="*" // Logic: Accepts any file format (PDF, PNG, CSV, etc.)
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Optional: Validation for 25MB limit (25 * 1024 * 1024 bytes)
                          const maxSize = 25 * 1024 * 1024;
                          if (file.size > maxSize) {
                            alert(
                              "File is too large. Please select a file under 25MB.",
                            );
                            e.target.value = ""; // Clear the input
                            setFileName("");
                            return;
                          }
                          setFileName(file.name);
                          // You can also save the file object to your formData here
                          // setFormData({ ...formData, attachedFile: file });
                        }
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
        )}

        {/* STEP 3: Schedule Request */}
        {step === 3 && (
          <Box>
            {/* Question updates dynamically based on mode selected in Step 2 */}
            <Typography
              fontWeight={600}
              fontSize={13}
              sx={{ mb: 1, textTransform: "capitalize" }}
            >
              Want to schedule this {formData.mode}
            </Typography>

            <RadioGroup
              row
              value={formData.is_scheduled}
              onChange={(e) =>
                setFormData({ ...formData, is_scheduled: e.target.value })
              }
              sx={{ mb: 3 }}
            >
              <FormControlLabel
                value="yes"
                control={<Radio sx={coralRadio} size="small" />}
                label={<Typography variant="body2">Yes</Typography>}
              />
              <FormControlLabel
                value="no"
                control={<Radio sx={coralRadio} size="small" />}
                label={<Typography variant="body2">No</Typography>}
              />
            </RadioGroup>

            {/* Logic: Enable only if "Yes" is selected */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Select Date"
                disabled={formData.is_scheduled === "no"}
                value={
                  formData.is_scheduled === "no"
                    ? "00/00/0000"
                    : formData.schedule_date
                }
                onChange={(e) =>
                  setFormData({ ...formData, schedule_date: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarTodayIcon
                        sx={{
                          fontSize: 18,
                          color:
                            formData.is_scheduled === "no"
                              ? "text.disabled"
                              : "inherit",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Logic: Enable only if "Yes" is selected */}
              <TextField
                fullWidth
                label="Enter Time"
                disabled={formData.is_scheduled === "no"}
                value={
                  formData.is_scheduled === "no"
                    ? "00:00 PM"
                    : formData.schedule_time
                }
                onChange={(e) =>
                  setFormData({ ...formData, schedule_time: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <AccessTimeIcon
                        sx={{
                          fontSize: 18,
                          color:
                            formData.is_scheduled === "no"
                              ? "text.disabled"
                              : "inherit",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          p: "24px",
          display: "flex",
          gap: 2,
          borderTop: "1px solid #F3F4F6",
        }}
      >
        <Button
          variant="outlined"
          onClick={step === 1 ? handleClose : prevStep}
          sx={{
            flex: 1,
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 700,
            color: "#4B5563",
            borderColor: "#D1D5DB",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{
            flex: 1,
            background: "#F3F4F6",
            color: "#4B5563",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": { background: "#E5E7EB" },
          }}
        >
          Save as Draft
        </Button>
        <Button
          variant="contained"
          onClick={step < 3 ? nextStep : handleSaveRequest}
          sx={{
            flex: 1.2,
            background: "#4D4D4D",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { background: "#333" },
          }}
        >
          {step < 3
            ? "Save & Continue"
            : formData.is_scheduled === "yes"
              ? "Save Request"
              : "Send Request"}
        </Button>
      </Box>
    </Dialog>
  );
};

export default ReviewRequest;
