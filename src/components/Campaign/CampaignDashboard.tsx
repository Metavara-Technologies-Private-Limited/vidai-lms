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
import { CampaignAPI } from "../../services/campaign.api";
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_TYPE,
  platformIcons,
  PLATFORMS,
  type Platform,
} from "../../constants/campaigns.constants";
import type { Campaign } from "../../types/campaigns.types";
import { formatScheduleTime } from "../../utils/campaigns.utils";

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

  // ─── Ad insights state ───────────────────────────────────────────────────
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
  });

  // ─── Facebook insights ────────────────────────────────────────────────────
  const fetchAdInsights = React.useCallback(async (fbCampaignId: string) => {
    try {
      console.log("Fetching ad insights for FB Campaign ID:", fbCampaignId);
      const res = await CampaignAPI.getFBAdInsights(fbCampaignId);
      const data = res.data?.insights || {};

      console.log("AD INSIGHTS RAW:", data);

      setAdInsights({
        impressions:     data.post_impressions  || 0,
        clicks:          data.post_clicks       || 0,
        spend:           data.spend             || "0",
        reach:           data.reach             || "0",
        cpc:             parseFloat(data.cpc    || "0").toFixed(2),
        cpm:             parseFloat(data.cpm    || "0").toFixed(2),
        conversions:     data.conversions       || 0,
        total_budget:    data.total_budget      || "0",
        conversion_rate: data.conversion_rate   || "0%",
        ctr:             data.ctr               || "0",
      });
    } catch (err) {
      console.error("FB Ad Insights fetch failed", err);
    }
  }, []);

  // ─── Google Ads insights — reads from DB only ─────────────────────────────
  const fetchGoogleAdsInsightsFromDB = React.useCallback(async (campaignId: string) => {
    try {
      console.log("[GoogleAds] Reading insights from DB for campaign:", campaignId);
      const res = await CampaignAPI.getGoogleAdsInsightsFromApi(campaignId);
      const data = res.data?.insights || res.data || {};

      console.log("[GoogleAds] DB insights raw:", data);

      const hasRealData =
        Number(data.impressions ?? 0) > 0 ||
        Number(data.clicks ?? 0) > 0 ||
        Number(data.cost ?? 0) > 0;

      if (hasRealData) {
        setAdInsights((prev) => ({
          ...prev,
          impressions:     Number(data.impressions    ?? prev.impressions),
          clicks:          Number(data.clicks         ?? prev.clicks),
          spend:           String(data.cost           ?? prev.spend       ?? "0"),
          reach:           String(data.reach          ?? prev.reach       ?? "0"),
          cpc:             parseFloat(String(data.avg_cpc ?? prev.cpc    ?? "0")).toFixed(2),
          conversions:     Number(data.conversions    ?? prev.conversions),
          total_budget:    String(data.total_budget   ?? prev.total_budget ?? "0"),
          conversion_rate: String(data.ctr ?? data.conversion_rate ?? prev.conversion_rate ?? "0%"),
          ctr:             String(data.ctr            ?? prev.ctr          ?? "0"),
        }));
        return true;
      }

      return false;
    } catch (err) {
      console.error("[GoogleAds] DB insights fetch failed", err);
      return false;
    }
  }, []);

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoadingInsights(true);

        if (campaign.type === CAMPAIGN_TYPE.EMAIL) {
          try {
            await CampaignAPI.getMailchimpInsights(campaign.id);
          } catch {
            // Not sent to Mailchimp yet — that is fine.
          }
        }

        const hasGoogleAds = campaign.platforms?.includes(PLATFORMS.GOOGLE_ADS);

        const res = await CampaignAPI.get(campaign.id);
        const d = res.data;
        const fbCampaignId = d.fb_campaign_id ?? campaign.fb_campaign_id ?? null;

        setFullCampaign((prev) => ({
          ...prev,
          emails_sent:        d.emails_sent        ?? 0,
          impressions:        d.impressions         ?? 0,
          open_rate:          d.open_rate           ?? 0,
          clicks:             d.clicks              ?? 0,
          click_rate:         d.click_rate          ?? 0,
          bounces:            d.bounces             ?? 0,
          unsubscribes:       d.unsubscribes        ?? 0,
          lead_generated:     d.lead_generated      ?? 0,
          conversion_rate:    d.conversion_rate     ?? 0,
          last_open:          d.last_open           ?? null,
          last_click:         d.last_click          ?? null,
          insights_synced_at: d.insights_synced_at  ?? null,
          fb_campaign_id:     fbCampaignId,
          budget_data:        d.budget_data         ?? prev.budget_data ?? {},
        }));

        if (fbCampaignId) {
          await fetchAdInsights(fbCampaignId);
        }

        if (hasGoogleAds) {
          console.log("[GoogleAds] No DB data — triggering Zapier insights fetch...");
          try {
            await CampaignAPI.triggerGoogleAdsInsights(campaign.id);
            console.log("[GoogleAds] Zapier trigger sent. Polling DB for results...");
          } catch (err) {
            console.error("[GoogleAds] Trigger failed:", err);
          }

          let attempts = 0;
          const maxAttempts = 5;
          const pollIntervalMs = 3000;

          while (attempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, pollIntervalMs));
            attempts++;
            console.log(`[GoogleAds] Poll attempt ${attempts}/${maxAttempts}`);
            const gotData = await fetchGoogleAdsInsightsFromDB(campaign.id);
            if (gotData) {
              console.log("[GoogleAds] Got real data on attempt", attempts);
              break;
            }
          }

          if (attempts >= maxAttempts) {
            console.warn("[GoogleAds] Polling timed out — Zapier may still be processing");
          }
        }

      } catch (err) {
        console.error("Failed to fetch campaign data:", err);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchAll();
  }, [campaign.id, campaign.type, campaign.fb_campaign_id, campaign.platforms, fetchAdInsights, fetchGoogleAdsInsightsFromDB]);

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

  const ctr = adInsights.ctr !== "0"
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
    { title: "Emails Sent",     value: loadingInsights ? "…" : (fullCampaign.emails_sent   ?? 0), icon: impressionsIcon },
    { title: "Total Opens",     value: loadingInsights ? "…" : (fullCampaign.impressions    ?? 0), icon: clicksIcon },
    { title: "Open Rate",       value: loadingInsights ? "…" : formatRate(fullCampaign.open_rate), icon: ctrIcon },
    { title: "Total Clicks",    value: loadingInsights ? "…" : (fullCampaign.clicks         ?? 0), icon: cpcIcon },
    { title: "Click Rate",      value: loadingInsights ? "…" : formatRate(fullCampaign.click_rate), icon: conversionRateIcon },
    { title: "Bounces",         value: loadingInsights ? "…" : (fullCampaign.bounces        ?? 0), icon: spendIcon },
    { title: "Unsubscribes",    value: loadingInsights ? "…" : (fullCampaign.unsubscribes   ?? 0), icon: cpaIcon },
    { title: "Leads Generated", value: loadingInsights ? "…" : (fullCampaign.lead_generated || 0), icon: conversionsIcon },
  ];

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
      value: loadingInsights ? "…" : `₹${totalBudget}`,
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
      value: loadingInsights ? "…" : `₹${adInsights.cpc}`,
      icon: cpcIcon,
    },
    {
      title: "CPA",
      value: loadingInsights
        ? "…"
        : adInsights.conversions > 0
          ? `₹${(parseFloat(adInsights.spend) / adInsights.conversions).toFixed(2)}`
          : `₹${adInsights.spend}`,
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
            width: 24, height: 24, padding: "10px", opacity: 1,
            color: "#374151", borderRadius: 1, mr: 1,
            boxShadow: "3px 3px 6px rgba(0,0,0,0.2)", backgroundColor: "#fff",
          }}
        >
          <TurnLeftIcon sx={{ fontSize: 24, padding: "3px" }} />
        </IconButton>

        <div className="cd-header-card">
          <div className="cd-header-top">
            <div className="cd-header-left">
              <div className={fullCampaign.type === CAMPAIGN_TYPE.EMAIL ? "cd-mail-icon" : "cd-globe-icon"}>
                <img src={fullCampaign.type === CAMPAIGN_TYPE.EMAIL ? mailIcon : globeIcon} alt={fullCampaign.type} />
              </div>
              <span className="cd-header-title">{fullCampaign.name}</span>
              <span className={`status ${fullCampaign.status.toLowerCase()}`}>{fullCampaign.status}</span>
            </div>
          </div>

          <div className="cd-header-meta">
            <Meta label="Campaign Duration" value={duration} />
            <Meta label="Schedule Time" value={scheduleTime} />
            <Meta
              label="Campaign Objective"
              value={fullCampaign.objective ? CAMPAIGN_OBJECTIVES[fullCampaign.objective as keyof typeof CAMPAIGN_OBJECTIVES] : "-"}
            />
            <Meta
              label="Platform"
              value={
                <div className="cd-platform-icons">
                  {platforms.map((p) => (<img key={p} src={platformIcons[p]} alt={p} />))}
                </div>
              }
            />
            <Meta label="Campaign Type" value={fullCampaign.type.toUpperCase()} />
            <Meta label="Leads Generated" value={fullCampaign.lead_generated || 0} />
          </div>
        </div>
      </div>

      <div className="cd-metrics-row">
        {metrics.map((m) => (<Metric key={m.title} {...m} />))}
      </div>

      <div className="cd-tabs-container">
        {["Content", "Performance", "Platform Breakdown", "AI Insights"].map((tab) => (
          <button key={tab} className={`cd-tab ${activeTab === tab ? "cd-tab-active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {platforms.length > 1 && (
        <div className="cd-subtabs-container">
          {platforms.map((p) => (
            <button key={p} className={`cd-subtab ${activeSubTab === p ? "cd-subtab-active" : ""}`} onClick={() => setActiveSubTab(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* ✅ FIX: pass adInsights so Performance tab shows real data instead of mock */}
      <CampaignTabContent
        campaign={fullCampaign}
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        adInsights={adInsights}
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
  "Total Impressions": "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
  "Total Clicks": "linear-gradient(180deg, rgba(131,93,239,0.10) 0%, rgba(131,93,239,0.05) 35%, #FFFFFF 100%)",
  Conversions: "linear-gradient(180deg, rgba(45,107,240,0.10) 0%, rgba(45,107,240,0.05) 35%, #FFFFFF 100%)",
  "Total Budget": "linear-gradient(180deg, rgba(236,189,86,0.10) 0%, rgba(236,189,86,0.05) 35%, #FFFFFF 100%)",
  CTR: "linear-gradient(180deg, rgba(71,179,95,0.10) 0%, rgba(71,179,95,0.05) 35%, #FFFFFF 100%)",
  "Conversion Rate": "linear-gradient(180deg, rgba(242,91,91,0.10) 0%, rgba(242,91,91,0.05) 35%, #FFFFFF 100%)",
  CPC: "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
  CPA: "linear-gradient(180deg, rgba(131,93,239,0.10) 0%, rgba(131,93,239,0.05) 35%, #FFFFFF 100%)",
  "Emails Sent": "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
  "Total Opens": "linear-gradient(180deg, rgba(71,179,95,0.10) 0%, rgba(71,179,95,0.05) 35%, #FFFFFF 100%)",
  "Open Rate": "linear-gradient(180deg, rgba(45,107,240,0.10) 0%, rgba(45,107,240,0.05) 35%, #FFFFFF 100%)",
  "Total Clicks (Email)": "linear-gradient(180deg, rgba(83,146,242,0.10) 0%, rgba(83,146,242,0.05) 35%, #FFFFFF 100%)",
  "Click Rate": "linear-gradient(180deg, rgba(131,93,239,0.10) 0%, rgba(131,93,239,0.05) 35%, #FFFFFF 100%)",
  Bounces: "linear-gradient(180deg, rgba(242,91,91,0.10) 0%, rgba(242,91,91,0.05) 35%, #FFFFFF 100%)",
  Unsubscribes: "linear-gradient(180deg, rgba(236,189,86,0.10) 0%, rgba(236,189,86,0.05) 35%, #FFFFFF 100%)",
  "Leads Generated": "linear-gradient(180deg, rgba(45,107,240,0.10) 0%, rgba(45,107,240,0.05) 35%, #FFFFFF 100%)",
};

const Metric = ({ title, value, icon }: { title: string; value: string | number; icon: string }) => (
  <div className="cd-metric-card" style={{ background: METRIC_GRADIENTS[title] }}>
    <div className="cd-metric-icon"><img src={icon} alt={title} /></div>
    <div className="cd-metric-text">
      <span className="cd-metric-label">{title}</span>
      <span className="cd-metric-value">{value}</span>
    </div>
  </div>
);

export default CampaignDashboard;