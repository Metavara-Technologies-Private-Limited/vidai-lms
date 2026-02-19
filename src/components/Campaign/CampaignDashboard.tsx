// import "../../../../src/styles/Campaign/CampaignDashboard.css";
// import React from "react";
// import { useNavigate } from "react-router-dom";

// import instagramIcon from "../../components/Campaign/Icons/instagram.png";
// import facebookIcon from "../../components/Campaign/Icons/facebook.png";
// import globeIcon from "../../components/Campaign/Images/globe.png";
// import impressionsIcon from "../../components/Campaign/Icons/impressions.png";
// import clicksIcon from "../../components/Campaign/Icons/clicks.png";
// import conversionsIcon from "../../components/Campaign/Icons/conversions.png";
// import spendIcon from "../../components/Campaign/Icons/spend.png";
// import ctrIcon from "../../components/Campaign/Icons/ctr.png";
// import conversionRateIcon from "../../components/Campaign/Icons/conversion-rate.png";
// import cpcIcon from "../../components/Campaign/Icons/cpc.png";
// import cpaIcon from "../../components/Campaign/Icons/cpa.png";

// import CampaignTabContent from "../../components/Campaign/CampaignTabContent";

// const CampaignDashboard = () => {
//   const navigate = useNavigate();

//   const [activeTab, setActiveTab] = React.useState("Content");
//   const [activeSubTab, setActiveSubTab] = React.useState("Facebook");

//   return (
//     <div className="cd-wrapper">

//       {/* ================= HEADER ================= */}
//       <div className="cd-header-section">

//         <button
//           className="cd-back-btn"
//           onClick={() => navigate("/campaigns")}
//           aria-label="Back to campaigns"
//         >
//           <span className="cd-arrow"></span>
//         </button>

//         <div className="cd-header-card">
//           <div className="cd-header-top">
//             <div className="cd-header-left">
//               <div className="cd-globe">
//                 <img src={globeIcon} alt="Global" />
//               </div>
//               <span className="cd-header-title">
//                 IVF Awareness – December
//               </span>
//               <span className="cd-live">Live</span>
//             </div>
//           </div>

//           <div className="cd-header-meta">
//             <Meta label="Campaign Duration" value="01/12/2025 - 07/12/2025" />
//             <Meta label="Schedule Time" value="12:30 PM" />
//             <Meta label="Campaign objective" value="Leads Generation" />
//             <Meta
//               label="Platform"
//               value={
//                 <div className="cd-platform-icons">
//                   <img src={facebookIcon} alt="Facebook" />
//                   <img src={instagramIcon} alt="Instagram" />
//                 </div>
//               }
//             />
//             <Meta
//               label="Created by & Date"
//               value="Henry Cavil | 7/11/2025"
//             />
//             <Meta label="Campaign Mode" value="Paid" />
//             <Meta label="Total Budget" value="$250" />
//             <Meta label="Leads Generated" value="14" />
//           </div>
//         </div>
//       </div>

//       {/* ================= METRICS ================= */}
//       <div className="cd-metrics-row">
//         <Metric title="Total Impressions" value="2000" icon={impressionsIcon} />
//         <Metric title="Total Clicks" value="5000" icon={clicksIcon} />
//         <Metric title="Conversions" value="200" icon={conversionsIcon} />
//         <Metric title="Total Spend" value="$400" icon={spendIcon} />
//         <Metric title="CTR" value="4%" icon={ctrIcon} />
//         <Metric title="Conversion Rate" value="6.7%" icon={conversionRateIcon} />
//         <Metric title="CPC" value="$12" icon={cpcIcon} />
//         <Metric title="CPA" value="$40" icon={cpaIcon} />
//       </div>

//       {/* ================= MAIN TABS ================= */}
//       <div className="cd-tabs-container">
//         {["Content", "Performance", "Platform Breakdown", "AI Insights"].map(
//           (tab) => (
//             <button
//               key={tab}
//               className={`cd-tab ${activeTab === tab ? "cd-tab-active" : ""}`}
//               onClick={() => setActiveTab(tab)}
//             >
//               {tab}
//             </button>
//           )
//         )}
//       </div>

//       {/* ================= SUB TABS ================= */}
//       <div className="cd-subtabs-container">
//         {["Facebook", "Instagram"].map((sub) => (
//           <button
//             key={sub}
//             className={`cd-subtab ${
//               activeSubTab === sub ? "cd-subtab-active" : ""
//             }`}
//             onClick={() => setActiveSubTab(sub)}
//           >
//             {sub}
//           </button>
//         ))}
//       </div>

//       {/* ================= TAB CONTENT ================= */}
//       <CampaignTabContent
//         activeTab={activeTab}
//         activeSubTab={activeSubTab}
//       />
//     </div>
//   );
// };

// /* ================= META ================= */
// const Meta = ({ label, value }: { label: string; value: any }) => (
//   <div className="cd-meta-block">
//     <span className="cd-meta-label">{label}</span>
//     <span className="cd-meta-value">{value}</span>
//   </div>
// );

// /* ================= METRIC ================= */
// const Metric = ({
//   title,
//   value,
//   icon
// }: {
//   title: string;
//   value: string;
//   icon: string;
// }) => (
//   <div className="cd-metric-card">
//     <div className="cd-metric-icon">
//       <img src={icon} alt={title} />
//     </div>
//     <div className="cd-metric-text">
//       <span className="cd-metric-label">{title}</span>
//       <span className="cd-metric-value">{value}</span>
//     </div>
//   </div>
// );

// export default CampaignDashboard;
