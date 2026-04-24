import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Modal,
  Box,
  IconButton,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import viewIcon from "./Icons/view.png";
import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";
import googleAdsIcon from "./Icons/google-ads.png";
import { CampaignAPI } from "../../services/campaign.api";
import "../../styles/Campaign/EmailCampaignModal.css";
import EmailTemplateModal from "../../components/Campaign/EmailTemplateModal";
import type { Campaign, CampaignAPIType } from "../../types/campaigns.types";
import {
  CAMPAIGN_AUDIENCE,
  CAMPAIGN_MODE,
  CAMPAIGN_OBJECTIVES,
  SENDER_EMAIL,
} from "../../constants/campaigns.constants";
import { selectClinic } from "../../store/clinicSlice";
import TemplateService, {
  type TemplateDocument,
} from "../../services/templates.api";
import {
  canTypeCampaignName,
  getCampaignNameValidationError,
} from "./campaignNameValidation";

interface EditCampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSave: (updated: Campaign) => void;
}

export default function EditCampaignModal({
  campaign,
  onClose,
  onSave,
}: EditCampaignModalProps) {
  const clinic = useSelector(selectClinic);
  const clinicId = clinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 0);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [fullCampaignData, setFullCampaignData] =
    useState<CampaignAPIType | null>(null);

  const [campaignName, setCampaignName] = useState(campaign.name);
  const [campaignDescription, setCampaignDescription] = useState(
    campaign.description || "",
  );
  const [objective, setObjective] = useState(campaign.objective || "");
  const [audience, setAudience] = useState(campaign.audience || "");
  const [startDate, setStartDate] = useState(campaign.start);
  const [endDate, setEndDate] = useState(campaign.end);

  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [templateAttachments, setTemplateAttachments] = useState<
    TemplateDocument[]
  >([]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [accounts, setAccounts] = useState<string[]>([]);
  const [mode, setMode] = useState<"organic" | "paid" | "">("");
  const [scheduleDate, setScheduleDate] = useState(
    campaign.scheduledAt
      ? dayjs(campaign.scheduledAt).format("YYYY-MM-DD")
      : "",
  );
  const [scheduleRange, setScheduleRange] = useState<
    [Dayjs | null, Dayjs | null]
  >([
    campaign.scheduledAt ? dayjs(campaign.scheduledAt) : null,
    campaign.scheduledAt ? dayjs(campaign.scheduledAt) : null,
  ]);
  const [scheduleTime, setScheduleTime] = useState(
    campaign.scheduledAt ? dayjs(campaign.scheduledAt).format("HH:mm") : "",
  );
  const [instagramBudget, setInstagramBudget] = useState(350);
  const [facebookBudget, setFacebookBudget] = useState(250);
  const [linkedinBudget, setLinkedinBudget] = useState(150);
  const [googleAdsBudget, setGoogleAdsBudget] = useState(200);

  const toggleAccount = (id: string) => {
    setAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await CampaignAPI.get(campaign.id);
        const data = response.data;
        setFullCampaignData(data);
        setCampaignName(data.campaign_name || "");
        setCampaignDescription(data.campaign_description || "");
        setObjective(data.campaign_objective || "");
        setAudience(data.target_audience || "");
        setStartDate(data.start_date || "");
        setEndDate(data.end_date || "");
        if (data.email?.length > 0) {
          setSubject(data.email[0].subject || "");
          setEmailBody(data.email[0].email_body || "");
          if (editorRef.current)
            editorRef.current.innerHTML = data.email[0].email_body || "";
        }
        if (data.selected_start) {
          setScheduleRange([
            dayjs(data.selected_start),
            dayjs(data.selected_end),
          ]);
          setScheduleDate(dayjs(data.selected_start).format("YYYY-MM-DD"));
        }
        if (data.enter_time) setScheduleTime(data.enter_time);
        if (
          Array.isArray(data.select_ad_accounts) &&
          data.select_ad_accounts.length > 0
        ) {
          setAccounts(data.select_ad_accounts.filter(Boolean));
        } else if (data.social_media?.length > 0) {
          setAccounts(
            data.social_media
              .filter((sm: { is_active?: boolean }) => sm.is_active !== false)
              .map((sm: { platform_name: string }) => sm.platform_name),
          );
        }

        // ← FIXED: use campaign_mode (numeric) not posting_mode/mode
        if (data.campaign_mode === 1) setMode("organic");
        if (data.campaign_mode === 2) setMode("paid");
      } catch (error) {
        console.error("Failed to fetch campaign:", error);
      }
    };
    fetchCampaign();
  }, [campaign.id]);

  useEffect(() => {
    if (
      editorRef.current &&
      emailBody &&
      editorRef.current.innerHTML !== emailBody
    ) {
      editorRef.current.innerHTML = emailBody;
    }
  }, [step, emailBody]);

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

  const step1Valid =
    campaignName.trim() &&
    campaignDescription.trim() &&
    objective &&
    audience &&
    startDate &&
    endDate;
  const step2Valid =
    campaign.type === "email"
      ? audience && subject.trim() && emailBody.trim()
      : accounts.length > 0 && mode;
  const step3Valid =
    campaign.type === "email"
      ? scheduleRange[0] && scheduleRange[1] && scheduleTime
      : scheduleDate && scheduleTime;

  const handleNext = () => {
    setSubmitted(true);
    if (step === 1) {
      const campaignNameError = getCampaignNameValidationError(campaignName);
      if (campaignNameError) {
        toast.error(campaignNameError, { toastId: "edit-campaign-name-error" });
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

  const handleUpdate = async () => {
    setSubmitted(true);
    if (!step3Valid || !fullCampaignData) return;
    try {
      const start =
        campaign.type === "email"
          ? scheduleRange[0]?.format("YYYY-MM-DD")
          : scheduleDate;
      const end =
        campaign.type === "email"
          ? scheduleRange[1]?.format("YYYY-MM-DD")
          : scheduleDate;
      const scheduledDateTime = dayjs(
        `${start} ${scheduleTime}`,
        "YYYY-MM-DD HH:mm",
      ).format("YYYY-MM-DDTHH:mm:ss");

      const socialAccountData =
        campaign.type === "social"
          ? accounts
              .filter((platform) => platform !== "google_ads")
              .map((platform) => {
                const existing = fullCampaignData.social_media?.find(
                  (sm: { id: number; platform_name: string }) =>
                    sm.platform_name === platform,
                );
                return {
                  id: existing?.id,
                  platform_name: platform,
                  is_active: true,
                };
              })
          : [];

      const socialPayload =
        campaign.type === "social"
          ? {
              social_media: socialAccountData,
              select_ad_accounts: accounts,
              campaign_content:
                fullCampaignData.campaign_content || campaignName,
              platform_data: fullCampaignData.platform_data || {},
              budget_data: fullCampaignData.budget_data || {},
            }
          : {};

      const payload = {
        clinic: clinicId,
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        campaign_objective: objective,
        target_audience: audience,
        start_date: startDate,
        end_date: endDate,
        campaign_mode:
          campaign.type === "email"
            ? CAMPAIGN_MODE.EMAIL
            : mode === "paid"
              ? CAMPAIGN_MODE.PAID
              : CAMPAIGN_MODE.ORGANIC,
        selected_start: start ?? null,
        selected_end: end ?? null,
        enter_time: scheduleTime,
        email:
          campaign.type === "email"
            ? [
                {
                  id: fullCampaignData.email?.[0]?.id,
                  audience_name: audience,
                  subject,
                  email_body: emailBody,
                  template_name: "EMAIL",
                  template_id: selectedTemplateId,
                  sender_email: SENDER_EMAIL,
                  scheduled_at: scheduledDateTime,
                  is_active: true,
                },
              ]
            : [],
        ...socialPayload,
      };

      await CampaignAPI.update(campaign.id, payload);

      const updatedCampaign: Campaign = {
        ...campaign,
        name: campaignName,
        description: campaignDescription,
        objective: objective as Campaign["objective"],
        audience: audience as Campaign["audience"],
        start: startDate,
        end: endDate,
        scheduledAt: `${start}T${scheduleTime}`,
      };

      onSave(updatedCampaign);
      onClose();
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const audienceLabel =
    audience === "all"
      ? "All Subscribers"
      : audience === "active"
        ? "Active Users"
        : "";

  return (
    <>
      <Modal open={true} onClose={onClose}>
        <Box className="email-campaign-modal">
          <div className="add-modal-header">
            <Typography variant="h6">
              Edit {campaign.type === "email" ? "Email" : "Social Media"}{" "}
              Campaign
            </Typography>
            <IconButton onClick={onClose} className="modal-close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <div className="modal-divider" />

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
              <span>
                {campaign.type === "email"
                  ? "Email Setup"
                  : "Content & Configuration"}
              </span>
            </div>
            <div className="line" />
            <div className={`step ${step === 3 ? "active" : ""}`}>
              <div className="circle">3</div>
              <span>
                Schedule {campaign.type === "email" ? "Email" : "Campaign"}
              </span>
            </div>
          </div>

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
                      toast.error(
                        "Alphanumeric and underscore are allowed",
                        { toastId: "edit-campaign-name-typing" },
                      );
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
                      slotProps={{ textField: { fullWidth: true } }}
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
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </div>
              </div>
            </div>
          )}

          {step === 2 && campaign.type === "email" && (
            <div className="step-content">
              <h2>Email Setup</h2>
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
                    <Select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      displayEmpty
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
              <div
                className={`section-card ${submitted && (!subject || !emailBody) ? "error" : ""}`}
              >
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
                <div className="email-body-row">
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

          {step === 2 && campaign.type === "social" && (
            <div className="step-content">
              <h2>Content & Configuration</h2>
              <div
                className={`section-card ${submitted && accounts.length === 0 ? "error" : ""}`}
              >
                <h3>Select Ad Accounts</h3>
                <p className="section-subtitle">
                  Select your social media ad accounts
                </p>
                <div className="account-row">
                  {[
                    {
                      id: "instagram",
                      label: "Instagram",
                      icon: instagramIcon,
                    },
                    { id: "facebook", label: "Facebook", icon: facebookIcon },
                    { id: "linkedin", label: "LinkedIn", icon: linkedinIcon },
                    {
                      id: "google_ads",
                      label: "Google Ads",
                      icon: googleAdsIcon,
                    },
                  ].map((acc) => (
                    <div
                      key={acc.id}
                      className={`account-card ${accounts.includes(acc.id) ? "selected" : ""}`}
                      onClick={() => toggleAccount(acc.id)}
                    >
                      <div className="account-left">
                        <img src={acc.icon} alt={acc.label} />
                        <span>{acc.label}</span>
                      </div>
                      <div
                        className={`account-checkbox ${accounts.includes(acc.id) ? "checked" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div
                className={`section-card ${submitted && !mode ? "error" : ""}`}
              >
                <h3>Campaign Mode</h3>
                <p className="section-subtitle">
                  Choose a campaign mode to optimize your ad strategy
                </p>
                <div className="mode-row">
                  <div
                    className={`mode-card ${mode === "organic" ? "selected" : ""}`}
                    onClick={() => setMode("organic")}
                  >
                    <div className="mode-left">
                      <div
                        className={`radio ${mode === "organic" ? "checked" : ""}`}
                      />
                      <div className="mode-text">
                        <h4>Organic Posting</h4>
                        <p>
                          Post to your connected social accounts without ad
                          spend.
                        </p>
                      </div>
                    </div>
                    <span className="badge">No Budget Required</span>
                  </div>
                  <div
                    className={`mode-card ${mode === "paid" ? "selected" : ""}`}
                    onClick={() => setMode("paid")}
                  >
                    <div className="mode-left">
                      <div
                        className={`radio ${mode === "paid" ? "checked" : ""}`}
                      />
                      <div className="mode-text">
                        <h4>Paid Advertising</h4>
                        <p>
                          Boost your reach and engagement with targeted ads.
                        </p>
                      </div>
                    </div>
                    <span className="badge outlined">
                      Budget Setup Required
                    </span>
                  </div>
                </div>
              </div>
              {mode && (
                <div className="section-card">
                  <h2>Campaign Content</h2>
                  <p className="section-subtitle">
                    Create your post content with AI assistance
                  </p>
                  <div className="content-row">
                    <img src={instagramIcon} alt="Instagram" />
                    <textarea
                      placeholder="What would you like to share on Instagram?"
                      disabled={!accounts.includes("instagram")}
                      style={{
                        opacity: accounts.includes("instagram") ? 1 : 0.5,
                        cursor: accounts.includes("instagram")
                          ? "text"
                          : "not-allowed",
                      }}
                    />
                  </div>
                  <div className="content-row">
                    <img src={facebookIcon} alt="Facebook" />
                    <input
                      placeholder="What would you like to share on Facebook?"
                      disabled={!accounts.includes("facebook")}
                      style={{
                        opacity: accounts.includes("facebook") ? 1 : 0.5,
                        cursor: accounts.includes("facebook")
                          ? "text"
                          : "not-allowed",
                      }}
                    />
                  </div>
                  <div className="content-row">
                    <img src={linkedinIcon} alt="LinkedIn" />
                    <input
                      placeholder="What would you like to share on LinkedIn?"
                      disabled={!accounts.includes("linkedin")}
                      style={{
                        opacity: accounts.includes("linkedin") ? 1 : 0.5,
                        cursor: accounts.includes("linkedin")
                          ? "text"
                          : "not-allowed",
                      }}
                    />
                  </div>
                  <div className="content-row">
                    <img src={googleAdsIcon} alt="Google Ads" />
                    <input
                      placeholder="What would you like to share on Google Ads?"
                      disabled={!accounts.includes("google_ads")}
                      style={{
                        opacity: accounts.includes("google_ads") ? 1 : 0.5,
                        cursor: accounts.includes("google_ads")
                          ? "text"
                          : "not-allowed",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && campaign.type === "email" && (
            <div className="step-content">
              <h2>Schedule Email</h2>
              <div className="schedule-card">
                <div className="schedule-header">
                  <div className="schedule-title">
                    <h3>Schedule</h3>
                    <p>Select date and time to send the email</p>
                  </div>
                  <button className="ai-opt-btn">
                    ✨ AI-Optimization Timing
                  </button>
                </div>
                <div className="schedule-row">
                  <div
                    className={`schedule-field ${submitted && (!scheduleRange[0] || !scheduleRange[1]) ? "error" : ""}`}
                  >
                    <label>Select Date</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <DatePicker
                          label="From"
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
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                        <DatePicker
                          label="To"
                          value={scheduleRange[1]}
                          minDate={scheduleRange[0] ?? dayjs()}
                          maxDate={endDate ? dayjs(endDate) : undefined}
                          onChange={(v) =>
                            setScheduleRange([
                              scheduleRange[0],
                              v ? dayjs(v) : null,
                            ])
                          }
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </div>
                    </LocalizationProvider>
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

          {step === 3 && campaign.type === "social" && (
            <div className="step-content">
              <h3>Schedule Campaign</h3>
              <div className="section-card">
                <div className="schedule-header">
                  <div>
                    <h3>
                      {mode === "paid"
                        ? "Schedule & Budget Allocation"
                        : "Schedule"}
                    </h3>
                    <p className="section-subtitle">
                      {mode === "paid"
                        ? "Establish your schedule and budget for every platform."
                        : "Select a date and time for the campaign."}
                    </p>
                  </div>
                  <button className="ai-btn">✨ AI-Optimization Timing</button>
                </div>
                <div className="schedule-row">
                  <div className="form-group half">
                    <label>Select Date</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        format="DD/MM/YYYY"
                        value={scheduleDate ? dayjs(scheduleDate) : null}
                        onChange={(v) =>
                          setScheduleDate(
                            v ? (v as Dayjs).format("YYYY-MM-DD") : "",
                          )
                        }
                        slots={{ openPickerIcon: CalendarTodayIcon }}
                      />
                    </LocalizationProvider>
                  </div>
                  <div className="form-group half">
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
                      />
                    </LocalizationProvider>
                  </div>
                </div>
                {mode === "paid" && (
                  <>
                    <div className="budget-divider" />
                    <div className="budget-section">
                      <h3>Budget Allocation</h3>
                      <div className="budget-row">
                        {accounts.includes("instagram") && (
                          <div className="budget-card">
                            <div className="budget-title">
                              <img
                                src={instagramIcon}
                                alt="Instagram"
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  objectFit: "contain",
                                }}
                              />
                              <span>Instagram (Estimate CPC : $3.5)</span>
                            </div>
                            <div className="budget-input-wrapper">
                              <label>Enter Amount ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={instagramBudget}
                                onChange={(e) =>
                                  setInstagramBudget(Number(e.target.value))
                                }
                                className="budget-input"
                              />
                            </div>
                          </div>
                        )}
                        {accounts.includes("facebook") && (
                          <div className="budget-card">
                            <div className="budget-title">
                              <img
                                src={facebookIcon}
                                alt="Facebook"
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  objectFit: "contain",
                                }}
                              />
                              <span>Facebook (Estimate CPC : $2.5)</span>
                            </div>
                            <div className="budget-input-wrapper">
                              <label>Enter Amount ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={facebookBudget}
                                onChange={(e) =>
                                  setFacebookBudget(Number(e.target.value))
                                }
                                className="budget-input"
                              />
                            </div>
                          </div>
                        )}
                        {accounts.includes("linkedin") && (
                          <div className="budget-card">
                            <div className="budget-title">
                              <img
                                src={linkedinIcon}
                                alt="LinkedIn"
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  objectFit: "contain",
                                }}
                              />
                              <span>LinkedIn (Estimate CPC : $1.5)</span>
                            </div>
                            <div className="budget-input-wrapper">
                              <label>Enter Amount ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={linkedinBudget}
                                onChange={(e) =>
                                  setLinkedinBudget(Number(e.target.value))
                                }
                                className="budget-input"
                              />
                            </div>
                          </div>
                        )}
                        {accounts.includes("google_ads") && (
                          <div className="budget-card">
                            <div className="budget-title">
                              <img
                                src={googleAdsIcon}
                                alt="Google Ads"
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  objectFit: "contain",
                                }}
                              />
                              <span>Google Ads (Estimate CPC : $2.0)</span>
                            </div>
                            <div className="budget-input-wrapper">
                              <label>Enter Amount ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={googleAdsBudget}
                                onChange={(e) =>
                                  setGoogleAdsBudget(Number(e.target.value))
                                }
                                className="budget-input"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="total-budget">
                        <div>
                          <h4>
                            Total Budget: $
                            {(accounts.includes("instagram")
                              ? instagramBudget
                              : 0) +
                              (accounts.includes("facebook")
                                ? facebookBudget
                                : 0) +
                              (accounts.includes("linkedin")
                                ? linkedinBudget
                                : 0) +
                              (accounts.includes("google_ads")
                                ? googleAdsBudget
                                : 0)}
                          </h4>
                          <p>
                            Ad spend is charged directly by each connected
                            social media platform. We don't handle payments.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            {step === 3 ? (
              <button className="next-btn" onClick={handleUpdate}>
                Update Campaign
              </button>
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
        onSelect={(template: { subject: string; body: string; id: string }) => {
          setSubject(template.subject);
          setEmailBody(template.body);
          setSelectedTemplateId(template.id);
          if (editorRef.current) editorRef.current.innerHTML = template.body;
          if (template.id) fetchTemplateDocuments(template.id);
        }}
      />
    </>
  );
}
