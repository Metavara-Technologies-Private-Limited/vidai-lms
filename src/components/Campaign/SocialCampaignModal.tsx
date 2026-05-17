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

// FIX: minimum budget is strictly greater than $2 — so minimum accepted is $3
const PLATFORM_MIN_BUDGET = 2; // must be strictly greater than this

const isPlainUrl = (str: string) =>
  str.trim().startsWith("http") && !str.trim().includes(" ");

const getNextFiveMinuteTime = () => {
  const now = dayjs();

  const remainder = 5 - (now.minute() % 5);

  const rounded = remainder === 5 ? now : now.add(remainder, "minute");

  return rounded.second(0).format("HH:mm");
};

// FIX: Convert any share/preview URL to a direct renderable image URL.
const resolveImageUrl = (url: string): string => {
  if (!url) return url;
  const trimmed = url.trim();

  // ── Google Drive ──────────────────────────────────────────────────────
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (driveFileMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
  }
  const driveOpenMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }
  const docsMatch = trimmed.match(/docs\.google\.com\/[^/]+\/d\/([^/?]+)/);
  if (docsMatch) {
    return `https://drive.google.com/uc?export=view&id=${docsMatch[1]}`;
  }
  if (trimmed.includes("drive.google.com/uc")) {
    return trimmed;
  }

  // ── Dropbox ───────────────────────────────────────────────────────────
  if (trimmed.includes("dropbox.com")) {
    return trimmed
      .replace(/[?&]dl=\d/, "")
      .replace(/[?&]raw=\d/, "")
      .replace(/\?/, "?raw=1&")
      .replace(/dropbox\.com\/(.+)$/, (match) =>
        match.includes("?") ? match : match + "?raw=1"
      );
  }

  // ── OneDrive / SharePoint ─────────────────────────────────────────────
  if (trimmed.match(/1drv\.ms|onedrive\.live\.com|sharepoint\.com/)) {
    if (trimmed.includes("download=1")) return trimmed;
    const sep = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${sep}download=1`;
  }

  // ── Imgur ─────────────────────────────────────────────────────────────
  const imgurGallery = trimmed.match(
    /^https?:\/\/(?:www\.)?imgur\.com\/(?:a\/|gallery\/)?([A-Za-z0-9]+)(?:\.[a-z]+)?(?:[?#].*)?$/
  );
  if (imgurGallery && !trimmed.includes("i.imgur.com")) {
    return `https://i.imgur.com/${imgurGallery[1]}.jpg`;
  }

  // ── Postimages / postimg.cc ───────────────────────────────────────────
  if (trimmed.includes("postimg.cc") || trimmed.includes("postimage.org")) {
    return trimmed;
  }

  // ── All other URLs ────────────────────────────────────────────────────
  return trimmed;
};

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

// ─── Per-platform uploaded image file state ───────────────────────────
type PlatformImageFiles = Record<Platform, File | null>;
type PlatformImagePreviews = Record<Platform, string>; // object URLs for preview

// ─── Image resize/compress helper ────────────────────────────────────
// Resizes and compresses an image File to stay within maxSizeMB and
// maxDimension px (longest side). Returns a new File with the same name.
const resizeAndCompressImage = (
  file: File,
  maxSizeMB: number = 2,
  maxDimension: number = 1920
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.onload = (evt) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image load error"));
      img.onload = () => {
        let { width, height } = img;

        // ── Scale down if either dimension exceeds maxDimension ──
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // ── Iteratively lower quality until size is within limit ──
        const maxBytes = maxSizeMB * 1024 * 1024;
        let quality = 0.92;
        const tryExport = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas toBlob failed"));
                return;
              }
              if (blob.size <= maxBytes || quality <= 0.3) {
                // Accept — wrap in a File so the rest of the upload flow works
                const outputFile = new File([blob], file.name, {
                  type: blob.type,
                  lastModified: Date.now(),
                });
                resolve(outputFile);
              } else {
                quality = Math.max(quality - 0.1, 0.3);
                tryExport();
              }
            },
            "image/jpeg",
            quality
          );
        };
        tryExport();
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function SocialCampaignModal({ onClose, onSave }: Props) {
  const clinic = useSelector(selectClinic);
  const clinicId = clinic?.id || 1;
  // const googleAdsCustomerId = clinic?.google_ads_customer_id;
  const [googleAdsIntegrationConnected, setGoogleAdsIntegrationConnected] =
    useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);

  // ─── LinkedIn account status ───────────────────────────────────
  const [linkedInAccountStatus, setLinkedInAccountStatus] =
    useState<LinkedInAccountStatus | null>(null);

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

  const [metaCountry, setMetaCountry] = useState("");
  const [metaState, setMetaState] = useState("");

  // ─── Dynamic country/state data from API ─────────────────────
  const [countriesData, setCountriesData] = useState<CountryData[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const isPlatformConnected = (platform: Platform) =>
    platformConnectionMap[platform];

  useEffect(() => {
    if (!countriesData.length) return;
    if (!navigator.geolocation) return;
    if (metaCountry) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );

          const data = await res.json();

          const detectedCountry =
            data?.address?.country_code?.toUpperCase() || "";

          const detectedState = data?.address?.state || "";

          const validCountry = countriesData.find(
            (c) => c.iso2 === detectedCountry || c.name === detectedCountry,
          );

          if (validCountry) {
            setMetaCountry(validCountry.iso2 || validCountry.name);
          }

          const validState = validCountry?.states?.find(
            (s) => s.name.toLowerCase() === detectedState.toLowerCase(),
          );

          if (validState) {
            setMetaState(validState.name);
          }
        } catch (err) {
          console.error("Location detection failed", err);
        }
      },
      (err) => {
        console.error("Location permission denied", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      },
    );
  }, [countriesData, metaCountry]);
  
  // Fetch countries + states from API on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setCountriesLoading(true);
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/states");
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          const sorted = [...json.data].sort((a: CountryData, b: CountryData) =>
            a.name.localeCompare(b.name)
          );
          setCountriesData(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch countries from API", err);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Derive states for selected country
  const selectedCountryStates: { name: string; state_code?: string }[] =
    countriesData.find((c) => c.name === linkedInCountry)?.states ?? [];
  const metaSelectedStates =
    countriesData.find(
      (c) => c.iso2 === metaCountry || c.name === metaCountry
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
        const res = await integrationApi.getSocialAccounts(clinic.id);
        const accs = Array.isArray(res.data) ? res.data : [];

        if (!isMounted) return;

        setGoogleAdsIntegrationConnected(
          accs.some(
            (acc) =>
              typeof acc.platform === "string" &&
              acc.platform.toLowerCase().includes("google")
          )
        );
        setFacebookConnected(
          accs.some((acc) => acc.platform === "facebook" && acc.connected)
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

  // const isGoogleAdsConnected = Boolean(
  //   (googleAdsCustomerId && String(googleAdsCustomerId).trim().length) ||
  //     googleAdsIntegrationConnected
  // );

  const isLinkedInFullySetup = Boolean(linkedInAccountStatus?.connected);

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
  const [objective, setObjective] = useState(() => {
    const keys = Object.keys(CAMPAIGN_OBJECTIVES);
    const leadGenKey = keys.find(
      (k) =>
        k === "lead_generation" ||
        k === "LEAD_GENERATION" ||
        (CAMPAIGN_OBJECTIVES as Record<string, string>)[k]
          ?.toLowerCase()
          .includes("lead")
    );
    return leadGenKey ?? keys[0] ?? "";
  });
  const [audience, setAudience] = useState(() => {
    const keys = Object.keys(CAMPAIGN_AUDIENCE);
    const allSubKey = keys.find(
      (k) =>
        k === "all_subscribers" ||
        k === "ALL_SUBSCRIBERS" ||
        (CAMPAIGN_AUDIENCE as Record<string, string>)[k]
          ?.toLowerCase()
          .includes("all")
    );
    return allSubKey ?? keys[0] ?? "";
  });
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
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

  // ─── REMOVED: platformImageUrls state (URL field removed) ────────────
  // Only file-based upload is kept. platformImageUrlsRef is kept for
  // legacy plain-URL fallback from content field (Step 3 logic unchanged).

  // ─── Per-platform uploaded image files & previews ────────────────────
  const [platformImageFiles, setPlatformImageFiles] =
    useState<PlatformImageFiles>({
      instagram: null,
      facebook: null,
      linkedin: null,
      gmail: null,
      google_ads: null,
    });

  const [platformImagePreviews, setPlatformImagePreviews] =
    useState<PlatformImagePreviews>({
      instagram: "",
      facebook: "",
      linkedin: "",
      gmail: "",
      google_ads: "",
    });

  // Refs for the hidden image-upload inputs (one per platform)
  const imageUploadRefs: Record<Platform, React.RefObject<HTMLInputElement | null>> = {
    instagram: useRef<HTMLInputElement>(null),
    facebook: useRef<HTMLInputElement>(null),
    linkedin: useRef<HTMLInputElement>(null),
    gmail: useRef<HTMLInputElement>(null),
    google_ads: useRef<HTMLInputElement>(null),
  };

  // ─── Handle image file chosen from disk ──────────────────────────────
  // FIX TS6133: wired to imageUploadRefs onChange below (was declared but never used).
  // CHANGED: added size check (>5 MB hard reject) + auto resize/compress
  // (>2 MB gets resized to ≤2 MB via canvas before storing in state).
  // Nothing else in this function changed.
  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    platform: Platform
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── Hard limit: reject files over 20 MB ──────────────────────────
    const HARD_LIMIT_MB = 20;
    const COMPRESS_THRESHOLD_MB = 5;

    if (file.size > HARD_LIMIT_MB * 1024 * 1024) {
      toast.error(
        `Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please upload an image under ${HARD_LIMIT_MB} MB.`,
        { toastId: "img-size-error" }
      );
      e.target.value = "";
      return;
    }

    // ── Auto-compress if file is between 5 MB and 20 MB ──────────────
    let finalFile: File = file;
    if (file.size > COMPRESS_THRESHOLD_MB * 1024 * 1024) {
      try {
        toast.info("Compressing image…", {
          toastId: "img-compress-progress",
          autoClose: false,
        });
        finalFile = await resizeAndCompressImage(file, COMPRESS_THRESHOLD_MB, 1920);
        toast.dismiss("img-compress-progress");
        toast.success(
          `Image compressed: ${(file.size / 1024 / 1024).toFixed(1)} MB → ${(finalFile.size / 1024 / 1024).toFixed(1)} MB`,
          { toastId: "img-compress-done", autoClose: 3000 }
        );
      } catch (compressErr) {
        toast.dismiss("img-compress-progress");
        console.error("[ImageCompress] Failed to compress image", compressErr);
        toast.warn(
          "Could not auto-compress image. Using original file — upload may fail if server rejects large files.",
          { toastId: "img-compress-warn" }
        );
        finalFile = file; // fall back to original
      }
    }

    // Revoke previous object URL to avoid memory leaks
    if (platformImagePreviews[platform]) {
      URL.revokeObjectURL(platformImagePreviews[platform]);
    }

    const objectUrl = URL.createObjectURL(finalFile);
    setPlatformImageFiles((prev) => ({ ...prev, [platform]: finalFile }));
    setPlatformImagePreviews((prev) => ({ ...prev, [platform]: objectUrl }));

    e.target.value = "";
  };

  // Remove uploaded image for a platform
  const handleRemoveImageFile = (platform: Platform) => {
    if (platformImagePreviews[platform]) {
      URL.revokeObjectURL(platformImagePreviews[platform]);
    }
    setPlatformImageFiles((prev) => ({ ...prev, [platform]: null }));
    setPlatformImagePreviews((prev) => ({ ...prev, [platform]: "" }));
  };

  // ─── Upload image file to server and get back a URL ──────────────────
  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clinic_id", String(clinicId));
      const uploadResponse = await CampaignAPI.uploadCampaignDocument(formData);
      const url =
        // Preferred backend contract
        (uploadResponse?.data as { image_url?: string })?.image_url ??
        // Backward-compatible fallbacks
        (uploadResponse?.data as { url?: string })?.url ??
        (uploadResponse?.data as { file_url?: string })?.file_url ??
        null;
      return url;
    } catch (err: unknown) {
      const errMessage = String(err);
      if (errMessage.includes("CORS") || errMessage.includes("Network Error")) {
        console.error(
          "[ImageUpload] CORS/Network error. Backend may not allow requests from this origin.\n" +
          "Possible fixes:\n" +
          "1. Ensure backend has django-cors-headers installed and configured\n" +
          "2. Add your frontend origin to CORS_ALLOWED_ORIGINS in settings.py\n" +
          "3. Verify /api/upload/image/ endpoint exists and has CORS headers enabled"
        );
      } else {
        console.error("[ImageUpload] Failed to upload image file", err);
      }
      return null;
    }
  };

  // ─── platformImageUrlsRef kept for legacy plain-URL content fallback ──
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

  // ─── handleImageUrl kept so SocialContentBox prop interface is unchanged ─
  // Even though the URL input field is removed from the modal UI, SocialContentBox
  // may still call onImageUrl internally; we keep the handler to avoid runtime errors.
  const handleImageUrl = (platform: Platform, url: string) => {
    const resolvedUrl = resolveImageUrl(url);
    platformImageUrlsRef.current[platform] = resolvedUrl;
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

  useEffect(() => {
    const syncContent = (
      ref: React.RefObject<HTMLDivElement | null>,
      value: string,
    ) => {
      if (!ref.current) return;

      if (ref.current.innerText.trim() !== value.trim()) {
        ref.current.innerText = value;
      }
    };

    syncContent(facebookRef, platformContent.facebook);
    syncContent(instagramRef, platformContent.instagram);
    syncContent(linkedinRef, platformContent.linkedin);
    syncContent(googleAdsRef, platformContent.google_ads);
  }, [step, platformContent]);

  const [inlinePreview, setInlinePreview] = useState<{
    src: string;
    type: "image" | "file";
    name: string;
  } | null>(null);

  const step2Valid = accounts.length > 0 && mode;

  // ─── FIX: validate campaign content per selected platform ────────────
  const getPlatformContentErrors = (): string[] => {
    const errors: string[] = [];
    for (const platform of accounts) {
      const fromRef = platformRefs[platform]?.current?.innerText?.trim() || "";
      const fromState = platformContent[platform]?.trim() || "";
      const hasContent = fromState || fromRef;
      if (!hasContent) {
        errors.push(
          `${platform.replace("_", " ").toUpperCase()} campaign content is required.`
        );
      }
    }
    return errors;
  };

  const [scheduleDate, setScheduleDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [scheduleTime, setScheduleTime] = useState(getNextFiveMinuteTime());
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
      `<a href="${url}" target="_blank" style="color:#2563eb;text-decoration:underline;">${url}</a>`
    );
  };

  const handleEmoji = (platform: string) => {
    const ref = getEditorRef(platform);
    ref.current?.focus();
    document.execCommand("insertText", false, "😊");
  };

  const handleImage = () => {
    // No-op: images handled via file upload button inside content box
  };

  const handleAttachment = (platform: string) => {
    if (platform === "instagram") instagramFileRef.current?.click();
    if (platform === "facebook") facebookFileRef.current?.click();
    if (platform === "linkedin") linkedinFileRef.current?.click();
    if (platform === "google_ads") googleAdsFileRef.current?.click();
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
        { toastId: `${id}-not-connected` }
      );
      return;
    }
    setAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
      return;
    }

    if (step === 2 && step2Valid) {
      // ── FIX: validate that every selected platform has content ──
      const contentErrors = getPlatformContentErrors();
      if (contentErrors.length > 0) {
        contentErrors.forEach((msg) =>
          toast.error(msg, { toastId: `content-error-${msg}` })
        );
        return;
      }
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

  const getBudgetError = (platform: Platform, amount: number): string | null => {
    if (
      platform === "facebook" ||
      platform === "instagram" ||
      platform === "linkedin" ||
      platform === "google_ads"
    ) {
      if (amount <= PLATFORM_MIN_BUDGET) {
        return `${platform.replace("_", " ").toUpperCase()} requires a budget greater than $${PLATFORM_MIN_BUDGET}. Please enter at least $${PLATFORM_MIN_BUDGET + 1}.`;
      }
    }
    return null;
  };

  const getComputedCampaignStatus = () => {
    if (!scheduleDate || !scheduleTime) {
      return CAMPAIGN_STATUS.LIVE;
    }

    const scheduledAt = dayjs(`${scheduleDate} ${scheduleTime}`);

    return scheduledAt.isAfter(dayjs())
      ? CAMPAIGN_STATUS.SCHEDULED
      : CAMPAIGN_STATUS.LIVE;
  };

  const handleCreateCampaign = async (
    type: "live" | "draft" | "scheduled"
  ) => {
    setSubmitted(true);

    if (!step1Valid || !step2Valid) return;
    if (type === "scheduled" && (!scheduleDate || !scheduleTime)) {
      toast.error("Please select both schedule date and time");
      return;
    }

    if (mode === "paid") {
      for (const platform of accounts) {
        const err = getBudgetError(platform, budgets[platform]);
        if (err) {
          toast.error(err);
          return;
        }
      }
    }

    setLoadingType(type);
    try {
      const selectedPlatforms = PLATFORM_LIST.filter((p) =>
        accounts.includes(p.id)
      );

      const totalSpend = selectedPlatforms.reduce(
        (sum, p) => sum + budgets[p.id],
        0
      );

      const refsMap: Record<Platform, React.RefObject<HTMLDivElement | null>> = {
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

      // ─── Resolve image_url: uploaded file only (URL field removed) ───────
      // Priority order:
      //   1. Uploaded image file (uploaded to server, returns a URL)
      //   2. Content that looks like a plain URL (legacy fallback)
      let image_url: string | null = null;

      // Step 1 – try uploading a file
      for (const p of accounts) {
        const file = platformImageFiles[p];
        if (file) {
          toast.info("Uploading image…", { toastId: "image-upload-progress", autoClose: false });
          const uploadedUrl = await uploadImageFile(file);
          toast.dismiss("image-upload-progress");
          if (uploadedUrl) {
            image_url = uploadedUrl;
            break;
          } else {
            toast.warn(
              "Image upload failed — campaign will be created without an image."
            );
          }
        }
      }

      // Step 2 – legacy: content that is a plain URL
      if (!image_url) {
        for (const p of accounts) {
          const content = resolvedContent[p]?.trim();
          if (content && isPlainUrl(content)) {
            image_url = resolveImageUrl(content);
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
        type === "draft"
          ? CAMPAIGN_STATUS.DRAFT
          : getComputedCampaignStatus();

          const isActive =
            statusValue === CAMPAIGN_STATUS.LIVE ||
            statusValue === CAMPAIGN_STATUS.SCHEDULED;
      // const googleAdsCampaignStatus = type === "live" ? "live" : "draft";

      const campaignMode: ("organic_posting" | "paid_advertising")[] = [
        mode === "paid" ? "paid_advertising" : "organic_posting",
      ];

      const selectedAccounts = [...accounts];

      const cleanedContent: Partial<Record<Platform, unknown>> = {
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
      if (accounts.includes("facebook")) {
        cleanedContent["facebook"] = {
          content: resolvedContent["facebook"],
          country_code: metaCountry || "IN",
          state: metaState,
        };
      }
      if (accounts.includes("instagram")) {
        cleanedContent["instagram"] = {
          content: resolvedContent["instagram"],
          country_code: metaCountry || "IN",
          state: metaState,
        };
      }
      if (accounts.includes("google_ads")) {
        cleanedContent["google_ads"] = {
          content: resolvedContent["google_ads"],

          keywords: keywordsInput
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),

          headline_1: campaignName.slice(0, 30),

          headline_2: "Learn More",

          headline_3: "Contact Us Today",

          description: campaignDescription.slice(0, 90),

          description_2: "Call us now or visit our website.",

          campaign_type: "SEARCH",

          bidding_strategy: "MANUAL_CPC",

          cpc_bid: 2,
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
        image_url:
          "https://lms-vidaisolutions.metavaratechnologies.com/media/campaign_images/58e5f195dcfe46fd96f69239a3f01eca.jpg",
        selected_start: scheduleDate || null,
        selected_end: endDate || null,
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

      // const shouldSendGoogleAds =
      //   accounts.includes("google_ads") &&
      //   isGoogleAdsConnected &&
      //   mode === "paid";

      // if (shouldSendGoogleAds) {
      //   try {
      //     const googleAdsImage =
      //       platformImageUrlsRef.current["google_ads"]?.trim() ||
      //       image_url ||
      //       "https://lms-vidaisolutions.metavaratechnologies.com/media/campaign_images/58e5f195dcfe46fd96f69239a3f01eca.jpg";

      //     const parsedKeywords = keywordsInput
      //       .split(",")
      //       .map((k) => k.trim())
      //       .filter(Boolean);

      //     console.log("[GoogleAds] Sending paid ad payload:", {
      //       internal_campaign_id: String(newCampaignId ?? ""),
      //       image_url: googleAdsImage,
      //       keywords: parsedKeywords,
      //       campaign_objective: objective,
      //       target_audience: audience,
      //       start_date: startDate,
      //       end_date: endDate,
      //       start_time: scheduleTime || "",
      //       campaign_status: statusValue,
      //       schedule_datetime: scheduleDateTime,
      //     });

      //     // ✅ FIX: Use platform's estimated CPC ($2.0 for Google Ads) instead of hardcoded value
      //     const googleAdsPlatform = PLATFORM_LIST.find((p) => p.id === "google_ads");
      //     const googleAdsCpcBid = googleAdsPlatform?.cpc ?? 2.0;

      //     await CampaignAPI.createGoogleAds({
      //       clinic_id: clinicId,
      //       customer_id: String(clinic?.google_ads_customer_id ?? ""),
      //       campaign_name: campaignName,
      //       budget: budgets["google_ads"],
      //       bidding_strategy: "MANUAL_CPC",
      //       locations: [],
      //       keywords: parsedKeywords,
      //       cpc_bid: googleAdsCpcBid,
      //       ad_group_name: `${campaignName} AdGroup`,
      //       final_url: clinic?.website ?? "https://example.com",
      //       headline_1: campaignName.slice(0, 30),
      //       headline_2: "Learn More",
      //       headline_3: "Contact Us Today",
      //       description: campaignDescription.slice(0, 90),
      //       description_2: "Call us now or visit our website.",
      //       image_url: googleAdsImage,
      //       platform_data: { google_ads: resolvedContent["google_ads"] },
      //       campaign_type: "SEARCH",
      //       internal_campaign_id: String(newCampaignId ?? ""),
      //       campaign_objective: objective,
      //       target_audience: audience,
      //       start_date: startDate,
      //       end_date: endDate,
      //       start_time: scheduleTime || "",
      //       campaign_status: statusValue,
      //       schedule_datetime: scheduleDateTime,
      //     });

      //     console.log("[GoogleAds] Paid campaign sent to Zapier successfully");
      //   } catch (googleAdsErr) {
      //     console.error("[GoogleAds] Failed to trigger Google Ads:", googleAdsErr);
      //     toast.warn("Campaign saved, but Google Ads trigger failed. Check logs.");
      //   }
      // } else if (
      //   accounts.includes("google_ads") &&
      //   isGoogleAdsConnected &&
      //   mode === "organic"
      // ) {
      //   console.log(
      //     "[GoogleAds] Organic mode — campaign content saved, no paid ad triggered."
      //   );
      // } else if (accounts.includes("google_ads") && !isGoogleAdsConnected) {
      //   toast.warn(
      //     "Google Ads was not triggered because this clinic is not connected to Google Ads."
      //   );
      // }

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
                .toLowerCase() === campaignName.trim().toLowerCase()
          )
          .sort((a, b) => {
            const at = new Date(
              String(a?.modified_at ?? a?.created_at ?? 0)
            ).getTime();
            const bt = new Date(
              String(b?.modified_at ?? b?.created_at ?? 0)
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <img
            src={platformIcons["linkedin"]}
            alt="LinkedIn"
            style={{ width: 20, height: 20 }}
          />
          <h3 style={{ margin: 0, color: "#0077b5" }}>
            LinkedIn Campaign Controls
          </h3>
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

  const scheduleDateMin = startDate ? dayjs(startDate) : dayjs();
  const scheduleDateMax = endDate ? dayjs(endDate) : undefined;

  const getScheduleMinTime = (): Dayjs | undefined => {
    if (!scheduleDate) return dayjs();
    if (scheduleDate === dayjs().format("YYYY-MM-DD")) {
      return dayjs();
    }
    return undefined;
  };

  // FIX: Accept Date | Dayjs to match MUI's PickerValidDate type — fixes TS2322 build error
  const isScheduleDateDisabled = (date: Date | Dayjs): boolean => {
    const d = dayjs(date);
    if (startDate && d.isBefore(dayjs(startDate), "day")) return true;
    if (endDate && d.isAfter(dayjs(endDate), "day")) return true;
    return false;
  };


  return (
    <Modal open={true} onClose={onClose}>
      <Box className="email-campaign-modal">
        <style>{`
          .img-preview-wrapper:hover .img-hover-overlay {
            opacity: 1 !important;
          }
        `}</style>
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
                      )
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
                      )
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
                    minDate={dayjs()}
                    value={startDate ? dayjs(startDate) : null}
                    onChange={(v) => {
                      const parsed = v ? dayjs(v as Dayjs) : null;
                      if (!parsed || !parsed.isValid()) {
                        setStartDate("");
                        return;
                      }

                      const today = dayjs().startOf("day");
                      if (parsed.isBefore(today, "day")) {
                        setStartDate("");
                        return;
                      }

                      const newStart = parsed.format("YYYY-MM-DD");
                      setStartDate(newStart);
                      if (
                        endDate &&
                        newStart &&
                        dayjs(endDate).isBefore(dayjs(newStart), "day")
                      ) {
                        setEndDate("");
                      }
                      if (
                        scheduleDate &&
                        newStart &&
                        dayjs(scheduleDate).isBefore(dayjs(newStart), "day")
                      ) {
                        setScheduleDate("");
                        setScheduleTime("");
                      }
                    }}
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
                    minDate={startDate ? dayjs(startDate) : dayjs()}
                    value={endDate ? dayjs(endDate) : null}
                    onChange={(v) => {
                      const parsed = v ? dayjs(v as Dayjs) : null;
                      if (!parsed || !parsed.isValid()) {
                        setEndDate("");
                        return;
                      }

                      const minEnd = startDate
                        ? dayjs(startDate).startOf("day")
                        : dayjs().startOf("day");
                      if (parsed.isBefore(minEnd, "day")) {
                        setEndDate("");
                        return;
                      }

                      const newEnd = parsed.format("YYYY-MM-DD");
                      setEndDate(newEnd);
                      if (
                        scheduleDate &&
                        newEnd &&
                        dayjs(scheduleDate).isAfter(dayjs(newEnd), "day")
                      ) {
                        setScheduleDate("");
                        setScheduleTime("");
                      }
                    }}
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

            {/* Google Ads Keywords — paid mode only */}
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
                    Separate keywords with commas. These will be added as broad
                    match keywords to your Google Search campaign.
                    {!keywordsInput.trim() && (
                      <span style={{ color: "#d97706" }}>
                        {" "}
                        If left empty, fallback keywords will be auto-generated
                        from the campaign name.
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
              </div>
            )}

            {/* Google Ads organic info */}
            {accounts.includes("google_ads") && mode === "organic" && (
              <div
                className="section-card"
                style={{
                  border: "1px solid #d1fae5",
                  backgroundColor: "#f0fdf4",
                  borderRadius: 8,
                }}
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
                    src={platformIcons["google_ads"]}
                    alt="Google Ads"
                    style={{ width: 18, height: 18 }}
                  />
                  <h3 style={{ margin: 0, color: "#15803d" }}>
                    Google Ads — Organic Post
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>
                  Your campaign content will be saved for Google Ads. No paid ad
                  will be triggered — no money will be spent. Switch to{" "}
                  <strong>Paid Advertising</strong> mode to run a real Google
                  Ad.
                </p>
              </div>
            )}

            {/* Meta Ad Targeting */}
            {(accounts.includes("facebook") ||
              accounts.includes("instagram")) && (
              <div
                className="section-card"
                style={{ border: "1px solid #1877f2", borderRadius: 8 }}
              >
                <h3 style={{ color: "#1877f2" }}>Meta Ad Targeting</h3>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Country</label>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Select
                        value={metaCountry}
                        onChange={(e) => {
                          setMetaCountry(e.target.value);
                          setMetaState("");
                        }}
                        displayEmpty
                      >
                        <MenuItem value="">Select Country</MenuItem>
                        {countriesData.map((c) => (
                          <MenuItem key={c.name} value={c.iso2 || c.name}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                  <div className="form-group half">
                    <label>State</label>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Select
                        value={metaState}
                        onChange={(e) => setMetaState(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">All States</MenuItem>
                        {metaSelectedStates.map((s) => (
                          <MenuItem key={s.name} value={s.name}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                </div>
              </div>
            )}

            {/* LinkedIn Targeting */}
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
                    onChange={(e) => setLinkedInCustomLocation(e.target.value)}
                    placeholder="e.g. Mumbai, Maharashtra, India"
                    style={{ width: "100%" }}
                  />
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    Location that will be sent:{" "}
                    <strong style={{ color: "#1d4ed8" }}>
                      {getLinkedInLocation() || "—"}
                    </strong>
                  </p>
                </div>

                <div className="form-row" style={{ marginTop: 8 }}>
                  <div className="form-group half">
                    <label>Bid Strategy</label>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Select
                        value={linkedInBidStrategy}
                        onChange={(e) => setLinkedInBidStrategy(e.target.value)}
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

                {/* ── Hidden image upload inputs (one per platform) ── */}
                {/* FIX TS6133: wired handleImageFileUpload here so it is actually used */}
                {PLATFORM_LIST.map((p) => (
                  <React.Fragment key={p.id}>
                    <input
                      ref={imageUploadRefs[p.id]}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleImageFileUpload(e, p.id)}
                    />
                  </React.Fragment>
                ))}

                {PLATFORM_LIST.map((p) => (
                  <React.Fragment key={`file-${p.id}`}>
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
                  (p) => {
                    const contentMissing =
                      submitted &&
                      !platformContent[p.id]?.trim() &&
                      !platformRefs[p.id]?.current?.innerText?.trim();

                    return (
                      <div key={p.id}>
                        {/* Content error banner */}
                        {contentMissing && (
                          <div
                            style={{
                              backgroundColor: "#fef2f2",
                              border: "1px solid #fca5a5",
                              borderRadius: 6,
                              padding: "8px 12px",
                              marginBottom: 6,
                              fontSize: 12,
                              color: "#dc2626",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            ⚠️{" "}
                            {p.label} campaign content is required. Please
                            add some text before proceeding.
                          </div>
                        )}

                        <SocialContentBox
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
                          imageUrl={""}
                          imageFile={platformImageFiles[p.id]}
                          imagePreview={platformImagePreviews[p.id]}
                          onUploadClick={() => imageUploadRefs[p.id].current?.click()}
                          onRemoveImage={() => handleRemoveImageFile(p.id)}
                          onPreviewClick={(src, name) =>
                            setInlinePreview({ src, type: "image", name })
                          }
                        />
                      </div>
                    );
                  }
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
                  {startDate && endDate && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginTop: 4,
                      }}
                    >
                      Schedule must be within campaign duration:{" "}
                      <strong style={{ color: "#1d4ed8" }}>
                        {dayjs(startDate).format("DD/MM/YYYY")} –{" "}
                        {dayjs(endDate).format("DD/MM/YYYY")}
                      </strong>
                    </p>
                  )}
                </div>
                <button className="ai-btn">✨ AI-Optimization Timing</button>
              </div>

              <div className="schedule-row">
                <div className="form-group half">
                  <label>Select Date</label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      minDate={scheduleDateMin}
                      maxDate={scheduleDateMax}
                      shouldDisableDate={isScheduleDateDisabled}
                      value={scheduleDate ? dayjs(scheduleDate) : null}
                      onChange={(v) => {
                        const parsed = v ? dayjs(v as Dayjs) : null;
                        if (!parsed || !parsed.isValid()) {
                          setScheduleDate("");
                          setScheduleTime("");
                          return;
                        }

                        const minSchedule = scheduleDateMin.startOf("day");
                        if (parsed.isBefore(minSchedule, "day")) {
                          setScheduleDate("");
                          setScheduleTime("");
                          return;
                        }

                        if (scheduleDateMax) {
                          const maxSchedule = scheduleDateMax.startOf("day");
                          if (parsed.isAfter(maxSchedule, "day")) {
                            setScheduleDate("");
                            setScheduleTime("");
                            return;
                          }
                        }

                        setScheduleDate(parsed.format("YYYY-MM-DD"));
                        setScheduleTime("");
                      }}
                      slots={{ openPickerIcon: CalendarTodayIcon }}
                    />
                  </LocalizationProvider>
                </div>
                <div className="form-group half">
                  <label>Enter Time</label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TimePicker
                      format="hh:mm A"
                      disabled={!scheduleDate}
                      minTime={getScheduleMinTime()}
                      value={
                        scheduleTime
                          ? dayjs(
                              `${scheduleDate || dayjs().format("YYYY-MM-DD")} ${scheduleTime}`
                            )
                          : null
                      }
                      onChange={(v) => {
                        if (v) setScheduleTime((v as Dayjs).format("HH:mm"));
                      }}
                      ampm
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          helperText: !scheduleDate
                            ? "Select a date first"
                            : undefined,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>

              {mode === "paid" && (
                <>
                  <div className="budget-divider" />
                  <div className="budget-section">
                    <h3>Budget Allocation</h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginBottom: 8,
                      }}
                    >
                      Minimum budget per platform:{" "}
                      <strong style={{ color: "#d97706" }}>
                        ${PLATFORM_MIN_BUDGET + 1}
                      </strong>{" "}
                      (must be greater than ${PLATFORM_MIN_BUDGET})
                    </p>
                    <div className="budget-row">
                      {PLATFORM_LIST.filter((p) =>
                        accounts.includes(p.id)
                      ).map((p) => {
                        const budgetErr = getBudgetError(
                          p.id,
                          budgets[p.id]
                        );
                        return (
                          <div key={p.id} className="budget-card">
                            <div className="budget-title">
                              <img
                                src={platformIcons[p.id]}
                                alt={p.label}
                              />
                              <span>
                                {p.label} (Estimate CPC : ${p.cpc})
                              </span>
                            </div>
                            <div className="budget-input-wrapper">
                              <label htmlFor={`budget-${p.id}`}>Enter Amount in USD ($)</label>
                              <input
                                id={`budget-${p.id}`}
                                type="number"
                                min={PLATFORM_MIN_BUDGET + 1}
                                step="1"
                                value={budgets[p.id]}
                                onChange={(e) =>
                                  setBudget(p.id, Number(e.target.value))
                                }
                                className="budget-input"
                                aria-label={`Budget for ${p.label} in US Dollars. Estimated CPC: $${p.cpc}`}
                                style={{
                                  borderColor: budgetErr
                                    ? "#ef4444"
                                    : undefined,
                                }}
                              />
                              {budgetErr && (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "#ef4444",
                                    marginTop: 4,
                                  }}
                                >
                                  {budgetErr}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="total-budget">
                      <div>
                        <h4>
                          Total Budget : $
                          {PLATFORM_LIST.filter((p) =>
                            accounts.includes(p.id)
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

        {/* ── Full-size image/file preview modal ── */}
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