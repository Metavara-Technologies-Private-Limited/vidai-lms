import { useEffect, useRef, useState } from "react";
import "../../styles/Campaign/EmailCampaignModal.css";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Modal,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import viewIcon from "./Icons/view.png";
import { CampaignAPI } from "../../services/campaign.api";
import { Box } from "@mui/system";
import EmailTemplateModal from "../../components/Campaign/EmailTemplateModal";
import {
  CAMPAIGN_AUDIENCE,
  CAMPAIGN_MODE,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_STATUS,
  SENDER_EMAIL,
} from "../../constants/campaigns.constants";
import type { EmailCampaignPayload } from "../../types/campaigns.types";
import { useSelector } from "react-redux";
import { selectClinic } from "../../store/clinicSlice";
import {
  canTypeCampaignName,
  getCampaignNameValidationError,
} from "./campaignNameValidation";
import TemplateService, {
  type TemplateDocument,
} from "../../services/templates.api";

interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
}
interface EmailCampaignModalProps {
  onClose: () => void;
  onSave: (...args: unknown[]) => void;
}

export default function EmailCampaignModal({
  onClose,
  onSave,
}: EmailCampaignModalProps) {
  const clinic = useSelector(selectClinic);
  const clinicId = clinic?.id || 1;
  const [modalLoading, setModalLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [templateAttachments, setTemplateAttachments] = useState<
    TemplateDocument[]
  >([]);
  /* ================= STEP 1 – DETAILS ================= */
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [objective, setObjective] = useState(() => {
    const keys = Object.keys(CAMPAIGN_OBJECTIVES);

    const leadGenKey = keys.find(
      (k) =>
        k === "lead_generation" ||
        k === "LEAD_GENERATION" ||
        (CAMPAIGN_OBJECTIVES as Record<string, string>)[k]
          ?.toLowerCase()
          .includes("lead"),
    );

    return leadGenKey ?? keys[0] ?? "";
  });

  const [audience, setAudience] = useState(() => {
    const keys = Object.keys(CAMPAIGN_AUDIENCE);

    const allSubKey = keys.find(
      (k) =>
        k === "all_subscribers" ||
        k === "ALL_SUBSCRIBERS" ||
        (CAMPAIGN_AUDIENCE as Record<string, string>)[k]
          ?.toLowerCase()
          .includes("all"),
    );

    return allSubKey ?? keys[0] ?? "";
  });

  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const step1Valid =
    campaignName.trim() &&
    campaignDescription.trim() &&
    objective &&
    audience &&
    startDate &&
    endDate;

  /* ================= STEP 2 – EMAIL SETUP ================= */
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const step2Valid = audience && subject.trim() && emailBody.trim();

  /* ================= STEP 3 – SCHEDULE ================= */
  const [scheduleRange, setScheduleRange] = useState<
    [Dayjs | null, Dayjs | null]
  >([null, null]);
  const [scheduleTime, setScheduleTime] = useState("");

  const step3Valid = scheduleRange[0] && scheduleRange[1] && scheduleTime;

  const applyAiOptimizedTiming = () => {
    const now = dayjs();
    const suggested = now
      .add(5 - (now.minute() % 5), "minute")
      .second(0)
      .millisecond(0);
    setScheduleRange([suggested.startOf("day"), suggested.startOf("day")]);
    setScheduleTime(suggested.format("HH:mm"));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setModalLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /* ================= NAVIGATION ================= */
  const handleNext = () => {
    setSubmitted(true);

    if (step === 1) {
      const campaignNameError = getCampaignNameValidationError(campaignName);
      if (campaignNameError) {
        toast.error(campaignNameError, {
          toastId: "email-campaign-name-error",
        });
        return;
      }
    }

    if (step === 1 && step1Valid) {
      setStep(2);
      setSubmitted(false);
    } else if (step === 2 && step2Valid) {
      setStep(3);
      setSubmitted(false);
    }
  };

  const fetchTemplateDocuments = async (templateId: string): Promise<void> => {
    try {
      const documents = await TemplateService.getTemplateDocuments(
        "mail",
        templateId,
      );
      setTemplateAttachments(documents ?? []);
    } catch (error) {
      console.error("Failed to fetch template documents:", error);
    }
  };

  const handleSave = async (
    status: typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.SCHEDULED,
  ) => {
    setSubmitted(true);
    if (status === CAMPAIGN_STATUS.SCHEDULED && !step3Valid) {
      toast.warning("Schedule requires From date, To date, and Time.");
      return;
    }

    try {
      const start = scheduleRange[0]
        ? scheduleRange[0].format("YYYY-MM-DD")
        : null;

      const end = scheduleRange[1]
        ? scheduleRange[1].format("YYYY-MM-DD")
        : null;

      const scheduledDateTime = dayjs(
        `${start} ${scheduleTime}`,
        "YYYY-MM-DD HH:mm",
      ).format("YYYY-MM-DDTHH:mm:ss");

      const isScheduled = status === CAMPAIGN_STATUS.SCHEDULED;

      const payload: EmailCampaignPayload = {
        clinic: clinicId,
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        campaign_objective: objective,
        target_audience: audience,
        start_date: startDate,
        end_date: endDate,
        campaign_mode: CAMPAIGN_MODE.EMAIL,
        status: status.toLowerCase(),

        // Schedule details
        selected_start: isScheduled ? start : null,
        selected_end: isScheduled ? end : null,
        enter_time: isScheduled ? scheduleTime : null,

        // Email config
        email: [
          {
            audience_name: audience,
            subject: subject,
            email_body: emailBody,
            template_name: "EMAIL",
            template_id: selectedTemplateId,
            sender_email: clinic?.email ?? SENDER_EMAIL,
            scheduled_at: isScheduled ? scheduledDateTime : null,
            is_active: isScheduled,
          },
        ],
      };

      const createdRes = await CampaignAPI.createEmail(payload);

      // FIX: Pass the created campaign data to onSave so the parent
      // (CampaignsScreen) can dispatch fetchCampaign() via Redux.
      // Do NOT call CampaignAPI.list() here — that was causing the
      // duplicate list/ API call every time a campaign was saved.
      onSave(createdRes?.data ?? payload);
      toast.success("Campaign created successfully");
      onClose();
    } catch (error: unknown) {
      // FIX: Removed the CampaignAPI.list() fallback call that was here.
      // It was calling list() on EVERY failed save attempt, adding an
      // extra network request. If creation fails, just show the error —
      // the parent will re-fetch via onSave only on actual success.
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create campaign");
      }
    }
  };

  const audienceLabel =
    audience === "all"
      ? "All Subscribers"
      : audience === "active"
        ? "Active Users"
        : "";

  if (modalLoading) {
    return (
      <Modal open={true} onClose={onClose}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Modal>
    );
  }

  return (
    <>
      <Modal open={true} onClose={onClose}>
        <Box className="email-campaign-modal">
          {/* HEADER */}
          <div className="add-modal-header">
            <Typography variant="h6">Add Email Campaigns</Typography>
            <IconButton onClick={onClose} className="close-btn">
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>

          <div className="modal-divider" />

          {/*  STEPPER */}
          <div className="stepper">
            <div
              className={`step ${step === 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}
            >
              <div className="circle">{step > 1 ? "✓" : "1"}</div>
              <span>Campaign Details</span>
            </div>

            <div className="line" />

            <div
              className={`step ${step === 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}
            >
              <div className="circle">{step > 2 ? "✓" : "2"}</div>
              <span>Email Setup</span>
            </div>

            <div className="line" />

            <div className={`step ${step === 3 ? "active" : ""}`}>
              <div className="circle">3</div>
              <span>Schedule Email</span>
            </div>
          </div>

          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <div className="step-content">
              <Typography variant="h6" sx={{ mb: 3 }}>
                Campaign Details
              </Typography>

              <div
                className={`form-group ${submitted && !campaignName ? "error" : ""}`}
              >
                <label>Campaign Name *</label>
                <input
                  value={campaignName}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (!canTypeCampaignName(nextValue)) {
                      toast.error("Alphanumeric and underscore are allowed", {
                        toastId: "email-campaign-name-typing",
                      });
                      return;
                    }
                    setCampaignName(nextValue);
                  }}
                  placeholder="e.g. New Product Launch"
                />
              </div>

              <div
                className={`form-group ${submitted && !campaignDescription ? "error" : ""}`}
              >
                <label>Campaign Description *</label>
                <input
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Short description of campaign"
                />
              </div>

              <div className="form-row">
                <div
                  className={`form-group half ${submitted && !objective ? "error" : ""}`}
                >
                  <label>Campaign Objective *</label>
                  <FormControl fullWidth>
                    <Select
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">Select Objective</MenuItem>
                      {Object.entries(CAMPAIGN_OBJECTIVES).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ),
                      )}
                    </Select>
                  </FormControl>
                </div>

                <div
                  className={`form-group half ${submitted && !audience ? "error" : ""}`}
                >
                  <label>Target Audience *</label>
                  <FormControl fullWidth>
                    <Select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">Select Audience</MenuItem>
                      {Object.entries(CAMPAIGN_AUDIENCE).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ),
                      )}
                    </Select>
                  </FormControl>
                </div>
              </div>

              <div className="form-row">
                <div
                  className={`form-group half ${submitted && !startDate ? "error" : ""}`}
                >
                  <label>Start Date *</label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      value={startDate ? dayjs(startDate) : null}
                      onChange={(v) =>
                        setStartDate(v ? (v as Dayjs).format("YYYY-MM-DD") : "")
                      }
                      slots={{ openPickerIcon: CalendarTodayIcon }}
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  </LocalizationProvider>
                </div>

                <div
                  className={`form-group half ${submitted && !endDate ? "error" : ""}`}
                >
                  <label>End Date *</label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      value={endDate ? dayjs(endDate) : null}
                      onChange={(v) =>
                        setEndDate(v ? (v as Dayjs).format("YYYY-MM-DD") : "")
                      }
                      slots={{ openPickerIcon: CalendarTodayIcon }}
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && (
            <div className="step-content">
              <Typography variant="h6" sx={{ mb: 3 }}>
                Email Setup
              </Typography>
              <div
                className={`section-card ${submitted && !audience ? "error" : ""}`}
              >
                <h3>Select Audience</h3>
                <p className="section-subtitle">
                  Choose which audience list to send this email to
                </p>

                <div
                  className={`form-group ${submitted && !audience ? "error" : ""}`}
                >
                  <label>Audience List *</label>
                  <FormControl fullWidth>
                    <InputLabel>Audience List *</InputLabel>
                    <Select
                      value={audience}
                      label="Audience List *"
                      onChange={(e) => setAudience(e.target.value)}
                    >
                      <MenuItem value="">Select Audience List</MenuItem>
                      {Object.entries(CAMPAIGN_AUDIENCE).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ),
                      )}
                    </Select>
                  </FormControl>
                </div>
              </div>

              {/* ===== EMAIL CONTENT ===== */}
              <div
                className={`section-card ${submitted && (!subject || !emailBody) ? "error" : ""}`}
              >
                {/* HEADER FULL WIDTH */}
                <div className="email-content-header">
                  <div>
                    <h3>Email Content</h3>
                    <p className="section-subtitle">
                      Design your email with AI assistance
                    </p>
                  </div>

                  <div className="email-actions">
                    <button
                      className="outline-btn"
                      onClick={() => setPreviewOpen(!previewOpen)}
                    >
                      <img src={viewIcon} alt="View" width={20} height={20} />
                      Preview Email
                    </button>

                    <button
                      className="light-btn"
                      onClick={() => {
                        setTemplateAttachments([]);
                        setTemplateOpen(true);
                      }}
                    >
                      + Email Template
                    </button>
                  </div>
                </div>

                {/* FLEX ROW STARTS HERE */}
                <div className="email-body-row">
                  {/* LEFT SIDE */}
                  <div className="email-left">
                    <div
                      className={`form-group ${submitted && !subject ? "error" : ""}`}
                    >
                      <label>Subject Line *</label>
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="New Product Launch"
                      />
                      <span className="ai-suggest">✨ AI Suggest</span>
                    </div>

                    <div
                      className={`form-group ${submitted && !emailBody ? "error" : ""}`}
                    >
                      <label>Email *</label>
                      <div
                        ref={editorRef}
                        className="email-editor"
                        contentEditable
                        onInput={(e: React.FormEvent<HTMLDivElement>) =>
                          setEmailBody(e.currentTarget.innerHTML)
                        }
                      />

                      {templateAttachments.length > 0 && (
                        <div className="template-attachments">
                          <label>Attachments</label>

                          {templateAttachments.map((doc) => {
                            const url =
                              doc.file || doc.file_url || doc.url || "";
                            const name =
                              doc.name ||
                              doc.filename ||
                              (url ? url.split("/").pop() : "Attachment");

                            return (
                              <div
                                key={doc.id ? String(doc.id) : url}
                                className="attachment-item"
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  📎 {name}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <span className="ai-suggest">✨ AI Suggest</span>
                    </div>
                  </div>

                  {/* RIGHT SIDE PREVIEW */}
                  {previewOpen && (
                    <div className="email-preview">
                      <div className="preview-header">
                        <h3>Preview Email</h3>
                        <button onClick={() => setPreviewOpen(false)}>✕</button>
                      </div>

                      <div className="preview-body">
                        <p>
                          To: <span className="chip">{audienceLabel}</span>
                        </p>

                        <div className="preview-divider"></div>

                        <p className="preview-subject">
                          <span className="label">Subject:</span> {subject}
                        </p>

                        <div className="preview-divider"></div>

                        <div
                          className="preview-email-content"
                          dangerouslySetInnerHTML={{ __html: emailBody }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3 ================= */}
          {step === 3 && (
            <div className="step-content">
              <Typography variant="h6" sx={{ mb: 3 }}>
                Schedule Email
              </Typography>
              <div className="schedule-card">
                <div className="schedule-header">
                  <div className="schedule-title">
                    <h3>Schedule</h3>
                    <p>Select date and time to send the email</p>
                  </div>

                  <button type="button" className="ai-opt-btn" onClick={applyAiOptimizedTiming}>
                    ✨ AI-Optimization Timing
                  </button>
                </div>

                <div className="schedule-row">
                  <div
                    className={`schedule-field ${submitted && (!scheduleRange[0] || !scheduleRange[1]) ? "error" : ""}`}
                  >
                    <div className="form-row">
                      <div
                        className={`form-group half ${submitted && !startDate ? "error" : ""}`}
                      >
                        <label>Scheduled From</label>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            format="DD/MM/YYYY"
                            value={scheduleRange[0]}
                            minDate={dayjs()}
                            maxDate={
                              scheduleRange[1] ??
                              (endDate ? dayjs(endDate) : undefined)
                            }
                            onChange={(v) =>
                              setScheduleRange([
                                v ? dayjs(v) : null,
                                scheduleRange[1],
                              ])
                            }
                            slots={{ openPickerIcon: CalendarTodayIcon }}
                            slotProps={{ textField: { fullWidth: true } }}
                          />
                        </LocalizationProvider>
                      </div>

                      <div
                        className={`form-group half ${submitted && !endDate ? "error" : ""}`}
                      >
                        <label>Scheduled Till</label>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            format="DD/MM/YYYY"
                            value={scheduleRange[1]}
                            minDate={scheduleRange[0] ?? dayjs()}
                            maxDate={endDate ? dayjs(endDate) : undefined}
                            onChange={(v) =>
                              setScheduleRange([
                                scheduleRange[0],
                                v ? dayjs(v) : null,
                              ])
                            }
                            slots={{ openPickerIcon: CalendarTodayIcon }}
                            slotProps={{ textField: { fullWidth: true } }}
                          />
                        </LocalizationProvider>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`schedule-field ${submitted && !scheduleTime ? "error" : ""}`}
                  >
                    <label>Enter Time</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        format="hh:mm A"
                        value={
                          scheduleTime
                            ? dayjs(`2024-01-01 ${scheduleTime}`)
                            : null
                        }
                        onChange={(v) => {
                          if (v) setScheduleTime((v as Dayjs).format("HH:mm"));
                        }}
                        ampm
                        minTime={
                          scheduleRange[0] &&
                          scheduleRange[0].isSame(dayjs(), "day")
                            ? dayjs()
                            : undefined
                        }
                      />
                    </LocalizationProvider>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= FOOTER ================= */}
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>

            {step === 3 ? (
              <>
                <button
                  className="next-btn"
                  style={{ background: "#E5E7EB", color: "#111" }}
                  onClick={() => handleSave("Draft")}
                >
                  Save as Draft
                </button>
                <button
                  className="next-btn"
                  onClick={() => handleSave("Scheduled")}
                >
                  Schedule
                </button>
              </>
            ) : (
              <button className="next-btn" onClick={handleNext}>
                Next
              </button>
            )}
          </div>
        </Box>
      </Modal>
      <EmailTemplateModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSelect={(template: EmailTemplate) => {
          setSubject(template.subject);
          setEmailBody(template.body);
          setSelectedTemplateId(template.id);

          if (editorRef.current) {
            editorRef.current.innerHTML = template.body;
          }

          if (template.id) {
            fetchTemplateDocuments(template.id);
          }
        }}
      />
    </>
  );
}
