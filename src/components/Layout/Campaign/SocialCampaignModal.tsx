import React, { useState, useRef } from "react";
import "../../../../src/styles/Campaign/SocialCampaignModal.css";
import { CampaignAPI } from "../../../../src/services/campaign.api";
import {
  FormControl,
  Select,
  MenuItem,
  Modal,
  Typography,
  IconButton,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import instagramIcon from "../../../components/Layout/Campaign/Icons/instagram.png";
import facebookIcon from "../../../components/Layout/Campaign/Icons/facebook.png";
import linkedinIcon from "../../../components/Layout/Campaign/Icons/linkedin.png";
import { Box } from "@mui/system";
import CloseIcon from "@mui/icons-material/Close";
import type {
  Campaign,
  Platform,
  SocialCampaignPayload,
} from "../../../types/campaigns.types";
import SocialContentBox from "./SocialContentBox";
import { useSelector } from "react-redux";
import { selectClinic } from "../../../store/clinicSlice";

type Props = {
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
};

const PLATFORMS: { id: Platform; label: string; icon: string; cpc: number }[] =
  [
    { id: "instagram", label: "Instagram", icon: instagramIcon, cpc: 3.5 },
    { id: "facebook", label: "Facebook", icon: facebookIcon, cpc: 2.5 },
    { id: "linkedin", label: "LinkedIn", icon: linkedinIcon, cpc: 1.5 },
  ];

export default function SocialCampaignModal({ onClose, onSave }: Props) {
  const clinic = useSelector(selectClinic);
  const clinicId = clinic?.id || 1;
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  /* ================= STEP 1 ================= */
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

  /* ================= STEP 2 ================= */
  const [accounts, setAccounts] = useState<Platform[]>([]);
  const [mode, setMode] = useState<"organic" | "paid" | "">("");

  const instagramRef = useRef<HTMLDivElement>(null);
  const facebookRef = useRef<HTMLDivElement>(null);
  const linkedinRef = useRef<HTMLDivElement>(null);

  const instagramImageRef = useRef<HTMLInputElement>(null);
  const instagramFileRef = useRef<HTMLInputElement>(null);
  const facebookImageRef = useRef<HTMLInputElement>(null);
  const facebookFileRef = useRef<HTMLInputElement>(null);
  const linkedinImageRef = useRef<HTMLInputElement>(null);
  const linkedinFileRef = useRef<HTMLInputElement>(null);

  // Ref lookup map — inside the component, but refs never stored in objects passed to render
  const platformRefs: Record<
    Platform,
    React.RefObject<HTMLDivElement | null>
  > = {
    instagram: instagramRef,
    facebook: facebookRef,
    linkedin: linkedinRef,
  };
  const imageInputRefs: Record<
    Platform,
    React.RefObject<HTMLInputElement | null>
  > = {
    instagram: instagramImageRef,
    facebook: facebookImageRef,
    linkedin: linkedinImageRef,
  };

  const fileInputRefs: Record<
    Platform,
    React.RefObject<HTMLInputElement | null>
  > = {
    instagram: instagramFileRef,
    facebook: facebookFileRef,
    linkedin: linkedinFileRef,
  };

  // inlinePreview state
  const [inlinePreview, setInlinePreview] = useState<{
    src: string;
    type: "image" | "file";
    name: string;
  } | null>(null);

  const step2Valid = accounts.length > 0 && mode;

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [budgets, setBudgets] = useState<Record<Platform, number>>({
    instagram: 350,
    facebook: 250,
    linkedin: 150,
  });
  const setBudget = (platform: Platform, value: number) =>
    setBudgets((prev) => ({ ...prev, [platform]: value }));

  const getEditorRef = (platform: string) => {
    if (platform === "instagram") return instagramRef;
    if (platform === "facebook") return facebookRef;
    return linkedinRef;
  };

  const insertHTML = (platform: string, html: string) => {
    const ref = getEditorRef(platform);
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const el = document.createElement("span");
    el.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node;
    while ((node = el.firstChild)) frag.appendChild(node);
    range.insertNode(frag);
    ref.current?.focus();
  };

  const handleText = () => {
    document.execCommand("bold");
  };

  const handleLink = (platform: string) => {
    const url = prompt("Enter URL");
    if (!url) return;
    insertHTML(
      platform,
      `<a href="${url}" target="_blank" style="color:#2563eb; text-decoration:underline;">${url}</a>`,
    );
  };

  const handleEmoji = (platform: string) => {
    const ref = getEditorRef(platform);
    const editorEl = ref.current?.nextElementSibling as HTMLElement;
    editorEl?.focus();
    document.execCommand("insertText", false, "😊");
  };

  const handleImage = (platform: string) => {
    if (platform === "instagram") instagramImageRef.current?.click();
    if (platform === "facebook") facebookImageRef.current?.click();
    if (platform === "linkedin") linkedinImageRef.current?.click();
  };

  const handleAttachment = (platform: string) => {
    if (platform === "instagram") instagramFileRef.current?.click();
    if (platform === "facebook") facebookFileRef.current?.click();
    if (platform === "linkedin") linkedinFileRef.current?.click();
  };

  const handleFileInsert = (
    e: React.ChangeEvent<HTMLInputElement>,
    platform: string,
    type: "image" | "file",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ref = getEditorRef(platform);

    if (type === "image") {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const src = event.target?.result as string;

        const wrapper = document.createElement("div");
        wrapper.className = "inserted-image-wrapper";

        const img = document.createElement("img");
        img.src = src;
        img.style.cursor = "pointer";
        // click image → open inline preview
        img.onclick = () =>
          setInlinePreview({ src, type: "image", name: file.name });

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.className = "remove-btn";
        removeBtn.contentEditable = "false";
        removeBtn.onclick = () => wrapper.remove();

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        ref.current?.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    } else {
      // objectUrl defined here properly
      const objectUrl = URL.createObjectURL(file);

      const wrapper = document.createElement("div");
      wrapper.className = "inserted-file-wrapper";

      const label = document.createElement("span");
      label.className = "file-label";
      label.textContent = `${file.name}`;
      label.style.cursor = "pointer";
      label.onclick = () =>
        setInlinePreview({ src: objectUrl, type: "file", name: file.name });

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "✕";
      removeBtn.className = "remove-btn";
      removeBtn.contentEditable = "false";
      removeBtn.onclick = () => wrapper.remove();

      wrapper.appendChild(label);
      wrapper.appendChild(removeBtn);
      ref.current?.appendChild(wrapper);
    }

    e.target.value = "";
  };

  const toggleAccount = (id: Platform) => {
    setAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

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

  const handleCreateCampaign = async (type: "live" | "draft" | "scheduled") => {
    setSubmitted(true);
    if (!step1Valid || !step2Valid || !scheduleDate || !scheduleTime) return;
    if (type === "live" && (!step1Valid || !step2Valid || !scheduleTime))
      return;
    if (
      type === "scheduled" &&
      (!step1Valid || !step2Valid || !scheduleDate || !scheduleTime)
    )
      return;

    try {
      const scheduledDateTime =
        scheduleDate && scheduleTime
          ? dayjs(`${scheduleDate} ${scheduleTime}`, "YYYY-MM-DD HH:mm").format(
              "YYYY-MM-DDTHH:mm:ss",
            )
          : null;

      // After — use budgets object
      const totalSpend = PLATFORMS.filter((p) =>
        accounts.includes(p.id),
      ).reduce((sum, p) => sum + budgets[p.id], 0);

      const estimatedCPC = totalSpend > 0 ? (totalSpend / 100).toFixed(2) : 0;
      const facebookEditor = facebookRef.current
        ?.nextElementSibling as HTMLElement | null;

      const facebookContent = facebookEditor?.innerText?.trim() || "";

      const campaignMode: ("paid_advertising" | "organic_posting")[] = [
        mode === "paid" ? "paid_advertising" : "organic_posting",
      ];

      const getEditorContent = (platform: Platform): string =>
        (platformRefs[platform].current?.nextElementSibling as HTMLElement | null)
          ?.innerText?.trim() || "";

      const payload: SocialCampaignPayload = {
        clinic: clinicId,
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        campaign_objective: objective,
        target_audience: audience,
        start_date: startDate,
        end_date: endDate,

        campaign_content: facebookContent || "Post content",

        campaign_mode: campaignMode,

        select_ad_accounts: accounts,

        enter_time: scheduleTime,

        platform_data: PLATFORMS.reduce(
          (acc, p) => ({ ...acc, [p.id]: getEditorContent(p.id) }),
          {} as Record<Platform, string>,
        ),

        budget_data: {
          ...budgets,
          total: PLATFORMS.filter((p) => accounts.includes(p.id)).reduce(
            (sum, p) => sum + budgets[p.id],
            0,
          ),
        },

        status:
          type === "live"
            ? "live"
            : type === "scheduled"
              ? "scheduled"
              : "draft",

        is_active: type === "live",
      };
      const response = await CampaignAPI.createSocial(payload);
      const apiData = response.data;
      const formattedCampaign: Campaign = {
        id: apiData.id,
        name: apiData.campaign_name,
        type: "social",
        status:
          type === "live" ? "Live" : type === "draft" ? "Draft" : "Scheduled",
        start: apiData.start_date,
        end: apiData.end_date,
        platforms: accounts,
        leads: 0,
        lead_generated: 0,
        scheduledAt: type === "scheduled" ? scheduledDateTime : null,
        total_spend: mode === "paid" ? totalSpend : 0,
        cpc: mode === "paid" ? Number(estimatedCPC) : 0,
      };

      onSave(formattedCampaign);
      toast.success("Campaign created successfully");
      onClose();
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <Box className="email-campaign-modal">
        {/* HEADER */}
        <div className="add-modal-header">
          <Typography variant="h6">Add Social Media Campaign</Typography>
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
                placeholder="e.g. Contains records of routine checks..."
              />
            </div>

            <div className="form-row">
              <div
                className={`form-group half ${submitted && !objective ? "error" : ""}`}
              >
                <label>Campaign Objective *</label>
                <FormControl fullWidth variant="outlined">
                  <Select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">Select Objective</MenuItem>
                    <MenuItem value="leads">Lead Generation</MenuItem>
                    <MenuItem value="awareness">Brand Awareness</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div
                className={`form-group half ${submitted && !audience ? "error" : ""}`}
              >
                <label>Target Audience *</label>
                <FormControl fullWidth variant="outlined">
                  <Select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">Select Audience</MenuItem>
                    <MenuItem value="all">All Users</MenuItem>
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
                      textField: {
                        error: submitted && !startDate,
                      },
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
                      textField: {
                        error: submitted && !endDate,
                      },
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
              Content & Configuration
            </Typography>

            <div
              className={`section-card ${submitted && accounts.length === 0 ? "error" : ""}`}
            >
              <h3>Select Ad Accounts</h3>
              <p className="section-subtitle">
                Select your social media ad accounts
              </p>
              <div className="account-row">
                {PLATFORMS.map((acc) => (
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

            {mode && (
              <div className="section-card">
                <h2>Campaign Content</h2>
                <p className="section-subtitle">
                  Create your post content with AI assistance
                </p>

                {/* Hidden file inputs */}
                {PLATFORMS.map((p) => (
                  <React.Fragment key={p.id}>
                    <input
                      key={`${p.id}-image`}
                      ref={imageInputRefs[p.id]}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleFileInsert(e, p.id, "image")}
                    />
                    <input
                      key={`${p.id}-file`}
                      ref={fileInputRefs[p.id]}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      hidden
                      onChange={(e) => handleFileInsert(e, p.id, "file")}
                    />
                  </React.Fragment>
                ))}

                {PLATFORMS.filter((p) => accounts.includes(p.id)).map((p) => (
                  <SocialContentBox
                    key={p.id}
                    ref={platformRefs[p.id]}
                    platform={p.id}
                    icon={p.icon}
                    label={p.label}
                    onText={handleText}
                    onLink={handleLink}
                    onEmoji={handleEmoji}
                    onImage={handleImage}
                    onAttachment={handleAttachment}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className="step-content">
            <Typography variant="h6" sx={{ mb: 3 }}>
              Schedule Campaign
            </Typography>

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
                      slotProps={{ textField: { fullWidth: true } }}
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
                      {PLATFORMS.filter((p) => accounts.includes(p.id)).map(
                        (p) => (
                          <div key={p.id} className="budget-card">
                            <div className="budget-title">
                              <img src={p.icon} alt={p.label} />
                              <span>
                                {p.label} (Estimate CPC : ${p.cpc})
                              </span>
                            </div>
                            <div className="budget-input-wrapper">
                              <label>Enter Amount ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={budgets[p.id]}
                                onChange={(e) =>
                                  setBudget(p.id, Number(e.target.value))
                                }
                                className="budget-input"
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="total-budget">
                      <div>
                        <h4>
                          Total Budget : $
                          {PLATFORMS.filter((p) =>
                            accounts.includes(p.id),
                          ).reduce((sum, p) => sum + budgets[p.id], 0)}
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
            mode === "paid" ? (
              <>
                <button
                  className="cancel-btn"
                  onClick={() => handleCreateCampaign("draft")}
                >
                  Save as Draft
                </button>
                <button
                  className="next-btn"
                  onClick={() => handleCreateCampaign("scheduled")}
                >
                  Schedule
                </button>
              </>
            ) : (
              <button
                className="next-btn"
                onClick={() => handleCreateCampaign("live")}
              >
                Save & Post
              </button>
            )
          ) : (
            <button className="next-btn" onClick={handleNext}>
              Next
            </button>
          )}
        </div>

        {/* ✅ INLINE PREVIEW POPUP — was completely missing from your file */}
        {inlinePreview && (
          <div
            className="inline-preview-backdrop"
            onClick={() => setInlinePreview(null)}
          >
            <div
              className="inline-preview-popup"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="preview-close-btn"
                onClick={() => setInlinePreview(null)}
              >
                ✕
              </button>
              <span className="preview-filename">{inlinePreview.name}</span>
              {inlinePreview.type === "image" ? (
                <img src={inlinePreview.src} alt={inlinePreview.name} />
              ) : (
                <iframe src={inlinePreview.src} title={inlinePreview.name} />
              )}
            </div>
          </div>
        )}
      </Box>
    </Modal>
  );
}
