/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import "../../../../src/styles/Campaign/CampaignTabContent.css";
import contentImage from "./Images/vidai.png";
import instagramIcon from"./Icons/instagram.png";
import facebookIcon from"./Icons/facebook.png";
import linkedinIcon from"./Icons/linkedin.png";
import { Sector } from "recharts";
import type { Campaign } from "../../../types/campaigns.types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Props {
  campaign: Campaign;   
  activeTab: string;
  // activeSubTab: string;
}

// const performanceData = campaign.performance_data || [];

// const allocation = campaign.budget_data?.allocation || {};

// const platformData = Object.keys(allocation).map((key) => ({
//   name: key.charAt(0).toUpperCase() + key.slice(1),
//   value:
//     campaign.budget_data?.total_budget > 0
//       ? Math.round(
//           (allocation[key] /
//             campaign.budget_data.total_budget) *
//             100,
//         )
//       : 0,
//   color: "#A8AEBF"
// }));

const CampaignTabContent: React.FC<Props> = ({
  campaign,
  activeTab
  // activeSubTab
}) => {
  const performanceData = campaign.performance_data || [];

const allocation = campaign.budget_data?.allocation || {};

const totalBudget = campaign.budget_data?.total_budget || 0;

const platformData = Object.keys(allocation).map((key) => ({
  name: key.charAt(0).toUpperCase() + key.slice(1),
  value:
    totalBudget > 0
      ? Math.round((allocation[key] / totalBudget) * 100)
      : 0,
  color: "#A8AEBF",
}));
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<"facebook" | "instagram">("facebook");
  // const [activeIndex, setActiveIndex] =
  // React.useState<number | undefined>(undefined);

  /* ================= CONTENT ================= */
  if (activeTab === "Content") {
  return (
    <div className="cd-content-card">
      
      {/* LEFT SIDE TEXT */}
      <div className="cd-content-text">
        <h3 className="cd-content-title">
          {campaign.type === "email"
            ? campaign.email?.[0]?.subject || "No Subject"
            : campaign.campaign_name || "Campaign"}
        </h3>

        <p>
          {campaign.type === "email"
            ? campaign.email?.[0]?.email_body || "No Email Content"
            : campaign.campaign_content || "No Content Available"}
        </p>
      </div>

      {/* RIGHT SIDE IMAGE (UNCHANGED) */}
      <div className="cd-content-image">
        <img src={contentImage} alt="Campaign Content" />
      </div>

    </div>
  );
}

  /* ================= PERFORMANCE ================= */
 if (activeTab === "Performance") {
  return (
    <div className="cd-performance-card">
      <h4 className="cd-perf-title">Impressions</h4>
      <div className="cd-perf-divider"></div>
      <div className="cd-perf-row">
        <div className="cd-perf-left">
          <div className="cd-perf-number">1500</div>
          <div className="cd-perf-sub">Total Impressions</div>
        </div>

        <div className="cd-platform-toggle">
          <label>
            <input
              type="radio"
              checked={selectedPlatform === "facebook"}
              onChange={() => setSelectedPlatform("facebook")}
            />
            Facebook
          </label>

          <label>
            <input
              type="radio"
              checked={selectedPlatform === "instagram"}
              onChange={() => setSelectedPlatform("instagram")}
            />
            Instagram
          </label>
        </div>

      </div>
     <ResponsiveContainer width="100%" height={210}>
  <LineChart
    data={performanceData}
    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
  >
    <defs>
      <filter id="lineShadow" height="200%">
        <feDropShadow
          dx="0"
          dy="4"
          stdDeviation="8"
          floodColor="#5B6EF5"
          floodOpacity="0.15"
        />
      </filter>
    </defs>
    <CartesianGrid
      strokeDasharray="4 4"
      vertical={false}
      stroke="#F1F1F1"
    />

    <XAxis
      dataKey="date"
      axisLine={false}
      tickLine={false}
      stroke="#9E9E9E"
    />

    <YAxis
      axisLine={false}
      tickLine={false}
      stroke="#9E9E9E"
    />

    <Tooltip content={<CustomTooltip />} />

    <Line
  type="natural"
  dataKey={selectedPlatform}
  stroke="#5B6EF5"
  strokeWidth={2.5}
  dot={false}
  filter="url(#lineShadow)"
  activeDot={{
    r: 6,
    stroke: "#ffffff",
    strokeWidth: 3,
    fill: "#5B6EF5"
  }}
/>
  </LineChart>
</ResponsiveContainer>

    </div>
  );
}

  /* ================= PLATFORM BREAKDOWN ================= */
  if (activeTab === "Platform Breakdown") {
  return (
    <div className="cd-platform-wrapper">
      <h3 className="cd-platform-title">
        Platform Distribution & Performance
      </h3>
      <div className="cd-platform-divider"></div>
      <div className="cd-platform-main">
        <div className="cd-pie-wrapper">

  <ResponsiveContainer width="100%" height={320}>
  <PieChart>

   <Pie
  data={platformData}
  dataKey="value"
  nameKey="name"
  outerRadius={130}
  activeShape={(props: any) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload
    } = props;

    const RADIAN = Math.PI / 180;

    const midRadius =
    innerRadius + (outerRadius - innerRadius) / 2;

    const x =
    cx + midRadius * Math.cos(-midAngle * RADIAN);

    const y =
    cy + midRadius * Math.sin(-midAngle * RADIAN);

    return (
      <>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
<foreignObject
  x={x - 40}
  y={y - 35}
  width="90"
  height="70"
>
  <div
    style={{
      position: "relative",
      background: "#ffffff",
      borderRadius: "14px",
      padding: "8px 12px",
      textAlign: "center",
      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <div
      style={{
        fontSize: "14px",
        fontWeight: 600,
        color: "#222"
      }}
    >
      {payload.value} %
    </div>

    <div
      style={{
        fontSize: "12px",
        color: "#8A8A8A",
        marginTop: "2px"
      }}
    >
      {payload.name}
    </div>

    <div
      style={{
        position: "absolute",
        bottom: "-4px",
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: "6px solid #ffffff",
        filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.06))"
      }}
    />
  </div>
</foreignObject>
      </>
    );
  }}
>
  {platformData.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={entry.color} />
  ))}
</Pie>

  </PieChart>
</ResponsiveContainer>
          <div className="cd-platform-legend">
            <div>
              <span className="legend-dot dot1"></span>
              <img src={instagramIcon} alt="Instagram" />
              Instagram
            </div>

            <div>
              <span className="legend-dot dot2"></span>
              <img src={facebookIcon} alt="Facebook" />
              Facebook
            </div>

            <div>
              <span className="legend-dot dot3"></span>
              <img src={linkedinIcon} alt="LinkedIn" />
              LinkedIn
            </div>
          </div>

        </div>
        <div className="cd-platform-cards">

          {Object.keys(allocation).map((platform) => {
  const spend = allocation[platform] || 0;

  return (
    <PlatformCard
      key={platform}
      icon={
        platform === "instagram"
          ? instagramIcon
          : platform === "facebook"
          ? facebookIcon
          : linkedinIcon
      }
      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
      spend={`$${spend}`}
      conversion={String(campaign.lead_generated ?? 0)}
    />
  );
})}

          {/* <PlatformCard
            icon={facebookIcon}
            title="Facebook"
            spend="$1300"
            conversion="40"
          />

          <PlatformCard
            icon={linkedinIcon}
            title="LinkedIn"
            spend="$1500"
            conversion="80"
          /> */}

        </div>

      </div>
    </div>
  );
}

  if (activeTab === "AI Insights") {
  return (
    <div className="cd-ai-wrapper">
      <h3 className="cd-ai-title">AI-Powered Insights</h3>
      <div className="cd-ai-divider"></div>
      <div className="cd-ai-cards">
        <div className="cd-ai-card green">
          <div className="cd-ai-heading">High Performer</div>
          <p>
            Your LinkedIn ads are outperforming by 35%. The B2B audience is highly engaged.
            Consider allocating 15–20% more budget to LinkedIn.
          </p>
        </div>

        <div className="cd-ai-card blue">
          <div className="cd-ai-heading">Optimization Opportunity</div>
          <p>
            Peak engagement occurs between 10 AM – 2 PM EST. Schedule posts during these
            hours for 23% higher CTR.
          </p>
        </div>

        <div className="cd-ai-card purple">
          <div className="cd-ai-heading">Content Recommendation</div>
          <p>
            Video content generates 2.8x more engagement. Consider adding video creatives
            to Instagram & Facebook.
          </p>
        </div>

        <div className="cd-ai-card orange">
          <div className="cd-ai-heading">Budget Efficiency</div>
          <p>
            Cost Per Conversion is 12% below target. Increase budget by $500 while
            maintaining profitability.
          </p>
        </div>

      </div>
    </div>
  );
}

  return null;
};
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#ffffff",
          padding: "8px 14px",
          borderRadius: "10px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          fontSize: "13px",
          fontWeight: 500
        }}
      >
        {payload[0].value} Impressions
      </div>
    );
  }
  return null;
};
const PlatformCard = ({
  icon,
  title,
  spend,
  conversion
}: {
  icon: string;
  title: string;
  spend: string;
  conversion: string;
}) => (
  <div className="cd-platform-card">
    <div className="cd-platform-header">
      <img className="cd-platform-icon" src={icon} alt={title} />
      <span>{title}</span>
    </div>

    <div className="cd-platform-metrics">
      <span className="spend">Spend: {spend}</span>
      <span className="conversion">Conversion: {conversion}</span>
    </div>
  </div>
);

export default CampaignTabContent;
