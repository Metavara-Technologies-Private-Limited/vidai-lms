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

// ─── Full world countries + states/provinces ─────────────────────
const LINKEDIN_COUNTRIES: {
  value: string;
  label: string;
  states?: { value: string; label: string }[];
}[] = [
  // ── A ──
  {
    value: "Afghanistan",
    label: "Afghanistan",
    states: [
      { value: "Badakhshan", label: "Badakhshan" },
      { value: "Badghis", label: "Badghis" },
      { value: "Baghlan", label: "Baghlan" },
      { value: "Balkh", label: "Balkh" },
      { value: "Bamyan", label: "Bamyan" },
      { value: "Daykundi", label: "Daykundi" },
      { value: "Farah", label: "Farah" },
      { value: "Faryab", label: "Faryab" },
      { value: "Ghazni", label: "Ghazni" },
      { value: "Ghor", label: "Ghor" },
      { value: "Helmand", label: "Helmand" },
      { value: "Herat", label: "Herat" },
      { value: "Jowzjan", label: "Jowzjan" },
      { value: "Kabul", label: "Kabul" },
      { value: "Kandahar", label: "Kandahar" },
      { value: "Kapisa", label: "Kapisa" },
      { value: "Khost", label: "Khost" },
      { value: "Kunar", label: "Kunar" },
      { value: "Kunduz", label: "Kunduz" },
      { value: "Laghman", label: "Laghman" },
      { value: "Logar", label: "Logar" },
      { value: "Nangarhar", label: "Nangarhar" },
      { value: "Nimroz", label: "Nimroz" },
      { value: "Nuristan", label: "Nuristan" },
      { value: "Paktia", label: "Paktia" },
      { value: "Paktika", label: "Paktika" },
      { value: "Panjshir", label: "Panjshir" },
      { value: "Parwan", label: "Parwan" },
      { value: "Samangan", label: "Samangan" },
      { value: "Sar-e Pol", label: "Sar-e Pol" },
      { value: "Takhar", label: "Takhar" },
      { value: "Urozgan", label: "Urozgan" },
      { value: "Wardak", label: "Wardak" },
      { value: "Zabul", label: "Zabul" },
    ],
  },
  { value: "Albania", label: "Albania", states: [] },
  { value: "Algeria", label: "Algeria", states: [] },
  { value: "Andorra", label: "Andorra", states: [] },
  { value: "Angola", label: "Angola", states: [] },
  { value: "Argentina", label: "Argentina", states: [
    { value: "Buenos Aires", label: "Buenos Aires" },
    { value: "Catamarca", label: "Catamarca" },
    { value: "Chaco", label: "Chaco" },
    { value: "Chubut", label: "Chubut" },
    { value: "Córdoba", label: "Córdoba" },
    { value: "Corrientes", label: "Corrientes" },
    { value: "Entre Ríos", label: "Entre Ríos" },
    { value: "Formosa", label: "Formosa" },
    { value: "Jujuy", label: "Jujuy" },
    { value: "La Pampa", label: "La Pampa" },
    { value: "La Rioja", label: "La Rioja" },
    { value: "Mendoza", label: "Mendoza" },
    { value: "Misiones", label: "Misiones" },
    { value: "Neuquén", label: "Neuquén" },
    { value: "Río Negro", label: "Río Negro" },
    { value: "Salta", label: "Salta" },
    { value: "San Juan", label: "San Juan" },
    { value: "San Luis", label: "San Luis" },
    { value: "Santa Cruz", label: "Santa Cruz" },
    { value: "Santa Fe", label: "Santa Fe" },
    { value: "Santiago del Estero", label: "Santiago del Estero" },
    { value: "Tierra del Fuego", label: "Tierra del Fuego" },
    { value: "Tucumán", label: "Tucumán" },
  ]},
  { value: "Armenia", label: "Armenia", states: [] },
  {
    value: "Australia",
    label: "Australia",
    states: [
      { value: "Australian Capital Territory", label: "Australian Capital Territory" },
      { value: "New South Wales", label: "New South Wales" },
      { value: "Northern Territory", label: "Northern Territory" },
      { value: "Queensland", label: "Queensland" },
      { value: "South Australia", label: "South Australia" },
      { value: "Tasmania", label: "Tasmania" },
      { value: "Victoria", label: "Victoria" },
      { value: "Western Australia", label: "Western Australia" },
    ],
  },
  { value: "Austria", label: "Austria", states: [
    { value: "Burgenland", label: "Burgenland" },
    { value: "Carinthia", label: "Carinthia" },
    { value: "Lower Austria", label: "Lower Austria" },
    { value: "Salzburg", label: "Salzburg" },
    { value: "Styria", label: "Styria" },
    { value: "Tyrol", label: "Tyrol" },
    { value: "Upper Austria", label: "Upper Austria" },
    { value: "Vienna", label: "Vienna" },
    { value: "Vorarlberg", label: "Vorarlberg" },
  ]},
  { value: "Azerbaijan", label: "Azerbaijan", states: [] },
  // ── B ──
  { value: "Bahrain", label: "Bahrain", states: [] },
  { value: "Bangladesh", label: "Bangladesh", states: [
    { value: "Barisal", label: "Barisal" },
    { value: "Chittagong", label: "Chittagong" },
    { value: "Dhaka", label: "Dhaka" },
    { value: "Khulna", label: "Khulna" },
    { value: "Mymensingh", label: "Mymensingh" },
    { value: "Rajshahi", label: "Rajshahi" },
    { value: "Rangpur", label: "Rangpur" },
    { value: "Sylhet", label: "Sylhet" },
  ]},
  { value: "Belarus", label: "Belarus", states: [] },
  { value: "Belgium", label: "Belgium", states: [
    { value: "Brussels", label: "Brussels" },
    { value: "Flanders", label: "Flanders" },
    { value: "Wallonia", label: "Wallonia" },
  ]},
  { value: "Bolivia", label: "Bolivia", states: [] },
  { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina", states: [] },
  { value: "Botswana", label: "Botswana", states: [] },
  { value: "Brazil", label: "Brazil", states: [
    { value: "Acre", label: "Acre" },
    { value: "Alagoas", label: "Alagoas" },
    { value: "Amapá", label: "Amapá" },
    { value: "Amazonas", label: "Amazonas" },
    { value: "Bahia", label: "Bahia" },
    { value: "Ceará", label: "Ceará" },
    { value: "Espírito Santo", label: "Espírito Santo" },
    { value: "Goiás", label: "Goiás" },
    { value: "Maranhão", label: "Maranhão" },
    { value: "Mato Grosso", label: "Mato Grosso" },
    { value: "Mato Grosso do Sul", label: "Mato Grosso do Sul" },
    { value: "Minas Gerais", label: "Minas Gerais" },
    { value: "Pará", label: "Pará" },
    { value: "Paraíba", label: "Paraíba" },
    { value: "Paraná", label: "Paraná" },
    { value: "Pernambuco", label: "Pernambuco" },
    { value: "Piauí", label: "Piauí" },
    { value: "Rio de Janeiro", label: "Rio de Janeiro" },
    { value: "Rio Grande do Norte", label: "Rio Grande do Norte" },
    { value: "Rio Grande do Sul", label: "Rio Grande do Sul" },
    { value: "Rondônia", label: "Rondônia" },
    { value: "Roraima", label: "Roraima" },
    { value: "Santa Catarina", label: "Santa Catarina" },
    { value: "São Paulo", label: "São Paulo" },
    { value: "Sergipe", label: "Sergipe" },
    { value: "Tocantins", label: "Tocantins" },
  ]},
  { value: "Bulgaria", label: "Bulgaria", states: [] },
  // ── C ──
  { value: "Cambodia", label: "Cambodia", states: [] },
  { value: "Cameroon", label: "Cameroon", states: [] },
  {
    value: "Canada",
    label: "Canada",
    states: [
      { value: "Alberta", label: "Alberta" },
      { value: "British Columbia", label: "British Columbia" },
      { value: "Manitoba", label: "Manitoba" },
      { value: "New Brunswick", label: "New Brunswick" },
      { value: "Newfoundland and Labrador", label: "Newfoundland and Labrador" },
      { value: "Northwest Territories", label: "Northwest Territories" },
      { value: "Nova Scotia", label: "Nova Scotia" },
      { value: "Nunavut", label: "Nunavut" },
      { value: "Ontario", label: "Ontario" },
      { value: "Prince Edward Island", label: "Prince Edward Island" },
      { value: "Quebec", label: "Quebec" },
      { value: "Saskatchewan", label: "Saskatchewan" },
      { value: "Yukon", label: "Yukon" },
    ],
  },
  { value: "Chile", label: "Chile", states: [] },
  { value: "China", label: "China", states: [
    { value: "Anhui", label: "Anhui" },
    { value: "Beijing", label: "Beijing" },
    { value: "Chongqing", label: "Chongqing" },
    { value: "Fujian", label: "Fujian" },
    { value: "Gansu", label: "Gansu" },
    { value: "Guangdong", label: "Guangdong" },
    { value: "Guangxi", label: "Guangxi" },
    { value: "Guizhou", label: "Guizhou" },
    { value: "Hainan", label: "Hainan" },
    { value: "Hebei", label: "Hebei" },
    { value: "Heilongjiang", label: "Heilongjiang" },
    { value: "Henan", label: "Henan" },
    { value: "Hong Kong", label: "Hong Kong" },
    { value: "Hubei", label: "Hubei" },
    { value: "Hunan", label: "Hunan" },
    { value: "Inner Mongolia", label: "Inner Mongolia" },
    { value: "Jiangsu", label: "Jiangsu" },
    { value: "Jiangxi", label: "Jiangxi" },
    { value: "Jilin", label: "Jilin" },
    { value: "Liaoning", label: "Liaoning" },
    { value: "Macau", label: "Macau" },
    { value: "Ningxia", label: "Ningxia" },
    { value: "Qinghai", label: "Qinghai" },
    { value: "Shaanxi", label: "Shaanxi" },
    { value: "Shandong", label: "Shandong" },
    { value: "Shanghai", label: "Shanghai" },
    { value: "Shanxi", label: "Shanxi" },
    { value: "Sichuan", label: "Sichuan" },
    { value: "Tianjin", label: "Tianjin" },
    { value: "Tibet", label: "Tibet" },
    { value: "Xinjiang", label: "Xinjiang" },
    { value: "Yunnan", label: "Yunnan" },
    { value: "Zhejiang", label: "Zhejiang" },
  ]},
  { value: "Colombia", label: "Colombia", states: [] },
  { value: "Costa Rica", label: "Costa Rica", states: [] },
  { value: "Croatia", label: "Croatia", states: [] },
  { value: "Cuba", label: "Cuba", states: [] },
  { value: "Cyprus", label: "Cyprus", states: [] },
  { value: "Czech Republic", label: "Czech Republic", states: [] },
  // ── D ──
  { value: "Denmark", label: "Denmark", states: [] },
  { value: "Dominican Republic", label: "Dominican Republic", states: [] },
  // ── E ──
  { value: "Ecuador", label: "Ecuador", states: [] },
  { value: "Egypt", label: "Egypt", states: [
    { value: "Alexandria", label: "Alexandria" },
    { value: "Aswan", label: "Aswan" },
    { value: "Asyut", label: "Asyut" },
    { value: "Beheira", label: "Beheira" },
    { value: "Cairo", label: "Cairo" },
    { value: "Dakahlia", label: "Dakahlia" },
    { value: "Damietta", label: "Damietta" },
    { value: "Faiyum", label: "Faiyum" },
    { value: "Gharbia", label: "Gharbia" },
    { value: "Giza", label: "Giza" },
    { value: "Ismailia", label: "Ismailia" },
    { value: "Kafr el-Sheikh", label: "Kafr el-Sheikh" },
    { value: "Luxor", label: "Luxor" },
    { value: "Matruh", label: "Matruh" },
    { value: "Minya", label: "Minya" },
    { value: "Monufia", label: "Monufia" },
    { value: "North Sinai", label: "North Sinai" },
    { value: "Port Said", label: "Port Said" },
    { value: "Qalyubia", label: "Qalyubia" },
    { value: "Qena", label: "Qena" },
    { value: "Red Sea", label: "Red Sea" },
    { value: "Sharqia", label: "Sharqia" },
    { value: "Sohag", label: "Sohag" },
    { value: "South Sinai", label: "South Sinai" },
    { value: "Suez", label: "Suez" },
  ]},
  { value: "El Salvador", label: "El Salvador", states: [] },
  { value: "Ethiopia", label: "Ethiopia", states: [] },
  // ── F ──
  { value: "Finland", label: "Finland", states: [] },
  { value: "France", label: "France", states: [
    { value: "Auvergne-Rhône-Alpes", label: "Auvergne-Rhône-Alpes" },
    { value: "Bourgogne-Franche-Comté", label: "Bourgogne-Franche-Comté" },
    { value: "Bretagne", label: "Bretagne" },
    { value: "Centre-Val de Loire", label: "Centre-Val de Loire" },
    { value: "Corse", label: "Corse" },
    { value: "Grand Est", label: "Grand Est" },
    { value: "Hauts-de-France", label: "Hauts-de-France" },
    { value: "Île-de-France", label: "Île-de-France" },
    { value: "Normandie", label: "Normandie" },
    { value: "Nouvelle-Aquitaine", label: "Nouvelle-Aquitaine" },
    { value: "Occitanie", label: "Occitanie" },
    { value: "Pays de la Loire", label: "Pays de la Loire" },
    { value: "Provence-Alpes-Côte d'Azur", label: "Provence-Alpes-Côte d'Azur" },
  ]},
  // ── G ──
  { value: "Georgia", label: "Georgia", states: [] },
  {
    value: "Germany",
    label: "Germany",
    states: [
      { value: "Baden-Württemberg", label: "Baden-Württemberg" },
      { value: "Bavaria", label: "Bavaria" },
      { value: "Berlin", label: "Berlin" },
      { value: "Brandenburg", label: "Brandenburg" },
      { value: "Bremen", label: "Bremen" },
      { value: "Hamburg", label: "Hamburg" },
      { value: "Hesse", label: "Hesse" },
      { value: "Lower Saxony", label: "Lower Saxony" },
      { value: "Mecklenburg-Vorpommern", label: "Mecklenburg-Vorpommern" },
      { value: "North Rhine-Westphalia", label: "North Rhine-Westphalia" },
      { value: "Rhineland-Palatinate", label: "Rhineland-Palatinate" },
      { value: "Saarland", label: "Saarland" },
      { value: "Saxony", label: "Saxony" },
      { value: "Saxony-Anhalt", label: "Saxony-Anhalt" },
      { value: "Schleswig-Holstein", label: "Schleswig-Holstein" },
      { value: "Thuringia", label: "Thuringia" },
    ],
  },
  { value: "Ghana", label: "Ghana", states: [] },
  { value: "Greece", label: "Greece", states: [] },
  { value: "Guatemala", label: "Guatemala", states: [] },
  // ── H ──
  { value: "Honduras", label: "Honduras", states: [] },
  { value: "Hungary", label: "Hungary", states: [] },
  // ── I ──
  { value: "Iceland", label: "Iceland", states: [] },
  {
    value: "India",
    label: "India",
    states: [
      { value: "Andaman and Nicobar Islands", label: "Andaman and Nicobar Islands" },
      { value: "Andhra Pradesh", label: "Andhra Pradesh" },
      { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
      { value: "Assam", label: "Assam" },
      { value: "Bihar", label: "Bihar" },
      { value: "Chandigarh", label: "Chandigarh" },
      { value: "Chhattisgarh", label: "Chhattisgarh" },
      { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra and Nagar Haveli and Daman and Diu" },
      { value: "Delhi", label: "Delhi" },
      { value: "Goa", label: "Goa" },
      { value: "Gujarat", label: "Gujarat" },
      { value: "Haryana", label: "Haryana" },
      { value: "Himachal Pradesh", label: "Himachal Pradesh" },
      { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
      { value: "Jharkhand", label: "Jharkhand" },
      { value: "Karnataka", label: "Karnataka" },
      { value: "Kerala", label: "Kerala" },
      { value: "Ladakh", label: "Ladakh" },
      { value: "Lakshadweep", label: "Lakshadweep" },
      { value: "Madhya Pradesh", label: "Madhya Pradesh" },
      { value: "Maharashtra", label: "Maharashtra" },
      { value: "Manipur", label: "Manipur" },
      { value: "Meghalaya", label: "Meghalaya" },
      { value: "Mizoram", label: "Mizoram" },
      { value: "Nagaland", label: "Nagaland" },
      { value: "Odisha", label: "Odisha" },
      { value: "Puducherry", label: "Puducherry" },
      { value: "Punjab", label: "Punjab" },
      { value: "Rajasthan", label: "Rajasthan" },
      { value: "Sikkim", label: "Sikkim" },
      { value: "Tamil Nadu", label: "Tamil Nadu" },
      { value: "Telangana", label: "Telangana" },
      { value: "Tripura", label: "Tripura" },
      { value: "Uttar Pradesh", label: "Uttar Pradesh" },
      { value: "Uttarakhand", label: "Uttarakhand" },
      { value: "West Bengal", label: "West Bengal" },
    ],
  },
  { value: "Indonesia", label: "Indonesia", states: [
    { value: "Aceh", label: "Aceh" },
    { value: "Bali", label: "Bali" },
    { value: "Bangka Belitung", label: "Bangka Belitung" },
    { value: "Banten", label: "Banten" },
    { value: "Bengkulu", label: "Bengkulu" },
    { value: "Central Java", label: "Central Java" },
    { value: "Central Kalimantan", label: "Central Kalimantan" },
    { value: "Central Sulawesi", label: "Central Sulawesi" },
    { value: "East Java", label: "East Java" },
    { value: "East Kalimantan", label: "East Kalimantan" },
    { value: "East Nusa Tenggara", label: "East Nusa Tenggara" },
    { value: "Gorontalo", label: "Gorontalo" },
    { value: "Jakarta", label: "Jakarta" },
    { value: "Jambi", label: "Jambi" },
    { value: "Lampung", label: "Lampung" },
    { value: "Maluku", label: "Maluku" },
    { value: "North Kalimantan", label: "North Kalimantan" },
    { value: "North Maluku", label: "North Maluku" },
    { value: "North Sulawesi", label: "North Sulawesi" },
    { value: "North Sumatra", label: "North Sumatra" },
    { value: "Papua", label: "Papua" },
    { value: "Riau", label: "Riau" },
    { value: "Riau Islands", label: "Riau Islands" },
    { value: "South Kalimantan", label: "South Kalimantan" },
    { value: "South Sulawesi", label: "South Sulawesi" },
    { value: "South Sumatra", label: "South Sumatra" },
    { value: "Southeast Sulawesi", label: "Southeast Sulawesi" },
    { value: "West Java", label: "West Java" },
    { value: "West Kalimantan", label: "West Kalimantan" },
    { value: "West Nusa Tenggara", label: "West Nusa Tenggara" },
    { value: "West Papua", label: "West Papua" },
    { value: "West Sulawesi", label: "West Sulawesi" },
    { value: "West Sumatra", label: "West Sumatra" },
    { value: "Yogyakarta", label: "Yogyakarta" },
  ]},
  { value: "Iran", label: "Iran", states: [] },
  { value: "Iraq", label: "Iraq", states: [] },
  { value: "Ireland", label: "Ireland", states: [] },
  { value: "Israel", label: "Israel", states: [] },
  { value: "Italy", label: "Italy", states: [
    { value: "Abruzzo", label: "Abruzzo" },
    { value: "Aosta Valley", label: "Aosta Valley" },
    { value: "Apulia", label: "Apulia" },
    { value: "Basilicata", label: "Basilicata" },
    { value: "Calabria", label: "Calabria" },
    { value: "Campania", label: "Campania" },
    { value: "Emilia-Romagna", label: "Emilia-Romagna" },
    { value: "Friuli-Venezia Giulia", label: "Friuli-Venezia Giulia" },
    { value: "Lazio", label: "Lazio" },
    { value: "Liguria", label: "Liguria" },
    { value: "Lombardy", label: "Lombardy" },
    { value: "Marche", label: "Marche" },
    { value: "Molise", label: "Molise" },
    { value: "Piedmont", label: "Piedmont" },
    { value: "Sardinia", label: "Sardinia" },
    { value: "Sicily", label: "Sicily" },
    { value: "Trentino-South Tyrol", label: "Trentino-South Tyrol" },
    { value: "Tuscany", label: "Tuscany" },
    { value: "Umbria", label: "Umbria" },
    { value: "Veneto", label: "Veneto" },
  ]},
  // ── J ──
  { value: "Jamaica", label: "Jamaica", states: [] },
  { value: "Japan", label: "Japan", states: [
    { value: "Aichi", label: "Aichi" },
    { value: "Akita", label: "Akita" },
    { value: "Aomori", label: "Aomori" },
    { value: "Chiba", label: "Chiba" },
    { value: "Ehime", label: "Ehime" },
    { value: "Fukui", label: "Fukui" },
    { value: "Fukuoka", label: "Fukuoka" },
    { value: "Fukushima", label: "Fukushima" },
    { value: "Gifu", label: "Gifu" },
    { value: "Gunma", label: "Gunma" },
    { value: "Hiroshima", label: "Hiroshima" },
    { value: "Hokkaido", label: "Hokkaido" },
    { value: "Hyogo", label: "Hyogo" },
    { value: "Ibaraki", label: "Ibaraki" },
    { value: "Ishikawa", label: "Ishikawa" },
    { value: "Iwate", label: "Iwate" },
    { value: "Kagawa", label: "Kagawa" },
    { value: "Kagoshima", label: "Kagoshima" },
    { value: "Kanagawa", label: "Kanagawa" },
    { value: "Kochi", label: "Kochi" },
    { value: "Kumamoto", label: "Kumamoto" },
    { value: "Kyoto", label: "Kyoto" },
    { value: "Mie", label: "Mie" },
    { value: "Miyagi", label: "Miyagi" },
    { value: "Miyazaki", label: "Miyazaki" },
    { value: "Nagano", label: "Nagano" },
    { value: "Nagasaki", label: "Nagasaki" },
    { value: "Nara", label: "Nara" },
    { value: "Niigata", label: "Niigata" },
    { value: "Oita", label: "Oita" },
    { value: "Okayama", label: "Okayama" },
    { value: "Okinawa", label: "Okinawa" },
    { value: "Osaka", label: "Osaka" },
    { value: "Saga", label: "Saga" },
    { value: "Saitama", label: "Saitama" },
    { value: "Shiga", label: "Shiga" },
    { value: "Shimane", label: "Shimane" },
    { value: "Shizuoka", label: "Shizuoka" },
    { value: "Tochigi", label: "Tochigi" },
    { value: "Tokushima", label: "Tokushima" },
    { value: "Tokyo", label: "Tokyo" },
    { value: "Tottori", label: "Tottori" },
    { value: "Toyama", label: "Toyama" },
    { value: "Wakayama", label: "Wakayama" },
    { value: "Yamagata", label: "Yamagata" },
    { value: "Yamaguchi", label: "Yamaguchi" },
    { value: "Yamanashi", label: "Yamanashi" },
  ]},
  { value: "Jordan", label: "Jordan", states: [] },
  // ── K ──
  { value: "Kazakhstan", label: "Kazakhstan", states: [] },
  { value: "Kenya", label: "Kenya", states: [] },
  { value: "Kuwait", label: "Kuwait", states: [] },
  // ── L ──
  { value: "Lebanon", label: "Lebanon", states: [] },
  { value: "Libya", label: "Libya", states: [] },
  { value: "Lithuania", label: "Lithuania", states: [] },
  { value: "Luxembourg", label: "Luxembourg", states: [] },
  // ── M ──
  { value: "Malaysia", label: "Malaysia", states: [
    { value: "Johor", label: "Johor" },
    { value: "Kedah", label: "Kedah" },
    { value: "Kelantan", label: "Kelantan" },
    { value: "Kuala Lumpur", label: "Kuala Lumpur" },
    { value: "Labuan", label: "Labuan" },
    { value: "Melaka", label: "Melaka" },
    { value: "Negeri Sembilan", label: "Negeri Sembilan" },
    { value: "Pahang", label: "Pahang" },
    { value: "Penang", label: "Penang" },
    { value: "Perak", label: "Perak" },
    { value: "Perlis", label: "Perlis" },
    { value: "Putrajaya", label: "Putrajaya" },
    { value: "Sabah", label: "Sabah" },
    { value: "Sarawak", label: "Sarawak" },
    { value: "Selangor", label: "Selangor" },
    { value: "Terengganu", label: "Terengganu" },
  ]},
  { value: "Mexico", label: "Mexico", states: [
    { value: "Aguascalientes", label: "Aguascalientes" },
    { value: "Baja California", label: "Baja California" },
    { value: "Baja California Sur", label: "Baja California Sur" },
    { value: "Campeche", label: "Campeche" },
    { value: "Chiapas", label: "Chiapas" },
    { value: "Chihuahua", label: "Chihuahua" },
    { value: "Ciudad de México", label: "Ciudad de México" },
    { value: "Coahuila", label: "Coahuila" },
    { value: "Colima", label: "Colima" },
    { value: "Durango", label: "Durango" },
    { value: "Guanajuato", label: "Guanajuato" },
    { value: "Guerrero", label: "Guerrero" },
    { value: "Hidalgo", label: "Hidalgo" },
    { value: "Jalisco", label: "Jalisco" },
    { value: "México", label: "México" },
    { value: "Michoacán", label: "Michoacán" },
    { value: "Morelos", label: "Morelos" },
    { value: "Nayarit", label: "Nayarit" },
    { value: "Nuevo León", label: "Nuevo León" },
    { value: "Oaxaca", label: "Oaxaca" },
    { value: "Puebla", label: "Puebla" },
    { value: "Querétaro", label: "Querétaro" },
    { value: "Quintana Roo", label: "Quintana Roo" },
    { value: "San Luis Potosí", label: "San Luis Potosí" },
    { value: "Sinaloa", label: "Sinaloa" },
    { value: "Sonora", label: "Sonora" },
    { value: "Tabasco", label: "Tabasco" },
    { value: "Tamaulipas", label: "Tamaulipas" },
    { value: "Tlaxcala", label: "Tlaxcala" },
    { value: "Veracruz", label: "Veracruz" },
    { value: "Yucatán", label: "Yucatán" },
    { value: "Zacatecas", label: "Zacatecas" },
  ]},
  { value: "Morocco", label: "Morocco", states: [] },
  { value: "Myanmar", label: "Myanmar", states: [] },
  // ── N ──
  { value: "Nepal", label: "Nepal", states: [] },
  { value: "Netherlands", label: "Netherlands", states: [
    { value: "Drenthe", label: "Drenthe" },
    { value: "Flevoland", label: "Flevoland" },
    { value: "Friesland", label: "Friesland" },
    { value: "Gelderland", label: "Gelderland" },
    { value: "Groningen", label: "Groningen" },
    { value: "Limburg", label: "Limburg" },
    { value: "North Brabant", label: "North Brabant" },
    { value: "North Holland", label: "North Holland" },
    { value: "Overijssel", label: "Overijssel" },
    { value: "South Holland", label: "South Holland" },
    { value: "Utrecht", label: "Utrecht" },
    { value: "Zeeland", label: "Zeeland" },
  ]},
  { value: "New Zealand", label: "New Zealand", states: [
    { value: "Auckland", label: "Auckland" },
    { value: "Bay of Plenty", label: "Bay of Plenty" },
    { value: "Canterbury", label: "Canterbury" },
    { value: "Gisborne", label: "Gisborne" },
    { value: "Hawke's Bay", label: "Hawke's Bay" },
    { value: "Manawatu-Whanganui", label: "Manawatu-Whanganui" },
    { value: "Marlborough", label: "Marlborough" },
    { value: "Nelson", label: "Nelson" },
    { value: "Northland", label: "Northland" },
    { value: "Otago", label: "Otago" },
    { value: "Southland", label: "Southland" },
    { value: "Taranaki", label: "Taranaki" },
    { value: "Tasman", label: "Tasman" },
    { value: "Waikato", label: "Waikato" },
    { value: "Wellington", label: "Wellington" },
    { value: "West Coast", label: "West Coast" },
  ]},
  { value: "Nicaragua", label: "Nicaragua", states: [] },
  { value: "Nigeria", label: "Nigeria", states: [
    { value: "Abia", label: "Abia" },
    { value: "Abuja FCT", label: "Abuja FCT" },
    { value: "Adamawa", label: "Adamawa" },
    { value: "Akwa Ibom", label: "Akwa Ibom" },
    { value: "Anambra", label: "Anambra" },
    { value: "Bauchi", label: "Bauchi" },
    { value: "Bayelsa", label: "Bayelsa" },
    { value: "Benue", label: "Benue" },
    { value: "Borno", label: "Borno" },
    { value: "Cross River", label: "Cross River" },
    { value: "Delta", label: "Delta" },
    { value: "Ebonyi", label: "Ebonyi" },
    { value: "Edo", label: "Edo" },
    { value: "Ekiti", label: "Ekiti" },
    { value: "Enugu", label: "Enugu" },
    { value: "Gombe", label: "Gombe" },
    { value: "Imo", label: "Imo" },
    { value: "Jigawa", label: "Jigawa" },
    { value: "Kaduna", label: "Kaduna" },
    { value: "Kano", label: "Kano" },
    { value: "Katsina", label: "Katsina" },
    { value: "Kebbi", label: "Kebbi" },
    { value: "Kogi", label: "Kogi" },
    { value: "Kwara", label: "Kwara" },
    { value: "Lagos", label: "Lagos" },
    { value: "Nasarawa", label: "Nasarawa" },
    { value: "Niger", label: "Niger" },
    { value: "Ogun", label: "Ogun" },
    { value: "Ondo", label: "Ondo" },
    { value: "Osun", label: "Osun" },
    { value: "Oyo", label: "Oyo" },
    { value: "Plateau", label: "Plateau" },
    { value: "Rivers", label: "Rivers" },
    { value: "Sokoto", label: "Sokoto" },
    { value: "Taraba", label: "Taraba" },
    { value: "Yobe", label: "Yobe" },
    { value: "Zamfara", label: "Zamfara" },
  ]},
  { value: "Norway", label: "Norway", states: [] },
  // ── O ──
  { value: "Oman", label: "Oman", states: [] },
  // ── P ──
  { value: "Pakistan", label: "Pakistan", states: [
    { value: "Azad Kashmir", label: "Azad Kashmir" },
    { value: "Balochistan", label: "Balochistan" },
    { value: "Gilgit-Baltistan", label: "Gilgit-Baltistan" },
    { value: "Islamabad Capital Territory", label: "Islamabad Capital Territory" },
    { value: "Khyber Pakhtunkhwa", label: "Khyber Pakhtunkhwa" },
    { value: "Punjab", label: "Punjab" },
    { value: "Sindh", label: "Sindh" },
  ]},
  { value: "Panama", label: "Panama", states: [] },
  { value: "Paraguay", label: "Paraguay", states: [] },
  { value: "Peru", label: "Peru", states: [] },
  { value: "Philippines", label: "Philippines", states: [
    { value: "Bicol", label: "Bicol" },
    { value: "Cagayan Valley", label: "Cagayan Valley" },
    { value: "Calabarzon", label: "Calabarzon" },
    { value: "Caraga", label: "Caraga" },
    { value: "Central Luzon", label: "Central Luzon" },
    { value: "Central Visayas", label: "Central Visayas" },
    { value: "Cordillera Administrative Region", label: "Cordillera Administrative Region" },
    { value: "Davao", label: "Davao" },
    { value: "Eastern Visayas", label: "Eastern Visayas" },
    { value: "Ilocos", label: "Ilocos" },
    { value: "Metro Manila", label: "Metro Manila" },
    { value: "Mimaropa", label: "Mimaropa" },
    { value: "Muslim Mindanao", label: "Muslim Mindanao" },
    { value: "Northern Mindanao", label: "Northern Mindanao" },
    { value: "Soccsksargen", label: "Soccsksargen" },
    { value: "Western Visayas", label: "Western Visayas" },
    { value: "Zamboanga Peninsula", label: "Zamboanga Peninsula" },
  ]},
  { value: "Poland", label: "Poland", states: [] },
  { value: "Portugal", label: "Portugal", states: [] },
  // ── Q ──
  { value: "Qatar", label: "Qatar", states: [] },
  // ── R ──
  { value: "Romania", label: "Romania", states: [] },
  { value: "Russia", label: "Russia", states: [
    { value: "Altai Krai", label: "Altai Krai" },
    { value: "Chelyabinsk Oblast", label: "Chelyabinsk Oblast" },
    { value: "Irkutsk Oblast", label: "Irkutsk Oblast" },
    { value: "Krasnodar Krai", label: "Krasnodar Krai" },
    { value: "Krasnoyarsk Krai", label: "Krasnoyarsk Krai" },
    { value: "Leningrad Oblast", label: "Leningrad Oblast" },
    { value: "Moscow", label: "Moscow" },
    { value: "Moscow Oblast", label: "Moscow Oblast" },
    { value: "Nizhny Novgorod Oblast", label: "Nizhny Novgorod Oblast" },
    { value: "Novosibirsk Oblast", label: "Novosibirsk Oblast" },
    { value: "Omsk Oblast", label: "Omsk Oblast" },
    { value: "Perm Krai", label: "Perm Krai" },
    { value: "Republic of Bashkortostan", label: "Republic of Bashkortostan" },
    { value: "Republic of Tatarstan", label: "Republic of Tatarstan" },
    { value: "Rostov Oblast", label: "Rostov Oblast" },
    { value: "Saint Petersburg", label: "Saint Petersburg" },
    { value: "Samara Oblast", label: "Samara Oblast" },
    { value: "Saratov Oblast", label: "Saratov Oblast" },
    { value: "Sverdlovsk Oblast", label: "Sverdlovsk Oblast" },
    { value: "Tyumen Oblast", label: "Tyumen Oblast" },
    { value: "Volgograd Oblast", label: "Volgograd Oblast" },
    { value: "Voronezh Oblast", label: "Voronezh Oblast" },
  ]},
  // ── S ──
  { value: "Saudi Arabia", label: "Saudi Arabia", states: [
    { value: "Al Bahah", label: "Al Bahah" },
    { value: "Al Hudud ash Shamaliyah", label: "Al Hudud ash Shamaliyah" },
    { value: "Al Jawf", label: "Al Jawf" },
    { value: "Al Madinah", label: "Al Madinah" },
    { value: "Al Qassim", label: "Al Qassim" },
    { value: "Ar Riyad", label: "Ar Riyad" },
    { value: "Asir", label: "Asir" },
    { value: "Eastern Province", label: "Eastern Province" },
    { value: "Ha'il", label: "Ha'il" },
    { value: "Jazan", label: "Jazan" },
    { value: "Makkah", label: "Makkah" },
    { value: "Najran", label: "Najran" },
    { value: "Tabuk", label: "Tabuk" },
  ]},
  { value: "Serbia", label: "Serbia", states: [] },
  { value: "Singapore", label: "Singapore", states: [] },
  { value: "Slovakia", label: "Slovakia", states: [] },
  { value: "Slovenia", label: "Slovenia", states: [] },
  { value: "South Africa", label: "South Africa", states: [
    { value: "Eastern Cape", label: "Eastern Cape" },
    { value: "Free State", label: "Free State" },
    { value: "Gauteng", label: "Gauteng" },
    { value: "KwaZulu-Natal", label: "KwaZulu-Natal" },
    { value: "Limpopo", label: "Limpopo" },
    { value: "Mpumalanga", label: "Mpumalanga" },
    { value: "Northern Cape", label: "Northern Cape" },
    { value: "North West", label: "North West" },
    { value: "Western Cape", label: "Western Cape" },
  ]},
  { value: "South Korea", label: "South Korea", states: [
    { value: "Busan", label: "Busan" },
    { value: "Chungcheongbuk-do", label: "Chungcheongbuk-do" },
    { value: "Chungcheongnam-do", label: "Chungcheongnam-do" },
    { value: "Daegu", label: "Daegu" },
    { value: "Daejeon", label: "Daejeon" },
    { value: "Gangwon-do", label: "Gangwon-do" },
    { value: "Gwangju", label: "Gwangju" },
    { value: "Gyeonggi-do", label: "Gyeonggi-do" },
    { value: "Gyeongsangbuk-do", label: "Gyeongsangbuk-do" },
    { value: "Gyeongsangnam-do", label: "Gyeongsangnam-do" },
    { value: "Incheon", label: "Incheon" },
    { value: "Jeju", label: "Jeju" },
    { value: "Jeollabuk-do", label: "Jeollabuk-do" },
    { value: "Jeollanam-do", label: "Jeollanam-do" },
    { value: "Sejong", label: "Sejong" },
    { value: "Seoul", label: "Seoul" },
    { value: "Ulsan", label: "Ulsan" },
  ]},
  { value: "Spain", label: "Spain", states: [
    { value: "Andalusia", label: "Andalusia" },
    { value: "Aragon", label: "Aragon" },
    { value: "Asturias", label: "Asturias" },
    { value: "Balearic Islands", label: "Balearic Islands" },
    { value: "Basque Country", label: "Basque Country" },
    { value: "Canary Islands", label: "Canary Islands" },
    { value: "Cantabria", label: "Cantabria" },
    { value: "Castile and León", label: "Castile and León" },
    { value: "Castilla-La Mancha", label: "Castilla-La Mancha" },
    { value: "Catalonia", label: "Catalonia" },
    { value: "Extremadura", label: "Extremadura" },
    { value: "Galicia", label: "Galicia" },
    { value: "La Rioja", label: "La Rioja" },
    { value: "Madrid", label: "Madrid" },
    { value: "Murcia", label: "Murcia" },
    { value: "Navarre", label: "Navarre" },
    { value: "Valencia", label: "Valencia" },
  ]},
  { value: "Sri Lanka", label: "Sri Lanka", states: [] },
  { value: "Sudan", label: "Sudan", states: [] },
  { value: "Sweden", label: "Sweden", states: [] },
  { value: "Switzerland", label: "Switzerland", states: [
    { value: "Aargau", label: "Aargau" },
    { value: "Appenzell Ausserrhoden", label: "Appenzell Ausserrhoden" },
    { value: "Appenzell Innerrhoden", label: "Appenzell Innerrhoden" },
    { value: "Basel-Landschaft", label: "Basel-Landschaft" },
    { value: "Basel-Stadt", label: "Basel-Stadt" },
    { value: "Bern", label: "Bern" },
    { value: "Fribourg", label: "Fribourg" },
    { value: "Geneva", label: "Geneva" },
    { value: "Glarus", label: "Glarus" },
    { value: "Graubünden", label: "Graubünden" },
    { value: "Jura", label: "Jura" },
    { value: "Lucerne", label: "Lucerne" },
    { value: "Neuchâtel", label: "Neuchâtel" },
    { value: "Nidwalden", label: "Nidwalden" },
    { value: "Obwalden", label: "Obwalden" },
    { value: "Schaffhausen", label: "Schaffhausen" },
    { value: "Schwyz", label: "Schwyz" },
    { value: "Solothurn", label: "Solothurn" },
    { value: "St. Gallen", label: "St. Gallen" },
    { value: "Thurgau", label: "Thurgau" },
    { value: "Ticino", label: "Ticino" },
    { value: "Uri", label: "Uri" },
    { value: "Valais", label: "Valais" },
    { value: "Vaud", label: "Vaud" },
    { value: "Zug", label: "Zug" },
    { value: "Zürich", label: "Zürich" },
  ]},
  { value: "Syria", label: "Syria", states: [] },
  // ── T ──
  { value: "Taiwan", label: "Taiwan", states: [] },
  { value: "Tanzania", label: "Tanzania", states: [] },
  { value: "Thailand", label: "Thailand", states: [
    { value: "Bangkok", label: "Bangkok" },
    { value: "Chiang Mai", label: "Chiang Mai" },
    { value: "Chiang Rai", label: "Chiang Rai" },
    { value: "Chonburi", label: "Chonburi" },
    { value: "Khon Kaen", label: "Khon Kaen" },
    { value: "Nakhon Ratchasima", label: "Nakhon Ratchasima" },
    { value: "Nonthaburi", label: "Nonthaburi" },
    { value: "Pathum Thani", label: "Pathum Thani" },
    { value: "Phuket", label: "Phuket" },
    { value: "Songkhla", label: "Songkhla" },
    { value: "Surat Thani", label: "Surat Thani" },
    { value: "Udon Thani", label: "Udon Thani" },
  ]},
  { value: "Tunisia", label: "Tunisia", states: [] },
  { value: "Turkey", label: "Turkey", states: [
    { value: "Adana", label: "Adana" },
    { value: "Ankara", label: "Ankara" },
    { value: "Antalya", label: "Antalya" },
    { value: "Bursa", label: "Bursa" },
    { value: "Diyarbakır", label: "Diyarbakır" },
    { value: "Eskişehir", label: "Eskişehir" },
    { value: "Gaziantep", label: "Gaziantep" },
    { value: "İstanbul", label: "İstanbul" },
    { value: "İzmir", label: "İzmir" },
    { value: "Kayseri", label: "Kayseri" },
    { value: "Konya", label: "Konya" },
    { value: "Mersin", label: "Mersin" },
    { value: "Sakarya", label: "Sakarya" },
    { value: "Samsun", label: "Samsun" },
    { value: "Trabzon", label: "Trabzon" },
  ]},
  // ── U ──
  { value: "UAE", label: "UAE", states: [
    { value: "Abu Dhabi", label: "Abu Dhabi" },
    { value: "Ajman", label: "Ajman" },
    { value: "Dubai", label: "Dubai" },
    { value: "Fujairah", label: "Fujairah" },
    { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
    { value: "Sharjah", label: "Sharjah" },
    { value: "Umm Al Quwain", label: "Umm Al Quwain" },
  ]},
  { value: "Uganda", label: "Uganda", states: [] },
  { value: "Ukraine", label: "Ukraine", states: [] },
  {
    value: "United Kingdom",
    label: "United Kingdom",
    states: [
      { value: "England", label: "England" },
      { value: "Northern Ireland", label: "Northern Ireland" },
      { value: "Scotland", label: "Scotland" },
      { value: "Wales", label: "Wales" },
    ],
  },
  {
    value: "United States",
    label: "United States",
    states: [
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
    ],
  },
  { value: "Uruguay", label: "Uruguay", states: [] },
  { value: "Uzbekistan", label: "Uzbekistan", states: [] },
  // ── V ──
  { value: "Venezuela", label: "Venezuela", states: [] },
  { value: "Vietnam", label: "Vietnam", states: [
    { value: "An Giang", label: "An Giang" },
    { value: "Bà Rịa–Vũng Tàu", label: "Bà Rịa–Vũng Tàu" },
    { value: "Bình Dương", label: "Bình Dương" },
    { value: "Bình Phước", label: "Bình Phước" },
    { value: "Cần Thơ", label: "Cần Thơ" },
    { value: "Đà Nẵng", label: "Đà Nẵng" },
    { value: "Đồng Nai", label: "Đồng Nai" },
    { value: "Hà Nội", label: "Hà Nội" },
    { value: "Hải Phòng", label: "Hải Phòng" },
    { value: "Hồ Chí Minh City", label: "Hồ Chí Minh City" },
    { value: "Khánh Hòa", label: "Khánh Hòa" },
    { value: "Kiên Giang", label: "Kiên Giang" },
    { value: "Lâm Đồng", label: "Lâm Đồng" },
    { value: "Long An", label: "Long An" },
    { value: "Nghệ An", label: "Nghệ An" },
    { value: "Thanh Hóa", label: "Thanh Hóa" },
    { value: "Tiền Giang", label: "Tiền Giang" },
  ]},
  // ── Y ──
  { value: "Yemen", label: "Yemen", states: [] },
  // ── Z ──
  { value: "Zimbabwe", label: "Zimbabwe", states: [] },
];

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
  // FIX 1: Default country is empty string (no pre-selection)
  const [linkedInCountry, setLinkedInCountry] = useState("");
  const [linkedInState, setLinkedInState] = useState("");
  const [linkedInCustomLocation, setLinkedInCustomLocation] = useState("");
  const [linkedInBidStrategy, setLinkedInBidStrategy] = useState("MANUAL_BIDDING");
  // FIX 3: Default bid amount is 0, step is 1 (whole numbers only)
  const [linkedInBidAmount, setLinkedInBidAmount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    if (!clinic?.id) {
      queueMicrotask(() => {
        if (isMounted) {
          setGoogleAdsIntegrationConnected(false);
          setLinkedInAccountStatus(null);
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
      } catch (err) {
        console.error("Failed to fetch Google Ads integration status", err);
        if (isMounted) {
          setGoogleAdsIntegrationConnected(false);
        }
      }

    //   // ── LinkedIn account setup check ─────────────────────────
    //   try {
    //     setLinkedInStatusLoading(true);
    //     const liRes = await CampaignAPI.getLinkedInAccountStatus(clinic.id);
    //     if (isMounted) {
    //       setLinkedInAccountStatus(liRes.data);
    //     }
    //   } catch (err) {
    //     console.error("Failed to fetch LinkedIn account status", err);
    //     if (isMounted) {
    //       // Treat as not connected if the endpoint errors
    //       setLinkedInAccountStatus({
    //         connected: false,
    //         setup_complete: false,
    //         missing: ["linkedin_account"],
    //       });
    //     }
    //   } finally {
    //     if (isMounted) setLinkedInStatusLoading(false);
    //   }
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
    // Warn if LinkedIn is selected but not fully set up
    // if (
    //   id === "linkedin" &&
    //   !accounts.includes("linkedin") &&
    //   linkedInAccountStatus !== null &&
    //   !isLinkedInFullySetup
    // ) {
    //   const missing = linkedInAccountStatus?.missing ?? [];
    //   const missingStr = missing.length
    //     ? ` Missing: ${missing.join(", ")}.`
    //     : "";
    //   toast.warn(
    //     `LinkedIn is not fully set up.${missingStr} The campaign will be saved but LinkedIn ads will not be triggered until setup is complete.`,
    //     { toastId: "linkedin-not-setup" },
    //   );
    // }
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

  // ─── Build final LinkedIn location string ─────────────────────
  const getLinkedInLocation = () => {
    if (linkedInCustomLocation.trim()) return linkedInCustomLocation.trim();
    if (linkedInState && linkedInCountry) return `${linkedInState}, ${linkedInCountry}`;
    if (linkedInCountry) return linkedInCountry;
    return "";
  };

  // ─── Selected country's states ────────────────────────────────
  const selectedCountryStates =
    LINKEDIN_COUNTRIES.find((c) => c.value === linkedInCountry)?.states ?? [];

  const handleCreateCampaign = async (
    type: "live" | "draft" | "scheduled",
  ) => {
    setSubmitted(true);

    if (!step1Valid || !step2Valid) return;
    if (type === "scheduled" && (!scheduleDate || !scheduleTime)) return;

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
          content:      existingLinkedinContent,
          location:     getLinkedInLocation(),
          bid_strategy: linkedInBidStrategy,
          bid_amount:   linkedInBidAmount,
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

      // ─────────────────────────────────────────────────────────
      // Google Ads: fire the dedicated endpoint if selected
      // ─────────────────────────────────────────────────────────
      const shouldSendGoogleAds =
        accounts.includes("google_ads") && isGoogleAdsConnected;

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

          console.log("[GoogleAds] Sending payload:", {
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

          console.log("[GoogleAds] Campaign sent to Zapier successfully");
        } catch (googleAdsErr) {
          console.error("[GoogleAds] Failed to trigger Google Ads:", googleAdsErr);
          toast.warn("Campaign saved, but Google Ads trigger failed. Check logs.");
        }
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

  // // ─── LinkedIn connection badge shown on platform card ─────────
  // const renderLinkedInBadge = () => { ... };

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
                      {/* LinkedIn-specific connection badge */}
                      {/* {acc.id === "linkedin" && renderLinkedInBadge()} */}
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

            {/* ✅ Google Ads Keywords — shown when google_ads selected */}
            {accounts.includes("google_ads") && (
              <div className="section-card">
                <h3>Google Ads Keywords</h3>
                <p className="section-subtitle">
                  Enter keywords for your Google Search campaign (comma-separated)
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
                    Separate keywords with commas. These will be added as broad match keywords to your Google Search campaign.
                    {!keywordsInput.trim() && (
                      <span style={{ color: "#d97706" }}>
                        {" "}If left empty, fallback keywords will be auto-generated from the campaign name.
                      </span>
                    )}
                  </p>
                  {keywordsInput.trim() && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
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
                    onChange={(e) => handleImageUrl("google_ads", e.target.value)}
                    placeholder="https://your-image-url.com/image.jpg"
                    style={{ width: "100%" }}
                  />
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    If provided, a Display campaign will also be created alongside the Search campaign.
                  </p>
                </div>
              </div>
            )}

            {/* ✅ LinkedIn Targeting — shown only when linkedin selected */}
            {accounts.includes("linkedin") && (
              <div className="section-card" style={{ border: "1px solid #0077b5", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <img
                    src={platformIcons["linkedin"]}
                    alt="LinkedIn"
                    style={{ width: 18, height: 18 }}
                  />
                  <h3 style={{ margin: 0, color: "#0077b5" }}>LinkedIn Ad Targeting</h3>
                </div>
                <p className="section-subtitle">
                  Configure targeting and bidding for your LinkedIn campaign
                </p>

                {/* Location row */}
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div className="form-group half">
                    {/* FIX 1 & 2: No default country, full world list */}
                    <label>Country</label>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Select
                        value={linkedInCountry}
                        onChange={(e) => {
                          setLinkedInCountry(e.target.value);
                          setLinkedInState("");
                        }}
                        displayEmpty
                      >
                        <MenuItem value="">Select Country</MenuItem>
                        {LINKEDIN_COUNTRIES.map((c) => (
                          <MenuItem key={c.value} value={c.value}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>

                  <div className="form-group half">
                    <label>
                      State / Region
                      <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>
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
                            <MenuItem key={s.value} value={s.value}>
                              {s.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <input
                        value={linkedInState}
                        onChange={(e) => setLinkedInState(e.target.value)}
                        placeholder="e.g. London, Bavaria…"
                        style={{ width: "100%", height: 40, padding: "0 12px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 14 }}
                      />
                    )}
                  </div>
                </div>

                {/* Custom location override */}
                <div className="form-group" style={{ marginTop: 8 }}>
                  <label>
                    Custom Location
                    <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>
                      (overrides country/state if filled)
                    </span>
                  </label>
                  <input
                    value={linkedInCustomLocation}
                    onChange={(e) => setLinkedInCustomLocation(e.target.value)}
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
                        onChange={(e) => setLinkedInBidStrategy(e.target.value)}
                      >
                        {LINKEDIN_BID_STRATEGIES.map((s) => (
                          <MenuItem key={s.value} value={s.value}>
                            {s.label}
                          </MenuItem>
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
                        <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>
                          (not used for auto)
                        </span>
                      )}
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                        color: "#6b7280", fontSize: 14, pointerEvents: "none",
                      }}>
                        $
                      </span>
                      {/* FIX 3: step=1, min=0, default=0 — increments by whole numbers */}
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={linkedInBidAmount}
                        onChange={(e) => setLinkedInBidAmount(Number(e.target.value))}
                        disabled={linkedInBidStrategy === "MAXIMUM_DELIVERY"}
                        style={{
                          width: "100%",
                          paddingLeft: 24,
                          height: 40,
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          fontSize: 14,
                          opacity: linkedInBidStrategy === "MAXIMUM_DELIVERY" ? 0.5 : 1,
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
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
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          {/* ── BACK button: shown on step 2 and step 3 ── */}
          {step > 1 && (
            <button
              className="cancel-btn"
              onClick={() => { setStep(step - 1); setSubmitted(false); }}
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