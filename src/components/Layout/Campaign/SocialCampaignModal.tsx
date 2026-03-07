import React, { useState, useRef } from "react";
import "../../../../src/styles/Campaign/SocialCampaignModal.css";
import { CampaignAPI } from "../../../../src/services/campaign.api";
import { FormControl, Select, MenuItem, Modal, Typography, IconButton } from "@mui/material";
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
import type { Campaign, Platform, SocialCampaignPayload } from "../../../types/campaigns.types";
import SocialContentBox from "./SocialContentBox";
import { useSelector } from "react-redux";
import { selectClinic } from "../../../store/clinicSlice";

type Props = {  
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
};

const PLATFORMS: { id: Platform; label: string; icon: string; cpc: number }[] = [
  { id: "instagram", label: "Instagram", icon: instagramIcon, cpc: 3.5 },
  { id: "facebook", label: "Facebook", icon: facebookIcon, cpc: 2.5 },
  { id: "linkedin", label: "LinkedIn", icon: linkedinIcon, cpc: 1.5 },
];

// Helper: check if a string is a plain URL (no spaces, starts with http)
const isPlainUrl = (str: string) =>
  str.trim().startsWith("http") && !str.trim().includes(" ");

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

  const [platformContent, setPlatformContent] = useState<Record<Platform, string>>({
    instagram: "",
    facebook: "",
    linkedin: "",
  });

  // Per-platform image URLs — typed into the Image URL field in SocialContentBox
  const [platformImageUrls, setPlatformImageUrls] = useState<Record<Platform, string>>({
    instagram: "",
    facebook: "",
    linkedin: "",
  });

  // Also mirror platformImageUrls in a ref so it's always current at submit time
  const platformImageUrlsRef = useRef<Record<Platform, string>>({
    instagram: "",
    facebook: "",
    linkedin: "",
  });

  const handleEditorInput = (platform: Platform, value: string) => {
    setPlatformContent((prev) => ({ ...prev, [platform]: value }));
  };

  const handleImageUrl = (platform: Platform, url: string) => {
    platformImageUrlsRef.current[platform] = url;
    setPlatformImageUrls((prev) => ({ ...prev, [platform]: url }));
  };

  /* ---- Refs ---- */
  const instagramRef = useRef<HTMLDivElement>(null);
  const facebookRef = useRef<HTMLDivElement>(null);
  const linkedinRef = useRef<HTMLDivElement>(null);

  const instagramMediaRef = useRef<HTMLDivElement>(null);
  const facebookMediaRef = useRef<HTMLDivElement>(null);
  const linkedinMediaRef = useRef<HTMLDivElement>(null);

  const instagramFileRef = useRef<HTMLInputElement>(null);
  const facebookFileRef = useRef<HTMLInputElement>(null);
  const linkedinFileRef = useRef<HTMLInputElement>(null);

  const platformRefs: Record<Platform, React.RefObject<HTMLDivElement | null>> = {
    instagram: instagramRef,
    facebook: facebookRef,
    linkedin: linkedinRef,
  };

  const mediaRefs: Record<Platform, React.RefObject<HTMLDivElement | null>> = {
    instagram: instagramMediaRef,
    facebook: facebookMediaRef,
    linkedin: linkedinMediaRef,
  };

  const fileInputRefs: Record<Platform, React.RefObject<HTMLInputElement | null>> = {
    instagram: instagramFileRef,
    facebook: facebookFileRef,
    linkedin: linkedinFileRef,
  };

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

  const getMediaRef = (platform: string) => {
    if (platform === "instagram") return instagramMediaRef;
    if (platform === "facebook") return facebookMediaRef;
    return linkedinMediaRef;
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

  const handleText = () => { document.execCommand("bold"); };

  const handleLink = (platform: string) => {
    const url = prompt("Enter URL");
    if (!url) return;
    insertHTML(
      platform,
      `<a href="${url}" target="_blank" style="color:#2563eb;text-decoration:underline;">${url}</a>`
    );
  };

  const handleEmoji = (platform: string) => {
    const ref = getEditorRef(platform);
    ref.current?.focus();
    document.execCommand("insertText", false, "😊");
  };

  const handleImage = (_platform: string) => {
    // No-op: images handled via URL input field in SocialContentBox
  };

  const handleAttachment = (platform: string) => {
    if (platform === "instagram") instagramFileRef.current?.click();
    if (platform === "facebook") facebookFileRef.current?.click();
    if (platform === "linkedin") linkedinFileRef.current?.click();
  };

  const handleFileInsert = (
    e: React.ChangeEvent<HTMLInputElement>,
    platform: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaRef = getMediaRef(platform);
    const objectUrl = URL.createObjectURL(file);
    const wrapper = document.createElement("div");
    wrapper.className = "inserted-file-wrapper";
    const label = document.createElement("span");
    label.className = "file-label";
    label.textContent = file.name;
    label.style.cursor = "pointer";
    label.onclick = () => setInlinePreview({ src: objectUrl, type: "file", name: file.name });
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "remove-btn";
    removeBtn.contentEditable = "false";
    removeBtn.onclick = () => wrapper.remove();
    wrapper.appendChild(label);
    wrapper.appendChild(removeBtn);
    mediaRef.current?.appendChild(wrapper);
    e.target.value = "";
  };

  const toggleAccount = (id: Platform) => {
    setAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    setSubmitted(true);
    if (step === 1 && step1Valid) { setStep(2); setSubmitted(false); }
    else if (step === 2 && step2Valid) { setStep(3); setSubmitted(false); }
  };

  const handleCreateCampaign = async (type: "live" | "draft" | "scheduled") => {
    setSubmitted(true);

    // FIX: For organic "live" posts, schedule date/time are not required
    const needsSchedule = type === "scheduled" || type === "draft";
    if (!step1Valid || !step2Valid) return;
    if (needsSchedule && (!scheduleDate || !scheduleTime)) return;

    try {
      const scheduledDateTime =
        scheduleDate && scheduleTime
          ? dayjs(`${scheduleDate} ${scheduleTime}`, "YYYY-MM-DD HH:mm").format("YYYY-MM-DDTHH:mm:ss")
          : null;

      const totalSpend = PLATFORMS.filter((p) => accounts.includes(p.id)).reduce(
        (sum, p) => sum + budgets[p.id], 0
      );
      const estimatedCPC = totalSpend > 0 ? (totalSpend / 100).toFixed(2) : 0;
      const campaignMode: ("paid_advertising" | "organic_posting")[] = [
        mode === "paid" ? "paid_advertising" : "organic_posting",
      ];

      const refsMap: Record<Platform, React.RefObject<HTMLDivElement | null>> = {
        instagram: instagramRef,
        facebook: facebookRef,
        linkedin: linkedinRef,
      };

      const resolvedContent: Record<Platform, string> = {
        instagram: "",
        facebook: "",
        linkedin: "",
      };

      for (const platform of accounts) {
        const fromState = platformContent[platform]?.trim();
        const fromRef = refsMap[platform]?.current?.innerText?.trim() || "";
        resolvedContent[platform] = fromState || fromRef;
      }

      // Resolve image_url — priority order:
      //    1. Image URL field (ref — always current, no stale closure)
      //    2. Image URL field (state — fallback)
      //    3. If content editor only has a plain URL, use that as image_url
      let image_url: string | null = null;

      for (const p of accounts) {
        const fromRef = platformImageUrlsRef.current[p]?.trim();
        const fromState = platformImageUrls[p]?.trim();
        const candidate = fromRef || fromState || "";
        if (candidate) {
          image_url = candidate;
          break;
        }
      }

      // Fallback: if user pasted URL into content editor instead of image field
      if (!image_url) {
        for (const p of accounts) {
          const content = resolvedContent[p]?.trim();
          if (content && isPlainUrl(content)) {
            image_url = content;
            resolvedContent[p] = ""; // clear it from content so it's not used as post text
            break;
          }
        }
      }

      // campaign_content: use first non-empty, non-URL content; fallback to campaign name
      const firstSelectedContent =
        accounts
          .map((p) => resolvedContent[p])
          .find((c) => c.trim() !== "" && !isPlainUrl(c)) ?? campaignName;

      console.log("📸 image_url to send:", image_url ?? "none");
      console.log("📝 campaign_content:", firstSelectedContent);
      console.log("📱 platforms (accounts):", accounts); // DEBUG

      const payload: SocialCampaignPayload = {
        clinic: clinicId,
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        campaign_objective: objective,
        target_audience: audience,
        start_date: startDate,
        end_date: endDate,
        schedule_date_range: `${startDate},${endDate}`,
        campaign_content: firstSelectedContent,
        campaign_mode: campaignMode,
        select_ad_accounts: accounts,
        enter_time: scheduleTime,
        platform_data: resolvedContent,
        budget_data: {
          ...budgets,
          total: PLATFORMS.filter((p) => accounts.includes(p.id)).reduce(
            (sum, p) => sum + budgets[p.id], 0
          ),
        },
        status: type === "live" ? "live" : type === "scheduled" ? "scheduled" : "draft",
        is_active: type === "live",
        image_url: image_url,
      };

      const response = await CampaignAPI.createSocial(payload);

      // Create API returns: { message: "...", campaigns: [{ campaign_id, mode, platforms, fb_post_id }] }
      // Fields like campaign_name, start_date are NOT in the response — use local form state instead.
      const createdCampaign = response.data?.campaigns?.[0] ?? {};

      const mappedStatus =
        type === "live" ? "Live" : type === "draft" ? "Draft" : "Scheduled";

      const formattedCampaign: Campaign = {
<<<<<<< HEAD
        // campaign_id is in the nested campaigns[0] object, not response.data directly
        id: createdCampaign.campaign_id ?? createdCampaign.id ?? crypto.randomUUID(),
        // Use local form state for all display fields (not returned by create API)
        name: campaignName,
=======
        id: apiData.id,
        campaign_name: apiData.campaign_name,
>>>>>>> d00cc67f27fab285147f213cf9b08d18b129f618
        type: "social",
        status: mappedStatus,
        start: startDate,
        end: endDate,
        // accounts state always has the correct selected platforms
        platforms: accounts,
        leads: 0,
        lead_generated: 0,
        scheduledAt: apiData.scheduled_at ?? undefined,
        total_spend: mode === "paid" ? totalSpend : 0,
        cpc: mode === "paid" ? Number(estimatedCPC) : 0,
      };

      console.log("✅ formattedCampaign.platforms:", formattedCampaign.platforms); // DEBUG

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
            <Typography variant="h6" sx={{ mb: 3 }}>Campaign Details</Typography>

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
                placeholder="e.g. Contains records of routine checks..."
              />
            </div>

            <div className="form-row">
              <div className={`form-group half ${submitted && !objective ? "error" : ""}`}>
                <label>Campaign Objective *</label>
                <FormControl fullWidth variant="outlined">
                  <Select value={objective} onChange={(e) => setObjective(e.target.value)} displayEmpty>
                    <MenuItem value="">Select Objective</MenuItem>
                    <MenuItem value="leads">Lead Generation</MenuItem>
                    <MenuItem value="awareness">Brand Awareness</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className={`form-group half ${submitted && !audience ? "error" : ""}`}>
                <label>Target Audience *</label>
                <FormControl fullWidth variant="outlined">
                  <Select value={audience} onChange={(e) => setAudience(e.target.value)} displayEmpty>
                    <MenuItem value="">Select Audience</MenuItem>
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
                    onChange={(v) => setStartDate(v ? (v as Dayjs).format("YYYY-MM-DD") : "")}
                    slots={{ openPickerIcon: CalendarTodayIcon }}
                    slotProps={{ textField: { error: submitted && !startDate } }}
                  />
                </LocalizationProvider>
              </div>
              <div className={`form-group half ${submitted && !endDate ? "error" : ""}`}>
                <label>End Date *</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={endDate ? dayjs(endDate) : null}
                    onChange={(v) => setEndDate(v ? (v as Dayjs).format("YYYY-MM-DD") : "")}
                    slots={{ openPickerIcon: CalendarTodayIcon }}
                    slotProps={{ textField: { error: submitted && !endDate } }}
                  />
                </LocalizationProvider>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="step-content">
            <Typography variant="h6" sx={{ mb: 3 }}>Content & Configuration</Typography>

            <div className={`section-card ${submitted && accounts.length === 0 ? "error" : ""}`}>
              <h3>Select Ad Accounts</h3>
              <p className="section-subtitle">Select your social media ad accounts</p>
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
                    <div className={`account-checkbox ${accounts.includes(acc.id) ? "checked" : ""}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className={`section-card ${submitted && !mode ? "error" : ""}`}>
              <h3>Campaign Mode</h3>
              <p className="section-subtitle">Choose a campaign mode to optimize your ad strategy</p>
              <div className="mode-row">
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

            {mode && (
              <div className="section-card">
                <h2>Campaign Content</h2>
                <p className="section-subtitle">Create your post content with AI assistance</p>

                {/* File attachment inputs */}
                {PLATFORMS.map((p) => (
                  <React.Fragment key={p.id}>
                    <input
                      ref={fileInputRefs[p.id]}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      hidden
                      onChange={(e) => handleFileInsert(e, p.id)}
                    />
                  </React.Fragment>
                ))}

                {PLATFORMS.filter((p) => accounts.includes(p.id)).map((p) => (
                  <SocialContentBox
                    key={p.id}
                    ref={platformRefs[p.id]}
                    mediaRef={mediaRefs[p.id]}
                    platform={p.id}
                    icon={p.icon}
                    label={p.label}
                    onText={handleText}
                    onLink={handleLink}
                    onEmoji={handleEmoji}
                    onImage={handleImage}
                    onAttachment={handleAttachment}
                    onInput={handleEditorInput}
                    onImageUrl={handleImageUrl}
                    imageUrl={platformImageUrls[p.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className="step-content">
            <Typography variant="h6" sx={{ mb: 3 }}>Schedule Campaign</Typography>

            <div className="section-card">
              <div className="schedule-header">
                <div>
                  <h3>{mode === "paid" ? "Schedule & Budget Allocation" : "Schedule"}</h3>
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
                      onChange={(v) => setScheduleDate(v ? (v as Dayjs).format("YYYY-MM-DD") : "")}
                      slots={{ openPickerIcon: CalendarTodayIcon }}
                    />
                  </LocalizationProvider>
                </div>
                <div className="form-group half">
                  <label>Enter Time</label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TimePicker
                      format="hh:mm A"
                      value={scheduleTime ? dayjs(`2024-01-01 ${scheduleTime}`) : null}
                      onChange={(v) => { if (v) setScheduleTime((v as Dayjs).format("HH:mm")); }}
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
                      {PLATFORMS.filter((p) => accounts.includes(p.id)).map((p) => (
                        <div key={p.id} className="budget-card">
                          <div className="budget-title">
                            <img src={p.icon} alt={p.label} />
                            <span>{p.label} (Estimate CPC : ${p.cpc})</span>
                          </div>
                          <div className="budget-input-wrapper">
                            <label>Enter Amount ($)</label>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={budgets[p.id]}
                              onChange={(e) => setBudget(p.id, Number(e.target.value))}
                              className="budget-input"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="total-budget">
                      <div>
                        <h4>
                          Total Budget : $
                          {PLATFORMS.filter((p) => accounts.includes(p.id)).reduce(
                            (sum, p) => sum + budgets[p.id], 0
                          )}
                        </h4>
                        <p>
                          Ad spend is charged directly by each connected social media platform.
                          We don't handle payments.
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
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          {step === 3 ? (
            mode === "paid" ? (
              <>
                <button className="cancel-btn" onClick={() => handleCreateCampaign("draft")}>
                  Save as Draft
                </button>
                <button className="next-btn" onClick={() => handleCreateCampaign("scheduled")}>
                  Schedule
                </button>
              </>
            ) : (
              // FIX: organic "Save & Post" → type "live" — no schedule date/time required
              <button className="next-btn" onClick={() => handleCreateCampaign("live")}>
                Save & Post
              </button>
            )
          ) : (
            <button className="next-btn" onClick={handleNext}>Next</button>
          )}
        </div>

        {/* INLINE PREVIEW POPUP */}
        {inlinePreview && (
          <div className="inline-preview-backdrop" onClick={() => setInlinePreview(null)}>
            <div className="inline-preview-popup" onClick={(e) => e.stopPropagation()}>
              <button className="preview-close-btn" onClick={() => setInlinePreview(null)}>✕</button>
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