import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { reputationApi } from "../../services/reputation.api";
import type { Lead } from "../../services/leads.api";
import { fetchLeads, selectLeads } from "../../store/leadSlice";
import {
  fetchReputationDashboard,
  fetchReviewRequests,
  prependReviewRequest,
} from "../../store/reputationSlice";
import type { AppDispatch } from "../../store";
import ReviewRequestStepper from "./ReviewRequestStepper";
import ReviewRequestStepDetails from "./ReviewRequestStepDetails";
import ReviewRequestStepContent from "./ReviewRequestStepContent";
import ReviewRequestStepSchedule from "./ReviewRequestStepSchedule";
import {
  createInitialReviewRequestFormData,
  formatDate,
  formatTime,
  getScheduledDateTime,
  isFieldFilled,
  isRequestNameValid,
  sanitizeRequestNameInput,
  type ReviewRequestFormData,
} from "./reviewRequest.utils";

type ReviewRequestProps = {
  open: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;
};

const coralRadio = {
  color: "#D1D5DB",
  "&.Mui-checked": { color: "#E86A4A" },
};

const getBackendErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const axiosLikeError = error as {
      response?: {
        data?: unknown;
      };
    };

    const data = axiosLikeError.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      const record = data as Record<string, unknown>;

      const message = record.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }

      const fallbackError = record.error;
      if (typeof fallbackError === "string" && fallbackError.trim()) {
        return fallbackError;
      }

      const firstEntry = Object.values(record).find((value) => {
        if (typeof value === "string" && value.trim()) {
          return true;
        }
        return (
          Array.isArray(value) &&
          value.some((item) => typeof item === "string" && item.trim())
        );
      });

      if (typeof firstEntry === "string" && firstEntry.trim()) {
        return firstEntry;
      }

      if (Array.isArray(firstEntry)) {
        const firstString = firstEntry.find(
          (item) => typeof item === "string" && item.trim(),
        );
        if (typeof firstString === "string") {
          return firstString;
        }
      }
    }
  }

  return "Failed to create review request";
};

const normalizeReviewLinkPlaceholder = (message: string) => {
  const brokenGoogleReviewUrlPattern =
    /https?:\/\/g\.page\/review\/your-clinic/gi;
  const flexibleReviewLinkTokenPattern =
    /(\{\{\s*review[_\s-]*link\s*\}\}|\{\s*review[_\s-]*link\s*\}|\[\s*review[_\s-]*link\s*\]|<\s*review[_\s-]*link\s*>)/gi;

  const normalized = message
    .replace(brokenGoogleReviewUrlPattern, "{review_link}")
    .replace(flexibleReviewLinkTokenPattern, "{review_link}");

  if (normalized.includes("{review_link}")) {
    return normalized;
  }

  return `${normalized.trim()}\n\n{review_link}`;
};

const GOOGLE_REVIEW_PLACEHOLDER_URL = "https://g.page/review/your-clinic";

const getConfiguredGoogleReviewUrl = () =>
  (import.meta.env.VITE_GOOGLE_REVIEW_URL ?? "").trim();

const isValidWebUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidEmailAddress = (value?: string) => {
  const email = (value ?? "").trim();
  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhoneNumber = (value?: string) => {
  const phone = (value ?? "").trim();
  if (!phone) {
    return false;
  }

  const normalized = phone.replace(/[\s().-]/g, "");
  return /^\+?[1-9]\d{7,14}$/.test(normalized);
};

const toPositiveNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  return 0;
};

const unwrapCreateRequestRecord = (
  response: unknown,
): Record<string, unknown> => {
  let current: unknown = response;

  for (let i = 0; i < 4; i += 1) {
    if (typeof current !== "object" || current === null) {
      return {};
    }

    const record = current as Record<string, unknown>;
    if (typeof record.id === "string" || typeof record.id === "number") {
      return record;
    }

    if (typeof record.data === "object" && record.data !== null) {
      current = record.data;
      continue;
    }

    return record;
  }

  return {};
};

const ReviewRequest = ({ open, onClose, onOpenChange }: ReviewRequestProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const allLeads = useSelector(selectLeads);

  const [step, setStep] = useState(1);
  const [leadActionFilter, setLeadActionFilter] = useState("");
  const [leadSelectionType, setLeadSelectionType] = useState<"all" | "manual">(
    "all",
  );
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState<ReviewRequestFormData>(() =>
    createInitialReviewRequestFormData(),
  );

  useEffect(() => {
    if (open && allLeads.length === 0) {
      dispatch(fetchLeads());
    }
  }, [open, allLeads.length, dispatch]);

  const filteredLeads = useMemo(() => {
    if (!leadActionFilter) {
      return allLeads;
    }

    const normalizedFilter = leadActionFilter.trim().toLowerCase();

    return allLeads.filter((lead) => {
      const actionType = (lead.next_action_type || "").trim().toLowerCase();
      return actionType === normalizedFilter;
    });
  }, [allLeads, leadActionFilter]);

  const handleLeadSelectionTypeChange = (value: "all" | "manual") => {
    setLeadSelectionType(value);

    if (value === "manual") {
      // Manual mode should start with no preselected leads.
      setSelectedLeads([]);
    }
  };

  const handleLeadActionFilterChange = (value: string) => {
    setLeadActionFilter(value);

    if (leadSelectionType === "manual") {
      if (!value) {
        return;
      }

      const normalizedFilter = value.trim().toLowerCase();
      setSelectedLeads((prev) =>
        prev.filter(
          (lead) =>
            (lead.next_action_type || "").trim().toLowerCase() ===
            normalizedFilter,
        ),
      );
    }
  };

  const showErrorToast = (message: string) => {
    toast.error(message, { toastId: `review-request-error-${message}` });
  };

  const showSuccessToast = (message: string) => {
    toast.success(message, { toastId: `review-request-success-${message}` });
  };

  const showSavingToast = () =>
    toast.loading("Saving review request...", {
      toastId: "review-request-saving",
    });

  const closeDialog = (shouldReset = true) => {
    onClose();

    if (shouldReset) {
      resetLocalState();
    }
  };

  const resetLocalState = () => {
    setStep(1);
    setLeadActionFilter("");
    setLeadSelectionType("all");
    setSelectedLeads([]);
    setFileName("");
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setFormData(createInitialReviewRequestFormData());
  };

  const handleClose = () => {
    if (isSubmittingRef.current) {
      return;
    }

    closeDialog();
  };

  const buildOptimisticRequest = (
    response: unknown,
    payload: {
      request_name: string;
      mode: "email" | "sms" | "whatsapp";
      status: "draft" | "sent" | "scheduled";
      lead_ids: string[];
    },
  ) => {
    const record = unwrapCreateRequestRecord(response);
    const resolvedId =
      record.id ?? record.request_id ?? record.uuid ?? `temp-${Date.now()}`;

    const resolvedRequestSent =
      toPositiveNumber(record.requests_sent) ||
      toPositiveNumber(record.request_sent) ||
      toPositiveNumber(record.selected_leads_count) ||
      toPositiveNumber(record.leads_count) ||
      payload.lead_ids.length;

    return {
      id: String(resolvedId),
      request_name:
        typeof record.request_name === "string"
          ? record.request_name
          : payload.request_name,
      status:
        typeof record.status === "string" ? record.status : payload.status,
      requests_sent: resolvedRequestSent,
      selected_leads_count: payload.lead_ids.length,
      lead_ids: payload.lead_ids,
      reviews_submitted:
        typeof record.reviews_submitted === "number"
          ? record.reviews_submitted
          : 0,
      avg_rating: typeof record.avg_rating === "number" ? record.avg_rating : 0,
      mode: typeof record.mode === "string" ? record.mode : payload.mode,
      created_at:
        typeof record.created_at === "string"
          ? record.created_at
          : new Date().toISOString(),
    };
  };

  const validateMandatoryField = (value: string, label: string) => {
    if (!isFieldFilled(value)) {
      showErrorToast(`${label} is Mandatory`);
      return false;
    }
    return true;
  };

  const validateRequestName = (value: string, checkMandatory = false) => {
    const trimmed = value.trim();

    if (!trimmed) {
      if (checkMandatory) {
        showErrorToast("Request Name is Mandatory");
      }
      return false;
    }

    if (!isRequestNameValid(trimmed)) {
      showErrorToast("Enter Alphanumeric only");
      return false;
    }

    return true;
  };

  const validateStep1 = () => {
    const requestNameEmpty = !isFieldFilled(formData.request_name);
    const descriptionEmpty = !isFieldFilled(formData.description);

    if (requestNameEmpty && descriptionEmpty) {
      showErrorToast("Please fill all fields");
      return false;
    }

    if (!validateRequestName(formData.request_name, true)) {
      return false;
    }

    if (descriptionEmpty) {
      showErrorToast("Description needed");
      return false;
    }

    if (leadSelectionType === "manual" && selectedLeads.length === 0) {
      showErrorToast("Leads is Mandatory");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const subjectEmpty = !isFieldFilled(formData.subject);
    const messageEmpty = !isFieldFilled(formData.message);

    if (subjectEmpty && messageEmpty) {
      showErrorToast("Please fill all fields");
      return false;
    }

    if (!validateMandatoryField(formData.subject, "Subject")) {
      return false;
    }

    if (!validateMandatoryField(formData.message, "Message")) {
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    if (formData.is_scheduled !== "yes") {
      return true;
    }

    const dateEmpty = !isFieldFilled(formData.schedule_date);
    const timeEmpty = !isFieldFilled(formData.schedule_time);

    if (dateEmpty && timeEmpty) {
      showErrorToast("Please fill all fields");
      return false;
    }

    if (!validateMandatoryField(formData.schedule_date, "Select Date")) {
      return false;
    }

    if (!validateMandatoryField(formData.schedule_time, "Enter Time")) {
      return false;
    }

    const scheduledAt = getScheduledDateTime(
      formData.schedule_date,
      formData.schedule_time,
    );

    if (!scheduledAt || !scheduledAt.isValid()) {
      showErrorToast("Please select a valid schedule date and time");
      return false;
    }

    if (!scheduledAt.isAfter(new Date())) {
      showErrorToast("Schedule time must be in the future");
      return false;
    }

    return true;
  };

  const handleSaveRequest = async (
    status: "draft" | "sent" | "scheduled",
    successMessage: string,
  ) => {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    const savingToastId = showSavingToast();

    if (onOpenChange) {
      onOpenChange(false);
    } else {
      onClose();
    }

    try {
      const targetLeads =
        leadSelectionType === "all" ? filteredLeads : selectedLeads;

      const invalidLeads = targetLeads.filter((lead) => {
        if (formData.mode === "email") {
          return !isValidEmailAddress(lead.email);
        }

        return !isValidPhoneNumber(lead.contact_no);
      });

      if (invalidLeads.length > 0) {
        const recipientType = formData.mode === "email" ? "email" : "phone";
        const sampleNames = invalidLeads
          .slice(0, 3)
          .map((lead) => lead.full_name)
          .join(", ");
        showErrorToast(
          `Cannot send via ${formData.mode.toUpperCase()}: ${invalidLeads.length} lead(s) have invalid ${recipientType} details (${sampleNames}${invalidLeads.length > 3 ? ", ..." : ""}).`,
        );
        toast.dismiss(savingToastId);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        onOpenChange?.(true);
        return;
      }

      const leadIds = targetLeads.map((lead) => String(lead.id));

      if (leadIds.length === 0) {
        showErrorToast(
          "No leads available. Please refresh leads and try again.",
        );
        toast.dismiss(savingToastId);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        onOpenChange?.(true);
        return;
      }

      const clinicId =
        (leadSelectionType === "manual"
          ? selectedLeads[0]?.clinic_id
          : filteredLeads[0]?.clinic_id) ?? 1;

      const normalizedMessage = normalizeReviewLinkPlaceholder(
        formData.message.trim(),
      );

      const configuredGoogleReviewUrl = getConfiguredGoogleReviewUrl();

      if (formData.collect_on === "google") {
        if (
          !isValidWebUrl(configuredGoogleReviewUrl) ||
          configuredGoogleReviewUrl.toLowerCase() ===
            GOOGLE_REVIEW_PLACEHOLDER_URL.toLowerCase()
        ) {
          showErrorToast(
            "Google review URL is not configured. Set VITE_GOOGLE_REVIEW_URL to your real Google review link or choose Feedback Form.",
          );
          toast.dismiss(savingToastId);
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          onOpenChange?.(true);
          return;
        }
      }

      const resolvedMessage =
        formData.collect_on === "google"
          ? normalizedMessage.replace(
              /\{review_link\}/gi,
              configuredGoogleReviewUrl,
            )
          : normalizedMessage;

      const payload = {
        clinic: clinicId,
        request_name: formData.request_name.trim(),
        description: formData.description.trim(),
        collect_on: formData.collect_on,
        mode: formData.mode,
        subject: formData.subject.trim(),
        message: resolvedMessage,
        status,
        lead_ids: leadIds,
        ...(formData.is_scheduled === "yes" && {
          schedule_date: formatDate(formData.schedule_date.trim()),
          schedule_time: formatTime(formData.schedule_time.trim()),
        }),
      };

      const response = await reputationApi.createRequest(payload);

      dispatch(prependReviewRequest(buildOptimisticRequest(response, payload)));

      toast.dismiss(savingToastId);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      closeDialog();
      showSuccessToast(successMessage);
      void dispatch(fetchReviewRequests());
      void dispatch(fetchReputationDashboard());
    } catch (error: unknown) {
      toast.dismiss(savingToastId);
      showErrorToast(getBackendErrorMessage(error));
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      onOpenChange?.(true);
    }
  };

  const handleSaveAsDraft = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }

    if (!validateStep3()) return;
    await handleSaveRequest("draft", "Review Request Saved successfully");
  };

  const handlePrimaryAction = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }

    if (!validateStep3()) return;
    await handleSaveRequest(
      formData.is_scheduled === "yes" ? "scheduled" : "sent",
      "Review Request Saved successfully",
    );
  };

  const handleRequestNameChange = (rawValue: string) => {
    const sanitized = sanitizeRequestNameInput(rawValue);

    if (sanitized === null) {
      showErrorToast("Enter Alphanumeric only");
      return;
    }

    setFormData((prev) => ({ ...prev, request_name: sanitized }));
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      showErrorToast("File is too large. Please select a file under 25MB.");
      setFileName("");
      return;
    }
    setFileName(file.name);
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (
          isSubmittingRef.current &&
          (reason === "backdropClick" || reason === "escapeKeyDown")
        ) {
          return;
        }

        handleClose();
      }}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: { xs: "calc(100% - 24px)", sm: 660, md: 740 },
          borderRadius: "16px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          p: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography fontWeight={700} fontSize={18} color="#1F2937">
          New Review Request
        </Typography>
        <IconButton onClick={handleClose} size="small" disabled={isSubmitting}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: "0 20px", overflowY: "auto" }}>
        <ReviewRequestStepper step={step} />

        {step === 1 && (
          <ReviewRequestStepDetails
            formData={formData}
            allLeads={filteredLeads}
            leadSelectionType={leadSelectionType}
            selectedLeads={selectedLeads}
            coralRadio={coralRadio}
            onRequestNameChange={handleRequestNameChange}
            onRequestNameBlur={() => {
              validateRequestName(formData.request_name, true);
            }}
            onDescriptionChange={(value) => {
              setFormData((prev) => ({ ...prev, description: value }));
            }}
            onDescriptionBlur={() => {
              if (!isFieldFilled(formData.description)) {
                showErrorToast("Description needed");
              }
            }}
            onLeadSelectionTypeChange={handleLeadSelectionTypeChange}
            onSelectedLeadsChange={setSelectedLeads}
            leadActionFilter={leadActionFilter}
            onLeadActionFilterChange={handleLeadActionFilterChange}
            onCollectOnChange={(value) => {
              setFormData((prev) => ({ ...prev, collect_on: value }));
            }}
          />
        )}

        {step === 2 && (
          <ReviewRequestStepContent
            formData={formData}
            fileName={fileName}
            coralRadio={coralRadio}
            onModeChange={(value) => {
              setFormData((prev) => ({ ...prev, mode: value }));
            }}
            onSubjectChange={(value) => {
              setFormData((prev) => ({ ...prev, subject: value }));
            }}
            onSubjectBlur={() => {
              validateMandatoryField(formData.subject, "Subject");
            }}
            onMessageChange={(value) => {
              setFormData((prev) => ({ ...prev, message: value }));
            }}
            onMessageBlur={() => {
              validateMandatoryField(formData.message, "Message");
            }}
            onFileSelect={handleFileSelect}
          />
        )}

        {step === 3 && (
          <ReviewRequestStepSchedule
            formData={formData}
            coralRadio={coralRadio}
            onScheduleToggle={(value) => {
              setFormData((prev) => {
                if (value === "no") {
                  return { ...prev, is_scheduled: value };
                }

                const scheduledAt = getScheduledDateTime(
                  prev.schedule_date,
                  prev.schedule_time,
                );

                if (scheduledAt && scheduledAt.isAfter(new Date())) {
                  return { ...prev, is_scheduled: value };
                }

                const defaultSchedule = createInitialReviewRequestFormData();

                return {
                  ...prev,
                  is_scheduled: value,
                  schedule_date: defaultSchedule.schedule_date,
                  schedule_time: defaultSchedule.schedule_time,
                };
              });
            }}
            onDateChange={(value) => {
              setFormData((prev) => ({ ...prev, schedule_date: value }));
            }}
            onDateBlur={() => {
              if (formData.is_scheduled === "yes") {
                validateMandatoryField(formData.schedule_date, "Select Date");
              }
            }}
            onTimeChange={(value) => {
              setFormData((prev) => ({ ...prev, schedule_time: value }));
            }}
            onTimeBlur={() => {
              if (formData.is_scheduled === "yes") {
                validateMandatoryField(formData.schedule_time, "Enter Time");
              }
            }}
          />
        )}
      </DialogContent>

      <Box
        sx={{
          p: "16px 20px",
          display: "flex",
          gap: 2,
          borderTop: "1px solid #F3F4F6",
        }}
      >
        <Button
          variant="outlined"
          onClick={step === 1 ? handleClose : () => setStep((prev) => prev - 1)}
          disabled={isSubmitting}
          sx={{
            flex: 1,
            borderRadius: "8px",
            textTransform: "none",
            height: 44,
            fontWeight: 700,
            color: "#4B5563",
            borderColor: "#D1D5DB",
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSaveAsDraft}
          disabled={isSubmitting}
          sx={{
            flex: 1,
            background: "#F3F4F6",
            color: "#4B5563",
            borderRadius: "8px",
            textTransform: "none",
            height: 44,
            fontWeight: 700,
            boxShadow: "none",
            opacity: isSubmitting ? 0.7 : 1,
            "&:hover": { background: "#E5E7EB" },
          }}
        >
          {isSubmitting ? "Saving..." : "Save as Draft"}
        </Button>

        <Button
          variant="contained"
          onClick={handlePrimaryAction}
          disabled={isSubmitting}
          sx={{
            flex: 1.2,
            background: "#4D4D4D",
            borderRadius: "8px",
            textTransform: "none",
            height: 44,
            fontWeight: 700,
            opacity: isSubmitting ? 0.8 : 1,
            "&:hover": { background: "#333" },
          }}
        >
          {isSubmitting ? "Saving..." : "Save & Continue"}
        </Button>
      </Box>
    </Dialog>
  );
};

export default ReviewRequest;
