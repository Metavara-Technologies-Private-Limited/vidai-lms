import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Modal,
  Box,
  IconButton,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import viewIcon from "./Icons/view.png";
import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";
import googleAdsIcon from "./Icons/google-ads.png";
import { CampaignAPI } from "../../services/campaign.api";
import "../../styles/Campaign/EmailCampaignModal.css";
import "../../styles/Campaign/SocialCampaignModal.css";
import EmailTemplateModal from "../../components/Campaign/EmailTemplateModal";
import SocialContentBox from "./SocialContentBox";
import type { Campaign, CampaignAPIType } from "../../types/campaigns.types";
import {
  CAMPAIGN_AUDIENCE,
  CAMPAIGN_MODE,
  CAMPAIGN_OBJECTIVES,
  SENDER_EMAIL,
  platformIcons,
  type Platform,
} from "../../constants/campaigns.constants";
import { selectClinic } from "../../store/clinicSlice";
import TemplateService, {
  type TemplateDocument,
} from "../../services/templates.api";
import {
  canTypeCampaignName,
  getCampaignNameValidationError,
} from "./campaignNameValidation";

interface EditCampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSave: (updated: Campaign) => void;
}

// FIX: Convert any share/preview URL to a direct renderable image URL.
// Handles Google Drive, Dropbox, OneDrive, Imgur, and passes direct URLs unchanged.
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

  // ── All other URLs (S3, Cloudinary, direct .jpg/.png, etc.) ──────────
  return trimmed;
};

// Keep content clean: if a platform content is only a URL, treat it as image URL,
// not text content (same behavior as SocialCampaignModal create flow).
const isPlainUrl = (str: string): boolean =>
  str.trim().startsWith("http") && !str.trim().includes(" ");

// FIX: minimum budget strictly greater than $2
const PLATFORM_MIN_BUDGET = 2;

// ─── LinkedIn countries + states (full world list) ───────────────
const LINKEDIN_COUNTRIES: {
  value: string;
  label: string;
  states?: { value: string; label: string }[];
}[] = [
  { value: "Afghanistan", label: "Afghanistan", states: [] },
  { value: "Albania", label: "Albania", states: [] },
  { value: "Algeria", label: "Algeria", states: [] },
  { value: "Argentina", label: "Argentina", states: [
    { value: "Buenos Aires", label: "Buenos Aires" },
    { value: "Córdoba", label: "Córdoba" },
    { value: "Santa Fe", label: "Santa Fe" },
    { value: "Mendoza", label: "Mendoza" },
    { value: "Tucumán", label: "Tucumán" },
  ]},
  { value: "Australia", label: "Australia", states: [
    { value: "New South Wales", label: "New South Wales" },
    { value: "Victoria", label: "Victoria" },
    { value: "Queensland", label: "Queensland" },
    { value: "Western Australia", label: "Western Australia" },
    { value: "South Australia", label: "South Australia" },
    { value: "Tasmania", label: "Tasmania" },
    { value: "Australian Capital Territory", label: "Australian Capital Territory" },
    { value: "Northern Territory", label: "Northern Territory" },
  ]},
  { value: "Austria", label: "Austria", states: [
    { value: "Vienna", label: "Vienna" },
    { value: "Salzburg", label: "Salzburg" },
    { value: "Tyrol", label: "Tyrol" },
    { value: "Styria", label: "Styria" },
  ]},
  { value: "Bangladesh", label: "Bangladesh", states: [
    { value: "Dhaka", label: "Dhaka" },
    { value: "Chittagong", label: "Chittagong" },
    { value: "Rajshahi", label: "Rajshahi" },
    { value: "Khulna", label: "Khulna" },
  ]},
  { value: "Belgium", label: "Belgium", states: [
    { value: "Brussels", label: "Brussels" },
    { value: "Flanders", label: "Flanders" },
    { value: "Wallonia", label: "Wallonia" },
  ]},
  { value: "Brazil", label: "Brazil", states: [
    { value: "São Paulo", label: "São Paulo" },
    { value: "Rio de Janeiro", label: "Rio de Janeiro" },
    { value: "Minas Gerais", label: "Minas Gerais" },
    { value: "Bahia", label: "Bahia" },
    { value: "Paraná", label: "Paraná" },
    { value: "Rio Grande do Sul", label: "Rio Grande do Sul" },
  ]},
  { value: "Canada", label: "Canada", states: [
    { value: "Ontario", label: "Ontario" },
    { value: "Quebec", label: "Quebec" },
    { value: "British Columbia", label: "British Columbia" },
    { value: "Alberta", label: "Alberta" },
    { value: "Manitoba", label: "Manitoba" },
    { value: "Saskatchewan", label: "Saskatchewan" },
    { value: "Nova Scotia", label: "Nova Scotia" },
    { value: "New Brunswick", label: "New Brunswick" },
  ]},
  { value: "Chile", label: "Chile", states: [] },
  { value: "China", label: "China", states: [
    { value: "Beijing", label: "Beijing" },
    { value: "Shanghai", label: "Shanghai" },
    { value: "Guangdong", label: "Guangdong" },
    { value: "Sichuan", label: "Sichuan" },
    { value: "Zhejiang", label: "Zhejiang" },
    { value: "Jiangsu", label: "Jiangsu" },
  ]},
  { value: "Colombia", label: "Colombia", states: [] },
  { value: "Czech Republic", label: "Czech Republic", states: [] },
  { value: "Denmark", label: "Denmark", states: [] },
  { value: "Egypt", label: "Egypt", states: [
    { value: "Cairo", label: "Cairo" },
    { value: "Alexandria", label: "Alexandria" },
    { value: "Giza", label: "Giza" },
  ]},
  { value: "Finland", label: "Finland", states: [] },
  { value: "France", label: "France", states: [
    { value: "Île-de-France", label: "Île-de-France" },
    { value: "Auvergne-Rhône-Alpes", label: "Auvergne-Rhône-Alpes" },
    { value: "Occitanie", label: "Occitanie" },
    { value: "Nouvelle-Aquitaine", label: "Nouvelle-Aquitaine" },
    { value: "Bretagne", label: "Bretagne" },
  ]},
  { value: "Germany", label: "Germany", states: [
    { value: "Bavaria", label: "Bavaria" },
    { value: "North Rhine-Westphalia", label: "North Rhine-Westphalia" },
    { value: "Baden-Württemberg", label: "Baden-Württemberg" },
    { value: "Berlin", label: "Berlin" },
    { value: "Hamburg", label: "Hamburg" },
    { value: "Hesse", label: "Hesse" },
    { value: "Saxony", label: "Saxony" },
  ]},
  { value: "Ghana", label: "Ghana", states: [] },
  { value: "Greece", label: "Greece", states: [] },
  { value: "Hungary", label: "Hungary", states: [] },
  { value: "India", label: "India", states: [
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
    { value: "Assam", label: "Assam" },
    { value: "Bihar", label: "Bihar" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
    { value: "Delhi", label: "Delhi" },
    { value: "Goa", label: "Goa" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "Haryana", label: "Haryana" },
    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
    { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
    { value: "Jharkhand", label: "Jharkhand" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Kerala", label: "Kerala" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Manipur", label: "Manipur" },
    { value: "Meghalaya", label: "Meghalaya" },
    { value: "Mizoram", label: "Mizoram" },
    { value: "Nagaland", label: "Nagaland" },
    { value: "Odisha", label: "Odisha" },
    { value: "Punjab", label: "Punjab" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Sikkim", label: "Sikkim" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Telangana", label: "Telangana" },
    { value: "Tripura", label: "Tripura" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "Uttarakhand", label: "Uttarakhand" },
    { value: "West Bengal", label: "West Bengal" },
  ]},
  { value: "Indonesia", label: "Indonesia", states: [
    { value: "Jakarta", label: "Jakarta" },
    { value: "West Java", label: "West Java" },
    { value: "East Java", label: "East Java" },
    { value: "Central Java", label: "Central Java" },
    { value: "Bali", label: "Bali" },
    { value: "North Sumatra", label: "North Sumatra" },
  ]},
  { value: "Iran", label: "Iran", states: [] },
  { value: "Iraq", label: "Iraq", states: [] },
  { value: "Ireland", label: "Ireland", states: [] },
  { value: "Israel", label: "Israel", states: [] },
  { value: "Italy", label: "Italy", states: [
    { value: "Lombardy", label: "Lombardy" },
    { value: "Lazio", label: "Lazio" },
    { value: "Campania", label: "Campania" },
    { value: "Sicily", label: "Sicily" },
    { value: "Veneto", label: "Veneto" },
    { value: "Tuscany", label: "Tuscany" },
  ]},
  { value: "Japan", label: "Japan", states: [
    { value: "Tokyo", label: "Tokyo" },
    { value: "Osaka", label: "Osaka" },
    { value: "Kanagawa", label: "Kanagawa" },
    { value: "Aichi", label: "Aichi" },
    { value: "Hokkaido", label: "Hokkaido" },
    { value: "Fukuoka", label: "Fukuoka" },
    { value: "Kyoto", label: "Kyoto" },
  ]},
  { value: "Jordan", label: "Jordan", states: [] },
  { value: "Kenya", label: "Kenya", states: [] },
  { value: "Kuwait", label: "Kuwait", states: [] },
  { value: "Lebanon", label: "Lebanon", states: [] },
  { value: "Malaysia", label: "Malaysia", states: [
    { value: "Kuala Lumpur", label: "Kuala Lumpur" },
    { value: "Selangor", label: "Selangor" },
    { value: "Penang", label: "Penang" },
    { value: "Johor", label: "Johor" },
    { value: "Sabah", label: "Sabah" },
    { value: "Sarawak", label: "Sarawak" },
  ]},
  { value: "Mexico", label: "Mexico", states: [
    { value: "Ciudad de México", label: "Ciudad de México" },
    { value: "Jalisco", label: "Jalisco" },
    { value: "Nuevo León", label: "Nuevo León" },
    { value: "Puebla", label: "Puebla" },
    { value: "Guanajuato", label: "Guanajuato" },
  ]},
  { value: "Morocco", label: "Morocco", states: [] },
  { value: "Netherlands", label: "Netherlands", states: [
    { value: "North Holland", label: "North Holland" },
    { value: "South Holland", label: "South Holland" },
    { value: "Utrecht", label: "Utrecht" },
    { value: "North Brabant", label: "North Brabant" },
  ]},
  { value: "New Zealand", label: "New Zealand", states: [
    { value: "Auckland", label: "Auckland" },
    { value: "Wellington", label: "Wellington" },
    { value: "Canterbury", label: "Canterbury" },
    { value: "Waikato", label: "Waikato" },
  ]},
  { value: "Nigeria", label: "Nigeria", states: [
    { value: "Lagos", label: "Lagos" },
    { value: "Abuja FCT", label: "Abuja FCT" },
    { value: "Kano", label: "Kano" },
    { value: "Rivers", label: "Rivers" },
    { value: "Oyo", label: "Oyo" },
  ]},
  { value: "Norway", label: "Norway", states: [] },
  { value: "Oman", label: "Oman", states: [] },
  { value: "Pakistan", label: "Pakistan", states: [
    { value: "Punjab", label: "Punjab" },
    { value: "Sindh", label: "Sindh" },
    { value: "Khyber Pakhtunkhwa", label: "Khyber Pakhtunkhwa" },
    { value: "Balochistan", label: "Balochistan" },
    { value: "Islamabad Capital Territory", label: "Islamabad Capital Territory" },
  ]},
  { value: "Philippines", label: "Philippines", states: [
    { value: "Metro Manila", label: "Metro Manila" },
    { value: "Central Visayas", label: "Central Visayas" },
    { value: "Central Luzon", label: "Central Luzon" },
    { value: "Calabarzon", label: "Calabarzon" },
    { value: "Davao", label: "Davao" },
  ]},
  { value: "Poland", label: "Poland", states: [] },
  { value: "Portugal", label: "Portugal", states: [] },
  { value: "Qatar", label: "Qatar", states: [] },
  { value: "Romania", label: "Romania", states: [] },
  { value: "Russia", label: "Russia", states: [
    { value: "Moscow", label: "Moscow" },
    { value: "Saint Petersburg", label: "Saint Petersburg" },
    { value: "Krasnodar Krai", label: "Krasnodar Krai" },
    { value: "Sverdlovsk Oblast", label: "Sverdlovsk Oblast" },
  ]},
  { value: "Saudi Arabia", label: "Saudi Arabia", states: [
    { value: "Ar Riyad", label: "Ar Riyad" },
    { value: "Makkah", label: "Makkah" },
    { value: "Eastern Province", label: "Eastern Province" },
    { value: "Al Madinah", label: "Al Madinah" },
  ]},
  { value: "Singapore", label: "Singapore", states: [] },
  { value: "South Africa", label: "South Africa", states: [
    { value: "Gauteng", label: "Gauteng" },
    { value: "Western Cape", label: "Western Cape" },
    { value: "KwaZulu-Natal", label: "KwaZulu-Natal" },
    { value: "Eastern Cape", label: "Eastern Cape" },
  ]},
  { value: "South Korea", label: "South Korea", states: [
    { value: "Seoul", label: "Seoul" },
    { value: "Busan", label: "Busan" },
    { value: "Incheon", label: "Incheon" },
    { value: "Daegu", label: "Daegu" },
    { value: "Gyeonggi-do", label: "Gyeonggi-do" },
  ]},
  { value: "Spain", label: "Spain", states: [
    { value: "Madrid", label: "Madrid" },
    { value: "Catalonia", label: "Catalonia" },
    { value: "Andalusia", label: "Andalusia" },
    { value: "Valencia", label: "Valencia" },
    { value: "Basque Country", label: "Basque Country" },
  ]},
  { value: "Sri Lanka", label: "Sri Lanka", states: [] },
  { value: "Sweden", label: "Sweden", states: [] },
  { value: "Switzerland", label: "Switzerland", states: [
    { value: "Zürich", label: "Zürich" },
    { value: "Bern", label: "Bern" },
    { value: "Geneva", label: "Geneva" },
    { value: "Vaud", label: "Vaud" },
  ]},
  { value: "Taiwan", label: "Taiwan", states: [] },
  { value: "Thailand", label: "Thailand", states: [
    { value: "Bangkok", label: "Bangkok" },
    { value: "Chiang Mai", label: "Chiang Mai" },
    { value: "Phuket", label: "Phuket" },
    { value: "Chonburi", label: "Chonburi" },
  ]},
  { value: "Turkey", label: "Turkey", states: [
    { value: "İstanbul", label: "İstanbul" },
    { value: "Ankara", label: "Ankara" },
    { value: "İzmir", label: "İzmir" },
    { value: "Antalya", label: "Antalya" },
    { value: "Bursa", label: "Bursa" },
  ]},
  { value: "UAE", label: "UAE", states: [
    { value: "Dubai", label: "Dubai" },
    { value: "Abu Dhabi", label: "Abu Dhabi" },
    { value: "Sharjah", label: "Sharjah" },
    { value: "Ajman", label: "Ajman" },
    { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  ]},
  { value: "Ukraine", label: "Ukraine", states: [] },
  { value: "United Kingdom", label: "United Kingdom", states: [
    { value: "England", label: "England" },
    { value: "Scotland", label: "Scotland" },
    { value: "Wales", label: "Wales" },
    { value: "Northern Ireland", label: "Northern Ireland" },
  ]},
  { value: "United States", label: "United States", states: [
    { value: "Alabama", label: "Alabama" },
    { value: "Alaska", label: "Alaska" },
    { value: "Arizona", label: "Arizona" },
    { value: "Arkansas", label: "Arkansas" },
    { value: "California", label: "California" },
    { value: "Colorado", label: "Colorado" },
    { value: "Connecticut", label: "Connecticut" },
    { value: "Delaware", label: "Delaware" },
    { value: "Florida", label: "Florida" },
    { value: "Georgia", label: "Georgia" },
    { value: "Hawaii", label: "Hawaii" },
    { value: "Idaho", label: "Idaho" },
    { value: "Illinois", label: "Illinois" },
    { value: "Indiana", label: "Indiana" },
    { value: "Iowa", label: "Iowa" },
    { value: "Kansas", label: "Kansas" },
    { value: "Kentucky", label: "Kentucky" },
    { value: "Louisiana", label: "Louisiana" },
    { value: "Maine", label: "Maine" },
    { value: "Maryland", label: "Maryland" },
    { value: "Massachusetts", label: "Massachusetts" },
    { value: "Michigan", label: "Michigan" },
    { value: "Minnesota", label: "Minnesota" },
    { value: "Mississippi", label: "Mississippi" },
    { value: "Missouri", label: "Missouri" },
    { value: "Montana", label: "Montana" },
    { value: "Nebraska", label: "Nebraska" },
    { value: "Nevada", label: "Nevada" },
    { value: "New Hampshire", label: "New Hampshire" },
    { value: "New Jersey", label: "New Jersey" },
    { value: "New Mexico", label: "New Mexico" },
    { value: "New York", label: "New York" },
    { value: "North Carolina", label: "North Carolina" },
    { value: "North Dakota", label: "North Dakota" },
    { value: "Ohio", label: "Ohio" },
    { value: "Oklahoma", label: "Oklahoma" },
    { value: "Oregon", label: "Oregon" },
    { value: "Pennsylvania", label: "Pennsylvania" },
    { value: "Rhode Island", label: "Rhode Island" },
    { value: "South Carolina", label: "South Carolina" },
    { value: "South Dakota", label: "South Dakota" },
    { value: "Tennessee", label: "Tennessee" },
    { value: "Texas", label: "Texas" },
    { value: "Utah", label: "Utah" },
    { value: "Vermont", label: "Vermont" },
    { value: "Virginia", label: "Virginia" },
    { value: "Washington", label: "Washington" },
    { value: "West Virginia", label: "West Virginia" },
    { value: "Wisconsin", label: "Wisconsin" },
    { value: "Wyoming", label: "Wyoming" },
  ]},
  { value: "Uruguay", label: "Uruguay", states: [] },
  { value: "Venezuela", label: "Venezuela", states: [] },
  { value: "Vietnam", label: "Vietnam", states: [
    { value: "Hồ Chí Minh City", label: "Hồ Chí Minh City" },
    { value: "Hà Nội", label: "Hà Nội" },
    { value: "Đà Nẵng", label: "Đà Nẵng" },
    { value: "Bình Dương", label: "Bình Dương" },
  ]},
  { value: "Zimbabwe", label: "Zimbabwe", states: [] },
];

const LINKEDIN_BID_STRATEGIES = [
  { value: "MANUAL_BIDDING", label: "Manual Bidding" },
  { value: "MAXIMUM_DELIVERY", label: "Maximum Delivery (Auto)" },
  { value: "TARGET_COST", label: "Target Cost" },
  { value: "ENHANCED_CPC", label: "Enhanced CPC" },
];

const PLATFORM_LIST: { id: Platform; label: string; cpc: number }[] = [
  { id: "instagram", label: "Instagram", cpc: 3.5 },
  { id: "facebook", label: "Facebook", cpc: 2.5 },
  { id: "linkedin", label: "LinkedIn", cpc: 1.5 },
  { id: "google_ads", label: "Google Ads", cpc: 2.0 },
];

// FIX: Accurate per-platform budget error (must be strictly > $2)
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

export default function EditCampaignModal({
  campaign,
  onClose,
  onSave,
}: EditCampaignModalProps) {
  const clinic = useSelector(selectClinic);
  const clinicId = clinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 0);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [fullCampaignData, setFullCampaignData] =
    useState<CampaignAPIType | null>(null);

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateAttachments, setTemplateAttachments] = useState<TemplateDocument[]>([]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [accounts, setAccounts] = useState<string[]>([]);
  const [mode, setMode] = useState<"organic" | "paid" | "">("");
  const [initialMode, setInitialMode] = useState<"organic" | "paid" | "">("");
  const isPaidLocked = initialMode === "paid";
  // FIX: scheduleDate defaults from campaign.scheduledAt
  const [scheduleDate, setScheduleDate] = useState(
    campaign.scheduledAt ? dayjs(campaign.scheduledAt).format("YYYY-MM-DD") : "",
  );
  const [scheduleRange, setScheduleRange] = useState<[Dayjs | null, Dayjs | null]>([
    campaign.scheduledAt ? dayjs(campaign.scheduledAt) : null,
    campaign.scheduledAt ? dayjs(campaign.scheduledAt) : null,
  ]);
  const [scheduleTime, setScheduleTime] = useState(
    campaign.scheduledAt ? dayjs(campaign.scheduledAt).format("HH:mm") : "",
  );

  // FIX: budgets stored as a map so all platforms handled uniformly
  const [budgets, setBudgets] = useState<Record<Platform, number>>({
    instagram: 350,
    facebook: 250,
    linkedin: 150,
    gmail: 0,
    google_ads: 200,
  });
  const setBudget = (platform: Platform, value: number) =>
    setBudgets((prev) => ({ ...prev, [platform]: value }));

  // ─── Google Ads fields ────────────────────────────────────────
  // FIX: Google Ads image URL field REMOVED (no longer shown in UI, matching SocialCampaignModal)
  const [keywordsInput, setKeywordsInput] = useState("");

  // ─── Meta (Facebook/Instagram) targeting ─────────────────────
  const [metaCountry, setMetaCountry] = useState("");
  const [metaState, setMetaState] = useState("");

  // ─── LinkedIn targeting fields ────────────────────────────────
  const [linkedInCountry, setLinkedInCountry] = useState("");
  const [linkedInState, setLinkedInState] = useState("");
  const [linkedInCustomLocation, setLinkedInCustomLocation] = useState("");
  const [linkedInBidStrategy, setLinkedInBidStrategy] = useState("MANUAL_BIDDING");
  const [linkedInBidAmount, setLinkedInBidAmount] = useState<number>(0);

  // ─── Platform content & image URLs ───────────────────────────
  const [platformContent, setPlatformContent] = useState<Record<Platform, string>>({
    instagram: "", facebook: "", linkedin: "", gmail: "", google_ads: "",
  });
  const [platformImageUrls, setPlatformImageUrls] = useState<Record<Platform, string>>({
    instagram: "", facebook: "", linkedin: "", gmail: "", google_ads: "",
  });
  const platformImageUrlsRef = useRef<Record<Platform, string>>({
    instagram: "", facebook: "", linkedin: "", gmail: "", google_ads: "",
  });

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

  const [inlinePreview, setInlinePreview] = useState<{
    src: string; type: "image" | "file"; name: string;
  } | null>(null);

  const platformRefs: Record<Platform, React.RefObject<HTMLDivElement | null>> = {
    instagram: instagramRef, facebook: facebookRef, linkedin: linkedinRef,
    gmail: gmailRef, google_ads: googleAdsRef,
  };
  const mediaRefs: Record<Platform, React.RefObject<HTMLDivElement | null>> = {
    instagram: instagramMediaRef, facebook: facebookMediaRef, linkedin: linkedinMediaRef,
    gmail: gmailMediaRef, google_ads: googleAdsMediaRef,
  };
  const fileInputRefs: Record<Platform, React.RefObject<HTMLInputElement | null>> = {
    instagram: instagramFileRef, facebook: facebookFileRef, linkedin: linkedinFileRef,
    gmail: gmailFileRef, google_ads: googleAdsFileRef,
  };

  const handleEditorInput = (platform: Platform, value: string) =>
    setPlatformContent((prev) => ({ ...prev, [platform]: value }));

  // FIX: resolve Drive/Dropbox/etc URLs on input
  const handleImageUrl = (platform: Platform, url: string) => {
    const resolved = resolveImageUrl(url);
    platformImageUrlsRef.current[platform] = resolved;
    setPlatformImageUrls((prev) => ({ ...prev, [platform]: resolved }));
  };

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

  const handleText = () => { document.execCommand("bold"); };
  const handleLink = (platform: string) => {
    const url = prompt("Enter URL");
    if (!url) return;
    insertHTML(platform, `<a href="${url}" target="_blank" style="color:#2563eb;text-decoration:underline;">${url}</a>`);
  };
  const handleEmoji = (platform: string) => {
    const ref = getEditorRef(platform);
    ref.current?.focus();
    document.execCommand("insertText", false, "😊");
  };
  const handleImage = () => { /* No-op */ };
  const handleAttachment = (platform: string) => {
    if (platform === "instagram") instagramFileRef.current?.click();
    if (platform === "facebook") facebookFileRef.current?.click();
    if (platform === "linkedin") linkedinFileRef.current?.click();
    if (platform === "google_ads") googleAdsFileRef.current?.click();
  };
  const handleFileInsert = (e: React.ChangeEvent<HTMLInputElement>, platform: string) => {
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

  const toggleAccount = (id: string) =>
    setAccounts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // ─── LinkedIn location helper ─────────────────────────────────
  const getLinkedInLocation = () => {
    if (linkedInCustomLocation.trim()) return linkedInCustomLocation.trim();
    if (linkedInState && linkedInCountry) return `${linkedInState}, ${linkedInCountry}`;
    if (linkedInCountry) return linkedInCountry;
    return "";
  };
  const selectedCountryStates =
    LINKEDIN_COUNTRIES.find((c) => c.value === linkedInCountry)?.states ?? [];

  // ─── Helper: parse saved location string back into country/state ──
  const parseLocationIntoFields = (location: string) => {
    if (!location) return;
    const commaIdx = location.indexOf(", ");
    if (commaIdx !== -1) {
      const possibleState = location.substring(0, commaIdx).trim();
      const possibleCountry = location.substring(commaIdx + 2).trim();
      const countryMatch = LINKEDIN_COUNTRIES.find((c) => c.value === possibleCountry);
      if (countryMatch) {
        const stateMatch = countryMatch.states?.find((s) => s.value === possibleState);
        setLinkedInCountry(possibleCountry);
        setLinkedInState(stateMatch ? possibleState : "");
        if (!stateMatch) setLinkedInCustomLocation(location);
        return;
      }
    }
    const countryOnly = LINKEDIN_COUNTRIES.find((c) => c.value === location.trim());
    if (countryOnly) {
      setLinkedInCountry(location.trim());
      setLinkedInState("");
      return;
    }
    setLinkedInCustomLocation(location);
  };

  // FIX: Schedule date picker constraints — same as SocialCampaignModal
  const scheduleDateMin = startDate ? dayjs(startDate) : dayjs();
  const scheduleDateMax = endDate ? dayjs(endDate) : undefined;

  // ✅ FIX error 3: shouldDisableDate param typed as Date | Dayjs to match MUI expectation
  const isScheduleDateDisabled = (date: Date | Dayjs): boolean => {
    const d = dayjs(date);
    if (startDate && d.isBefore(dayjs(startDate), "day")) return true;
    if (endDate && d.isAfter(dayjs(endDate), "day")) return true;
    return false;
  };

  const getScheduleMinTime = (): Dayjs | undefined => {
    if (!scheduleDate) return dayjs();
    if (scheduleDate === dayjs().format("YYYY-MM-DD")) return dayjs();
    return undefined;
  };

  // ─── Fetch full campaign data and pre-fill ALL fields ────────
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await CampaignAPI.get(campaign.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = response.data as CampaignAPIType & Record<string, any>;
        setFullCampaignData(data);

        // ── Step 1 fields ──────────────────────────────────────
        setCampaignName(data.campaign_name || "");
        setCampaignDescription(data.campaign_description || "");
        setObjective(data.campaign_objective || "");
        setAudience(data.target_audience || "");
        setStartDate(data.start_date || "");
        setEndDate(data.end_date || "");

        // ── Email fields ───────────────────────────────────────
        if (data.email?.length > 0) {
          setSubject(data.email[0].subject || "");
          setEmailBody(data.email[0].email_body || "");
          if (editorRef.current)
            editorRef.current.innerHTML = data.email[0].email_body || "";
        }

        // ── Schedule fields ────────────────────────────────────
        // FIX: prefer selected_start/selected_end; fall back to scheduledAt
        if (data.selected_start) {
          const selStart = dayjs(data.selected_start);
          const selEnd = dayjs(data.selected_end || data.selected_start);
          setScheduleRange([selStart, selEnd]);
          setScheduleDate(selStart.format("YYYY-MM-DD"));
        } else if (campaign.scheduledAt) {
          const fallback = dayjs(campaign.scheduledAt);
          setScheduleRange([fallback, fallback]);
          setScheduleDate(fallback.format("YYYY-MM-DD"));
        }
        if (data.enter_time) setScheduleTime(data.enter_time);

        // ── Accounts / platforms ───────────────────────────────
        // FIX: try select_ad_accounts first, then social_media array
        let fetchedAccounts: string[] = [];
        if (Array.isArray(data.select_ad_accounts) && data.select_ad_accounts.length > 0) {
          fetchedAccounts = data.select_ad_accounts.filter(Boolean) as string[];
        } else if (Array.isArray(data.social_media) && data.social_media.length > 0) {
          fetchedAccounts =
            (data.social_media as { platform_name: string; is_active?: boolean }[])
              .filter((sm) => sm.is_active !== false)
              .map((sm) => sm.platform_name);
        }

        // ── Campaign mode ──────────────────────────────────────
        // ✅ FIX errors 1 & 2: cast campaign_mode to unknown first to allow string comparison
        const rawMode = data.campaign_mode as unknown;
        let resolvedMode: "organic" | "paid" | "" = "";
        if (rawMode === 1 || rawMode === "organic_posting" || rawMode === "organic") {
          resolvedMode = "organic";
        } else if (rawMode === 2 || rawMode === "paid_advertising" || rawMode === "paid") {
          resolvedMode = "paid";
        } else if (Array.isArray(rawMode)) {
          const modeArr = rawMode as string[];
          if (modeArr.includes("paid_advertising")) resolvedMode = "paid";
          else if (modeArr.includes("organic_posting")) resolvedMode = "organic";
        }
        setMode(resolvedMode);
        setInitialMode(resolvedMode);

        // ── Budget data ────────────────────────────────────────
        if (data.budget_data) {
          const bd = data.budget_data as Record<string, number>;
          setBudgets((prev) => ({
            ...prev,
            ...(bd.instagram !== undefined ? { instagram: bd.instagram } : {}),
            ...(bd.facebook !== undefined ? { facebook: bd.facebook } : {}),
            ...(bd.linkedin !== undefined ? { linkedin: bd.linkedin } : {}),
            ...(bd.google_ads !== undefined ? { google_ads: bd.google_ads } : {}),
          }));
        }

        // ── Platform data (content + targeting) ───────────────
        if (data.platform_data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pd = data.platform_data as Record<string, any>;

          if (
            pd.google_ads &&
            !fetchedAccounts.includes("google_ads")
          ) {
            fetchedAccounts = [...fetchedAccounts, "google_ads"];
          }

          setAccounts(fetchedAccounts);

          // FIX: extract text content for each platform,
          //      handling both plain string and {content: string} object shapes
          const extractRawContent = (val: unknown): string => {
            if (typeof val === "string") return val;
            if (val && typeof val === "object" && "content" in (val as object)) {
              return String((val as { content: unknown }).content ?? "");
            }
            return "";
          };

          const extractContent = (val: unknown): string => {
            const raw = extractRawContent(val);
            const trimmed = raw.trim();
            return isPlainUrl(trimmed) ? "" : raw;
          };

          const extractImageFromContent = (val: unknown): string => {
            const raw = extractRawContent(val).trim();
            return isPlainUrl(raw) ? resolveImageUrl(raw) : "";
          };

          const filledContent: Record<Platform, string> = {
            instagram: extractContent(pd.instagram),
            facebook: extractContent(pd.facebook),
            linkedin: extractContent(pd.linkedin),
            gmail: extractContent(pd.gmail),
            google_ads: extractContent(pd.google_ads),
          };
          setPlatformContent(filledContent);

          // FIX: extract image_url for each platform and resolve Drive/Dropbox URLs
          const extractImageUrl = (val: unknown): string => {
            if (val && typeof val === "object" && "image_url" in (val as object)) {
              const imgUrl = String((val as { image_url: unknown }).image_url ?? "");
              return imgUrl ? resolveImageUrl(imgUrl) : "";
            }
            return "";
          };

          const filledImageUrls: Record<Platform, string> = {
            instagram: extractImageUrl(pd.instagram) || extractImageFromContent(pd.instagram),
            facebook: extractImageUrl(pd.facebook) || extractImageFromContent(pd.facebook),
            linkedin: extractImageUrl(pd.linkedin) || extractImageFromContent(pd.linkedin),
            gmail: extractImageUrl(pd.gmail) || extractImageFromContent(pd.gmail),
            // FIX: Google Ads image URL NOT shown in UI — still resolve internally for submission
            google_ads: extractImageUrl(pd.google_ads) || extractImageFromContent(pd.google_ads),
          };
          // Apply resolved image URLs to both ref and state
          (Object.keys(filledImageUrls) as Platform[]).forEach((p) => {
            if (filledImageUrls[p]) {
              platformImageUrlsRef.current[p] = filledImageUrls[p];
            }
          });
          setPlatformImageUrls(filledImageUrls);

          // FIX: also check top-level image_url field (saved by SocialCampaignModal)
          if (data.image_url) {
            const resolvedTopLevel = resolveImageUrl(String(data.image_url));
            // Apply to all selected platforms that don't already have an image
            (["instagram", "facebook", "linkedin", "google_ads"] as Platform[]).forEach((p) => {
              if (!filledImageUrls[p]) {
                platformImageUrlsRef.current[p] = resolvedTopLevel;
                setPlatformImageUrls((prev) => ({ ...prev, [p]: resolvedTopLevel }));
              }
            });
          }

          // ── Push text content into contentEditable refs ──────
          setTimeout(() => {
            if (instagramRef.current && filledContent.instagram)
              instagramRef.current.innerText = filledContent.instagram;
            if (facebookRef.current && filledContent.facebook)
              facebookRef.current.innerText = filledContent.facebook;
            if (linkedinRef.current && filledContent.linkedin)
              linkedinRef.current.innerText = filledContent.linkedin;
            if (googleAdsRef.current && filledContent.google_ads)
              googleAdsRef.current.innerText = filledContent.google_ads;
          }, 300);

          // ── Google Ads: keywords only (no image URL in UI) ───
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const googleAdsData = pd.google_ads as any;
          if (googleAdsData && typeof googleAdsData === "object") {
            if (googleAdsData.keywords) {
              const kws: string = Array.isArray(googleAdsData.keywords)
                ? (googleAdsData.keywords as string[]).join(", ")
                : String(googleAdsData.keywords);
              setKeywordsInput(kws);
            }
            // FIX: image_url still resolved internally (for submission) but NOT shown in UI
          } else if (typeof pd.google_ads === "string" && pd.google_ads.trim().startsWith("{")) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const parsed = JSON.parse(pd.google_ads) as Record<string, any>;
              if (parsed.keywords) {
                const kws: string = Array.isArray(parsed.keywords)
                  ? (parsed.keywords as string[]).join(", ")
                  : String(parsed.keywords);
                setKeywordsInput(kws);
              }
            } catch {
              // not JSON, ignore
            }
          }

          // ── LinkedIn targeting ────────────────────────────────
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const linkedinData = pd.linkedin as any;
          if (linkedinData && typeof linkedinData === "object") {
            const liData = linkedinData as {
              location?: string;
              bid_strategy?: string;
              bid_amount?: number;
              content?: string;
            };
            if (liData.location) parseLocationIntoFields(liData.location);
            if (liData.bid_strategy) setLinkedInBidStrategy(liData.bid_strategy);
            if (liData.bid_amount !== undefined) setLinkedInBidAmount(Number(liData.bid_amount));
          } else if (typeof pd.linkedin === "string" && pd.linkedin.trim().startsWith("{")) {
            const linkedinStr: string = pd.linkedin;
            try {
              const liParsed = JSON.parse(linkedinStr) as {
                location?: string;
                bid_strategy?: string;
                bid_amount?: number;
              };
              if (liParsed.location) parseLocationIntoFields(liParsed.location);
              if (liParsed.bid_strategy) setLinkedInBidStrategy(liParsed.bid_strategy);
              if (liParsed.bid_amount !== undefined) setLinkedInBidAmount(Number(liParsed.bid_amount));
            } catch {
              // not JSON, ignore
            }
          }

          // ── Meta (Facebook/Instagram) targeting ───────────────
          // FIX: pre-fill metaCountry/metaState from saved facebook or instagram platform_data
          const metaData = (pd.facebook || pd.instagram) as { country_code?: string; state?: string } | undefined;
          if (metaData && typeof metaData === "object") {
            if (metaData.country_code) setMetaCountry(metaData.country_code);
            if (metaData.state) setMetaState(metaData.state);
          }
        } else {
          setAccounts(fetchedAccounts);
        }
      } catch (error) {
        console.error("Failed to fetch campaign:", error);
      }
    };
    fetchCampaign();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id]);

  // ─── Push content into refs when step changes to 2 (editors mount) ──
  useEffect(() => {
    if (step === 2 && campaign.type === "social") {
      setTimeout(() => {
        if (instagramRef.current && platformContent.instagram && !instagramRef.current.innerText.trim())
          instagramRef.current.innerText = platformContent.instagram;
        if (facebookRef.current && platformContent.facebook && !facebookRef.current.innerText.trim())
          facebookRef.current.innerText = platformContent.facebook;
        if (linkedinRef.current && platformContent.linkedin && !linkedinRef.current.innerText.trim())
          linkedinRef.current.innerText = platformContent.linkedin;
        if (googleAdsRef.current && platformContent.google_ads && !googleAdsRef.current.innerText.trim())
          googleAdsRef.current.innerText = platformContent.google_ads;
      }, 200);
    }
  }, [step, campaign.type, platformContent]);

  useEffect(() => {
    if (editorRef.current && emailBody && editorRef.current.innerHTML !== emailBody) {
      editorRef.current.innerHTML = emailBody;
    }
  }, [step, emailBody]);

  const fetchTemplateDocuments = async (templateId: string): Promise<void> => {
    try {
      const documents = await TemplateService.getTemplateDocuments("mail", templateId);
      setTemplateAttachments(documents ?? []);
    } catch (error) {
      console.error("Failed to fetch template documents:", error);
    }
  };

  const step1Valid =
    campaignName.trim() && campaignDescription.trim() && objective && audience && startDate && endDate;
  const step2Valid =
    campaign.type === "email"
      ? audience && subject.trim() && emailBody.trim()
      : accounts.length > 0 && mode;
  const step3Valid =
    campaign.type === "email"
      ? scheduleRange[0] && scheduleRange[1] && scheduleTime
      : scheduleDate && scheduleTime;

  const handleNext = () => {
    setSubmitted(true);
    if (step === 1) {
      const campaignNameError = getCampaignNameValidationError(campaignName);
      if (campaignNameError) {
        toast.error(campaignNameError, { toastId: "edit-campaign-name-error" });
        return;
      }
    }
    if (step === 1 && step1Valid) { setStep(2); setSubmitted(false); }
    else if (step === 2 && step2Valid) { setStep(3); setSubmitted(false); }
  };

  const handleUpdate = async () => {
    setSubmitted(true);
    if (!step3Valid || !fullCampaignData) return;

    if (isPaidLocked && mode !== "paid") {
      toast.error("Paid campaigns cannot be changed back to organic.");
      return;
    }

    // FIX: validate budgets with accurate error messages before submitting
    if (mode === "paid") {
      for (const platform of accounts as Platform[]) {
        const err = getBudgetError(platform, budgets[platform] ?? 0);
        if (err) {
          toast.error(err);
          return;
        }
      }
    }

    try {
      const start =
        campaign.type === "email" ? scheduleRange[0]?.format("YYYY-MM-DD") : scheduleDate;
      const end =
        campaign.type === "email" ? scheduleRange[1]?.format("YYYY-MM-DD") : scheduleDate;
      const scheduledDateTime = dayjs(`${start} ${scheduleTime}`, "YYYY-MM-DD HH:mm").format("YYYY-MM-DDTHH:mm:ss");

      const socialAccountData =
        campaign.type === "social"
          ? accounts
              .filter((platform) => platform !== "google_ads")
              .map((platform) => {
                const existing = fullCampaignData.social_media?.find(
                  (sm: { id: number; platform_name: string }) => sm.platform_name === platform,
                );
                return { id: existing?.id, platform_name: platform, is_active: true };
              })
          : [];

      // ─── Build updated platform_data ──────────────────────────
      // FIX: resolve any image URLs before saving
      const updatedPlatformData: Record<string, unknown> = {
        ...(fullCampaignData.platform_data || {}),
      };

      // Write per-platform content + image_url (resolved)
      for (const p of accounts as Platform[]) {
        if (p === "linkedin") {
          updatedPlatformData["linkedin"] = {
            content: platformContent["linkedin"],
            location: getLinkedInLocation(),
            bid_strategy: linkedInBidStrategy,
            bid_amount: linkedInBidAmount,
            // FIX: persist resolved image url for linkedin if present
            ...(platformImageUrlsRef.current["linkedin"]
              ? { image_url: resolveImageUrl(platformImageUrlsRef.current["linkedin"]) }
              : {}),
          };
        } else if (p === "facebook") {
          updatedPlatformData["facebook"] = {
            content: platformContent["facebook"],
            country_code: metaCountry || "IN",
            state: metaState,
            ...(platformImageUrlsRef.current["facebook"]
              ? { image_url: resolveImageUrl(platformImageUrlsRef.current["facebook"]) }
              : {}),
          };
        } else if (p === "instagram") {
          updatedPlatformData["instagram"] = {
            content: platformContent["instagram"],
            country_code: metaCountry || "IN",
            state: metaState,
            ...(platformImageUrlsRef.current["instagram"]
              ? { image_url: resolveImageUrl(platformImageUrlsRef.current["instagram"]) }
              : {}),
          };
        } else if (p === "google_ads") {
          // FIX: Google Ads — keywords only; image URL kept internally (no UI field)
          updatedPlatformData["google_ads"] = {
            content: platformContent["google_ads"],
            keywords: keywordsInput
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
            // preserve existing image_url from previously saved data if any
            ...(platformImageUrlsRef.current["google_ads"]
              ? { image_url: resolveImageUrl(platformImageUrlsRef.current["google_ads"]) }
              : {}),
          };
        } else {
          updatedPlatformData[p] = {
            content: platformContent[p as Platform],
          };
        }
      }

      // ✅ FIX errors 4 & 5: cast through unknown before Record<string, unknown>
      const fullDataAsRecord = fullCampaignData as unknown as Record<string, unknown>;

      // FIX: resolve the top-level image_url (pick first non-empty platform image)
      let resolvedImageUrl: string | null = null;
      for (const p of accounts as Platform[]) {
        const candidate = platformImageUrlsRef.current[p]?.trim();
        if (candidate) {
          resolvedImageUrl = resolveImageUrl(candidate);
          break;
        }
      }
      // fall back to existing campaign image_url if nothing new
      if (!resolvedImageUrl && fullDataAsRecord.image_url) {
        resolvedImageUrl = resolveImageUrl(String(fullDataAsRecord.image_url));
      }

      const persistedAccounts =
        mode === "paid"
          ? accounts
          : accounts.filter((platform) => platform !== "google_ads");
      const selectedPlatforms = PLATFORM_LIST.filter((p) => persistedAccounts.includes(p.id));
      const totalSpend =
        mode === "paid"
          ? selectedPlatforms.reduce((sum, p) => sum + (budgets[p.id] ?? 0), 0)
          : 0;

      const socialPayload =
        campaign.type === "social"
          ? {
              social_media: socialAccountData,
              select_ad_accounts: persistedAccounts,
              campaign_content: fullCampaignData.campaign_content || campaignName,
              platform_data: updatedPlatformData,
              image_url: resolvedImageUrl,
              budget_data: {
                ...Object.fromEntries(
                  selectedPlatforms.map((p) => [p.id, budgets[p.id]])
                ),
                total: totalSpend,
              },
            }
          : {};

      const payload = {
        clinic: clinicId,
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        campaign_objective: objective,
        target_audience: audience,
        start_date: startDate,
        end_date: endDate,
        campaign_mode:
          campaign.type === "email"
            ? CAMPAIGN_MODE.EMAIL
            : mode === "paid"
              ? CAMPAIGN_MODE.PAID
              : CAMPAIGN_MODE.ORGANIC,
        selected_start: start ?? null,
        selected_end: end ?? null,
        enter_time: scheduleTime,
        email:
          campaign.type === "email"
            ? [
                {
                  id: fullCampaignData.email?.[0]?.id,
                  audience_name: audience,
                  subject,
                  email_body: emailBody,
                  template_name: "EMAIL",
                  template_id: selectedTemplateId,
                  sender_email: SENDER_EMAIL,
                  scheduled_at: scheduledDateTime,
                  is_active: true,
                },
              ]
            : [],
        ...socialPayload,
      };

      await CampaignAPI.update(campaign.id, payload);

      const shouldCreateGoogleAdsOnPromotion =
        campaign.type === "social" &&
        initialMode !== "paid" &&
        mode === "paid" &&
        accounts.includes("google_ads") &&
        !!clinic?.google_ads_customer_id;

      if (shouldCreateGoogleAdsOnPromotion) {
        try {
          const googleAdsImage =
            platformImageUrlsRef.current["google_ads"]?.trim() ||
            resolvedImageUrl ||
            null;
          const parsedKeywords = keywordsInput
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean);
          const googleAdsCampaignStatus =
            String(fullCampaignData.status ?? "").toLowerCase() === "live"
              ? "live"
              : "draft";

          // ✅ FIX: Use platform's estimated CPC ($2.0 for Google Ads) instead of hardcoded value
          const googleAdsPlatform = PLATFORM_LIST.find((p) => p.id === "google_ads");
          const googleAdsCpcBid = googleAdsPlatform?.cpc ?? 2.0;

          await CampaignAPI.createGoogleAds({
            clinic_id: clinicId,
            customer_id: String(clinic?.google_ads_customer_id ?? ""),
            campaign_name: campaignName,
            budget: budgets["google_ads"],
            bidding_strategy: "MANUAL_CPC",
            locations: [],
            keywords: parsedKeywords,
            cpc_bid: googleAdsCpcBid,
            ad_group_name: `${campaignName} AdGroup`,
            final_url: clinic?.website ?? "https://example.com",
            headline_1: campaignName.slice(0, 30),
            headline_2: "Learn More",
            headline_3: "Contact Us Today",
            description: campaignDescription.slice(0, 90),
            description_2: "Call us now or visit our website.",
            image_url: googleAdsImage,
            platform_data: { google_ads: platformContent["google_ads"] },
            campaign_type: "SEARCH",
            internal_campaign_id: String(campaign.id),
            campaign_objective: objective,
            target_audience: audience,
            start_date: startDate,
            end_date: endDate,
            start_time: scheduleTime || "",
            campaign_status: googleAdsCampaignStatus,
          });
        } catch (googleAdsErr) {
          console.error("[GoogleAds] Failed to promote edited campaign to paid:", googleAdsErr);
          toast.warn("Campaign updated, but Google Ads promotion failed.");
        }
      }

      const updatedCampaign: Campaign = {
        ...campaign,
        name: campaignName,
        description: campaignDescription,
        objective: objective as Campaign["objective"],
        audience: audience as Campaign["audience"],
        start: startDate,
        end: endDate,
        scheduledAt: `${start}T${scheduleTime}`,
      };

      onSave(updatedCampaign);
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update campaign");
    }
  };

  const audienceLabel =
    audience === "all" ? "All Subscribers" : audience === "active" ? "Active Users" : "";

  return (
    <>
      <Modal open={true} onClose={onClose}>
        <Box className="email-campaign-modal">
          <div className="add-modal-header">
            <Typography variant="h6">
              Edit {campaign.type === "email" ? "Email" : "Social Media"} Campaign
            </Typography>
            <IconButton onClick={onClose} className="modal-close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <div className="modal-divider" />

          <div className="stepper">
            <div className={`step ${step === 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
              <div className="circle">{step > 1 ? "✓" : "1"}</div>
              <span>Campaign Details</span>
            </div>
            <div className="line" />
            <div className={`step ${step === 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
              <div className="circle">{step > 2 ? "✓" : "2"}</div>
              <span>{campaign.type === "email" ? "Email Setup" : "Content & Configuration"}</span>
            </div>
            <div className="line" />
            <div className={`step ${step === 3 ? "active" : ""}`}>
              <div className="circle">3</div>
              <span>Schedule {campaign.type === "email" ? "Email" : "Campaign"}</span>
            </div>
          </div>

          {/* ═══════════════ STEP 1 ═══════════════ */}
          {step === 1 && (
            <div className="step-content">
              <Typography variant="h6" sx={{ mb: 3 }}>Campaign Details</Typography>
              <div className={`form-group ${submitted && !campaignName ? "error" : ""}`}>
                <label>Campaign Name *</label>
                <input
                  value={campaignName}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (!canTypeCampaignName(nextValue)) {
                      toast.error("Alphanumeric and underscore are allowed", { toastId: "edit-campaign-name-typing" });
                      return;
                    }
                    setCampaignName(nextValue);
                  }}
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
                  <FormControl fullWidth>
                    <Select value={objective} onChange={(e) => setObjective(e.target.value)} displayEmpty>
                      <MenuItem value="">Select Objective</MenuItem>
                      {Object.entries(CAMPAIGN_OBJECTIVES).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className={`form-group half ${submitted && !audience ? "error" : ""}`}>
                  <label>Target Audience *</label>
                  <FormControl fullWidth>
                    <Select value={audience} onChange={(e) => setAudience(e.target.value)} displayEmpty>
                      <MenuItem value="">Select Audience</MenuItem>
                      {Object.entries(CAMPAIGN_AUDIENCE).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
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
                      onChange={(v) => {
                        const newStart = v ? (v as Dayjs).format("YYYY-MM-DD") : "";
                        setStartDate(newStart);
                        // FIX: clear endDate if it becomes before new startDate
                        if (endDate && newStart && dayjs(endDate).isBefore(dayjs(newStart), "day")) {
                          setEndDate("");
                        }
                        // FIX: clear scheduleDate if it falls outside new range
                        if (scheduleDate && newStart && dayjs(scheduleDate).isBefore(dayjs(newStart), "day")) {
                          setScheduleDate("");
                          setScheduleTime("");
                        }
                      }}
                      slots={{ openPickerIcon: CalendarTodayIcon }}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </div>
                <div className={`form-group half ${submitted && !endDate ? "error" : ""}`}>
                  <label>End Date *</label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      minDate={startDate ? dayjs(startDate) : undefined}
                      value={endDate ? dayjs(endDate) : null}
                      onChange={(v) => {
                        const newEnd = v ? (v as Dayjs).format("YYYY-MM-DD") : "";
                        setEndDate(newEnd);
                        // FIX: clear scheduleDate if it goes beyond new endDate
                        if (scheduleDate && newEnd && dayjs(scheduleDate).isAfter(dayjs(newEnd), "day")) {
                          setScheduleDate("");
                          setScheduleTime("");
                        }
                      }}
                      slots={{ openPickerIcon: CalendarTodayIcon }}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 2 — EMAIL ═══════════════ */}
          {step === 2 && campaign.type === "email" && (
            <div className="step-content">
              <h2>Email Setup</h2>
              <div className={`section-card ${submitted && !audience ? "error" : ""}`}>
                <h3>Select Audience</h3>
                <p className="section-subtitle">Choose which audience list to send this email to</p>
                <div className={`form-group ${submitted && !audience ? "error" : ""}`}>
                  <label>Audience List *</label>
                  <FormControl fullWidth>
                    <Select value={audience} onChange={(e) => setAudience(e.target.value)} displayEmpty>
                      <MenuItem value="">Select Audience List</MenuItem>
                      {Object.entries(CAMPAIGN_AUDIENCE).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
              <div className={`section-card ${submitted && (!subject || !emailBody) ? "error" : ""}`}>
                <div className="email-content-header">
                  <div>
                    <h3>Email Content</h3>
                    <p className="section-subtitle">Design your email with AI assistance</p>
                  </div>
                  <div className="email-actions">
                    <button className="outline-btn" onClick={() => setPreviewOpen(!previewOpen)}>
                      <img src={viewIcon} alt="View" width={20} height={20} />
                      Preview Email
                    </button>
                    <button className="light-btn" onClick={() => { setTemplateAttachments([]); setTemplateOpen(true); }}>
                      + Email Template
                    </button>
                  </div>
                </div>
                <div className="email-body-row">
                  <div className="email-left">
                    <div className={`form-group ${submitted && !subject ? "error" : ""}`}>
                      <label>Subject Line *</label>
                      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New Product Launch" />
                      <span className="ai-suggest">✨ AI Suggest</span>
                    </div>
                    <div className={`form-group ${submitted && !emailBody ? "error" : ""}`}>
                      <label>Email *</label>
                      <div
                        ref={editorRef}
                        className="email-editor"
                        contentEditable
                        onInput={(e: React.FormEvent<HTMLDivElement>) => setEmailBody(e.currentTarget.innerHTML)}
                      />
                      {templateAttachments.length > 0 && (
                        <div className="template-attachments">
                          <label>Attachments</label>
                          {templateAttachments.map((doc) => {
                            const url = doc.file || doc.file_url || doc.url || "";
                            const name = doc.name || doc.filename || (url ? url.split("/").pop() : "Attachment");
                            return (
                              <div key={doc.id ? String(doc.id) : url} className="attachment-item">
                                <a href={url} target="_blank" rel="noopener noreferrer">📎 {name}</a>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <span className="ai-suggest">✨ AI Suggest</span>
                    </div>
                  </div>
                  {previewOpen && (
                    <div className="email-preview">
                      <div className="preview-header">
                        <h3>Preview Email</h3>
                        <button onClick={() => setPreviewOpen(false)}>✕</button>
                      </div>
                      <div className="preview-body">
                        <p>To: <span className="chip">{audienceLabel}</span></p>
                        <div className="preview-divider"></div>
                        <p className="preview-subject"><span className="label">Subject:</span> {subject}</p>
                        <div className="preview-divider"></div>
                        <div className="preview-email-content" dangerouslySetInnerHTML={{ __html: emailBody }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 2 — SOCIAL ═══════════════ */}
          {step === 2 && campaign.type === "social" && (
            <div className="step-content">
              <Typography variant="h6" sx={{ mb: 3 }}>Content & Configuration</Typography>

              {/* Platform selection */}
              <div className={`section-card ${submitted && accounts.length === 0 ? "error" : ""}`}>
                <h3>Select Ad Accounts</h3>
                <p className="section-subtitle">Select your social media ad accounts</p>
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
                      <div className={`account-checkbox ${accounts.includes(acc.id) ? "checked" : ""}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaign mode */}
              <div className={`section-card ${submitted && !mode ? "error" : ""}`}>
                <h3>Campaign Mode</h3>
                <p className="section-subtitle">Choose a campaign mode to optimize your ad strategy</p>
                <div className="mode-row">
                  <div
                    className={`mode-card ${mode === "organic" ? "selected" : ""} ${isPaidLocked ? "disabled" : ""}`}
                    onClick={() => {
                      if (isPaidLocked) return;
                      setMode("organic");
                    }}
                    style={isPaidLocked ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                    title={isPaidLocked ? "Paid campaigns cannot be changed back to organic." : undefined}
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
                  <div className={`mode-card ${mode === "paid" ? "selected" : ""}`} onClick={() => setMode("paid")}>
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
                {isPaidLocked && (
                  <p className="section-subtitle" style={{ color: "#b45309", marginTop: 10 }}>
                    This campaign is already paid and cannot be changed back to organic.
                  </p>
                )}
              </div>

              {/* Google Ads Keywords — FIX: NO image URL field (removed to match SocialCampaignModal) */}
              {accounts.includes("google_ads") && mode === "paid" && (
                <div className="section-card">
                  <h3>Google Ads Keywords</h3>
                  <p className="section-subtitle">Enter keywords for your Google Search campaign (comma-separated)</p>
                  <div className="form-group">
                    <label>Keywords *</label>
                    <input
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="e.g. IVF, fertility clinic, IVF consultation, egg freezing"
                      style={{ width: "100%" }}
                    />
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      Separate keywords with commas.{" "}
                      {!keywordsInput.trim() && (
                        <span style={{ color: "#d97706" }}>
                          If left empty, fallback keywords will be auto-generated from the campaign name.
                        </span>
                      )}
                    </p>
                    {keywordsInput.trim() && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {keywordsInput.split(",").map((k) => k.trim()).filter(Boolean).map((kw, i) => (
                          <Chip key={i} label={kw} size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Google Ads organic info */}
              {accounts.includes("google_ads") && mode === "organic" && (
                <div className="section-card" style={{ border: "1px solid #d1fae5", backgroundColor: "#f0fdf4", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <img src={googleAdsIcon} alt="Google Ads" style={{ width: 18, height: 18 }} />
                    <h3 style={{ margin: 0, color: "#15803d" }}>Google Ads — Organic Post</h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>
                    Your campaign content will be saved for Google Ads. No paid ad will be triggered — no money will be spent.
                    Switch to <strong>Paid Advertising</strong> mode to run a real Google Ad.
                  </p>
                </div>
              )}

              {/* FIX: Meta Ad Targeting — pre-filled from saved facebook/instagram platform_data */}
              {(accounts.includes("facebook") || accounts.includes("instagram")) && (
                <div className="section-card" style={{ border: "1px solid #1877f2", borderRadius: 8 }}>
                  <h3 style={{ color: "#1877f2" }}>Meta Ad Targeting</h3>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Country</label>
                      <FormControl fullWidth variant="outlined" size="small">
                        <Select
                          value={metaCountry}
                          onChange={(e) => { setMetaCountry(e.target.value); setMetaState(""); }}
                          displayEmpty
                        >
                          <MenuItem value="">Select Country</MenuItem>
                          {LINKEDIN_COUNTRIES.map((c) => (
                            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
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
                          {(LINKEDIN_COUNTRIES.find((c) => c.value === metaCountry)?.states ?? []).map((s) => (
                            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                  </div>
                </div>
              )}

              {/* LinkedIn Ad Targeting — shown only when linkedin selected */}
              {accounts.includes("linkedin") && (
                <div className="section-card" style={{ border: "1px solid #0077b5", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <img src={linkedinIcon} alt="LinkedIn" style={{ width: 18, height: 18 }} />
                    <h3 style={{ margin: 0, color: "#0077b5" }}>LinkedIn Ad Targeting</h3>
                  </div>
                  <p className="section-subtitle">Configure targeting and bidding for your LinkedIn campaign</p>

                  <div className="form-row" style={{ marginTop: 12 }}>
                    <div className="form-group half">
                      <label>Country</label>
                      <FormControl fullWidth variant="outlined" size="small">
                        <Select
                          value={linkedInCountry}
                          onChange={(e) => { setLinkedInCountry(e.target.value); setLinkedInState(""); }}
                          displayEmpty
                        >
                          <MenuItem value="">Select Country</MenuItem>
                          {LINKEDIN_COUNTRIES.map((c) => (
                            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                    <div className="form-group half">
                      <label>
                        State / Region
                        <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>(optional)</span>
                      </label>
                      {selectedCountryStates.length > 0 ? (
                        <FormControl fullWidth variant="outlined" size="small">
                          <Select value={linkedInState} onChange={(e) => setLinkedInState(e.target.value)} displayEmpty>
                            <MenuItem value="">All States</MenuItem>
                            {selectedCountryStates.map((s) => (
                              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <input
                          value={linkedInState}
                          onChange={(e) => setLinkedInState(e.target.value)}
                          placeholder="e.g. Mumbai, Maharashtra, India"
                          style={{ width: "100%", height: 40, padding: "0 12px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 14 }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 8 }}>
                    <label>
                      Custom Location
                      <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>(overrides country/state if filled)</span>
                    </label>
                    <input
                      value={linkedInCustomLocation}
                      onChange={(e) => setLinkedInCustomLocation(e.target.value)}
                      placeholder="e.g. Mumbai, Maharashtra, India"
                      style={{ width: "100%" }}
                    />
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      Location that will be sent:{" "}
                      <strong style={{ color: "#1d4ed8" }}>{getLinkedInLocation() || "—"}</strong>
                    </p>
                  </div>

                  <div className="form-row" style={{ marginTop: 8 }}>
                    <div className="form-group half">
                      <label>Bid Strategy</label>
                      <FormControl fullWidth variant="outlined" size="small">
                        <Select value={linkedInBidStrategy} onChange={(e) => setLinkedInBidStrategy(e.target.value)}>
                          {LINKEDIN_BID_STRATEGIES.map((s) => (
                            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
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
                          <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>(not used for auto)</span>
                        )}
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden", opacity: linkedInBidStrategy === "MAXIMUM_DELIVERY" ? 0.5 : 1 }}>
                        <button
                          type="button"
                          disabled={linkedInBidStrategy === "MAXIMUM_DELIVERY" || linkedInBidAmount <= 0}
                          onClick={() => setLinkedInBidAmount((prev) => Math.max(0, prev - 1))}
                          style={{ width: 36, height: 40, border: "none", borderRight: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 18, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", opacity: linkedInBidAmount <= 0 ? 0.4 : 1 }}
                        >−</button>
                        <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center", gap: 2 }}>
                          <span style={{ color: "#6b7280", fontSize: 14 }}>$</span>
                          <span style={{ fontSize: 15, fontWeight: 600, color: "#111827", minWidth: 24, textAlign: "center" }}>
                            {linkedInBidAmount}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={linkedInBidStrategy === "MAXIMUM_DELIVERY"}
                          onClick={() => setLinkedInBidAmount((prev) => prev + 1)}
                          style={{ width: 36, height: 40, border: "none", borderLeft: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 18, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >+</button>
                      </div>
                      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                        Enter a whole number amount (e.g. 1, 2, 5, 10…)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Content — SocialContentBox */}
              {mode && (
                <div className="section-card">
                  <h2>Campaign Content</h2>
                  <p className="section-subtitle">Create your post content with AI assistance</p>

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

                  {PLATFORM_LIST.filter((p) => accounts.includes(p.id)).map((p) => (
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ STEP 3 — EMAIL ═══════════════ */}
          {step === 3 && campaign.type === "email" && (
            <div className="step-content">
              <h2>Schedule Email</h2>
              <div className="schedule-card">
                <div className="schedule-header">
                  <div className="schedule-title">
                    <h3>Schedule</h3>
                    <p>Select date and time to send the email</p>
                  </div>
                  <button className="ai-opt-btn">✨ AI-Optimization Timing</button>
                </div>
                <div className="schedule-row">
                  <div className={`schedule-field ${submitted && (!scheduleRange[0] || !scheduleRange[1]) ? "error" : ""}`}>
                    <label>Select Date</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <DatePicker
                          label="From"
                          value={scheduleRange[0]}
                          minDate={startDate ? dayjs(startDate) : dayjs()}
                          maxDate={scheduleRange[1] ?? (endDate ? dayjs(endDate) : undefined)}
                          onChange={(v) => setScheduleRange([v ? dayjs(v) : null, scheduleRange[1]])}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                        <DatePicker
                          label="To"
                          value={scheduleRange[1]}
                          minDate={scheduleRange[0] ?? (startDate ? dayjs(startDate) : dayjs())}
                          maxDate={endDate ? dayjs(endDate) : undefined}
                          onChange={(v) => setScheduleRange([scheduleRange[0], v ? dayjs(v) : null])}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </div>
                    </LocalizationProvider>
                  </div>
                  <div className={`schedule-field ${submitted && !scheduleTime ? "error" : ""}`}>
                    <label>Enter Time</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      {/* FIX: use real today's date for minTime comparison */}
                      <TimePicker
                        format="hh:mm A"
                        value={
                          scheduleTime
                            ? dayjs(`${scheduleRange[0]?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD")} ${scheduleTime}`)
                            : null
                        }
                        onChange={(v) => { if (v) setScheduleTime((v as Dayjs).format("HH:mm")); }}
                        ampm
                        minTime={
                          scheduleRange[0] && scheduleRange[0].isSame(dayjs(), "day")
                            ? dayjs()
                            : undefined
                        }
                      />
                    </LocalizationProvider>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 3 — SOCIAL ═══════════════ */}
          {step === 3 && campaign.type === "social" && (
            <div className="step-content">
              <Typography variant="h6" sx={{ mb: 3 }}>Schedule Campaign</Typography>
              <div className="section-card">
                <div className="schedule-header">
                  <div>
                    <h3>{mode === "paid" ? "Schedule & Budget Allocation" : "Schedule"}</h3>
                    <p className="section-subtitle">
                      {mode === "paid" ? "Establish your schedule and budget for every platform." : "Select a date and time for the campaign."}
                    </p>
                    {/* FIX: show allowed schedule range */}
                    {startDate && endDate && (
                      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                        Schedule must be within campaign duration:{" "}
                        <strong style={{ color: "#1d4ed8" }}>
                          {dayjs(startDate).format("DD/MM/YYYY")} – {dayjs(endDate).format("DD/MM/YYYY")}
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
                      {/* ✅ FIX error 3: shouldDisableDate now uses Date | Dayjs param */}
                      <DatePicker
                        format="DD/MM/YYYY"
                        minDate={scheduleDateMin}
                        maxDate={scheduleDateMax}
                        shouldDisableDate={isScheduleDateDisabled}
                        value={scheduleDate ? dayjs(scheduleDate) : null}
                        onChange={(v) => {
                          setScheduleDate(v ? (v as Dayjs).format("YYYY-MM-DD") : "");
                          setScheduleTime(""); // reset time on date change
                        }}
                        slots={{ openPickerIcon: CalendarTodayIcon }}
                      />
                    </LocalizationProvider>
                  </div>
                  <div className="form-group half">
                    <label>Enter Time</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      {/* FIX: disabled until date picked; minTime uses today's real date */}
                      <TimePicker
                        format="hh:mm A"
                        disabled={!scheduleDate}
                        minTime={getScheduleMinTime()}
                        value={
                          scheduleTime
                            ? dayjs(`${scheduleDate || dayjs().format("YYYY-MM-DD")} ${scheduleTime}`)
                            : null
                        }
                        onChange={(v) => { if (v) setScheduleTime((v as Dayjs).format("HH:mm")); }}
                        ampm
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            helperText: !scheduleDate ? "Select a date first" : undefined,
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
                      {/* FIX: show minimum budget hint */}
                      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                        Minimum budget per platform:{" "}
                        <strong style={{ color: "#d97706" }}>${PLATFORM_MIN_BUDGET + 1}</strong>{" "}
                        (must be greater than ${PLATFORM_MIN_BUDGET})
                      </p>
                      <div className="budget-row">
                        {PLATFORM_LIST.filter((p) => accounts.includes(p.id)).map((p) => {
                          const budgetErr = getBudgetError(p.id, budgets[p.id] ?? 0);
                          return (
                            <div key={p.id} className="budget-card">
                              <div className="budget-title">
                                <img
                                  src={
                                    p.id === "instagram" ? instagramIcon
                                    : p.id === "facebook" ? facebookIcon
                                    : p.id === "linkedin" ? linkedinIcon
                                    : googleAdsIcon
                                  }
                                  alt={p.label}
                                  style={{ width: "22px", height: "22px", objectFit: "contain" }}
                                />
                                <span>{p.label} (Estimate CPC : ${p.cpc})</span>
                              </div>
                              <div className="budget-input-wrapper">
                                <label htmlFor={`budget-${p.id}`}>Enter Amount in USD ($)</label>
                                <input
                                  id={`budget-${p.id}`}
                                  type="number"
                                  min={PLATFORM_MIN_BUDGET + 1}
                                  step="1"
                                  value={budgets[p.id] ?? 0}
                                  onChange={(e) => setBudget(p.id, Number(e.target.value))}
                                  className="budget-input"
                                  aria-label={`Budget for ${p.label} in US Dollars`}
                                  style={{ borderColor: budgetErr ? "#ef4444" : undefined }}
                                />
                                {/* FIX: inline error per platform */}
                                {budgetErr && (
                                  <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{budgetErr}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="total-budget">
                        <div>
                          <h4>
                            Total Budget: $
                            {PLATFORM_LIST.filter((p) => accounts.includes(p.id)).reduce(
                              (sum, p) => sum + (budgets[p.id] ?? 0),
                              0
                            )}
                          </h4>
                          <p>Ad spend is charged directly by each connected social media platform. We don't handle payments.</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            {step > 1 && (
              <button className="cancel-btn" onClick={() => { setStep(step - 1); setSubmitted(false); }}>
                Back
              </button>
            )}
            {step === 3 ? (
              <button className="next-btn" onClick={handleUpdate}>Update Campaign</button>
            ) : (
              <button className="next-btn" onClick={handleNext}>Next</button>
            )}
          </div>
        </Box>
      </Modal>

      <EmailTemplateModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSelect={(template: { subject: string; body: string; id: string }) => {
          setSubject(template.subject);
          setEmailBody(template.body);
          setSelectedTemplateId(template.id);
          if (editorRef.current) editorRef.current.innerHTML = template.body;
          if (template.id) fetchTemplateDocuments(template.id);
        }}
      />

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
    </>
  );
}