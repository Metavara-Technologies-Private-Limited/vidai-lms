/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import "../../../../src/styles/Campaign/CampaignTabContent.css";
import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";
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
  ResponsiveContainer,
} from "recharts";

interface Props {
  campaign: Campaign;
  activeTab: string;
  activeSubTab: string;
}

const performanceData = [
  { date: "1 Jan", facebook: 650, instagram: 520 },
  { date: "2 Jan", facebook: 630, instagram: 600 },
  { date: "3 Jan", facebook: 520, instagram: 480 },
  { date: "4 Jan", facebook: 280, instagram: 320 },
  { date: "5 Jan", facebook: 240, instagram: 260 },
  { date: "6 Jan", facebook: 620, instagram: 580 },
  { date: "7 Jan", facebook: 160, instagram: 220 },
];

const platformData = [
  { name: "Instagram", value: 30, color: "#A8AEBF" },
  { name: "Facebook", value: 20, color: "#C5CAD8" },
  { name: "LinkedIn", value: 50, color: "#8D95A8" },
];

const CampaignTabContent: React.FC<Props> = ({
  campaign,
  activeTab,
  activeSubTab,
}) => {
  const [selectedPlatform, setSelectedPlatform] = React.useState<
    "facebook" | "instagram"
  >("facebook");

  // ─── Resolve content & image for the active platform ────────────────────
  const platformData_raw: Record<string, string> =
    (campaign as any).platform_data ?? {};

  // Get the text for the active sub-tab platform (or fall back to campaign_content)
  const activePlatformKey = (activeSubTab || "").toLowerCase();
  const platformText: string =
    platformData_raw[activePlatformKey] ||
    (campaign as any).campaign_content ||
    "";

  // Image URL stored on the campaign
  const imageUrl: string = (campaign as any).image_url || "";

  // Parse the text — strip raw URLs (they are shown as image), extract hashtags
  const URL_REGEX = /https?:\/\/\S+/gi;
  const cleanedText = platformText.replace(URL_REGEX, "").trim();
  const lines = cleanedText.split("\n").filter((l) => l.trim());
  const hashtagLine = lines.find((l) => l.trim().startsWith("#")) || "";
  const bodyLines = lines.filter((l) => l.trim() && !l.trim().startsWith("#"));

  /* ================= CONTENT ================= */
  if (activeTab === "Content") {
    const hasImage = Boolean(imageUrl);
    const hasText = bodyLines.length > 0 || platformText;

    return (
      <div className="cd-content-card">
        {/* Text side */}
        <div
          className="cd-content-text"
          style={{ flex: hasImage ? "1 1 55%" : "1 1 100%" }}
        >
          {/* Campaign name as title */}
          <h3 className="cd-content-title">{campaign.name}</h3>

          {/* Body paragraphs */}
          {hasText ? (
            bodyLines.length > 0 ? (
              bodyLines.map((line, i) => (
                <p key={i} style={{ marginBottom: "10px", lineHeight: 1.6 }}>
                  {line}
                </p>
              ))
            ) : (
              <p style={{ lineHeight: 1.6 }}>{platformText}</p>
            )
          ) : (
            <p style={{ color: "#aaa", fontStyle: "italic" }}>
              No content available for this platform.
            </p>
          )}

          {/* Hashtags */}
          {hashtagLine && (
            <p className="cd-content-tags">{hashtagLine}</p>
          )}
        </div>

        {/* Image side — only render if image exists */}
        {hasImage && (
          <div className="cd-content-image">
            <img
              src={imageUrl}
              alt="Campaign"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "12px",
              }}
              onError={(e) => {
                // Hide image container if load fails
                (e.currentTarget.parentElement as HTMLElement).style.display =
                  "none";
              }}
            />
          </div>
        )}
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
            <YAxis axisLine={false} tickLine={false} stroke="#9E9E9E" />
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
                fill: "#5B6EF5",
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
                      payload,
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
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#222",
                              }}
                            >
                              {payload.value} %
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#8A8A8A",
                                marginTop: "2px",
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
                                filter:
                                  "drop-shadow(0 3px 3px rgba(0,0,0,0.06))",
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
            <PlatformCard
              icon={instagramIcon}
              title="Instagram"
              spend="$1200"
              conversion="60"
            />
            <PlatformCard
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
            />
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
              Your LinkedIn ads are outperforming by 35%. The B2B audience is
              highly engaged. Consider allocating 15–20% more budget to
              LinkedIn.
            </p>
          </div>

          <div className="cd-ai-card blue">
            <div className="cd-ai-heading">Optimization Opportunity</div>
            <p>
              Peak engagement occurs between 10 AM – 2 PM EST. Schedule posts
              during these hours for 23% higher CTR.
            </p>
          </div>

          <div className="cd-ai-card purple">
            <div className="cd-ai-heading">Content Recommendation</div>
            <p>
              Video content generates 2.8x more engagement. Consider adding
              video creatives to Instagram & Facebook.
            </p>
          </div>

          <div className="cd-ai-card orange">
            <div className="cd-ai-heading">Budget Efficiency</div>
            <p>
              Cost Per Conversion is 12% below target. Increase budget by $500
              while maintaining profitability.
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
          fontWeight: 500,
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
  conversion,
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