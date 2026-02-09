import { useState } from "react";
import { v4 as uuid } from "uuid";
import "../../../../src/styles/Campaign/SocialCampaignModal.css";

interface SocialCampaignModalProps {
  onClose: () => void;
  onSave: (campaign: {
    id: string;
    name: string;
    type: "social";
    status: "Schedule";
    start: string;
    end: string;
    platforms: string[];
    leads: number;
  }) => void;
}

export default function SocialCampaignModal({ onClose, onSave }: SocialCampaignModalProps) {
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Step 1 fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 2 fields
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [mode, setMode] = useState<"organic" | "paid">("organic");

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Basic validation
  const isStep1Valid = name.trim() && objective && audience && startDate && endDate;
  const isStep2Valid = platforms.length > 0;

  const getError = (field: string, value: string | string[]) => {
    if (!touched[field]) return "";
    if (Array.isArray(value)) {
      return value.length === 0 ? "Required" : "";
    }
    return !value?.toString().trim() ? "Required" : "";
  };

  // Extra validation: end date should not be before start date
  const getDateRangeError = () => {
    if (!touched.startDate || !touched.endDate) return "";
    if (!startDate || !endDate) return "";
    if (new Date(endDate) < new Date(startDate)) {
      return "End date must be after start date";
    }
    return "";
  };

  const handleNext = () => {
    if (step === 1) {
      // Mark all step 1 fields as touched when clicking Next
      markTouched("name");
      markTouched("objective");
      markTouched("audience");
      markTouched("startDate");
      markTouched("endDate");

      if (isStep1Valid && !getDateRangeError()) {
        setStep(2);
      }
    } else if (step === 2) {
      markTouched("platforms");
      if (isStep2Valid) {
        setStep(3);
      }
    }
  };

  const handleSave = () => {
    const newCampaign = {
      id: uuid(),
      name,
      type: "social" as const,
      status: "Schedule" as const,
      start: startDate,
      end: endDate,
      platforms,
      leads: 0,
    };
    onSave(newCampaign);
    onClose();
  };

  return (
    <div className="campaign-modal-overlay">
      <div className="campaign-modal social-campaign-modal">
        <h2>Add Social Media Campaigns</h2>

        {/* Stepper */}
        <div className="stepper">
          <div className={`step ${step >= 1 ? "active" : ""}`}>
            <div className={`circle ${step > 1 ? "completed" : ""}`}>
              {step > 1 ? "✓" : "1"}
            </div>
            <span>Campaign Details</span>
          </div>
          <div className="line" />
          <div className={`step ${step >= 2 ? "active" : ""}`}>
            <div className={`circle ${step > 2 ? "completed" : ""}`}>
              {step > 2 ? "✓" : "2"}
            </div>
            <span>Content & Configuration</span>
          </div>
          <div className="line" />
          <div className={`step ${step >= 3 ? "active" : ""}`}>
            <div className="circle">3</div>
            <span>Schedule Campaign</span>
          </div>
        </div>

        {/* Step 1 - Campaign Details */}
        {step === 1 && (
          <div className="step-content">
            <h3>Campaign Details</h3>

            <div className="form-group">
              <label>Campaign Name *</label>
              <div className="input-wrapper">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => markTouched("name")}
                  placeholder="e.g. New Product Launch"
                  className={getError("name", name) ? "error" : ""}
                />
                <button className="ai-suggest">✨ AI Suggest</button>
              </div>
              {getError("name", name) && <span className="error-text">Campaign name is required</span>}
            </div>

            <div className="form-group">
              <label>Campaign Description</label>
              <div className="input-wrapper">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Contains records of routine checks and ongoing monitoring..."
                />
                <button className="ai-suggest">✨ AI Suggest</button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Campaign Objective *</label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  onBlur={() => markTouched("objective")}
                  className={getError("objective", objective) ? "error" : ""}
                >
                  <option value="">Select Objective</option>
                  <option value="leads">Lead Generation</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="traffic">Website Traffic</option>
                </select>
                {getError("objective", objective) && <span className="error-text">Required</span>}
              </div>

              <div className="form-group half">
                <label>Target Audience *</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  onBlur={() => markTouched("audience")}
                  className={getError("audience", audience) ? "error" : ""}
                >
                  <option value="">Select Audience</option>
                  <option value="women-25-35">Women 25–35</option>
                  <option value="men-18-34">Men 18–34</option>
                  <option value="all">All Users</option>
                </select>
                {getError("audience", audience) && <span className="error-text">Required</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onBlur={() => markTouched("startDate")}
                  className={getError("startDate", startDate) ? "error" : ""}
                />
                {getError("startDate", startDate) && <span className="error-text">Required</span>}
              </div>

              <div className="form-group half">
                <label>End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onBlur={() => markTouched("endDate")}
                  className={getError("endDate", endDate) || getDateRangeError() ? "error" : ""}
                />
                {getError("endDate", endDate) && !getDateRangeError() && (
                  <span className="error-text">Required</span>
                )}
                {getDateRangeError() && (
                  <span className="error-text">{getDateRangeError()}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 - Content & Configuration */}
        {step === 2 && (
          <div className="step-content">
            <h3>Content & Configuration</h3>

            <div className="form-group">
              <label>Select Platforms *</label>
              <div className="platforms">
                {["Instagram", "Facebook", "LinkedIn"].map((p) => (
                  <label key={p} className="platform-label">
                    <input
                      type="checkbox"
                      checked={platforms.includes(p.toLowerCase())}
                      onChange={() => {
                        setPlatforms((prev) =>
                          prev.includes(p.toLowerCase())
                            ? prev.filter((x) => x !== p.toLowerCase())
                            : [...prev, p.toLowerCase()]
                        );
                        // Mark as touched whenever user interacts
                        markTouched("platforms");
                      }}
                    />
                    {p}
                  </label>
                ))}
              </div>
              {getError("platforms", platforms) && (
                <span className="error-text">Select at least one platform</span>
              )}
            </div>

            <div className="form-group">
              <label>Campaign Mode</label>
              <div className="mode-options">
                <label className={`mode-card ${mode === "organic" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "organic"}
                    onChange={() => setMode("organic")}
                  />
                  <div>
                    <strong>Organic Posting</strong>
                    <span>No Budget Required</span>
                  </div>
                </label>

                <label className={`mode-card ${mode === "paid" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "paid"}
                    onChange={() => setMode("paid")}
                  />
                  <div>
                    <strong>Paid Advertising</strong>
                    <span>Budget Setup Required</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Campaign Content</label>
              <p className="helper-text">Create your post content with AI assistance</p>
            </div>
          </div>
        )}

        {/* Step 3 - Schedule */}
        {step === 3 && (
          <div className="step-content">
            <h3>Schedule Campaign</h3>

            <div className="form-group">
              <label>Schedule</label>
              <p className="helper-text">Select date and time for the campaign</p>

              <div className="schedule-row">
                <div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <span>to</span>
                <div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="schedule-row">
                <input type="time" defaultValue="12:30" />
                <button className="ai-suggest">✨ AI-Optimization Timing</button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={step === 3 ? handleSave : handleNext}
            disabled={
              (step === 1 && (!isStep1Valid || !!getDateRangeError())) ||
              (step === 2 && !isStep2Valid)
            }
          >
            {step === 3 ? "Save & Post" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}