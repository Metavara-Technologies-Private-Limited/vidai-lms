/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import "../../styles/Campaign/CampaignTabContent.css";
import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";
import googleAdsIcon from "./Icons/google-ads.png";
import { Sector } from "recharts";
import type { Campaign } from "../../types/campaigns.types";
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

// ✅ NEW: adInsights shape passed from CampaignDashboard
interface AdInsights {
  impressions: number;
  clicks: number;
  spend: string;
  reach: string;
  cpc: string;
  cpm: string;
  conversions: number;
  total_budget: string;
  conversion_rate: string;
  ctr: string;
}

interface Props {
  campaign: Campaign;
  activeTab: string;
  activeSubTab: string;
  adInsights?: AdInsights; // ✅ NEW: real insights from parent
}

const PIE_COLORS: Record<string, string> = {
  instagram: "#A8AEBF",
  facebook: "#C5CAD8",
  linkedin: "#8D95A8",
  gmail: "#ECB856",
  google_ads: "#4285F4",
};

const CampaignTabContent: React.FC<Props> = ({
  campaign,
  activeTab,
  activeSubTab,
  adInsights, // ✅ NEW
}) => {
  const [selectedPlatform, setSelectedPlatform] = React.useState<
    "facebook" | "instagram" | "google_ads" | "linkedin"
  >("facebook");

  // ─── Resolve content & image for the active platform ────────────────────
  const platformData_raw: Record<string, string> =
    (campaign as any).platform_data ?? {};

  const activePlatformKey = (activeSubTab || "").toLowerCase();
  const platformText: string =
    platformData_raw[activePlatformKey] ||
    (campaign as any).campaign_content ||
    "";

  const imageUrl: string = (campaign as any).image_url || "";

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
        <div
          className="cd-content-text"
          style={{ flex: hasImage ? "1 1 55%" : "1 1 100%" }}
        >
          <h3 className="cd-content-title">{campaign.name}</h3>

          {hasText ? (
            platformText.trim().startsWith("<") ? (
              <div
                dangerouslySetInnerHTML={{ __html: platformText }}
                style={{ lineHeight: 1.6 }}
              />
            ) : (
              bodyLines.map((line, i) => (
                <p key={i} style={{ marginBottom: "10px", lineHeight: 1.6 }}>
                  {line}
                </p>
              ))
            )
          ) : (
            <p style={{ color: "#aaa", fontStyle: "italic" }}>
              No content available for this platform.
            </p>
          )}

          {hashtagLine && <p className="cd-content-tags">{hashtagLine}</p>}
        </div>

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
    const platforms: string[] = (campaign as any).platforms ?? [];
    const isEmail = campaign.type === "email";

    // ✅ Build real chart data from adInsights — one summary bar per metric
    // Since we have totals (not time-series), we show a summary metrics bar
    // and replace the mock line chart with a real metrics display
    const impressions = adInsights?.impressions ?? 0;
    const clicks      = adInsights?.clicks ?? 0;
    const ctr         = adInsights?.ctr ?? "0";
    const cpc         = adInsights?.cpc ?? "0";
    const spend       = adInsights?.spend ?? "0";
    const conversions = adInsights?.conversions ?? 0;

    const hasRealData = impressions > 0 || clicks > 0 || parseFloat(spend) > 0;

    // ✅ Build chart data — show metric breakdown as bar-style line chart
    const chartData = hasRealData
      ? [
          { metric: "Impressions", value: impressions },
          { metric: "Clicks",      value: clicks },
          { metric: "Conversions", value: conversions },
        ]
      : [];

    // ✅ Platform toggle — only show platforms this campaign has
    const availablePlatforms = platforms.filter((p) =>
      ["facebook", "instagram", "google_ads", "linkedin"].includes(p)
    );

    return (
      <div className="cd-performance-card">
        <h4 className="cd-perf-title">Performance Overview</h4>
        <div className="cd-perf-divider"></div>

        {/* ✅ Platform toggle — dynamic based on campaign platforms */}
        <div className="cd-perf-row">
          <div className="cd-perf-left">
            <div className="cd-perf-number">
              {isEmail
                ? ((campaign as any).impressions ?? 0)
                : hasRealData
                  ? impressions.toLocaleString()
                  : "—"}
            </div>
            <div className="cd-perf-sub">
              {isEmail ? "Total Opens" : hasRealData ? "Total Impressions" : "No data yet"}
            </div>
          </div>

          {!isEmail && availablePlatforms.length > 0 && (
            <div className="cd-platform-toggle">
              {availablePlatforms.map((p) => (
                <label key={p}>
                  <input
                    type="radio"
                    checked={selectedPlatform === p}
                    onChange={() => setSelectedPlatform(p as any)}
                  />
                  {p === "google_ads" ? "Google Ads" : p.charAt(0).toUpperCase() + p.slice(1)}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* ✅ Real metrics summary cards */}
        {!isEmail && hasRealData && (
          <div style={{
            display: "flex",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}>
            {[
              { label: "Impressions", value: impressions.toLocaleString(),     color: "#5B6EF5" },
              { label: "Clicks",      value: clicks.toLocaleString(),           color: "#47B35F" },
              { label: "CTR",         value: `${parseFloat(ctr).toFixed(2)}%`, color: "#ECB856" },
              { label: "Avg CPC",     value: `₹${parseFloat(cpc).toFixed(2)}`, color: "#F25B5B" },
              { label: "Cost",        value: `₹${parseFloat(spend).toFixed(2)}`, color: "#835DEF" },
              { label: "Conversions", value: String(conversions),               color: "#2D6BF0" },
            ].map((m) => (
              <div key={m.label} style={{
                flex: "1 1 130px",
                background: "#f9f9fb",
                borderRadius: "12px",
                padding: "14px 16px",
                borderLeft: `4px solid ${m.color}`,
              }}>
                <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{m.label}</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#222" }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Chart — real data if available, message if not */}
        {isEmail ? (
          <ResponsiveContainer width="100%" height={210} minWidth={0}>
            <LineChart
              data={[
                { date: "Opens",       value: (campaign as any).impressions ?? 0 },
                { date: "Clicks",      value: (campaign as any).clicks ?? 0 },
                { date: "Bounces",     value: (campaign as any).bounces ?? 0 },
                { date: "Unsubscribes",value: (campaign as any).unsubscribes ?? 0 },
              ]}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F1F1" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="#9E9E9E" />
              <YAxis axisLine={false} tickLine={false} stroke="#9E9E9E" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#5B6EF5"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#5B6EF5" }}
                activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 3, fill: "#5B6EF5" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : hasRealData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={210} minWidth={0}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <filter id="lineShadow" height="200%">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#5B6EF5" floodOpacity="0.15" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F1F1" />
              <XAxis dataKey="metric" axisLine={false} tickLine={false} stroke="#9E9E9E" />
              <YAxis axisLine={false} tickLine={false} stroke="#9E9E9E" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="natural"
                dataKey="value"
                stroke="#5B6EF5"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#5B6EF5" }}
                filter="url(#lineShadow)"
                activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 3, fill: "#5B6EF5" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{
            height: 210,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#aaa",
            fontSize: "14px",
            background: "#fafafa",
            borderRadius: "12px",
          }}>
            No performance data yet — insights will appear after Zapier fetches them.
          </div>
        )}
      </div>
    );
  }

  /* ================= PLATFORM BREAKDOWN ================= */
  if (activeTab === "Platform Breakdown") {
    const budgetRaw: Record<string, number> =
      (campaign as any).budget_data ?? {};
    const selectedPlatforms: string[] = (campaign as any).platforms ?? [];
    const totalBudget = selectedPlatforms.reduce(
      (s, p) => s + (budgetRaw[p] ?? 0),
      0,
    );
    const leadCount = (campaign as any).lead_generated ?? 0;

    const platformData = selectedPlatforms
      .filter((p) => (budgetRaw[p] ?? 0) > 0)
      .map((p) => ({
        name: p.charAt(0).toUpperCase() + p.slice(1),
        value:
          totalBudget > 0
            ? Math.round(((budgetRaw[p] ?? 0) / totalBudget) * 100)
            : 0,
        color: PIE_COLORS[p] ?? "#ccc",
      }));

    const pieData =
      platformData.length > 0
        ? platformData
        : selectedPlatforms.map((p) => ({
            name: p.charAt(0).toUpperCase() + p.slice(1),
            value: Math.round(100 / selectedPlatforms.length),
            color: PIE_COLORS[p] ?? "#ccc",
          }));

    const platformIconMap: Record<string, string> = {
      instagram: instagramIcon,
      facebook: facebookIcon,
      linkedin: linkedinIcon,
      google_ads: googleAdsIcon,
    };

    return (
      <div className="cd-platform-wrapper">
        <h3 className="cd-platform-title">
          Platform Distribution & Performance
        </h3>
        <div className="cd-platform-divider"></div>
        <div className="cd-platform-main">
          <div className="cd-pie-wrapper">
            <ResponsiveContainer width="100%" height={320} minWidth={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={130}
                  activeShape={(props: any) => {
                    const {
                      cx, cy, midAngle, innerRadius, outerRadius,
                      startAngle, endAngle, fill, payload,
                    } = props;

                    const RADIAN = Math.PI / 180;
                    const midRadius = innerRadius + (outerRadius - innerRadius) / 2;
                    const x = cx + midRadius * Math.cos(-midAngle * RADIAN);
                    const y = cy + midRadius * Math.sin(-midAngle * RADIAN);

                    return (
                      <>
                        <Sector
                          cx={cx} cy={cy}
                          innerRadius={innerRadius}
                          outerRadius={outerRadius + 6}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                        />
                        <foreignObject x={x - 40} y={y - 35} width="90" height="70">
                          <div style={{
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
                          }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>
                              {payload.value} %
                            </div>
                            <div style={{ fontSize: "12px", color: "#8A8A8A", marginTop: "2px" }}>
                              {payload.name}
                            </div>
                            <div style={{
                              position: "absolute",
                              bottom: "-4px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: 0, height: 0,
                              borderLeft: "6px solid transparent",
                              borderRight: "6px solid transparent",
                              borderTop: "6px solid #ffffff",
                              filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.06))",
                            }} />
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
              {pieData.map((p, i) => (
                <div key={p.name}>
                  <span
                    className={`legend-dot dot${i + 1}`}
                    style={{ background: p.color }}
                  />
                  <img
                    src={platformIconMap[p.name.toLowerCase().replace(" ", "_")] ?? instagramIcon}
                    alt={p.name}
                  />
                  {p.name}
                </div>
              ))}
            </div>
          </div>
          <div className="cd-platform-cards">
            {selectedPlatforms.map((p) => (
              <PlatformCard
                key={p}
                icon={platformIconMap[p] ?? instagramIcon}
                title={p === "google_ads" ? "Google Ads" : p.charAt(0).toUpperCase() + p.slice(1)}
                spend={`$${budgetRaw[p] ?? 0}`}
                conversion={String(leadCount)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================= AI INSIGHTS ================= */
  if (activeTab === "AI Insights") {
    const isEmail = campaign.type === "email";
    const platforms: string[] = (campaign as any).platforms ?? [];
    const budgetRaw: Record<string, number> = (campaign as any).budget_data ?? {};
    const totalBudget = platforms.reduce((s, p) => s + (budgetRaw[p] ?? 0), 0);
    const leadCount = (campaign as any).lead_generated ?? 0;
    const topPlatform =
      [...platforms].sort((a, b) => (budgetRaw[b] ?? 0) - (budgetRaw[a] ?? 0))[0] ?? "facebook";
    const cpa = leadCount > 0 ? (totalBudget / leadCount).toFixed(2) : null;

    return (
      <div className="cd-ai-wrapper">
        <h3 className="cd-ai-title">AI-Powered Insights</h3>
        <div className="cd-ai-divider"></div>
        <div className="cd-ai-cards">
          <div className="cd-ai-card green">
            <div className="cd-ai-heading">
              {isEmail ? "Email Performance" : "Top Platform"}
            </div>
            <p>
              {isEmail
                ? `Your email campaign achieved ${(campaign as any).impressions ?? 0} opens and ${(campaign as any).clicks ?? 0} clicks with a ${(campaign as any).conversion_rate ?? 0}% conversion rate.`
                : `${topPlatform === "google_ads" ? "Google Ads" : topPlatform.charAt(0).toUpperCase() + topPlatform.slice(1)} has the highest budget allocation at $${budgetRaw[topPlatform] ?? 0}. Monitor leads closely from this platform.`}
            </p>
          </div>

          <div className="cd-ai-card blue">
            <div className="cd-ai-heading">Optimization Opportunity</div>
            <p>
              {isEmail
                ? `You have ${(campaign as any).bounces ?? 0} bounces and ${(campaign as any).unsubscribes ?? 0} unsubscribes. Clean your list regularly to improve deliverability.`
                : `Campaign runs from ${campaign.start} to ${campaign.end}. Schedule posts between 10 AM – 2 PM for 23% higher engagement.`}
            </p>
          </div>

          <div className="cd-ai-card purple">
            <div className="cd-ai-heading">Content Recommendation</div>
            <p>
              {isEmail
                ? "Use personalized subject lines and strong CTAs to improve open rates. Consider A/B testing your email content."
                : `${platforms.includes("instagram") ? "Add high-quality images for Instagram — image posts get 38% more engagement. " : ""}${platforms.includes("google_ads") ? "Use keyword-rich headlines for Google Ads to maximize search visibility. " : ""}Video content generates 2.8x more engagement across social platforms.`}
            </p>
          </div>

          <div className="cd-ai-card orange">
            <div className="cd-ai-heading">Budget Efficiency</div>
            <p>
              {cpa
                ? `Current Cost Per Acquisition is $${cpa} based on ${leadCount} lead${leadCount !== 1 ? "s" : ""} from a $${totalBudget} budget.`
                : `Total budget is $${totalBudget}. No conversions tracked yet — ensure your landing page captures leads correctly.`}
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
      <div style={{
        background: "#ffffff",
        padding: "8px 14px",
        borderRadius: "10px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        fontSize: "13px",
        fontWeight: 500,
      }}>
        {payload[0].value?.toLocaleString()} {payload[0].payload?.metric ?? "Impressions"}
      </div>
    );
  }
  return null;
};

const PlatformCard = ({
  icon, title, spend, conversion,
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