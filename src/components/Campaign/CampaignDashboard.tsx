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

  // ─── Full campaign data with fresh insights ───────────────────────────────
  const [fullCampaign, setFullCampaign] = React.useState<Campaign>(campaign);
  const [loadingInsights, setLoadingInsights] = React.useState(true);

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoadingInsights(true);

        // ── Step 1: For email campaigns, trigger Mailchimp insights sync ──────
        // This fetches latest data from Mailchimp and saves to
        // CampaignEmailConfig.insights JSONField in DB.
        // Silently ignore errors — campaign may not be sent yet.
        if (campaign.type === CAMPAIGN_TYPE.EMAIL) {
          try {
            await CampaignAPI.getMailchimpInsights(campaign.id);
          } catch {
            // Not sent to Mailchimp yet, or Mailchimp API down — that is fine.
            // Step 2 below will still return whatever is cached in DB.
          }
        }

        // ── Step 2: Fetch full campaign data (includes latest insights) ───────
        const res = await CampaignAPI.get(campaign.id);
        const d = res.data;

        setFullCampaign((prev) => ({
          ...prev,
          emails_sent:        d.emails_sent        ?? 0,
          impressions:        d.impressions         ?? 0,  // opens
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
        }));
      } catch (err) {
        console.error("Failed to fetch campaign data:", err);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchAll();
  }, [campaign.id, campaign.type]);

  const duration = `${dayjs(fullCampaign.start).format("DD/MM/YYYY")} - ${dayjs(
    fullCampaign.end,
  ).format("DD/MM/YYYY")}`;

  const scheduleTime = formatScheduleTime(
    fullCampaign.selected_start,
    fullCampaign.enter_time,
  );

  const platforms: Platform[] = fullCampaign.platforms ?? [];

  // ─── Facebook insights (social campaigns only) ────────────────────────────
  const [fbInsights, setFbInsights] = React.useState({
    impressions: 0,
    clicks: 0,
    engagement: 0,
  });

  React.useEffect(() => {
    const fetchFbInsights = async () => {
      try {
        const res = await CampaignAPI.getFacebookInsights(campaign.id);
        await CampaignAPI.getFacebookDebug(campaign.id);
        const data = res.data?.insights || {};
        setFbInsights({
          impressions: data.post_impressions || 0,
          clicks: data.post_clicks || 0,
          engagement: data.post_engaged_users || 0,
        });
      } catch (err) {
        console.error("FB Insights fetch failed", err);
      }
    };

    if (campaign.platforms?.includes(PLATFORMS.FACEBOOK)) {
      fetchFbInsights();
      const interval = setInterval(fetchFbInsights, 60000);
      return () => clearInterval(interval);
    }
  }, [campaign.id, campaign.platforms]);

  // ─── Budget ───────────────────────────────────────────────────────────────
  const budgetData: Record<string, number> = fullCampaign.budget_data ?? {};
  const sumFromSelectedPlatforms = platforms
    .filter((p) => p !== PLATFORMS.GMAIL)
    .reduce((sum, p) => sum + (Number(budgetData[p]) || 0), 0);
  const totalBudget: number =
    sumFromSelectedPlatforms > 0
      ? sumFromSelectedPlatforms
      : (fullCampaign.total_spend ?? 0);

  const ctr =
    fbInsights.impressions > 0
      ? ((fbInsights.clicks / fbInsights.impressions) * 100).toFixed(2)
      : "0";

  // ─── Helper: normalise open_rate / click_rate ─────────────────────────────
  // Backend may return "25.0%" (string) or 25.0 (number).
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
      value: loadingInsights ? "…" : (fullCampaign.lead_generated || 0),
      icon: conversionsIcon,
    },
  ];

  // ─── SOCIAL CAMPAIGN METRICS ──────────────────────────────────────────────
  const socialMetrics = [
    {
      title: "Total Impressions",
      value: fullCampaign.impressions ?? 0,
      icon: impressionsIcon,
    },
    {
      title: "Total Clicks",
      value: fullCampaign.clicks ?? 0,
      icon: clicksIcon,
    },
    {
      title: "Conversions",
      value: fullCampaign.lead_generated || "0",
      icon: conversionsIcon,
    },
    {
      title: "Total Budget",
      value: `$${totalBudget}`,
      icon: spendIcon,
    },
    {
      title: "CTR",
      value: `${ctr}%`,
      icon: ctrIcon,
    },
    {
      title: "Conversion Rate",
      value: `${fullCampaign.conversion_rate ?? 0}%`,
      icon: conversionRateIcon,
    },
    {
      title: "CPC",
      value: `$${fullCampaign.cpc?.toFixed(2) ?? "0.00"}`,
      icon: cpcIcon,
    },
    {
      title: "CPA",
      value: "$0",
      icon: cpaIcon,
    },
  ];

  const metrics =
    fullCampaign.type === CAMPAIGN_TYPE.EMAIL ? emailMetrics : socialMetrics;

  return (
    <div className="cd-wrapper">
      {/* ================= HEADER ================= */}
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
              <span className={`status ${fullCampaign.status.toLowerCase()}`}>
                {fullCampaign.status}
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

      {/* ================= METRICS ================= */}
      <div className="cd-metrics-row">
        {metrics.map((m) => (
          <Metric key={m.title} {...m} />
        ))}
      </div>

      {/* ================= MAIN TABS ================= */}
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

      {/* ================= SUB TABS ================= */}
      {platforms.length > 1 && (
        <div className="cd-subtabs-container">
          {platforms.map((p) => (
            <button
              key={p}
              className={`cd-subtab ${
                activeSubTab === p ? "cd-subtab-active" : ""
              }`}
              onClick={() => setActiveSubTab(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* ================= TAB CONTENT ================= */}
      <CampaignTabContent
        campaign={fullCampaign}
        activeTab={activeTab}
        activeSubTab={activeSubTab}
      />
    </div>
  );
};

/* ================= META ================= */
const Meta = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="cd-meta-block">
    <span className="cd-meta-label">{label}</span>
    <span className="cd-meta-value">{value}</span>
  </div>
);

/* ================= METRIC ================= */
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