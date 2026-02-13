import { useState } from "react";
import "../../../../src/styles/Campaign/SocialCampaignModal.css";
import { CampaignAPI } from "../../../../src/services/campaign.api";
import {FormControl,InputLabel,Select,MenuItem} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import dayjs from "dayjs";

/* 🔹 LOCAL ICONS */
import instagramIcon from "../../../components/Layout/Campaign/Icons/instagram.png";
import facebookIcon from "../../../components/Layout/Campaign/Icons/facebook.png";
import linkedinIcon from "../../../components/Layout/Campaign/Icons/linkedin.png";

export default function SocialCampaignModal({ onClose, onSave }: any) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  

  /* ================= STEP 1 ================= */
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const step1Valid =
    campaignName.trim() &&
    objective &&
    audience &&
    startDate &&
    endDate;

  /* ================= STEP 2 ================= */
  const [accounts, setAccounts] = useState<string[]>([]);
  const [mode, setMode] = useState<"organic" | "paid" | "">("");

  const step2Valid = accounts.length > 0 && mode;

  const toggleAccount = (id: string) => {
    setAccounts((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };
const [scheduleDate, setScheduleDate] = useState("");
const [scheduleTime, setScheduleTime] = useState("");

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

  // const handleSaveAndPost = () => {
  // setSubmitted(true);
  // if (!step1Valid || !step2Valid) return;

  const handleSaveAndPost = async () => {
  setSubmitted(true);

  if (!step1Valid || !step2Valid || !scheduleDate || !scheduleTime)
    return;

  try {
    const scheduledDateTime = dayjs(
      `${scheduleDate} ${scheduleTime}`,
      "YYYY-MM-DD HH:mm"
    ).format("YYYY-MM-DDTHH:mm:ss");

    const payload = {
      clinic: 1, // replace dynamically if needed

      campaign_name: campaignName,
      campaign_description: "",
      campaign_objective: objective,
      target_audience: audience,

      start_date: startDate,
      end_date: endDate,

      campaign_mode: 1, // 🔥 1 = SOCIAL

      selected_start: scheduledDateTime,
      selected_end: scheduledDateTime,
      enter_time: scheduleTime,

      social_media: accounts.map((platform) => ({
        platform_name: platform, // instagram | facebook | linkedin
        is_active: true,
      })),
    };

    const response = await CampaignAPI.create(payload);

    const apiData = response.data;

    // 🔥 MAP BACKEND → UI MODEL
    const formattedCampaign = {
      id: apiData.id,
      name: apiData.campaign_name,
      type: "social",
      status: apiData.is_active ? "Live" : "Draft",
      start: apiData.start_date,
      end: apiData.end_date,
      platforms: accounts,
      leads: 0,
      scheduledAt: apiData.selected_start,
    };

    onSave(formattedCampaign);
    onClose();

  } catch (error: any) {
    console.error(error.response?.data || error.message);
  }
};

const [instagramBudget, setInstagramBudget] = useState(350);
const [facebookBudget, setFacebookBudget] = useState(250);
const [linkedinBudget, setLinkedinBudget] = useState(150);

const totalBudget =
  instagramBudget + facebookBudget + linkedinBudget;


  return (
    <div className="campaign-modal-overlay">
      <div className="campaign-modal">

        {/* ================= HEADER ================= */}
        <div className="modal-header">
          <span className="modal-title">Add Social Media Campaigns</span>
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
            <span>Content & Configuration</span>
          </div>

          <div className="line" />

          <div className={`step ${step === 3 ? "active" : ""}`}>
            <div className="circle">3</div>
            <span>Schedule Campaign</span>
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

            <div className="form-row">
              <div className={`form-group half ${submitted && !objective ? "error" : ""}`}>
                <label>Campaign Objective *</label>
                <FormControl fullWidth variant="outlined">
                  <Select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      Select Objective
                    </MenuItem>
                    <MenuItem value="leads">Lead Generation</MenuItem>
                    <MenuItem value="awareness">Brand Awareness</MenuItem>
                  </Select>
                </FormControl>
              </div>

            <div className={`form-group half ${submitted && !audience ? "error" : ""}`}>
              <label>Target Audience *</label>
              <FormControl fullWidth variant="outlined">
                <Select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    Select Audience
                  </MenuItem>
                  <MenuItem value="all">All Users</MenuItem>
                </Select>
              </FormControl>
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
    <h2>Content & Configuration</h2>
    {/* SELECT AD ACCOUNTS */}
    <div className={`section-card ${submitted && accounts.length === 0 ? "error" : ""}`}>
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
              className={`account-checkbox ${
                accounts.includes(acc.id) ? "checked" : ""
              }`}
            />
          </div>
        ))}
      </div>
    </div>

    {/* CAMPAIGN MODE */}
    <div className={`section-card ${submitted && !mode ? "error" : ""}`}>
      <h3>Campaign Mode</h3>
      <p className="section-subtitle">
        Choose a campaign mode to optimize your ad strategy
      </p>

      <div className="mode-row">
        {/* ORGANIC */}
        <div
          className={`mode-card ${mode === "organic" ? "selected" : ""}`}
          onClick={() => setMode("organic")}
        >
          <div className="mode-left">
            <div className={`radio ${mode === "organic" ? "checked" : ""}`} />
            <div className="mode-text">
              <h4>Organic Posting</h4>
              <p>Post to your connected social accounts without ad spend.</p>
            </div>
          </div>
          <span className="badge">No Budget Required</span>
        </div>

        {/* PAID */}
        <div
          className={`mode-card ${mode === "paid" ? "selected" : ""}`}
          onClick={() => setMode("paid")}
        >
          <div className="mode-left">
            <div className={`radio ${mode === "paid" ? "checked" : ""}`} />
            <div className="mode-text">
              <h4>Paid Advertising</h4>
              <p>Boost your reach and engagement with targeted ads.</p>
            </div>
          </div>
          <span className="badge outlined">Budget Setup Required</span>
        </div>
      </div>
    </div>
    {/* ================= CAMPAIGN CONTENT ================= */}
{mode && (
  <div className="section-card">
    <h2>Campaign Content</h2>
    <p className="section-subtitle">
      Create your post content with AI assistance
    </p>

    {/* Instagram */}
    <div className="content-row">
      <img src={instagramIcon} alt="Instagram" />
      <textarea placeholder="What would you like to share?" />
    </div>

    {/* Facebook */}
    <div className="content-row">
      <img src={facebookIcon} alt="Facebook" />
      <input placeholder="What would you like to share?" />
    </div>

    {/* LinkedIn */}
    <div className="content-row">
      <img src={linkedinIcon} alt="LinkedIn" />
      <input placeholder="What would you like to share?" />
    </div>
  </div>
)}
  </div>
)}

{/* ================= STEP 3 ================= */}
{step === 3 && (
  <div className="step-content">
  <h3>Schedule Campaign</h3>
    <div className="section-card">
      {/* HEADER */}
      <div className="schedule-header">
        <div>
          <h3>Schedule</h3>
          <p className="section-subtitle">
            Select a date and time for the campaign.
          </p>
        </div>

        <button className="ai-btn">
          ✨ AI-Optimization Timing
        </button>
      </div>

      {/* DATE + TIME */}
      <div className="schedule-row">
        <div className="form-group half">
          <label>Select Date Range</label>
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

        <div className="form-group half">
          <label>Enter Time</label>
          <input
  type="time"
  value={scheduleTime}
  onChange={(e) => setScheduleTime(e.target.value)}
/>

        </div>
      </div>
            {/* 🔥 THIN DIVIDER */}
      <div className="budget-divider" />

      {/* ===== BUDGET SECTION ===== */}
      <div className="budget-section">
        <h3>Budget Allocation</h3>

        <div className="budget-row">

          {/* Instagram */}
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

          {/* Facebook */}
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

          {/* LinkedIn */}
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
        </div>

        {/* TOTAL */}
        <div className="total-budget">
          <div>
            <h4>Total Budget : ${totalBudget}</h4>
            <p>
              Ad spend is charged directly by each connected
              social media platform. We don’t handle payments.
            </p>
          </div>
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
    <button className="next-btn" onClick={handleSaveAndPost}>
      Save & Post
    </button>
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