import React from "react";
import "../../../../src/styles/Campaign/CampaignTabContent.css";
import contentImage from "./Images/vidai.png";
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


import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import linkedinIcon from "./Icons/linkedin.png";


interface Props {
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
  { date: "7 Jan", facebook: 160, instagram: 220 }
];
const platformData = [
  { name: "Instagram", value: 30, color: "#A8AEBF" },
  { name: "Facebook", value: 20, color: "#C5CAD8" },
  { name: "LinkedIn", value: 50, color: "#8D95A8" }
];


const CampaignTabContent: React.FC<Props> = ({
  activeTab,
  activeSubTab
}) => {

  /* ================= CONTENT ================= */
  if (activeTab === "Content") {
    return (
      <div className="cd-content-card">
        <div className="cd-content-text">
          <h3 className="cd-content-title">IVF Awareness</h3>

          <p>
            Struggling to conceive can feel overwhelming—but you’re not alone.
            IVF has become a safe and proven path.
          </p>

          <p className="cd-content-tags">
            #IVFAwareness #FertilityCare #ParenthoodJourney
          </p>
        </div>

        <div className="cd-content-image">
          <img src={contentImage} alt="IVF Awareness Ad" />
        </div>
      </div>
    );
  }

  /* ================= PERFORMANCE ================= */
  if (activeTab === "Performance") {
    const dataKey =
      activeSubTab === "Facebook" ? "facebook" : "instagram";

    return (
      <div className="cd-performance-card">

        <div className="cd-performance-header">
          <h3>Impressions</h3>
          <span className="cd-total">1500</span>
          <p>Total Impressions</p>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={performanceData}>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#eee"
            />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip cursor={{ stroke: "#ccc", strokeWidth: 2 }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#6C7CF7"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 8, stroke: "#fff", strokeWidth: 3 }}
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

      <div className="cd-platform-content">

        {/* LEFT PIE CHART */}
        <div className="cd-pie-section">
          <ResponsiveContainer width={400} height={400}>
            <PieChart>
              <Pie
                data={platformData}
                dataKey="value"
                nameKey="name"
                innerRadius={0}
                outerRadius={160}
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="cd-platform-legend">
            <div>
              <span className="legend-dot dot1"></span>
              <img src={instagramIcon} alt="" />
              Instagram
            </div>
            <div>
              <span className="legend-dot dot2"></span>
              <img src={facebookIcon} alt="" />
              Facebook
            </div>
            <div>
              <span className="legend-dot dot3"></span>
              <img src={linkedinIcon} alt="" />
              LinkedIn
            </div>
          </div>
        </div>

        {/* RIGHT CARDS */}
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
  /* ================= AI INSIGHTS ================= */
  if (activeTab === "AI Insights") {
    return (
      <div className="cd-placeholder-card">
        <h3>AI Insights Coming Soon</h3>
      </div>
    );
  }

  return null;
};
/* ================= PLATFORM CARD COMPONENT ================= */
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
      <img src={icon} alt={title} />
      <span>{title}</span>
    </div>

    <div className="cd-platform-metrics">
      <span className="spend">Spend: {spend}</span>
      <span className="conversion">
        Conversion: {conversion}
      </span>
    </div>
  </div>
);


export default CampaignTabContent;
