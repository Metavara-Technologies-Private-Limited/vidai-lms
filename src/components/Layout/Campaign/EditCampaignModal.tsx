/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
import dayjs from "dayjs";
import viewIcon from "./Icons/view.png";
import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";
import { CampaignAPI } from "../../../../src/services/campaign.api";
import "../../../../src/styles/Campaign/EmailCampaignModal.css";

interface EditCampaignModalProps {
  campaign: any;
  onClose: () => void;
  onSave: (updatedCampaign: any) => void;
}

export default function EditCampaignModal({
  campaign,
  onClose,
  onSave,
}: EditCampaignModalProps) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [fullCampaignData, setFullCampaignData] = useState<any>(null);

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

  const [accounts, setAccounts] = useState<string[]>([]);
  const [mode, setMode] = useState<"organic" | "paid" | "">("");

  const [scheduleDate, setScheduleDate] = useState(
    campaign.scheduledAt
      ? dayjs(campaign.scheduledAt).format("YYYY-MM-DD")
      : "",
  );
  const [scheduleTime, setScheduleTime] = useState(
    campaign.scheduledAt ? dayjs(campaign.scheduledAt).format("HH:mm") : "",
  );
  const [instagramBudget, setInstagramBudget] = useState(350);
  const [facebookBudget, setFacebookBudget] = useState(250);
  const [linkedinBudget, setLinkedinBudget] = useState(150);

  const toggleAccount = (id: string) => {
    setAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await CampaignAPI.get(campaign.id);
        setFullCampaignData(response.data);

        if (response.data.email && response.data.email.length > 0) {
          setSubject(response.data.email[0].subject || "");
          setEmailBody(response.data.email[0].email_body || "");
        }

        if (
          response.data.social_media &&
          response.data.social_media.length > 0
        ) {
          const platforms = response.data.social_media.map(
            (sm: any) => sm.platform_name,
          );
          setAccounts(platforms);
        }
      } catch (error) {
        console.error("Failed to fetch campaign:", error);
      }
    };

    fetchCampaign();
  }, [campaign.id]);

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

  const step3Valid = scheduleDate && scheduleTime;

  const handleNext = () => {
    setSubmitted(true);
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
      const scheduledDateTime = dayjs(
        `${scheduleDate} ${scheduleTime}`,
        "YYYY-MM-DD HH:mm",
      ).format("YYYY-MM-DDTHH:mm:ss");

      const payload = {
        clinic: 1,
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        campaign_objective: objective,
        target_audience: audience,
        start_date: startDate,
        end_date: endDate,
        campaign_mode: campaign.type === "email" ? 2 : 1,
        selected_start: scheduledDateTime,
        selected_end: scheduledDateTime,
        enter_time: scheduleTime,
        email:
          campaign.type === "email"
            ? [
                {
                  id: fullCampaignData.email?.[0]?.id,
                  audience_name: audience,
                  subject: subject,
                  email_body: emailBody,
                  template_name: "EMAIL",
                  sender_email: "noreply@clinic.com",
                  scheduled_at: scheduledDateTime,
                  is_active: true,
                },
              ]
            : [],
        social_media:
          campaign.type === "social"
            ? accounts.map((platform) => {
                const existing = fullCampaignData.social_media?.find(
                  (sm: any) => sm.platform_name === platform,
                );
                return {
                  id: existing?.id,
                  platform_name: platform,
                  is_active: true,
                };
              })
            : [],
      };

      const response = await CampaignAPI.update(campaign.id, payload);
      onSave(response.data);
      onClose();
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <Box className="email-campaign-modal">
        <div className="add-modal-header">
          <Typography variant="h6">
            Edit {campaign.type === "email" ? "Email" : "Social Media"} Campaign
          </Typography>
          <IconButton onClick={onClose} className="close-btn">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <div className="modal-divider" />

        {/* STEPPER */}
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

        {/* STEP 1 - COMMON */}
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
                onChange={(e) => setCampaignName(e.target.value)}
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
                    <MenuItem value="awareness">Awareness</MenuItem>
                    <MenuItem value="leads">Lead Generation</MenuItem>
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
                    <MenuItem value="all">All Subscribers</MenuItem>
                    <MenuItem value="active">Active Users</MenuItem>
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
                    onChange={(v) => setStartDate(v ? (v as import("dayjs").Dayjs).format("YYYY-MM-DD") : "")}
                    slots={{ openPickerIcon: CalendarTodayIcon }}
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
                    onChange={(v) => setEndDate(v ? (v as import("dayjs").Dayjs).format("YYYY-MM-DD") : "")}
                    slots={{ openPickerIcon: CalendarTodayIcon }}
                  />
                </LocalizationProvider>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 - EMAIL */}
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
                    <MenuItem value="all">All Subscribers</MenuItem>
                    <MenuItem value="active">Active Users</MenuItem>
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
                  <button className="outline-btn">
                    <img src={viewIcon} alt="View" width={20} height={20} />
                    Preview Email
                  </button>
                  <button className="light-btn">+ Email Template</button>
                </div>
              </div>

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
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="New Product Launch"
                />
                <span className="ai-suggest">✨ AI Suggest</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 - SOCIAL */}
        {step === 2 && campaign.type === "social" && (
          <div className="step-content">
            <h2>Content & Configuration</h2>

            {/* Ad Accounts */}
            <div
              className={`section-card ${submitted && accounts.length === 0 ? "error" : ""}`}
            >
              <h3>Select Ad Accounts</h3>
              <p className="section-subtitle">
                Select your social media ad accounts
              </p>

              <div className="account-row">
                {[
                  { id: "instagram", label: "Instagram", icon: instagramIcon },
                  { id: "facebook", label: "Facebook", icon: facebookIcon },
                  { id: "linkedin", label: "LinkedIn", icon: linkedinIcon },
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

            {/* Campaign Mode */}
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
                        Post to your connected social accounts without ad spend.
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
                      <p>Boost your reach and engagement with targeted ads.</p>
                    </div>
                  </div>
                  <span className="badge outlined">Budget Setup Required</span>
                </div>
              </div>
            </div>

            {/* Campaign Content */}
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
              </div>
            )}
          </div>
        )}

        {/* STEP 3 - EMAIL */}
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
                  className={`schedule-field ${submitted && !scheduleDate ? "error" : ""}`}
                >
                  <label>Select Date</label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      value={scheduleDate ? dayjs(scheduleDate) : null}
                      onChange={(v) =>
                        setScheduleDate(v ? (v as import("dayjs").Dayjs).format("YYYY-MM-DD") : "")
                      }
                      slots={{ openPickerIcon: CalendarTodayIcon }}
                    />
                  </LocalizationProvider>
                </div>

                <div
                  className={`schedule-field ${submitted && !scheduleTime ? "error" : ""}`}
                >
                  <label>Enter Time</label>
                  <input
                    className="schedule-input"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - SOCIAL */}
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
                      setScheduleDate(v ? (v as import("dayjs").Dayjs).format("YYYY-MM-DD") : "")
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
                        if (v) setScheduleTime((v as import("dayjs").Dayjs).format("HH:mm"));
                      }}
                      ampm
                    />
                  </LocalizationProvider>
                </div>
              </div>

              {/* Budget Section */}
              {mode === "paid" && (
                <>
                  <div className="budget-divider" />
                  <div className="budget-section">
                    <h3>Budget Allocation</h3>
                    <div className="budget-row">
                      {accounts.includes("instagram") && (
                        <div className="budget-card">
                          <div className="budget-title">
                            <img src={instagramIcon} alt="Instagram" />
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
                            <img src={facebookIcon} alt="Facebook" />
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
                            <img src={linkedinIcon} alt="LinkedIn" />
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
                              : 0)}
                        </h4>
                        <p>
                          Ad spend is charged directly by each connected social
                          media platform. We don't handle payments.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
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
  );
}
