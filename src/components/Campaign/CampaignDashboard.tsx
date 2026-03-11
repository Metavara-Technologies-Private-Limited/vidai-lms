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

  const duration = `${dayjs(campaign.start).format("DD/MM/YYYY")} - ${dayjs(
    campaign.end,
  ).format("DD/MM/YYYY")}`;

  const scheduleTime = formatScheduleTime(
    campaign.selected_start,
    campaign.enter_time,
  );

  const platforms: Platform[] = campaign.platforms ?? [];

  const [insights, setInsights] = React.useState({
    impressions: 0,
    clicks: 0,
    engagement: 0,
  });

  React.useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await CampaignAPI.getFacebookInsights(campaign.id);
        await CampaignAPI.getFacebookDebug(campaign.id);

        const data = res.data?.insights || {};

        setInsights({
          impressions: data.post_impressions || 0,
          clicks: data.post_clicks || 0,
          engagement: data.post_engaged_users || 0,
        });
      } catch (err) {
        console.error("Insights fetch failed", err);
      }
    };

    if (campaign.platforms?.includes(PLATFORMS.FACEBOOK)) {
      fetchInsights();

      const interval = setInterval(fetchInsights, 60000);

      return () => clearInterval(interval);
    }
  }, [campaign.id, campaign.platforms]);

  // ─── Resolve total budget ─────────────────────────────────────────────────
  // Priority 1: budget_data.total
  // Priority 2: sum of all platform budgets in budget_data
  // Priority 3: total_spend flat field
  const budgetData: Record<string, number> = campaign.budget_data ?? {};
  // Only sum budgets for platforms actually selected in this campaign
  const sumFromSelectedPlatforms = platforms
    .filter((p) => p !== PLATFORMS.GMAIL)
    .reduce((sum, p) => sum + (Number(budgetData[p]) || 0), 0);

  const totalBudget: number =
    sumFromSelectedPlatforms > 0
      ? sumFromSelectedPlatforms
      : (campaign.total_spend ?? 0);

  const ctr =
    insights.impressions > 0
      ? ((insights.clicks / insights.impressions) * 100).toFixed(2)
      : "0";

  // ─── EMAIL CAMPAIGN METRICS (from Mailchimp insights JSON) ───────────────
  // These come from campaign.insights JSONField saved by
  // GET /api/campaigns/<id>/mailchimp-insights/
  // Fields: emails_sent, opens, open_rate, clicks, click_rate,
  //         bounces, unsubscribes, last_open, last_click, synced_at
  const emailMetrics = [
    {
      title: "Emails Sent",
      value: campaign.emails_sent ?? 0,
      icon: impressionsIcon,
    },
    {
      title: "Total Opens",
      value: campaign.impressions ?? 0, // impressions = opens from backend
      icon: clicksIcon,
    },
    {
      title: "Open Rate",
      value: campaign.open_rate != null ? `${campaign.open_rate}%` : "0%",
      icon: ctrIcon,
    },
    {
      title: "Total Clicks",
      value: campaign.clicks ?? 0,
      icon: cpcIcon,
    },
    {
      title: "Click Rate",
      value: campaign.click_rate != null ? `${campaign.click_rate}%` : "0%",
      icon: conversionRateIcon,
    },
    {
      title: "Bounces",
      value: campaign.bounces ?? 0,
      icon: spendIcon,
    },
    {
      title: "Unsubscribes",
      value: campaign.unsubscribes ?? 0,
      icon: cpaIcon,
    },
    {
      title: "Leads Generated",
      value: campaign.lead_generated || 0,
      icon: conversionsIcon,
    },
  ];

  // ─── SOCIAL CAMPAIGN METRICS (Facebook/Instagram/LinkedIn) ───────────────
  const socialMetrics = [
    {
      title: "Total Impressions",
      value: campaign.impressions ?? 0,
      icon: impressionsIcon,
    },
    {
      title: "Total Clicks",
      value: campaign.clicks ?? 0,
      icon: clicksIcon,
    },
    {
      title: "Conversions",
      value: campaign.lead_generated || "0",
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
      value: `${campaign.conversion_rate ?? 0}%`,
      icon: conversionRateIcon,
    },
    {
      title: "CPC",
      value: `$${campaign.cpc?.toFixed(2) ?? "0.00"}`,
      icon: cpcIcon,
    },
    {
      title: "CPA",
      value: "$0",
      icon: cpaIcon,
    },
  ];

  // ─── Pick correct metrics based on campaign type ──────────────────────────
  const metrics =
    campaign.type === CAMPAIGN_TYPE.EMAIL ? emailMetrics : socialMetrics;

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
                  campaign.type === CAMPAIGN_TYPE.EMAIL
                    ? "cd-mail-icon"
                    : "cd-globe-icon"
                }
              >
                <img
                  src={campaign.type === CAMPAIGN_TYPE.EMAIL ? mailIcon : globeIcon}
                  alt={campaign.type}
                />
              </div>
              <span className="cd-header-title">{campaign.name}</span>
              <span className={`status ${campaign.status.toLowerCase()}`}>
                {campaign.status}
              </span>
            </div>
          </div>

          <div className="cd-header-meta">
            <Meta label="Campaign Duration" value={duration} />
            <Meta label="Schedule Time" value={scheduleTime} />
            <Meta
              label="Campaign Objective"
              value={
                campaign.objective
                  ? CAMPAIGN_OBJECTIVES[
                      campaign.objective as keyof typeof CAMPAIGN_OBJECTIVES
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
            <Meta label="Campaign Type" value={campaign.type.toUpperCase()} />
            <Meta
              label="Leads Generated"
              value={campaign.lead_generated || 0}
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

      {/* ================= SUB TABS (Dynamic Platforms) ================= */}
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
        campaign={campaign}
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
  // ── Social metrics ──
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

  // ── Email / Mailchimp metrics ──
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