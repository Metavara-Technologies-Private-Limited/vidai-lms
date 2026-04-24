import { useMemo, useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

type ReviewRequestMode = "email" | "sms" | "whatsapp";
type SuggestionField = "subject" | "body";

export type AiSuggestionItem = {
  id: string;
  label: string;
  tone: string;
  subject: string;
  body: string;
};

type AiSuggestProps = {
  open: boolean;
  mode: ReviewRequestMode;
  field: SuggestionField;
  onClose: () => void;
  onApply: (value: string, suggestion: AiSuggestionItem) => void;
};

const AI_REVIEW_SUGGESTIONS: Record<ReviewRequestMode, AiSuggestionItem[]> = {
  email: [
    {
      id: "email-warm-thanks",
      label: "Warm Thank You",
      tone: "Friendly",
      subject: "Thank you for visiting us. We'd value your feedback",
      body: "Hi,\n\nThank you for trusting our clinic with your care. We hope your visit was comfortable and helpful.\n\nIf you have a moment, we would truly appreciate your review. Your feedback helps other patients feel confident in choosing our clinic and helps us continue improving our services.\n\nPlease share your experience using the link below.\n\n[Review Link]\n\nThank you again for your time and support.\n\nBest regards,\nClinic Team",
    },
    {
      id: "email-gentle-followup",
      label: "Gentle Follow-Up",
      tone: "Professional",
      subject: "Your feedback matters to our clinic",
      body: "Hello,\n\nWe recently had the pleasure of supporting you at our clinic, and we would love to hear about your experience.\n\nYour review helps us understand what we are doing well and where we can do better. It also helps other patients who are looking for trusted care.\n\nWhen convenient, please take a minute to leave your feedback through the review link.\n\n[Review Link]\n\nWe sincerely appreciate your time.\n\nRegards,\nClinic Team",
    },
    {
      id: "email-short-polite",
      label: "Short & Polite",
      tone: "Concise",
      subject: "Could you please leave us a quick review?",
      body: "Hi,\n\nThank you for visiting our clinic. If your experience was positive, we would be grateful if you could leave us a quick review.\n\nYour feedback supports our team and helps future patients.\n\n[Review Link]\n\nThank you,\nClinic Team",
    },
    {
  id: "email-care-followup",
  label: "Care Follow-Up",
  tone: "Empathetic",
  subject: "We hope you are doing well – share your feedback",
  body: "Hello,\n\nWe hope you are recovering well and doing good after your recent visit.\n\nYour experience matters deeply to us. It helps us improve our care and support future patients better.\n\nWe would truly appreciate it if you could share your feedback.\n\n[Review Link]\n\nWishing you good health,\nClinic Team",
},
{
  id: "email-experience-check",
  label: "Experience Check",
  tone: "Friendly",
  subject: "How was your experience with us?",
  body: "Hi,\n\nWe wanted to check in and hear about your recent experience at our clinic.\n\nYour feedback helps us continue providing the best care possible.\n\nIf you have a moment, please share your thoughts.\n\n[Review Link]\n\nThank you for your time,\nClinic Team",
},

  ],
  sms: [
    {
      id: "sms-friendly",
      label: "Friendly Ask",
      tone: "Friendly",
      subject: "",
      body: "Thank you for visiting our clinic. We'd be grateful if you could share your experience in a quick review: [Review Link]",
    },
    {
      id: "sms-professional",
      label: "Professional Ask",
      tone: "Professional",
      subject: "",
      body: "Your feedback helps us improve patient care. Please take a moment to leave your review here: [Review Link]",
    },
    {
      id: "sms-short",
      label: "Short Reminder",
      tone: "Concise",
      subject: "",
      body: "Thanks for choosing our clinic. Please leave a quick review here: [Review Link]",
    },
  ],
  whatsapp: [
    {
      id: "wa-warm",
      label: "Warm Message",
      tone: "Friendly",
      subject: "",
      body: "Hello! Thank you for visiting our clinic. We hope you had a positive experience. We'd really appreciate it if you could leave us a quick review here: [Review Link]",
    },
    {
      id: "wa-supportive",
      label: "Supportive Follow-Up",
      tone: "Professional",
      subject: "",
      body: "Hi, thank you for trusting our clinic. Your feedback means a lot to us and helps other patients too. Please share your review here: [Review Link]",
    },
    {
      id: "wa-brief",
      label: "Brief Request",
      tone: "Concise",
      subject: "",
      body: "Thank you for your visit. We'd be grateful for your review: [Review Link]",
    },
  ],
};

const fieldLabelMap: Record<SuggestionField, string> = {
  subject: "Subject",
  body: "Message",
};

const AI_Suggest = ({
  open,
  mode,
  field,
  onClose,
  onApply,
}: AiSuggestProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const suggestions = useMemo(() => AI_REVIEW_SUGGESTIONS[mode] ?? [], [mode]);

  const selectedSuggestion = useMemo(
    () =>
      suggestions.find((suggestion) => suggestion.id === selectedId) ??
      suggestions[0] ??
      null,
    [selectedId, suggestions],
  );

  const previewValue =
    field === "subject"
      ? (selectedSuggestion?.subject ?? "")
      : (selectedSuggestion?.body ?? "");

  const handleApply = () => {
    if (!selectedSuggestion) return;

    onApply(previewValue, selectedSuggestion);
    onClose();
  };

  return (
<Dialog
  open={open}
  onClose={onClose}
  PaperProps={{
    sx: {
      width: "fit-content",      // ✅ auto width
      maxWidth: "90vw",          // ✅ responsive safety
      borderRadius: "16px",
      px: 1,
    },
  }}
>
        <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoAwesomeIcon sx={{ color: "#A855F7" }} />
          <Box>
            <Typography fontSize={20} fontWeight={700}>
              AI Suggest
            </Typography>
            <Typography fontSize={13} color="#6B7280">
              Choose a ready-to-use {fieldLabelMap[field].toLowerCase()} for{" "}
              {mode === "whatsapp"
                ? "WhatsApp review requests"
                : `${mode.toUpperCase()} review requests`}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
<Box
  sx={{
    display: "inline-grid",   // ✅ KEY FIX
    gridTemplateColumns: "auto", // 👈 no forced width
    gap: 2,
  }}
>
<Stack
  spacing={1.25}
  sx={{
    maxHeight: field === "body" ? "260px" : "220px", // ✅ key change
    overflowY: "auto",
    pr: 1,

    "&::-webkit-scrollbar": {
      width: "3px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#D1D5DB",
      borderRadius: "10px",
    },
    scrollbarWidth: "thin",
    scrollbarColor: "#D1D5DB transparent",
  }}
>
              <Stack spacing={1.25}
sx={{
    maxHeight: field === "body" ? "260px" : "220px", // ✅ key change
    overflowY: "auto",
    pr: 6,

    "&::-webkit-scrollbar": {
      width: "3px",   
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent", 
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#D1D5DB",
      borderRadius: "10px",
    },
    scrollbarWidth: "thin",
    scrollbarColor: "#D1D5DB transparent",
  }}>
              {suggestions.map((suggestion, index) => {
                const isSelected =
                  (selectedId === null && index === 0) ||
                  selectedId === suggestion.id;

                return (
<Box
  key={suggestion.id}
  onClick={() => setSelectedId(suggestion.id)}
  sx={{
    p: 1.5,
    borderRadius: "14px",
    border: isSelected
      ? "1px solid #A855F7"
      : "1px solid #E5E7EB",
    backgroundColor: isSelected ? "#FAF5FF" : "#FFFFFF",
    cursor: "pointer",

    width: field === "body" ? "320px" : "fit-content",       
    maxWidth: "100%",           
  }}
>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Box>
                        <Typography fontWeight={700} fontSize={14}>
                          {suggestion.label}
                        </Typography>
<Typography
  fontSize={12}
  color="#6B7280"
  sx={
    field === "body"
      ? {
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }
      : {}
  }
>
  {field === "subject"
    ? suggestion.subject || "Body suggestion"
    : suggestion.body}
</Typography>
                      </Box>

                    </Stack>
                    <Chip
                      label={suggestion.tone}
                      size="small"
                      sx={{
                        mt: 1,
                        backgroundColor: "#F3E8FF",
                        color: "#7E22CE",
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>

            <Stack
              direction="row"
              justifyContent="flex-start"
              spacing={1.5}
              sx={{ mt: 1 }}
            >
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  borderColor: "#D1D5DB",
                  color: "#374151",
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 2.5,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleApply}
                sx={{
                  backgroundColor: "#A855F7",
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 2.5,
                  boxShadow: "none",
                  "&:hover": { backgroundColor: "#9333EA", boxShadow: "none" },
                }}
              >
                Use Suggestion
              </Button>
            </Stack>
          </Stack>

        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AI_Suggest;
