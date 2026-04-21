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
import { clinicsApi } from "../../services/tickets.api";
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
import {
  buildOptimisticRequest,
  coralRadio,
  type CreateRequestResponse,
  extractClinicEmails,
  getBackendErrorMessage,
  getConfiguredGoogleReviewUrl,
  handleDeliveryReport,
  isGoogleReviewUrlConfigured,
  isValidEmailAddress,
  isValidPhoneNumber,
  normalizeMessageForRequest,
} from "./reviewRequest.helpers";

type ReviewRequestProps = {
  open: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;
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
  const [defaultClinicEmail, setDefaultClinicEmail] = useState("");
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const clinicIdFromStorage = Number(localStorage.getItem("clinic_id") || 0);
    const clinicIdFromLeads = Number(allLeads[0]?.clinic_id || 0);
    const resolvedClinicId = clinicIdFromStorage || clinicIdFromLeads;

    if (!resolvedClinicId) {
      return;
    }

    let isMounted = true;

    const loadClinicSenderEmail = async () => {
      try {
        const clinicData = await clinicsApi.getClinicDetail(resolvedClinicId);
        const clinicEmails = extractClinicEmails(clinicData);
        const fallbackEmail = clinicEmails[0] || "";

        if (!isMounted || !fallbackEmail) {
          return;
        }

        setDefaultClinicEmail(fallbackEmail);
        setFormData((prev) => {
          if (prev.from_email.trim()) {
            return prev;
          }

          return { ...prev, from_email: fallbackEmail };
        });
      } catch {
        if (isMounted) {
          setDefaultClinicEmail("");
        }
      }
    };

    loadClinicSenderEmail();

    return () => {
      isMounted = false;
    };
  }, [open, allLeads]);

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

  const showWarningToast = (message: string) => {
    toast.warning(message, { toastId: `review-request-warning-${message}` });
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
    setDefaultClinicEmail("");
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
    const isEmailMode = formData.mode === "email";
    const subjectEmpty = isEmailMode && !isFieldFilled(formData.subject);
    const messageEmpty = !isFieldFilled(formData.message);

    if (subjectEmpty && messageEmpty) {
      showErrorToast("Please fill all fields");
      return false;
    }

    if (isEmailMode && !validateMandatoryField(formData.subject, "Subject")) {
      return false;
    }

    if (!validateMandatoryField(formData.message, "Message")) {
      return false;
    }

    if (formData.mode === "email") {
      if (!validateMandatoryField(formData.from_email, "From")) {
        return false;
      }

      if (!isValidEmailAddress(formData.from_email)) {
        showErrorToast("Enter valid sender email in From");
        return false;
      }

      const ccHasInvalid = formData.cc_emails.some(
        (email) => !isValidEmailAddress(email),
      );
      if (ccHasInvalid) {
        showErrorToast("One or more CC emails are invalid");
        return false;
      }

      const bccHasInvalid = formData.bcc_emails.some(
        (email) => !isValidEmailAddress(email),
      );
      if (bccHasInvalid) {
        showErrorToast("One or more BCC emails are invalid");
        return false;
      }
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

      const shouldValidateRecipients = status !== "draft";
      const invalidLeads = shouldValidateRecipients
        ? targetLeads.filter((lead) => {
            if (formData.mode === "email") {
              return !isValidEmailAddress(lead.email);
            }

            return !isValidPhoneNumber(lead.contact_no);
          })
        : [];

      // Debug logging
      if (invalidLeads.length > 0) {
        console.warn(
          `[Validation] ${invalidLeads.length} invalid lead(s)`,
          invalidLeads.map((lead) => ({
            id: lead.id,
            name: lead.full_name,
            contact: formData.mode === "email" ? lead.email : lead.contact_no,
          })),
        );
      }

      const invalidLeadIdSet = new Set(
        invalidLeads.map((lead) => String(lead.id)),
      );

      const validLeads = shouldValidateRecipients
        ? targetLeads.filter((lead) => !invalidLeadIdSet.has(String(lead.id)))
        : targetLeads;

      if (invalidLeads.length > 0) {
        const recipientType = formData.mode === "email" ? "email" : "phone";
        const sampleNames = invalidLeads
          .slice(0, 3)
          .map((lead) => lead.full_name)
          .join(", ");

        showWarningToast(
          `Skipped ${invalidLeads.length} lead(s) with invalid ${recipientType} details (${sampleNames}${invalidLeads.length > 3 ? ", ..." : ""}). Sending to valid leads only.`,
        );
      }

      const clinicId =
        validLeads[0]?.clinic_id ??
        (leadSelectionType === "manual"
          ? selectedLeads[0]?.clinic_id
          : filteredLeads[0]?.clinic_id) ??
        (Number(localStorage.getItem("clinic_id") || 0) || null) ??
        1;

      const clinicScopedLeads = validLeads.filter(
        (lead) => Number(lead.clinic_id) === Number(clinicId),
      );

      const skippedClinicMismatchCount =
        validLeads.length - clinicScopedLeads.length;
      if (skippedClinicMismatchCount > 0) {
        showWarningToast(
          `Skipped ${skippedClinicMismatchCount} lead(s) that belong to a different clinic.`,
        );
      }

      const leadIds = clinicScopedLeads.map((lead) => String(lead.id));

      if (leadIds.length === 0) {
        const recipientType = formData.mode === "email" ? "email" : "phone";
        showErrorToast(
          invalidLeads.length > 0
            ? `No valid ${recipientType} recipients available. Update lead contact details and try again.`
            : "No leads available. Please refresh leads and try again.",
        );
        toast.dismiss(savingToastId);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        onOpenChange?.(true);
        return;
      }

      const normalizedMessage = normalizeMessageForRequest(formData.message);
      const reviewFooter = `

---

Please share your valuable feedback here:

{review_link}`;
      const messageWithFooter = normalizedMessage.replace(
        /\{review_link\}|Share Review:\s*\{review_link\}|\[review_link\]/gi,
        "",
      );
      const messageWithReviewToken = messageWithFooter.trim() + reviewFooter;

      const configuredGoogleReviewUrl = getConfiguredGoogleReviewUrl();

      if (formData.collect_on === "google") {
        if (!isGoogleReviewUrlConfigured(configuredGoogleReviewUrl)) {
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
          ? messageWithReviewToken.replace(
              /\{review_link\}/gi,
              configuredGoogleReviewUrl,
            )
          : messageWithReviewToken;

      const payload = {
        clinic: clinicId,
        request_name: formData.request_name.trim(),
        description: formData.description.trim(),
        collect_on: formData.collect_on,
        mode: formData.mode,
        subject: formData.subject.trim(),
        message: resolvedMessage,
        ...(formData.mode === "email" && {
          sender_email:
            formData.from_email.trim() ||
            defaultClinicEmail.trim() ||
            undefined,
          cc: formData.cc_emails,
          bcc: formData.bcc_emails,
        }),
        status,
        lead_ids: leadIds,
        ...(formData.is_scheduled === "yes" && {
          schedule_date: formatDate(formData.schedule_date.trim()),
          schedule_time: formatTime(formData.schedule_time.trim()),
        }),
      };

      const response = (await reputationApi.createRequest(
        payload,
      )) as CreateRequestResponse;

      // Only prepend the request card if:
      // 1. Status is draft (no delivery check), OR
      // 2. No delivery_report present (email mode), OR
      // 3. delivery_report.success_count > 0 (SMS/WhatsApp actually sent)
      const shouldPrependRequest =
        status === "draft" ||
        !response.delivery_report ||
        (response.delivery_report &&
          response.delivery_report.success_count > 0);

      if (shouldPrependRequest) {
        dispatch(
          prependReviewRequest(
            buildOptimisticRequest(response, payload, response.delivery_report),
          ),
        );
      }

      toast.dismiss(savingToastId);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      closeDialog();

      // Handle delivery report if present (for SMS/WhatsApp modes)
      if (response.delivery_report) {
        handleDeliveryReport(
          response.status,
          response.delivery_report,
          (msg: string, type: "success" | "error" | "warning") => {
            if (type === "success") {
              showSuccessToast(msg);
            } else if (type === "warning") {
              showWarningToast(msg);
            } else {
              showErrorToast(msg);
            }
          },
        );
      } else {
        showSuccessToast(successMessage);
      }

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
          m: { xs: 1.5, sm: 2 },
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

      <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, py: 0, overflowY: "auto" }}>
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
              setFormData((prev) => ({
                ...prev,
                mode: value,
                ...(value === "email" && !prev.from_email && defaultClinicEmail
                  ? { from_email: defaultClinicEmail }
                  : {}),
              }));
            }}
            onFromEmailChange={(value) => {
              setFormData((prev) => ({ ...prev, from_email: value }));
            }}
            onCcChange={(value) => {
              setFormData((prev) => ({ ...prev, cc_emails: value }));
            }}
            onBccChange={(value) => {
              setFormData((prev) => ({ ...prev, bcc_emails: value }));
            }}
            onSubjectChange={(value) => {
              setFormData((prev) => ({ ...prev, subject: value }));
            }}
            onSubjectBlur={() => {
              if (formData.mode === "email") {
                validateMandatoryField(formData.subject, "Subject");
              }
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
          p: { xs: 2, sm: "16px 20px" },
          display: "flex",
          gap: 2,
          flexDirection: { xs: "column-reverse", sm: "row" },
          alignItems: "stretch",
          borderTop: "1px solid #F3F4F6",
        }}
      >
        <Button
          variant="outlined"
          onClick={step === 1 ? handleClose : () => setStep((prev) => prev - 1)}
          disabled={isSubmitting}
          sx={{
            flex: 1,
            width: { xs: "100%", sm: "auto" },
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
            width: { xs: "100%", sm: "auto" },
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
            width: { xs: "100%", sm: "auto" },
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
