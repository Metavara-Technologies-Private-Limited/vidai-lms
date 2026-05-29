import "../../styles/Campaign/CampaignDashboard.css";
import React from "react";
import dayjs from "dayjs";
import globeIcon from "./Images/globe.png";
import mailIcon from "./Icons/mail-card.png";
import TurnLeftIcon from "@mui/icons-material/TurnLeft";
import impressionsIcon from "./Icons/impressions.png";
import clicksIcon from "./Icons/clicks.png";
import conversionsIcon from "./Icons/conversions.png";
import spendIcon from "./Icons/spend.png";
import ctrIcon from "./Icons/ctr.png";
import conversionRateIcon from "./Icons/conversion-rate.png";
import cpcIcon from "./Icons/cpc.png";
import cpaIcon from "./Icons/cpa.png";
import CampaignTabContent from "./CampaignTabContent";
import { IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { CampaignAPI } from "../../services/campaign.api";
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_TYPE,
  platformIcons,
  PLATFORMS,
  type Platform,
} from "../../constants/campaigns.constants";
import type { Campaign } from "../../types/campaigns.types";
import { formatScheduleTime, getComputedCampaignStatus } from "../../utils/campaigns.utils";
import { toast } from "react-toastify";

/* ================= COMPONENT ================= */
const CampaignDashboard = ({
  campaign,
  onBack,
}: {
  campaign: Campaign;
  onBack: () => void;
}) => {
  const [activeTab, setActiveTab] = React.useState("Content");
  const [activeSubTab, setActiveSubTab] = React.useState(
    campaign.platforms?.[0] || "",
  );

  const [fullCampaign, setFullCampaign] = React.useState<Campaign>(campaign);
  const [loadingInsights, setLoadingInsights] = React.useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reduxClinicId = useSelector((state: any) => state.clinic?.id ?? 0);
  const clinicIdRef = React.useRef<number>(
    reduxClinicId || Number(localStorage.getItem("clinic_id") ?? 0),
  );
  React.useEffect(() => {
    if (reduxClinicId) clinicIdRef.current = reduxClinicId;
  }, [reduxClinicId]);

  const campaignIdRef = React.useRef(campaign.id);
  const campaignTypeRef = React.useRef(campaign.type);
  // const fbCampaignIdRef = React.useRef(campaign.fb_campaign_id);
  // const instagramCampaignIdRef = React.useRef(campaign.instagram_campaign_id);
  const platformsRef = React.useRef<Platform[]>(campaign.platforms ?? []);

  const [adInsights, setAdInsights] = React.useState({
    impressions: 0,
    clicks: 0,
    spend: "0",
    reach: "0",
    cpc: "0",
    cpm: "0",
    conversions: 0,
    total_budget: "0",
    conversion_rate: "0%",
    ctr: "0",
    currency: "USD",
  });
  const [platformInsights, setPlatformInsights] = React.useState<
    Record<string, typeof adInsights>
  >({});

  const fetchMetaInsights = React.useCallback(
    async (campaignId: string, platform: "facebook" | "instagram") => {
      try {
        console.log(`Fetching ${platform} insights for:`, campaignId);

        const res = await CampaignAPI.getFBAdInsights(campaignId, platform);

        return res.data?.insights || {};
      } catch (err) {
        console.error(`${platform} insights fetch failed`, err);

        return {};
      }
    },
    [],
  );

  const fetchGoogleAdsInsights = React.useCallback(
    async (campaignId: string) => {
      try {
        console.log("[GoogleAds] Fetching insights for campaign:", campaignId);
        const res = await CampaignAPI.getGoogleAdsInsights(campaignId);
        const data = res.data?.insights || res.data || {};
        console.log("[GoogleAds] DB insights raw:", data);
        const hasRealData =
          Number(data.impressions ?? 0) > 0 ||
          Number(data.clicks ?? 0) > 0 ||
          Number(data.cost ?? 0) > 0;
        if (hasRealData) {
          setAdInsights((prev) => ({
            ...prev,
            impressions: Number(data.impressions ?? prev.impressions),
            clicks: Number(data.clicks ?? prev.clicks),
            spend: String(data.cost ?? prev.spend ?? "0"),
            reach: String(data.reach ?? prev.reach ?? "0"),
            cpc: parseFloat(String(data.avg_cpc ?? prev.cpc ?? "0")).toFixed(2),
            conversions: Number(data.conversions ?? prev.conversions),
            total_budget: String(data.total_budget ?? prev.total_budget ?? "0"),
            conversion_rate: String(
              data.ctr ?? data.conversion_rate ?? prev.conversion_rate ?? "0%",
            ),
            ctr: String(data.ctr ?? prev.ctr ?? "0"),
          }));
          return true;
        }
        return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("[GoogleAds] insights fetch failed", err);

        const errorMessage =
          err?.response?.data?.error || "Failed to fetch Google Ads insights";

        toast.warn(errorMessage);

        return false;
      }
    },
    [],
  );

  React.useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fetchAll = async () => {
      try {
        setLoadingInsights(true);

        timeoutId = setTimeout(() => {
          if (!cancelled) {
            console.warn(
              "[CampaignDashboard] Loading timeout - forcing completion",
            );
            setLoadingInsights(false);
          }
        }, 10000);

        const campaignId = campaignIdRef.current;
        const campaignType = campaignTypeRef.current;
        // const fbCamId = fbCampaignIdRef.current;
        // const instagramCamId = instagramCampaignIdRef.current;
        const platforms = platformsRef.current;
        const cId = clinicIdRef.current;

        if (campaignType === CAMPAIGN_TYPE.EMAIL) {
          try {
            await CampaignAPI.getMailchimpInsights(campaignId);
          } catch (err) {
            console.error(err);
          }
          if (cancelled) return;
        }

        const hasGoogleAds = platforms.includes(PLATFORMS.GOOGLE_ADS);

        const res = await CampaignAPI.get(campaignId, cId);
        if (cancelled) return;

        const d = res.data;
        const fbCamId = d.fb_campaign_id;

        const instagramCamId = d.instagram_campaign_id;

        console.log("FB Campaign ID:", fbCamId);

        console.log("Instagram Campaign ID:", instagramCamId);
        if (
          platforms.includes(PLATFORMS.FACEBOOK) ||
          platforms.includes(PLATFORMS.INSTAGRAM)
        ) {
          const fbInsights =
            fbCamId && platforms.includes(PLATFORMS.FACEBOOK)
              ? await fetchMetaInsights(fbCamId, "facebook")
              : {};

          const instagramInsights =
            instagramCamId && platforms.includes(PLATFORMS.INSTAGRAM)
              ? await fetchMetaInsights(instagramCamId, "instagram")
              : {};

          console.log("Facebook Insights:", fbInsights);

          console.log("Instagram Insights:", instagramInsights);
          setPlatformInsights((prev) => ({
            ...prev,

            facebook: {
              impressions: Number(fbInsights.post_impressions || 0),

              clicks: Number(fbInsights.post_clicks || 0),

              spend: String(fbInsights.spend || "0"),

              reach: String(fbInsights.reach || "0"),

              cpc:
                Number(fbInsights.post_clicks || 0) > 0
                  ? (
                      Number(fbInsights.spend || 0) /
                      Number(fbInsights.post_clicks || 0)
                    ).toFixed(2)
                  : "0",

              cpm:
                Number(fbInsights.post_impressions || 0) > 0
                  ? (
                      (Number(fbInsights.spend || 0) * 1000) /
                      Number(fbInsights.post_impressions || 0)
                    ).toFixed(2)
                  : "0",

              ctr:
                Number(fbInsights.post_impressions || 0) > 0
                  ? (
                      (Number(fbInsights.post_clicks || 0) * 100) /
                      Number(fbInsights.post_impressions || 0)
                    ).toFixed(2)
                  : "0",

              conversions: 0,
              total_budget: String(fbInsights.spend || "0"),

              conversion_rate: "0%",
              currency: fbInsights.currency || "USD",
            },

            instagram: {
              impressions: Number(instagramInsights.post_impressions || 0),

              clicks: Number(instagramInsights.post_clicks || 0),

              spend: String(instagramInsights.spend || "0"),

              reach: String(instagramInsights.reach || "0"),

              cpc:
                Number(instagramInsights.post_clicks || 0) > 0
                  ? (
                      Number(instagramInsights.spend || 0) /
                      Number(instagramInsights.post_clicks || 0)
                    ).toFixed(2)
                  : "0",

              cpm:
                Number(instagramInsights.post_impressions || 0) > 0
                  ? (
                      (Number(instagramInsights.spend || 0) * 1000) /
                      Number(instagramInsights.post_impressions || 0)
                    ).toFixed(2)
                  : "0",

              ctr:
                Number(instagramInsights.post_clicks || 0) > 0
                  ? (
                      (Number(instagramInsights.post_clicks || 0) * 100) /
                      Number(instagramInsights.post_impressions || 0)
                    ).toFixed(2)
                  : "0",

              conversions: 0,
              total_budget: String(instagramInsights.spend || "0"),

              conversion_rate: "0%",
              currency: instagramInsights.currency || "USD",
            },
          }));

          const impressions =
            Number(fbInsights.post_impressions || 0) +
            Number(instagramInsights.post_impressions || 0);

          const clicks =
            Number(fbInsights.post_clicks || 0) +
            Number(instagramInsights.post_clicks || 0);

          const spend =
            Number(fbInsights.spend || 0) +
            Number(instagramInsights.spend || 0);

          const reach =
            Number(fbInsights.reach || 0) +
            Number(instagramInsights.reach || 0);

          setAdInsights((prev) => ({
            ...prev,
            impressions,
            clicks,
            spend: String(spend),
            reach: String(reach),

            cpc: clicks > 0 ? (spend / clicks).toFixed(2) : "0",

            cpm:
              impressions > 0 ? ((spend * 1000) / impressions).toFixed(2) : "0",

            ctr:
              impressions > 0 ? ((clicks * 100) / impressions).toFixed(2) : "0",

            total_budget: String(spend),
            currency:
              fbInsights.currency || instagramInsights.currency || "USD",
          }));
        }

        const resolvedFbCampaignId = d.fb_campaign_id ?? fbCamId ?? null;

        setFullCampaign((prev) => ({
          ...prev,
          emails_sent: d.emails_sent ?? 0,
          impressions: d.impressions ?? 0,
          open_rate: d.open_rate ?? 0,
          clicks: d.clicks ?? 0,
          click_rate: d.click_rate ?? 0,
          bounces: d.bounces ?? 0,
          unsubscribes: d.unsubscribes ?? 0,
          lead_generated: d.lead_generated ?? 0,
          conversion_rate: d.conversion_rate ?? 0,
          last_open: d.last_open ?? null,
          last_click: d.last_click ?? null,
          insights_synced_at: d.insights_synced_at ?? null,
          fb_campaign_id: resolvedFbCampaignId,
          budget_data: d.budget_data ?? prev.budget_data ?? {},
          image_url: d.image_url ?? prev.image_url ?? null,
        }));

        // if (hasGoogleAds) {
        // console.log(
        //   "[GoogleAds] No DB data - triggering Zapier insights fetch...",
        // );
        // try {
        //   await CampaignAPI.triggerGoogleAdsInsights(campaignId);
        //   console.log(
        //     "[GoogleAds] Zapier trigger sent. Polling DB for results...",
        //   );
        // } catch (err) {
        //   console.error("[GoogleAds] Trigger failed:", err);
        // }

        // let attempts = 0;
        // const maxAttempts = 3;
        // const pollIntervalMs = 2000;

        // while (attempts < maxAttempts) {
        //   await new Promise((r) => setTimeout(r, pollIntervalMs));
        //   attempts++;
        //   if (cancelled) return;
        //   console.log(`[GoogleAds] Poll attempt ${attempts}/${maxAttempts}`);
        //   const gotData = await fetchGoogleAdsInsightsFromDB(campaignId, cId);
        //   if (gotData) {
        //     console.log("[GoogleAds] Got real data on attempt", attempts);
        //     break;
        //   }
        // }

        // if (attempts >= maxAttempts) {
        //   console.warn(
        //     "[GoogleAds] Polling timed out - Zapier may still be processing",
        //   );
        // }
        // }
        if (hasGoogleAds) {
          console.log("[GoogleAds] Fetching live insights directly");

          await fetchGoogleAdsInsights(campaignId);
        }
      } catch (err) {
        console.error("Failed to fetch campaign data:", err);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (!cancelled) setLoadingInsights(false);
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [campaign.id, fetchGoogleAdsInsights, fetchMetaInsights]);

  // ─── Budget ───────────────────────────────────────────────────────────────
  const budgetData: Record<string, number> = fullCampaign.budget_data ?? {};
  const platforms: Platform[] = fullCampaign.platforms ?? [];

  const sumFromSelectedPlatforms = platforms
    .filter((p) => p !== PLATFORMS.GMAIL)
    .reduce((sum, p) => sum + (Number(budgetData[p]) || 0), 0);

  const totalBudget: number =
    sumFromSelectedPlatforms > 0
      ? sumFromSelectedPlatforms
      : parseFloat(adInsights.total_budget || "0") > 0
        ? parseFloat(adInsights.total_budget)
        : (fullCampaign.total_spend ?? 0);

  const ctr =
    adInsights.ctr !== "0"
      ? parseFloat(adInsights.ctr).toFixed(2)
      : adInsights.impressions > 0
        ? ((adInsights.clicks / adInsights.impressions) * 100).toFixed(2)
        : "0";

  const duration = `${dayjs(fullCampaign.start).format("DD/MM/YYYY")} - ${dayjs(
    fullCampaign.end,
  ).format("DD/MM/YYYY")}`;

  const scheduleTime = formatScheduleTime(
    fullCampaign.selected_start,
    fullCampaign.enter_time,
  );

  const formatRate = (val: string | number | null | undefined): string => {
    if (val == null) return "0%";
    const str = String(val).trim();
    if (str.endsWith("%")) return str;
    const num = parseFloat(str);
    if (isNaN(num)) return "0%";
    return `${num}%`;
  };

  // ─── EMAIL CAMPAIGN METRICS ───────────────────────────────────────────────
  const emailMetrics = [
    {
      title: "Emails Sent",
      value: loadingInsights ? "…" : (fullCampaign.emails_sent ?? 0),
      icon: impressionsIcon,
    },
    {
      title: "Total Opens",
      value: loadingInsights ? "…" : (fullCampaign.impressions ?? 0),
      icon: clicksIcon,
    },
    {
      title: "Open Rate",
      value: loadingInsights ? "…" : formatRate(fullCampaign.open_rate),
      icon: ctrIcon,
    },
    {
      title: "Total Clicks",
      value: loadingInsights ? "…" : (fullCampaign.clicks ?? 0),
      icon: cpcIcon,
    },
    {
      title: "Click Rate",
      value: loadingInsights ? "…" : formatRate(fullCampaign.click_rate),
      icon: conversionRateIcon,
    },
    {
      title: "Bounces",
      value: loadingInsights ? "…" : (fullCampaign.bounces ?? 0),
      icon: spendIcon,
    },
    {
      title: "Unsubscribes",
      value: loadingInsights ? "…" : (fullCampaign.unsubscribes ?? 0),
      icon: cpaIcon,
    },
    {
      title: "Leads Generated",
      value: loadingInsights ? "…" : fullCampaign.lead_generated || 0,
      icon: conversionsIcon,
    },
  ];

  const currencySymbol = adInsights.currency === "INR" ? "₹" : "$";

  // ─── SOCIAL CAMPAIGN METRICS ──────────────────────────────────────────────
  const socialMetrics = [
    {
      title: "Total Impressions",
      value: loadingInsights ? "…" : adInsights.impressions,
      icon: impressionsIcon,
    },
    {
      title: "Total Clicks",
      value: loadingInsights ? "…" : adInsights.clicks,
      icon: clicksIcon,
    },
    {
      title: "Conversions",
      value: loadingInsights ? "…" : adInsights.conversions,
      icon: conversionsIcon,
    },
    {
      title: "Total Budget",
      value: loadingInsights ? "…" : `${currencySymbol}${totalBudget}`,
      icon: spendIcon,
    },
    {
      title: "CTR",
      value: loadingInsights ? "…" : `${ctr}%`,
      icon: ctrIcon,
    },
    {
      title: "Conversion Rate",
      value: loadingInsights ? "…" : formatRate(adInsights.conversion_rate),
      icon: conversionRateIcon,
    },
    {
      title: "CPC",
      value: loadingInsights ? "…" : `${currencySymbol}${adInsights.cpc}`,
      icon: cpcIcon,
    },
    {
      title: "CPA",
      value: loadingInsights
        ? "…"
        : adInsights.conversions > 0
          ? `${currencySymbol}${(
              parseFloat(adInsights.spend) / adInsights.conversions
            ).toFixed(2)}`
          : "-",
      icon: cpaIcon,
    },
  ];

  const metrics =
    fullCampaign.type === CAMPAIGN_TYPE.EMAIL ? emailMetrics : socialMetrics;

  return (
    <div className="cd-wrapper">
      <div className="cd-header-section">
        <IconButton
          onClick={onBack}
          sx={{
            width: 24,
            height: 24,
            padding: "10px",
            opacity: 1,
            color: "#374151",
            borderRadius: 1,
            mr: 1,
            boxShadow: "3px 3px 6px rgba(0,0,0,0.2)",
            backgroundColor: "#fff",
          }}
        >
          <TurnLeftIcon sx={{ fontSize: 24, padding: "3px" }} />
        </IconButton>

        <div className="cd-header-card">
          <div className="cd-header-top">
            <div className="cd-header-left">
              <div
                className={
                  fullCampaign.type === CAMPAIGN_TYPE.EMAIL
                    ? "cd-mail-icon"
                    : "cd-globe-icon"
                }
              >
                <img
                  src={
                    fullCampaign.type === CAMPAIGN_TYPE.EMAIL
                      ? mailIcon
                      : globeIcon
                  }
                  alt={fullCampaign.type}
                />
              </div>
              <span className="cd-header-title">{fullCampaign.name}</span>
              <span className={`status ${getComputedCampaignStatus(fullCampaign).toLowerCase()}`}>
                {getComputedCampaignStatus(fullCampaign)}
              </span>
            </div>
          </div>
          <div className="cd-header-meta">
            <Meta label="Campaign Duration" value={duration} />
            <Meta label="Schedule Time" value={scheduleTime} />
            <Meta
              label="Campaign Objective"
              value={
                fullCampaign.objective
                  ? CAMPAIGN_OBJECTIVES[
                      fullCampaign.objective as keyof typeof CAMPAIGN_OBJECTIVES
                    ]
                  : "-"
              }
            />
            <Meta
              label="Platform"
              value={
                <div className="cd-platform-icons">
                  {platforms.map((p) => (
                    <img key={p} src={platformIcons[p]} alt={p} />
                  ))}
                </div>
              }
            />
            <Meta
              label="Campaign Type"
              value={fullCampaign.type.toUpperCase()}
            />
            <Meta
              label="Leads Generated"
              value={fullCampaign.lead_generated || 0}
            />
          </div>
        </div>
      </div>
      {loadingInsights && (
        <div className="cd-insights-loader">
          <div className="cd-insights-loader-spinner" />
          <span>Fetching latest campaign insights...</span>
        </div>
      )}
      <div className="cd-metrics-row">
        {metrics.map((m) => (
          <Metric key={m.title} {...m} />
        ))}
      </div>

      <div className="cd-tabs-container">
        {["Content", "Performance", "Platform Breakdown", "AI Insights"].map(
          (tab) => (
            <button
              key={tab}
              className={`cd-tab ${activeTab === tab ? "cd-tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {activeTab === "Content" && platforms.length > 1 && (
        <div className="cd-subtabs-container">
          {platforms.map((p) => (
            <button
              key={p}
              className={`cd-subtab ${activeSubTab === p ? "cd-subtab-active" : ""}`}
              onClick={() => setActiveSubTab(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      )}

      <CampaignTabContent
        campaign={fullCampaign}
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        adInsights={adInsights}
        platformInsights={platformInsights}
      />
    </div>
  );
};

const Meta = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="cd-meta-block">
    <span className="cd-meta-label">{label}</span>
    <span className="cd-meta-value">{value}</span>
  </div>
);

const METRIC_GRADIENTS: Record<string, string> = {
  "Total Impressions":
    "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
  "Total Clicks":
    "linear-gradient(180deg, rgba(131,93,239,0.10) 0%, rgba(131,93,239,0.05) 35%, #FFFFFF 100%)",
  Conversions:
    "linear-gradient(180deg, rgba(45,107,240,0.10) 0%, rgba(45,107,240,0.05) 35%, #FFFFFF 100%)",
  "Total Budget":
    "linear-gradient(180deg, rgba(236,189,86,0.10) 0%, rgba(236,189,86,0.05) 35%, #FFFFFF 100%)",
  CTR: "linear-gradient(180deg, rgba(71,179,95,0.10) 0%, rgba(71,179,95,0.05) 35%, #FFFFFF 100%)",
  "Conversion Rate":
    "linear-gradient(180deg, rgba(242,91,91,0.10) 0%, rgba(242,91,91,0.05) 35%, #FFFFFF 100%)",
  CPC: "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
  CPA: "linear-gradient(180deg, rgba(131,93,239,0.10) 0%, rgba(131,93,239,0.05) 35%, #FFFFFF 100%)",
  "Emails Sent":
    "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
  "Total Opens":
    "linear-gradient(180deg, rgba(71,179,95,0.10) 0%, rgba(71,179,95,0.05) 35%, #FFFFFF 100%)",
  "Open Rate":
    "linear-gradient(180deg, rgba(45,107,240,0.10) 0%, rgba(45,107,240,0.05) 35%, #FFFFFF 100%)",
  "Total Clicks (Email)":
    "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
  "Click Rate":
    "linear-gradient(180deg, rgba(131,93,239,0.10) 0%, rgba(131,93,239,0.05) 35%, #FFFFFF 100%)",
  Bounces:
    "linear-gradient(180deg, rgba(242,91,91,0.10) 0%, rgba(242,91,91,0.05) 35%, #FFFFFF 100%)",
  Unsubscribes:
    "linear-gradient(180deg, rgba(236,189,86,0.10) 0%, rgba(236,189,86,0.05) 35%, #FFFFFF 100%)",
  "Leads Generated":
    "linear-gradient(180deg, rgba(45,107,240,0.10) 0%, rgba(45,107,240,0.05) 35%, #FFFFFF 100%)",
};

const Metric = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) => (
  <div
    className="cd-metric-card"
    style={{ background: METRIC_GRADIENTS[title] }}
  >
    <div className="cd-metric-icon">
      <img src={icon} alt={title} />
    </div>
    <div className="cd-metric-text">
      <span className="cd-metric-label">{title}</span>
      <span className="cd-metric-value">{value}</span>
    </div>
  </div>
);

export default CampaignDashboard;