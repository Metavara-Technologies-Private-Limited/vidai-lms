/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import "../../../../src/styles/Campaign/EmailCampaignModal.css";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { FormControl, InputLabel, Select, MenuItem, Modal, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import viewIcon from "./Icons/view.png"; 
import { CampaignAPI } from "../../../../src/services/campaign.api";
import { Box } from "@mui/system";

export default function EmailCampaignModal({ onClose, onSave }: any) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  /* ================= STEP 1 – DETAILS ================= */
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const step2Valid = audience && subject.trim() && emailBody.trim();

  /* ================= STEP 3 – SCHEDULE ================= */
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const step3Valid = scheduleDate && scheduleTime;

  /* ================= NAVIGATION ================= */
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

  const handleSave = async (status: "Draft" | "Scheduled") => {
    setSubmitted(true);
    if (!step3Valid) return;

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
        campaign_mode: 2,

        selected_start: scheduledDateTime,
        selected_end: scheduledDateTime,
        enter_time: scheduleTime,

        email: [
          {
            audience_name: audience,
            subject: subject,
            email_body: emailBody,
            template_name: "EMAIL",
            sender_email: "noreply@clinic.com", // ✅ REQUIRED
            scheduled_at: status === "Scheduled" ? scheduledDateTime : null,
            is_active: status === "Scheduled",
          },
        ],
      };

      console.log("PAYLOAD:", payload);

      const response = await CampaignAPI.create(payload);

      const apiData = response.data;

      const formattedCampaign = {
        id: apiData.id,
        name: apiData.campaign_name,
        type: apiData.campaign_mode === 2 ? "email" : "social",
        status: apiData.is_active ? "Live" : "Draft",
        start: apiData.start_date,
        end: apiData.end_date,
        platforms:
          apiData.campaign_mode === 2 ? ["gmail"] : ["facebook", "instagram"],
        leads: 0,
        scheduledAt: apiData.selected_start,
      };

      onSave(formattedCampaign); 
      toast.success("Campaign created successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  return (
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
                    onChange={(v) =>
                      setStartDate(v ? v.format("YYYY-MM-DD") : "")
                    }
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
                    onChange={(v) =>
                      setEndDate(v ? v.format("YYYY-MM-DD") : "")
                    }
                    slots={{ openPickerIcon: CalendarTodayIcon }}
                  />
                </LocalizationProvider>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
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
                  <InputLabel>Audience List *</InputLabel>
                  <Select
                    value={audience}
                    label="Audience List *"
                    onChange={(e) => setAudience(e.target.value)}
                  >
                    <MenuItem value="">Select Audience List</MenuItem>
                    <MenuItem value="all">All Subscribers</MenuItem>
                    <MenuItem value="active">Active Users</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* ===== EMAIL CONTENT ===== */}
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
                  <button className="outline-btn" >
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

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
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
                        setScheduleDate(v ? v.format("YYYY-MM-DD") : "")
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
  );
}
