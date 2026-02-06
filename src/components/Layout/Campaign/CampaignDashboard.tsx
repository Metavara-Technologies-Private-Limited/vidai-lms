import React from "react";
import "../../../../src/styles/Campaign/CampaignDashboard.css";

/* ===== METRIC CARD ===== */
interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  color,
}) => (
  <div className="metric-card">
    <div className="metric-icon" style={{ backgroundColor: color }}>
      {icon}
    </div>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
  </div>
);

/* ===== DASHBOARD PROPS ===== */
interface CampaignDashboardProps {
  campaign?: any;     // optional for now
  onBack?: () => void;
}

/* ===== DASHBOARD ===== */
const CampaignDashboard: React.FC<CampaignDashboardProps> = ({
  campaign,
  onBack,
}) => {
  return (
    <div className="dashboard">
      {/* Back Button */}
      <button className="back-btn" onClick={onBack}>
        ←
      </button>

      {/* Header Section */}
      <div className="campaign-header">
        <div className="campaign-title-row">
          <div className="campaign-icon">🌐</div>
          <h1>{campaign?.name ?? "IVF Awareness – December"}</h1>
          <span className="status-live">
            {campaign?.status ?? "Live"}
          </span>
        </div>

        <div className="info-grid">
          <div>
            <span>Campaign Duration</span>
            <strong>
              {campaign?.start ?? "01/12/2025"} - {campaign?.end ?? "07/12/2025"}
            </strong>
          </div>
          <div>
            <span>Schedule Time</span>
            <strong>{campaign?.scheduledAt ?? "12:30 PM"}</strong>
          </div>
          <div>
            <span>Campaign Objective</span>
            <strong>{campaign?.objective ?? "Leads Generation"}</strong>
          </div>
          <div>
            <span>Platform</span>
            <div className="platform-icons">
              <div className="fb">f</div>
              <div className="insta">📷</div>
            </div>
          </div>
          <div>
            <span>Created by & Date</span>
            <div className="creator">
              <div className="avatar">👤</div>
              <strong>{campaign?.createdBy ?? "Henry Cavill"} | {campaign?.createdDate ?? "7/11/2025"}</strong>
            </div>
          </div>
          <div>
            <span>Campaign Mode</span>
            <span className="tag-paid">
              {campaign?.campaignMode ?? "Paid"}
            </span>
          </div>
          <div>
            <span>Total Budget</span>
            <strong>${campaign?.totalBudget ?? 250}</strong>
          </div>
          <div>
            <span>Leads Generated</span>
            <strong>{campaign?.leads ?? 14}</strong>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <MetricCard icon="👁️" label="Total Impressions" value={campaign?.totalImpressions ?? 2000} color="#dbeafe" />
        <MetricCard icon="👆" label="Total Clicks" value={campaign?.totalClicks ?? 5000} color="#d1fae5" />
        <MetricCard icon="👥" label="Conversions" value={campaign?.conversions ?? 200} color="#fee2e2" />
        <MetricCard icon="💰" label="Total Spend" value={`$${campaign?.totalSpend ?? 400}`} color="#fef3c7" />
        <MetricCard icon="📊" label="CTR (Click-Through Rate)" value={`${campaign?.ctr ?? 4}%`} color="#dbeafe" />
        <MetricCard icon="📈" label="Conversion Rate" value={`${campaign?.conversionRate ?? 6.7}%`} color="#dcfce7" />
        <MetricCard icon="🎯" label="CPC (Cost per Click)" value={`$${campaign?.cpc ?? 12}`} color="#e9d5ff" />
        <MetricCard icon="🔍" label="CPA (Cost per Lead)" value={`$${campaign?.cpa ?? 40}`} color="#fed7aa" />
      </div>

      {/* Content Section */}
      <div className="content-box">
        <div className="tabs">
          <button className="active">Content</button>
          <button>Performance</button>
          <button>Platform Breakdown</button>
          <button>AI Insights</button>
        </div>

        <div className="platform-tabs">
          <button className="active">Facebook</button>
          <button>Instagram</button>
        </div>

        <div className="content-layout">
          <div>
            <h2>{campaign?.name ?? "IVF Awareness"}</h2>
            <p>
              Struggling to conceive can feel overwhelming—but you're not alone.
              Millions of couples face fertility challenges, and IVF offers a
              proven path toward parenthood.
            </p>
            <p>
              Our fertility experts support you at every stage with personalized
              treatment plans and compassionate care.
            </p>
            <p>Take the first step today and explore your IVF journey.</p>
            <p className="hashtags">
              #IVFAwareness #FertilityCare #ParenthoodJourney
            </p>
          </div>

          <div className="ad-preview">
            <img
              src="data:image/svg+xml,%3Csvg width='300' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='400' fill='%23fef2f2'/%3E%3Ctext x='50%25' y='30%25' text-anchor='middle' fill='%23991b1b' font-size='24' font-weight='bold'%3EUIDEAL%3C/text%3E%3C/svg%3E"
              alt="Campaign Ad"
            />
            <div className="ad-footer">
              <strong>Get In Touch</strong>
              <p>☎ +1 (541) 754-3010</p>
              <p>🌐 www.vidailiferates.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDashboard;
