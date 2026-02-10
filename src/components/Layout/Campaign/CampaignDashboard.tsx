import "../../../../src/styles/Campaign/CampaignDashboard.css";
import React from "react";

import instagramIcon from "./Icons/instagram.png";
import facebookIcon from "./Icons/facebook.png";
import globeIcon from "./Images/globe.png";
import contentImage from"./Images/vidai.png";
import impressionsIcon from "./Icons/impressions.png";
import clicksIcon from "./Icons/clicks.png";
import conversionsIcon from "./Icons/conversions.png";
import spendIcon from "./Icons/spend.png";
import ctrIcon from "./Icons/ctr.png";
import conversionRateIcon from "./Icons/conversion-rate.png";
import cpcIcon from "./Icons/cpc.png";
import cpaIcon from "./Icons/cpa.png";

import { useNavigate } from "react-router-dom";

const CampaignDashboard = () => {
  const navigate = useNavigate();
const [activeTab, setActiveTab] = React.useState("Content");
const [activeSubTab, setActiveSubTab] = React.useState("Facebook");

  return (
    <div className="cd-wrapper">

      {/* ================= HEADER SECTION ================= */}
      <div className="cd-header-section">

        {/* BACK BUTTON */}
        <button
          className="cd-back-btn"
          onClick={() => navigate("/campaigns")}
          aria-label="Back to campaigns"
        >
          <span className="cd-arrow"></span>
        </button>

        {/* HEADER CARD */}
        <div className="cd-header-card">
          <div className="cd-header-top">
            <div className="cd-header-left">
              <div className="cd-globe">
                <img src={globeIcon} alt="Global" />
              </div>
              <span className="cd-header-title">
                IVF Awareness – December
              </span>
              <span className="cd-live">Live</span>
            </div>
          </div>

          <div className="cd-header-meta">
            <Meta label="Campaign Duration" value="01/12/2025 - 07/12/2025" />
            <Meta label="Schedule Time" value="12:30 PM" />
            <Meta label="Campaign objective" value="Leads Generation" />
            <Meta
              label="Platform"
              value={
                <div className="cd-platform-icons">
                  <img src={facebookIcon} alt="Facebook" />
                  <img src={instagramIcon} alt="Instagram" />
                </div>
              }
            />
            <Meta
              label="Created by & Date"
              value={
                <>
                  <span className="avatar"></span>
                  Henry Cavil | 7/11/2025
                </>
              }
            />
            <Meta label="Campaign Mode" value={<span className="cd-paid">Paid</span>} />
            <Meta label="Total Budget" value="$250" />
            <Meta label="Leads Generated" value={<span className="green">14</span>} />
          </div>
        </div>
      </div>

      {/* ================= METRICS ROW ================= */}
      <div className="cd-metrics-row">
        <Metric title="Total Impressions" value="2000" icon={impressionsIcon} />
        <Metric title="Total Clicks" value="5000" icon={clicksIcon} />
        <Metric title="Conversions" value="200" icon={conversionsIcon} />
        <Metric title="Total Spend" value="$400" icon={spendIcon} />
        <Metric title="CTR (Click-Through Rate)" value="4%" icon={ctrIcon} />
        <Metric title="Conversion Rate" value="6.7%" icon={conversionRateIcon} />
        <Metric title="CPC (Cost per Click)" value="$12" icon={cpcIcon} />
        <Metric title="CPA (Cost per Lead)" value="$40" icon={cpaIcon} />
      </div>
                  {/* ================= TABS CONTAINER (FIGMA 5th LEVEL) ================= */}
      <div className="cd-tabs-container">

        <button
          className={`cd-tab ${activeTab === "Content" ? "cd-tab-active" : ""}`}
          onClick={() => setActiveTab("Content")}
        >
          Content
        </button>

        <button
          className={`cd-tab ${activeTab === "Performance" ? "cd-tab-active" : ""}`}
          onClick={() => setActiveTab("Performance")}
        >
          Performance
        </button>

        <button
          className={`cd-tab ${activeTab === "Platform Breakdown" ? "cd-tab-active" : ""}`}
          onClick={() => setActiveTab("Platform Breakdown")}
        >
          Platform Breakdown
        </button>

        <button
          className={`cd-tab ${activeTab === "AI Insights" ? "cd-tab-active" : ""}`}
          onClick={() => setActiveTab("AI Insights")}
        >
          AI Insights
        </button>

      </div>

            {/* ================= SUB TABS (FACEBOOK / INSTAGRAM) ================= */}
      <div className="cd-subtabs-container">

        <button
          className={`cd-subtab ${activeSubTab === "Facebook" ? "cd-subtab-active" : ""
          }`}
          onClick={() => setActiveSubTab("Facebook")}
        >
          Facebook
        </button>

        <button
          className={`cd-subtab ${activeSubTab === "Instagram" ? "cd-subtab-active" : ""
          }`}
          onClick={() => setActiveSubTab("Instagram")}
        >
          Instagram
        </button>
      </div>

            {/* ================= CONTENT SECTION ================= */}
      <div className="cd-content-card">

        {/* LEFT CONTENT */}
        <div className="cd-content-text">
          <h3 className="cd-content-title">IVF Awareness</h3>

          <p>
            Struggling to conceive can feel overwhelming—but you’re not alone.
            Millions of couples across the world face fertility challenges, and
            IVF has become a proven, safe, and effective path toward parenthood.
            With the right medical guidance, advanced technology, and compassionate
            care, many families have successfully taken their first step toward
            a brighter future.
          </p>

          <p>
            Our fertility experts are here to support you at every stage of your
            journey—helping you understand your options, address concerns, and
            choose a treatment plan tailored to your needs. Early consultation
            can make a meaningful difference, and informed decisions lead to
            better outcomes.
          </p>

          <p>
            Take the first step today. Talk to our fertility specialists and explore
            how IVF can help you move closer to your dream of parenthood.
          </p>

          <p className="cd-content-tags">
            #IVFAwareness #FertilityCare #ParenthoodJourney #IVFSupport #HopeStartsHere
          </p>
        </div>

        {/* RIGHT IMAGE */}
        <div className="cd-content-image">
        <img
            src={contentImage}
            alt="IVF Awareness Ad"
        />
        </div>
      </div>
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

/* ================= METRIC (FIXED & MATCHES FIGMA) ================= */
const Metric = ({
  title,
  value,
  icon
}: {
  title: string;
  value: string;
  icon: string;
}) => (
  <div className="cd-metric-card">

    {/* ICON TOP */}
    <div className="cd-metric-icon">
      <img src={icon} alt={title} />
    </div>

    {/* TEXT BOTTOM */}
    <div className="cd-metric-text">
      <span className="cd-metric-label">{title}</span>
      <span className="cd-metric-value">{value}</span>
    </div>

  </div>
);

export default CampaignDashboard;
