/* eslint-disable @typescript-eslint/no-explicit-any */
import "../../../../src/styles/Campaign/CampaignDashboard.css";
import React from "react";
import dayjs from "dayjs";
import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";
import emailIcon from "./Icons/Email.png";
import globeIcon from "./Images/globe.png";
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

interface Campaign {
  id: string;
  name: string;
  type: "social" | "email";
  status: string;
  start: string;
  end: string;
  platforms: string[];
  lead_generated?: number;
  scheduledAt?: string;
  objective?: string;
}

const platformIconMap: Record<string, string> = {
  facebook: facebookIcon,
  instagram: instagramIcon,
  linkedin: linkedinIcon,
  gmail: emailIcon,
};

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

  const scheduleTime = campaign.scheduledAt
    ? dayjs(campaign.scheduledAt).format("DD MMM YYYY, hh:mm A")
    : "-";

  const platforms = campaign.platforms || [];

  const metrics = [
    { title: "Total Impressions", value: "0", icon: impressionsIcon },
    { title: "Total Clicks", value: "0", icon: clicksIcon },
    {
      title: "Conversions",
      value: campaign.lead_generated || "0",
      icon: conversionsIcon,
    },
    { title: "Total Spend", value: "$0", icon: spendIcon },
    { title: "CTR", value: "0%", icon: ctrIcon },
    { title: "Conversion Rate", value: "0%", icon: conversionRateIcon },
    { title: "CPC", value: "$0", icon: cpcIcon },
    { title: "CPA", value: "$0", icon: cpaIcon },
  ];

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
              <div className="cd-globe">
                <img src={globeIcon} alt="Global" />
              </div>

              <span className="cd-header-title">{campaign.name}</span>

              <span className={`cd-live ${campaign.status.toLowerCase()}`}>
                {campaign.status}
              </span>
            </div>
          </div>

          <div className="cd-header-meta">
            <Meta label="Campaign Duration" value={duration} />
            <Meta label="Schedule Time" value={scheduleTime} />
            <Meta
              label="Campaign Objective"
              value={campaign.objective || "-"}
            />

            <Meta
              label="Platform"
              value={
                <div className="cd-platform-icons">
                  {platforms.map((p) => (
                    <img key={p} src={platformIconMap[p]} alt={p} />
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
const Meta = ({ label, value }: { label: string; value: any }) => (
  <div className="cd-meta-block">
    <span className="cd-meta-label">{label}</span>
    <span className="cd-meta-value">{value}</span>
  </div>
);

/* ================= METRIC ================= */
const Metric = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) => (
  <div className="cd-metric-card">
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
