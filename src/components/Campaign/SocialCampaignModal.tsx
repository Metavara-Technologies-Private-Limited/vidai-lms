import React, { useState, useRef, useEffect } from "react";
import "../../styles/Campaign/EmailCampaignModal.css";
import "../../styles/Campaign/SocialCampaignModal.css";
import { CampaignAPI } from "../../services/campaign.api";
import { integrationApi } from "../../services/integration.api";
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
import { Box } from "@mui/system";
import CloseIcon from "@mui/icons-material/Close";
import type { SocialCampaignPayload } from "../../types/campaigns.types";
import SocialContentBox from "./SocialContentBox";
import { useSelector } from "react-redux";
import { selectClinic } from "../../store/clinicSlice";
import {
  CAMPAIGN_AUDIENCE,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_STATUS,
  platformIcons,
  type Platform,
} from "../../constants/campaigns.constants";
import {
  canTypeCampaignName,
  getCampaignNameValidationError,
} from "./campaignNameValidation";

type Props = {
  onClose: () => void;
  onSave: (campaign?: unknown) => void;
};

const PLATFORM_LIST: { id: Platform; label: string; cpc: number }[] = [
  { id: "instagram", label: "Instagram", cpc: 3.5 },
  { id: "facebook", label: "Facebook", cpc: 2.5 },
  { id: "linkedin", label: "LinkedIn", cpc: 1.5 },
  { id: "google_ads", label: "Google Ads", cpc: 2.0 },
];

const isPlainUrl = (str: string) =>
  str.trim().startsWith("http") && !str.trim().includes(" ");

export default function SocialCampaignModal({ onClose, onSave }: Props) {
  const clinic = useSelector(selectClinic);
  const clinicId = clinic?.id || 1;
  const googleAdsCustomerId = clinic?.google_ads_customer_id;
  const [googleAdsIntegrationConnected, setGoogleAdsIntegrationConnected] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!clinic?.id) {
      // Keep this asynchronous so React compiler does not flag sync state updates in effect.
      queueMicrotask(() => {
        if (isMounted) {
          setGoogleAdsIntegrationConnected(false);
        }
      });

      return () => {
        isMounted = false;
      };
    }

    const fetchGoogleAdsStatus = async () => {
      try {
        const res = await integrationApi.getSocialAccounts(clinic.id);
        const accs = Array.isArray(res.data) ? res.data : [];

        if (!isMounted) return;

        setGoogleAdsIntegrationConnected(
          accs.some(
            (acc) =>
              typeof acc.platform === "string" &&
              acc.platform.toLowerCase().includes("google"),
          ),
        );
      } catch (err) {
        console.error("Failed to fetch Google Ads integration status", err);
        if (isMounted) {
          setGoogleAdsIntegrationConnected(false);
        }
      }
    };

    fetchGoogleAdsStatus();

    return () => {
      isMounted = false;
    };
  }, [clinic]);

  const isGoogleAdsConnected = Boolean(
    (googleAdsCustomerId && String(googleAdsCustomerId).trim().length) ||
    googleAdsIntegrationConnected,
  );

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

  const [platformContent, setPlatformContent] = useState<
    Record<Platform, string>
  >({
    instagram: "",
    facebook: "",
    linkedin: "",
    gmail: "",
    google_ads: "",
  });

  const [platformImageUrls, setPlatformImageUrls] = useState<
    Record<Platform, string>
  >({
    instagram: "",
    facebook: "",
    linkedin: "",
    gmail: "",
    google_ads: "",
  });

  const platformImageUrlsRef = useRef<Record<Platform, string>>({
    instagram: "",
    facebook: "",
    linkedin: "",
    gmail: "",
    google_ads: "",
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
  const gmailRef = useRef<HTMLDivElement>(null);
  const googleAdsRef = useRef<HTMLDivElement>(null);

  const instagramMediaRef = useRef<HTMLDivElement>(null);
  const facebookMediaRef = useRef<HTMLDivElement>(null);
  const linkedinMediaRef = useRef<HTMLDivElement>(null);
  const gmailMediaRef = useRef<HTMLDivElement>(null);
  const googleAdsMediaRef = useRef<HTMLDivElement>(null);

  const instagramFileRef = useRef<HTMLInputElement>(null);
  const facebookFileRef = useRef<HTMLInputElement>(null);
  const linkedinFileRef = useRef<HTMLInputElement>(null);
  const gmailFileRef = useRef<HTMLInputElement>(null);
  const googleAdsFileRef = useRef<HTMLInputElement>(null);

  const platformRefs: Record<
    Platform,
    React.RefObject<HTMLDivElement | null>
  > = {
    instagram: instagramRef,
    facebook: facebookRef,
    linkedin: linkedinRef,
    gmail: gmailRef,
    google_ads: googleAdsRef,
  };

  const mediaRefs: Record<Platform, React.RefObject<HTMLDivElement | null>> = {
    instagram: instagramMediaRef,
    facebook: facebookMediaRef,
    linkedin: linkedinMediaRef,
    gmail: gmailMediaRef,
    google_ads: googleAdsMediaRef,
  };

  const fileInputRefs: Record<
    Platform,
    React.RefObject<HTMLInputElement | null>
  > = {
    instagram: instagramFileRef,
    facebook: facebookFileRef,
    linkedin: linkedinFileRef,
    gmail: gmailFileRef,
    google_ads: googleAdsFileRef,
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
    gmail: 0,
    google_ads: 200,
  });

  const setBudget = (platform: Platform, value: number) =>
    setBudgets((prev) => ({ ...prev, [platform]: value }));

  const getEditorRef = (platform: string) => {
    if (platform === "instagram") return instagramRef;
    if (platform === "facebook") return facebookRef;
    if (platform === "google_ads") return googleAdsRef;
    return linkedinRef;
  };

  const getMediaRef = (platform: string) => {
    if (platform === "instagram") return instagramMediaRef;
    if (platform === "facebook") return facebookMediaRef;
    if (platform === "google_ads") return googleAdsMediaRef;
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

  const handleText = () => {
    document.execCommand("bold");
  };

  const handleLink = (platform: string) => {
    const url = prompt("Enter URL");
    if (!url) return;
    insertHTML(
      platform,
      `<a href="${url}" target="_blank" style="color:#2563eb;text-decoration:underline;">${url}</a>`,
    );
  };

  const handleEmoji = (platform: string) => {
    const ref = getEditorRef(platform);
    ref.current?.focus();
    document.execCommand("insertText", false, "😊");
  };

  const handleImage = () => {
    // No-op: images handled via URL input field in SocialContentBox
  };

  const handleAttachment = (platform: string) => {
    if (platform === "instagram") instagramFileRef.current?.click();
    if (platform === "facebook") facebookFileRef.current?.click();
    if (platform === "linkedin") linkedinFileRef.current?.click();
    if (platform === "google_ads") googleAdsFileRef.current?.click();
  };

  const handleFileInsert = (
    e: React.ChangeEvent<HTMLInputElement>,
    platform: string,
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
    label.onclick = () =>
      setInlinePreview({ src: objectUrl, type: "file", name: file.name });
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    setSubmitted(true);
    if (step === 1) {
      const campaignNameError = getCampaignNameValidationError(campaignName);
      if (campaignNameError) {
        toast.error(campaignNameError, {
          toastId: "social-campaign-name-error",
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

  const handleCreateCampaign = async (type: "live" | "draft" | "scheduled") => {
    setSubmitted(true);

    const needsSchedule = type === "scheduled" || type === "draft";
    if (!step1Valid || !step2Valid) return;
    if (needsSchedule && (!scheduleDate || !scheduleTime)) return;

    try {
      const selectedPlatforms = PLATFORM_LIST.filter((p) =>
        accounts.includes(p.id),
      );

      const totalSpend = selectedPlatforms.reduce(
        (sum, p) => sum + budgets[p.id],
        0,
      );

      const refsMap: Record<
        Platform,
        React.RefObject<HTMLDivElement | null>
      > = {
        instagram: instagramRef,
        facebook: facebookRef,
        linkedin: linkedinRef,
        gmail: gmailRef,
        google_ads: googleAdsRef,
      };

      const resolvedContent: Record<Platform, string> = {
        instagram: "",
        facebook: "",
        linkedin: "",
        gmail: "",
        google_ads: "",
      };

      for (const platform of accounts) {
        const fromState = platformContent[platform]?.trim();
        const fromRef = refsMap[platform]?.current?.innerText?.trim() || "";
        resolvedContent[platform] = fromState || fromRef;
      }

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

      if (!image_url) {
        for (const p of accounts) {
          const content = resolvedContent[p]?.trim();
          if (content && isPlainUrl(content)) {
            image_url = content;
            resolvedContent[p] = "";
            break;
          }
        }
      }

      const firstSelectedContent =
        accounts
          .map((p) => resolvedContent[p])
          .find((c) => c.trim() !== "" && !isPlainUrl(c)) ?? campaignName;

      const statusValue =
        type === "live"
          ? CAMPAIGN_STATUS.LIVE
          : type === "scheduled"
            ? CAMPAIGN_STATUS.SCHEDULED
            : CAMPAIGN_STATUS.DRAFT;

      // BE SocialMediaCampaignCreateAPIView expects the string array, not numeric constant
      const campaignMode: ("organic_posting" | "paid_advertising")[] = [
        mode === "paid" ? "paid_advertising" : "organic_posting",
      ];

      const selectedAccounts = [...accounts];

      const cleanedContent: Partial<Record<Platform, string>> = {
        ...resolvedContent,
      };

      const payload: SocialCampaignPayload = {
        clinic: clinicId,
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        campaign_objective: objective,
        target_audience: audience,
        start_date: startDate,
        end_date: endDate,
        campaign_mode: campaignMode,
        campaign_content: firstSelectedContent,
        select_ad_accounts: selectedAccounts,
        enter_time: scheduleTime || null,
        platform_data: cleanedContent,
        budget_data: {
          ...Object.fromEntries(
            selectedPlatforms.map((p) => [p.id, budgets[p.id]]),
          ),
          total: totalSpend,
        },
        image_url,
        selected_start: scheduleDate || null,
        selected_end: scheduleDate || null,
        status: statusValue,
        is_active: type === "live",
      };

      const createdRes = await CampaignAPI.createSocial(payload);

      // -------------------------------------------------------
      // Google Ads: fire the dedicated endpoint if selected
      // -------------------------------------------------------
      const shouldSendGoogleAds =
        accounts.includes("google_ads") && isGoogleAdsConnected;

      if (shouldSendGoogleAds) {
        try {
          const googleAdsImage =
            platformImageUrlsRef.current["google_ads"]?.trim() ||
            platformImageUrls["google_ads"]?.trim() ||
            image_url ||
            null;

          await CampaignAPI.createGoogleAds({
            clinic_id: clinicId,
            customer_id: String(clinic?.google_ads_customer_id ?? ""),
            campaign_name: campaignName,
            budget: budgets["google_ads"],
            bidding_strategy: "MANUAL_CPC",
            locations: [],
            keywords: [],
            cpc_bid: 20,
            ad_group_name: `${campaignName} AdGroup`,
            final_url: clinic?.website ?? "https://example.com",
            headline_1: campaignName.slice(0, 30),
            headline_2: "Learn More",
            headline_3: "Contact Us Today",
            description: campaignDescription.slice(0, 90),
            description_2: "Call us now or visit our website.",
            image_url: googleAdsImage,
            platform_data: { google_ads: resolvedContent["google_ads"] },
          });

          console.log("[GoogleAds] Campaign sent to Zapier successfully");
        } catch (googleAdsErr) {
          console.error(
            "[GoogleAds] Failed to trigger Google Ads:",
            googleAdsErr,
          );
          toast.warn(
            "Campaign saved, but Google Ads trigger failed. Check logs.",
          );
        }
      } else if (accounts.includes("google_ads") && !isGoogleAdsConnected) {
        toast.warn(
          "Google Ads was not triggered because this clinic is not connected to Google Ads.",
        );
      }
      // -------------------------------------------------------

      onSave(createdRes?.data ?? payload);
      toast.success("Campaign created successfully");
      onClose();
    } catch {
      try {
        const listRes = await CampaignAPI.list();
        const list = Array.isArray(listRes.data) ? listRes.data : [];
        const found = list
          .filter(
            (item) =>
              String(item?.campaign_name ?? "")
                .trim()
                .toLowerCase() === campaignName.trim().toLowerCase(),
          )
          .sort((a, b) => {
            const at = new Date(
              String(a?.modified_at ?? a?.created_at ?? 0),
            ).getTime();
            const bt = new Date(
              String(b?.modified_at ?? b?.created_at ?? 0),
            ).getTime();
            return bt - at;
          })[0];

        if (found) {
          onSave(found);
          toast.success("Campaign created successfully");
          onClose();
          return;
        }
      } catch {
        // ignore fallback failure
      }

      toast.error("Failed to create campaign");
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <Box className="email-campaign-modal">
        <div className="add-modal-header">
          <Typography variant="h6">Add Social Media Campaign</Typography>
          <IconButton onClick={onClose} className="close-btn">
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
            <span>Content & Configuration</span>
          </div>
          <div className="line" />
          <div className={`step ${step === 3 ? "active" : ""}`}>
            <div className="circle">3</div>
            <span>Schedule Campaign</span>
          </div>
        </div>

        {/* STEP 1 */}
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
                      toastId: "social-campaign-name-typing",
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
                <FormControl fullWidth variant="outlined">
                  <Select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">Select Audience</MenuItem>
                    {Object.entries(CAMPAIGN_AUDIENCE).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
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
                      textField: { error: submitted && !startDate },
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
                    slotProps={{ textField: { error: submitted && !endDate } }}
                  />
                </LocalizationProvider>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
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
                {PLATFORM_LIST.map((acc) => (
                  <div
                    key={acc.id}
                    className={`account-card ${accounts.includes(acc.id) ? "selected" : ""}`}
                    onClick={() => toggleAccount(acc.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="account-left">
                      <img src={platformIcons[acc.id]} alt={acc.label} />
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

                {PLATFORM_LIST.map((p) => (
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

                {PLATFORM_LIST.filter((p) => accounts.includes(p.id)).map(
                  (p) => (
                    <SocialContentBox
                      key={p.id}
                      ref={platformRefs[p.id]}
                      mediaRef={mediaRefs[p.id]}
                      platform={p.id}
                      icon={platformIcons[p.id]}
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
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 */}
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
                      {PLATFORM_LIST.filter((p) => accounts.includes(p.id)).map(
                        (p) => (
                          <div key={p.id} className="budget-card">
                            <div className="budget-title">
                              <img src={platformIcons[p.id]} alt={p.label} />
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
                          {PLATFORM_LIST.filter((p) =>
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
