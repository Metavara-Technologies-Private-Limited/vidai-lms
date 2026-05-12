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
    Chip,
    // Tooltip,
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

  const PLATFORM_RULES = {
    facebook: { minBudget: 2 },
  };

  const isPlainUrl = (str: string) =>
    str.trim().startsWith("http") && !str.trim().includes(" ");

  // ─── LinkedIn account status shape ───────────────────────────────────
  interface LinkedInAccountStatus {
    connected: boolean;
    setup_complete: boolean;
    missing: string[];
    account_id?: string;
    org_urn?: string;
    has_campaign_group?: boolean;
  }

  // ─── Country/State shape from API ────────────────────────────────────
  interface CountryData {
    name: string;
    iso2?: string;
    iso3?: string;
    states: { name: string; state_code?: string }[];
  }

  const LINKEDIN_BID_STRATEGIES = [
    { value: "MANUAL_BIDDING", label: "Manual Bidding" },
    { value: "MAXIMUM_DELIVERY", label: "Maximum Delivery (Auto)" },
    { value: "TARGET_COST", label: "Target Cost" },
    { value: "ENHANCED_CPC", label: "Enhanced CPC" },
  ];

  export default function SocialCampaignModal({ onClose, onSave }: Props) {
    const clinic = useSelector(selectClinic);
    const clinicId = clinic?.id || 1;
    const googleAdsCustomerId = clinic?.google_ads_customer_id;
    const [googleAdsIntegrationConnected, setGoogleAdsIntegrationConnected] =
      useState(false);
    const [facebookConnected, setFacebookConnected] = useState(false);

    // ─── LinkedIn account status ───────────────────────────────────
    const [linkedInAccountStatus, setLinkedInAccountStatus] =
      useState<LinkedInAccountStatus | null>(null);
    // const [linkedInStatusLoading, setLinkedInStatusLoading] = useState(false);

    // ─── Per-campaign LinkedIn live status (after creation) ────────
    const [linkedInLiveStatus, setLinkedInLiveStatus] = useState<string | null>(null);
    const [linkedInInsightsLoading, setLinkedInInsightsLoading] = useState(false);
    const [linkedInStatusCheckLoading, setLinkedInStatusCheckLoading] = useState(false);
    const [linkedInUpdateLoading, setLinkedInUpdateLoading] = useState(false);
    const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);

    // ─── LinkedIn targeting fields ────────────────────────────────
    const [linkedInCountry, setLinkedInCountry] = useState("");
    const [linkedInState, setLinkedInState] = useState("");
    const [linkedInCustomLocation, setLinkedInCustomLocation] = useState("");
    const [linkedInBidStrategy, setLinkedInBidStrategy] = useState("MANUAL_BIDDING");
    const [linkedInBidAmount, setLinkedInBidAmount] = useState<number>(0);

    // ─── Dynamic country/state data from API ─────────────────────
    const [countriesData, setCountriesData] = useState<CountryData[]>([]);
    const [countriesLoading, setCountriesLoading] = useState(false);

    const isPlatformConnected = (platform: Platform) =>
      platformConnectionMap[platform];

    // Fetch countries + states from API on mount
    useEffect(() => {
      const fetchCountries = async () => {
        setCountriesLoading(true);
        try {
          const res = await fetch("https://countriesnow.space/api/v0.1/countries/states");
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            // Sort alphabetically by name
            const sorted = [...json.data].sort((a: CountryData, b: CountryData) =>
              a.name.localeCompare(b.name)
            );
            setCountriesData(sorted);
          }
        } catch (err) {
          console.error("Failed to fetch countries from API", err);
          // Leave countriesData empty — UI will gracefully show empty dropdown
        } finally {
          setCountriesLoading(false);
        }
      };
      fetchCountries();
    }, []);

    // Derive states for selected country
    const selectedCountryStates: { name: string; state_code?: string }[] =
      countriesData.find(
        (c) => c.name === linkedInCountry
      )?.states ?? [];

    useEffect(() => {
      let isMounted = true;

      if (!clinic?.id) {
        queueMicrotask(() => {
          if (isMounted) {
            setGoogleAdsIntegrationConnected(false);
            setLinkedInAccountStatus(null);
            setFacebookConnected(false);
          }
        });
        return () => {
          isMounted = false;
        };
      }

      const fetchStatuses = async () => {
        try {
          // ── Google Ads connection check ──────────────────────────
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
          setFacebookConnected(
            accs.some((acc) => acc.platform === "facebook" && acc.connected),
          );
        } catch (err) {
          console.error("Failed to fetch Google Ads integration status", err);
          if (isMounted) {
            setGoogleAdsIntegrationConnected(false);
          }
        }
      };

      fetchStatuses();

      return () => {
        isMounted = false;
      };
    }, [clinic]);

    const isGoogleAdsConnected = Boolean(
      (googleAdsCustomerId && String(googleAdsCustomerId).trim().length) ||
        googleAdsIntegrationConnected,
    );

    const isLinkedInFullySetup = Boolean(
      linkedInAccountStatus?.connected && linkedInAccountStatus?.setup_complete,
    );
    
    const platformConnectionMap: Record<Platform, boolean> = {
      facebook: facebookConnected,
      instagram: facebookConnected,
      linkedin: isLinkedInFullySetup,
      google_ads: googleAdsIntegrationConnected,
      gmail: true,
    };

    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loadingType, setLoadingType] = useState<
      "draft" | "scheduled" | "live" | null
    >(null);

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

    const [keywordsInput, setKeywordsInput] = useState("");

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
      const isConnected = isPlatformConnected(id);
      if (!accounts.includes(id) && !isConnected) {
        toast.warn(
          `${id.replace("_", " ").toUpperCase()} is not connected. Please connect it from Integrations.`,
          { toastId: `${id}-not-connected` },
        );
        return;
      }
      setAccounts((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    };;

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

    // ─── Build final LinkedIn location string ─────────────────────
    const getLinkedInLocation = () => {
      if (linkedInCustomLocation.trim()) return linkedInCustomLocation.trim();
      if (linkedInState && linkedInCountry) return `${linkedInState}, ${linkedInCountry}`;
      if (linkedInCountry) return linkedInCountry;
      return "";
    };

    const handleCreateCampaign = async (
      type: "live" | "draft" | "scheduled",
    ) => {
      setSubmitted(true);

      if (!step1Valid || !step2Valid) return;
      if (type === "scheduled" && (!scheduleDate || !scheduleTime)) {
        toast.error("Please select both schedule date and time");
        return;
      }

      setLoadingType(type);
      try {
        const selectedPlatforms = PLATFORM_LIST.filter((p) =>
          accounts.includes(p.id),
        );

        if (mode === "paid") {
          for (const platform of accounts) {
            if (
              (platform === "facebook" || platform === "instagram") &&
              budgets[platform] < PLATFORM_RULES.facebook.minBudget
            ) {
              toast.error(
                `${platform.toUpperCase()} requires minimum $${PLATFORM_RULES.facebook.minBudget} budget (≈ ₹95)`,
              );
              return;
            }
          }
        }
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

        const isActive = type === "live";
        const googleAdsCampaignStatus = type === "live" ? "live" : "draft";

        const campaignMode: ("organic_posting" | "paid_advertising")[] = [
          mode === "paid" ? "paid_advertising" : "organic_posting",
        ];

        const selectedAccounts = [...accounts];

        // ─── Build platform_data — inject LinkedIn targeting fields ──
        const cleanedContent: Partial<Record<Platform, string | object>> = {
          ...resolvedContent,
        };

        if (accounts.includes("linkedin")) {
          const existingLinkedinContent =
            typeof resolvedContent["linkedin"] === "string"
              ? resolvedContent["linkedin"]
              : "";
          cleanedContent["linkedin"] = {
            content: existingLinkedinContent,
            location: getLinkedInLocation(),
            bid_strategy: linkedInBidStrategy,
            bid_amount: linkedInBidAmount,
          };
        }

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
          is_active: isActive,
        };

        const createdRes = await CampaignAPI.createSocial(payload);

        const newCampaignId: string | null =
          (createdRes?.data as { id?: string })?.id ??
          (createdRes?.data as { campaign_id?: string })?.campaign_id ??
          null;

        if (newCampaignId) {
          setCreatedCampaignId(newCampaignId);
        }

        // ─────────────────────────────────────────────────────────────────
        // Google Ads: ONLY fire paid ad endpoint when mode === "paid"
        // For organic posting, the campaign content is already saved above
        // via CampaignAPI.createSocial — no money is spent.
        // ─────────────────────────────────────────────────────────────────
        const shouldSendGoogleAds =
          accounts.includes("google_ads") &&
          isGoogleAdsConnected &&
          mode === "paid"; // ← KEY FIX: organic skips this entirely

        if (shouldSendGoogleAds) {
          try {
            const googleAdsImage =
              platformImageUrlsRef.current["google_ads"]?.trim() ||
              platformImageUrls["google_ads"]?.trim() ||
              image_url ||
              null;

            const parsedKeywords = keywordsInput
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean);

            console.log("[GoogleAds] Sending paid ad payload:", {
              internal_campaign_id: String(newCampaignId ?? ""),
              image_url: googleAdsImage,
              keywords: parsedKeywords,
              campaign_objective: objective,
              target_audience: audience,
              start_date: startDate,
              end_date: endDate,
              start_time: scheduleTime || "",
              campaign_status: googleAdsCampaignStatus,
            });

            await CampaignAPI.createGoogleAds({
              clinic_id: clinicId,
              customer_id: String(clinic?.google_ads_customer_id ?? ""),
              campaign_name: campaignName,
              budget: budgets["google_ads"],
              bidding_strategy: "MANUAL_CPC",
              locations: [],
              keywords: parsedKeywords,
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
              campaign_type: "SEARCH",
              internal_campaign_id: String(newCampaignId ?? ""),
              campaign_objective: objective,
              target_audience: audience,
              start_date: startDate,
              end_date: endDate,
              start_time: scheduleTime || "",
              campaign_status: googleAdsCampaignStatus,
            });

            console.log("[GoogleAds] Paid campaign sent to Zapier successfully");
          } catch (googleAdsErr) {
            console.error(
              "[GoogleAds] Failed to trigger Google Ads:",
              googleAdsErr,
            );
            toast.warn(
              "Campaign saved, but Google Ads trigger failed. Check logs.",
            );
          }
        } else if (
          accounts.includes("google_ads") &&
          isGoogleAdsConnected &&
          mode === "organic"
        ) {
          // Organic posting with Google Ads selected:
          // Campaign content already saved via createSocial above.
          // No paid ad is triggered — no money spent.
          console.log(
            "[GoogleAds] Organic mode — campaign content saved, no paid ad triggered.",
          );
        } else if (accounts.includes("google_ads") && !isGoogleAdsConnected) {
          toast.warn(
            "Google Ads was not triggered because this clinic is not connected to Google Ads.",
          );
        }

        // ─────────────────────────────────────────────────────────
        // LinkedIn: warn if selected but not fully set up
        // ─────────────────────────────────────────────────────────
        if (accounts.includes("linkedin") && newCampaignId) {
          try {
            await CampaignAPI.createLinkedInCampaign(newCampaignId);

            console.log("[LinkedIn] Campaign sent to Zapier");
          } catch (err) {
            console.error("[LinkedIn] Create failed", err);
            toast.warn("Campaign saved but LinkedIn trigger failed");
          }
        }

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
      } finally {
        setLoadingType(null);
      }
    };

    // ─── LinkedIn post-creation actions ──────────────────────────
    const handleLinkedInStatusCheck = async () => {
      if (!createdCampaignId) return;
      setLinkedInStatusCheckLoading(true);
      try {
        const res = await CampaignAPI.getLinkedInStatus(createdCampaignId);
        const respStatus =
          (res?.data as { linkedin_live_status?: string })?.linkedin_live_status ??
          (res?.data as { status?: string })?.status ??
          "unknown";
        setLinkedInLiveStatus(String(respStatus));
        toast.success(`LinkedIn status: ${respStatus}`);
      } catch {
        toast.error("Failed to fetch LinkedIn status");
      } finally {
        setLinkedInStatusCheckLoading(false);
      }
    };

    const handleLinkedInInsights = async () => {
      if (!createdCampaignId) return;
      setLinkedInInsightsLoading(true);
      try {
        await CampaignAPI.triggerLinkedInInsights(createdCampaignId);
        toast.success("LinkedIn insights requested. Data will sync shortly.");
      } catch {
        toast.error("Failed to trigger LinkedIn insights");
      } finally {
        setLinkedInInsightsLoading(false);
      }
    };

    const handleLinkedInPause = async () => {
      if (!createdCampaignId) return;
      setLinkedInUpdateLoading(true);
      try {
        await CampaignAPI.updateLinkedInStatus(createdCampaignId, "PAUSED");
        setLinkedInLiveStatus("PAUSED");
        toast.success("LinkedIn campaign paused.");
      } catch {
        toast.error("Failed to pause LinkedIn campaign");
      } finally {
        setLinkedInUpdateLoading(false);
      }
    };

    const handleLinkedInResume = async () => {
      if (!createdCampaignId) return;
      setLinkedInUpdateLoading(true);
      try {
        await CampaignAPI.updateLinkedInStatus(createdCampaignId, "ACTIVE");
        setLinkedInLiveStatus("ACTIVE");
        toast.success("LinkedIn campaign resumed.");
      } catch {
        toast.error("Failed to resume LinkedIn campaign");
      } finally {
        setLinkedInUpdateLoading(false);
      }
    };

    // ─── LinkedIn live controls panel ─────────────────────────────
    const renderLinkedInControls = () => {
      if (!accounts.includes("linkedin")) return null;

      return (
        <div
          className="section-card"
          style={{
            marginTop: 16,
            border: "1px solid #0077b5",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <img
              src={platformIcons["linkedin"]}
              alt="LinkedIn"
              style={{ width: 20, height: 20 }}
            />
            <h3 style={{ margin: 0, color: "#0077b5" }}>LinkedIn Campaign Controls</h3>
            {linkedInLiveStatus && (
              <Chip
                label={linkedInLiveStatus}
                size="small"
                color={
                  linkedInLiveStatus === "ACTIVE"
                    ? "success"
                    : linkedInLiveStatus === "PAUSED"
                      ? "warning"
                      : "default"
                }
                sx={{ ml: "auto" }}
              />
            )}
          </div>

          {!isLinkedInFullySetup && (
            <p
              style={{
                color: "#d97706",
                fontSize: 12,
                marginBottom: 10,
                backgroundColor: "#fffbeb",
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid #fcd34d",
              }}
            >
              ⚠️ LinkedIn account setup is incomplete (missing:{" "}
              {linkedInAccountStatus?.missing?.join(", ") || "account details"}).
              Complete setup in Integrations for ads to be triggered.
            </p>
          )}

          {isLinkedInFullySetup && !createdCampaignId && (
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
              Controls will be available after the campaign is created.
            </p>
          )}

          {isLinkedInFullySetup && createdCampaignId && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="cancel-btn"
                style={{ fontSize: 12, padding: "4px 12px" }}
                onClick={handleLinkedInStatusCheck}
                disabled={linkedInStatusCheckLoading}
              >
                {linkedInStatusCheckLoading ? "Checking…" : "🔄 Sync Status"}
              </button>

              <button
                className="cancel-btn"
                style={{ fontSize: 12, padding: "4px 12px" }}
                onClick={handleLinkedInInsights}
                disabled={linkedInInsightsLoading}
              >
                {linkedInInsightsLoading ? "Requesting…" : "📊 Fetch Insights"}
              </button>

              {linkedInLiveStatus !== "PAUSED" && (
                <button
                  className="cancel-btn"
                  style={{ fontSize: 12, padding: "4px 12px", color: "#d97706" }}
                  onClick={handleLinkedInPause}
                  disabled={linkedInUpdateLoading}
                >
                  {linkedInUpdateLoading ? "Updating…" : "⏸ Pause"}
                </button>
              )}

              {linkedInLiveStatus === "PAUSED" && (
                <button
                  className="next-btn"
                  style={{ fontSize: 12, padding: "4px 12px" }}
                  onClick={handleLinkedInResume}
                  disabled={linkedInUpdateLoading}
                >
                  {linkedInUpdateLoading ? "Updating…" : "▶ Resume"}
                </button>
              )}
            </div>
          )}
        </div>
      );
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
                      slotProps={{
                        textField: { error: submitted && !endDate },
                      }}
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
                        {!isPlatformConnected(acc.id) && (
                          <Chip
                            label="Not Connected"
                            size="small"
                            color="error"
                            className="connection-chip"
                          />
                        )}
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

              {/* ✅ Google Ads Keywords — shown when google_ads selected AND paid mode */}
              {accounts.includes("google_ads") && mode === "paid" && (
                <div className="section-card">
                  <h3>Google Ads Keywords</h3>
                  <p className="section-subtitle">
                    Enter keywords for your Google Search campaign
                    (comma-separated)
                  </p>
                  <div className="form-group">
                    <label>Keywords *</label>
                    <input
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="e.g. IVF, fertility clinic, IVF consultation, egg freezing"
                      style={{ width: "100%" }}
                    />
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      Separate keywords with commas. These will be added as
                      broad match keywords to your Google Search campaign.
                      {!keywordsInput.trim() && (
                        <span style={{ color: "#d97706" }}>
                          {" "}
                          If left empty, fallback keywords will be
                          auto-generated from the campaign name.
                        </span>
                      )}
                    </p>
                    {keywordsInput.trim() && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          marginTop: 6,
                        }}
                      >
                        {keywordsInput
                          .split(",")
                          .map((k) => k.trim())
                          .filter(Boolean)
                          .map((kw, i) => (
                            <Chip
                              key={i}
                              label={kw}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>Google Ads Image URL (optional)</label>
                    <input
                      value={platformImageUrls["google_ads"]}
                      onChange={(e) =>
                        handleImageUrl("google_ads", e.target.value)
                      }
                      placeholder="https://your-image-url.com/image.jpg"
                      style={{ width: "100%" }}
                    />
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      If provided, a Display campaign will also be created
                      alongside the Search campaign.
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ Google Ads organic info — shown when google_ads selected AND organic mode */}
              {accounts.includes("google_ads") && mode === "organic" && (
                <div
                  className="section-card"
                  style={{
                    border: "1px solid #d1fae5",
                    backgroundColor: "#f0fdf4",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <img
                      src={platformIcons["google_ads"]}
                      alt="Google Ads"
                      style={{ width: 18, height: 18 }}
                    />
                    <h3 style={{ margin: 0, color: "#15803d" }}>Google Ads — Organic Post</h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>
                    Your campaign content will be saved for Google Ads. No paid ad will be triggered — no money will be spent.
                    Switch to <strong>Paid Advertising</strong> mode to run a real Google Ad.
                  </p>
                </div>
              )}

              {/* ✅ LinkedIn Targeting — shown only when linkedin selected */}
              {accounts.includes("linkedin") && (
                <div
                  className="section-card"
                  style={{ border: "1px solid #0077b5", borderRadius: 8 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <img
                      src={platformIcons["linkedin"]}
                      alt="LinkedIn"
                      style={{ width: 18, height: 18 }}
                    />
                    <h3 style={{ margin: 0, color: "#0077b5" }}>
                      LinkedIn Ad Targeting
                    </h3>
                  </div>
                  <p className="section-subtitle">
                    Configure targeting and bidding for your LinkedIn campaign
                  </p>

                  {/* Location row */}
                  <div className="form-row" style={{ marginTop: 12 }}>
                    <div className="form-group half">
                      <label>Country</label>
                      <FormControl fullWidth variant="outlined" size="small">
                        <Select
                          value={linkedInCountry}
                          onChange={(e) => {
                            setLinkedInCountry(e.target.value);
                            setLinkedInState("");
                          }}
                          displayEmpty
                          disabled={countriesLoading}
                        >
                          <MenuItem value="">
                            {countriesLoading
                              ? "Loading countries…"
                              : "Select Country"}
                          </MenuItem>
                          {countriesData.map((c) => (
                            <MenuItem key={c.name} value={c.name}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>

                    <div className="form-group half">
                      <label>
                        State / Region
                        <span
                          style={{
                            color: "#9ca3af",
                            fontWeight: 400,
                            marginLeft: 4,
                            fontSize: 11,
                          }}
                        >
                          (optional)
                        </span>
                      </label>
                      {selectedCountryStates.length > 0 ? (
                        <FormControl fullWidth variant="outlined" size="small">
                          <Select
                            value={linkedInState}
                            onChange={(e) => setLinkedInState(e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">All States</MenuItem>
                            {selectedCountryStates.map((s) => (
                              <MenuItem key={s.name} value={s.name}>
                                {s.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <input
                          value={linkedInState}
                          onChange={(e) => setLinkedInState(e.target.value)}
                          placeholder="e.g. London, Bavaria…"
                          style={{
                            width: "100%",
                            height: 40,
                            padding: "0 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            fontSize: 14,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Custom location override */}
                  <div className="form-group" style={{ marginTop: 8 }}>
                    <label>
                      Custom Location
                      <span
                        style={{
                          color: "#9ca3af",
                          fontWeight: 400,
                          marginLeft: 4,
                          fontSize: 11,
                        }}
                      >
                        (overrides country/state if filled)
                      </span>
                    </label>
                    <input
                      value={linkedInCustomLocation}
                      onChange={(e) =>
                        setLinkedInCustomLocation(e.target.value)
                      }
                      placeholder="e.g. Mumbai, Maharashtra, India"
                      style={{ width: "100%" }}
                    />
                    {/* Preview */}
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      Location that will be sent:{" "}
                      <strong style={{ color: "#1d4ed8" }}>
                        {getLinkedInLocation() || "—"}
                      </strong>
                    </p>
                  </div>

                  {/* Bid strategy + bid amount row */}
                  <div className="form-row" style={{ marginTop: 8 }}>
                    <div className="form-group half">
                      <label>Bid Strategy</label>
                      <FormControl fullWidth variant="outlined" size="small">
                        <Select
                          value={linkedInBidStrategy}
                          onChange={(e) =>
                            setLinkedInBidStrategy(e.target.value)
                          }
                        >
                          {LINKEDIN_BID_STRATEGIES.map((s) => (
                            <MenuItem key={s.value} value={s.value}>
                              {s.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <p
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}
                      >
                        {linkedInBidStrategy === "MAXIMUM_DELIVERY"
                          ? "LinkedIn automatically maximises delivery within your budget."
                          : linkedInBidStrategy === "TARGET_COST"
                            ? "LinkedIn tries to stay close to your target cost per result."
                            : linkedInBidStrategy === "ENHANCED_CPC"
                              ? "LinkedIn adjusts your manual bid to maximise conversions."
                              : "You set the exact bid per click manually."}
                      </p>
                    </div>

                    <div className="form-group half">
                      <label>
                        Bid Amount ($)
                        {linkedInBidStrategy === "MAXIMUM_DELIVERY" && (
                          <span
                            style={{
                              color: "#9ca3af",
                              fontWeight: 400,
                              marginLeft: 4,
                              fontSize: 11,
                            }}
                          >
                            (not used for auto)
                          </span>
                        )}
                      </label>
                      <div style={{ position: "relative" }}>
                        <span
                          style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#6b7280",
                            fontSize: 14,
                            pointerEvents: "none",
                          }}
                        >
                          $
                        </span>
                        {/* step=1, min=0, default=0 — increments by whole numbers */}
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={linkedInBidAmount}
                          onChange={(e) =>
                            setLinkedInBidAmount(Number(e.target.value))
                          }
                          disabled={linkedInBidStrategy === "MAXIMUM_DELIVERY"}
                          style={{
                            width: "100%",
                            paddingLeft: 24,
                            height: 40,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            fontSize: 14,
                            opacity:
                              linkedInBidStrategy === "MAXIMUM_DELIVERY"
                                ? 0.5
                                : 1,
                          }}
                        />
                      </div>
                      <p
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}
                      >
                        Enter a whole number amount (e.g. 1, 2, 5, 10…)
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                        {PLATFORM_LIST.filter((p) =>
                          accounts.includes(p.id),
                        ).map((p) => (
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
                        ))}
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
                            Ad spend is charged directly by each connected
                            social media platform. We don't handle payments.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {renderLinkedInControls()}
            </div>
          )}

          {/* FOOTER */}
          <div className="modal-actions">
            <button
              className="cancel-btn"
              onClick={onClose}
              disabled={loadingType !== null}
            >
              Cancel
            </button>
            {/* ── BACK button: shown on step 2 and step 3 ── */}
            {step > 1 && (
              <button
                className="cancel-btn"
                onClick={() => {
                  setStep(step - 1);
                  setSubmitted(false);
                }}
                disabled={loadingType !== null}
              >
                Back
              </button>
            )}
            {step === 3 ? (
              mode === "paid" ? (
                <>
                  <button
                    className="cancel-btn"
                    onClick={() => handleCreateCampaign("draft")}
                    disabled={loadingType !== null}
                  >
                    {loadingType === "draft" ? "Saving..." : "Save as Draft"}
                  </button>
                  <button
                    className="next-btn"
                    onClick={() => handleCreateCampaign("scheduled")}
                    disabled={loadingType !== null}
                  >
                    {loadingType === "scheduled" ? "Scheduling..." : "Schedule"}
                  </button>
                </>
              ) : (
                <button
                  className="next-btn"
                  onClick={() => handleCreateCampaign("live")}
                  disabled={loadingType !== null}
                >
                  {loadingType !== null ? "Creating..." : "Save & Post"}
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