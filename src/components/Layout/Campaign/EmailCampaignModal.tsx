import { useState } from "react";
import { v4 as uuid } from "uuid";
import "../../../../src/styles/Campaign/EmailCampaignModal.css";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import dayjs from "dayjs";
import viewIcon from "./Icons/view.png"; // adjust path if needed

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

  const handleSave = (status: "Draft" | "Scheduled") => {
    setSubmitted(true);
    if (!step3Valid) return;

    const newCampaign = {
      id: uuid(),
      name: campaignName,
      type: "email",
      status,
      start: startDate,
      end: endDate,
      platforms: ["gmail"],
      leads: 0,
      scheduledAt: `${scheduleDate} ${scheduleTime}`,
    };

    onSave(newCampaign);
  };

  return (
    <div className="campaign-modal-overlay">
      <div className="campaign-modal">

        {/* ================= HEADER ================= */}
        <div className="modal-header">
          <span className="modal-title">Add Email Campaigns</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* ================= STEPPER ================= */}
        <div className="stepper">
          <div className={`step ${step === 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
            <div className="circle">{step > 1 ? "✓" : "1"}</div>
            <span>Campaign Details</span>
          </div>

          <div className="line" />

          <div className={`step ${step === 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
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
            <h2>Campaign Details</h2>

            <div className={`form-group ${submitted && !campaignName ? "error" : ""}`}>
              <label>Campaign Name *</label>
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. New Product Launch"
              />
            </div>

            <div className={`form-group ${submitted && !campaignDescription ? "error" : ""}`}>
              <label>Campaign Description *</label>
              <input
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="Short description of campaign"
              />
            </div>

            <div className="form-row">
              <div className={`form-group half ${submitted && !objective ? "error" : ""}`}>
                <label>Campaign Objective *</label>
                <select value={objective} onChange={(e) => setObjective(e.target.value)}>
                  <option value="">Select Objective</option>
                  <option value="awareness">Awareness</option>
                  <option value="leads">Lead Generation</option>
                </select>
              </div>

              <div className={`form-group half ${submitted && !audience ? "error" : ""}`}>
                <label>Target Audience *</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="">Select Audience</option>
                  <option value="all">All Subscribers</option>
                  <option value="active">Active Users</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className={`form-group half ${submitted && !startDate ? "error" : ""}`}>
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

              <div className={`form-group half ${submitted && !endDate ? "error" : ""}`}>
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

    {/* ===== SELECT AUDIENCE ===== */}
    <div className={`section-card ${submitted && !audience ? "error" : ""}`}>
      <h3>Select Audience</h3>
      <p className="section-subtitle">
        Choose which audience list to send this email to
      </p>

      <div className={`form-group ${submitted && !audience ? "error" : ""}`}>
        <label>Audience List *</label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        >
          <option value="">Select Audience List</option>
          <option value="all">All Subscribers</option>
          <option value="active">Active Users</option>
        </select>
      </div>
    </div>

    {/* ===== EMAIL CONTENT ===== */}
    <div className={`section-card ${submitted && (!subject || !emailBody) ? "error" : ""}`}>

      {/* HEADER ROW */}
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

          <button className="light-btn">
            + Email Template
          </button>
        </div>
      </div>

      {/* SUBJECT */}
      <div className={`form-group ${submitted && !subject ? "error" : ""}`}>
        <label>Subject Line *</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="New Product Launch"
        />
        <span className="ai-suggest">✨ AI Suggest</span>
      </div>

      {/* EMAIL BODY */}
      <div className={`form-group ${submitted && !emailBody ? "error" : ""}`}>
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
                <div className={`schedule-field ${submitted && !scheduleDate ? "error" : ""}`}>
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

                <div className={`schedule-field ${submitted && !scheduleTime ? "error" : ""}`}>
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

      </div>
    </div>
  );
}
