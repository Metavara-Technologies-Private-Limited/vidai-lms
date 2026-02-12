// import { useState } from "react";
// import { v4 as uuid } from "uuid";
// import "../../../../src/styles/Campaign/SocialCampaignModal.css";

// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
// import dayjs from "dayjs";

// /* 🔹 LOCAL ICONS */
// import instagramIcon from "../../components/Campaign/Icons/instagram.png";
// import facebookIcon from "../../components/Campaign/Icons/facebook.png";
// import linkedinIcon from "../../components/Campaign/Icons/linkedin.png";

// export default function SocialCampaignModal({ onClose, onSave }: any) {
//   const [step, setStep] = useState(1);
//   const [submitted, setSubmitted] = useState(false);
  

//   /* ================= STEP 1 ================= */
//   const [campaignName, setCampaignName] = useState("");
//   const [objective, setObjective] = useState("");
//   const [audience, setAudience] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const step1Valid =
//     campaignName.trim() &&
//     objective &&
//     audience &&
//     startDate &&
//     endDate;

//   /* ================= STEP 2 ================= */
//   const [accounts, setAccounts] = useState<string[]>([]);
//   const [mode, setMode] = useState<"organic" | "paid" | "">("");

//   const step2Valid = accounts.length > 0 && mode;

//   const toggleAccount = (id: string) => {
//     setAccounts((prev) =>
//       prev.includes(id)
//         ? prev.filter((x) => x !== id)
//         : [...prev, id]
//     );
//   };

//   /* ================= NAVIGATION ================= */
//   const handleNext = () => {
//     setSubmitted(true);

//     if (step === 1 && step1Valid) {
//       setStep(2);
//       setSubmitted(false);
//     } else if (step === 2 && step2Valid) {
//       setStep(3);
//       setSubmitted(false);
//     }
//   };

//   const handleSaveAndPost = () => {
//   setSubmitted(true);
//   if (!step1Valid || !step2Valid) return;

//   const newCampaign = {
//     id: uuid(),
//     name: campaignName,
//     type: "social",
//     status: "Live",
//     start: startDate,
//     end: endDate,
//     platforms: accounts, // facebook / instagram / linkedin
//     leads: 0,
//     scheduledAt: undefined,
//   };

//   onSave(newCampaign);
// };

//   return (
//     <div className="campaign-modal-overlay">
//       <div className="campaign-modal">

//         {/* ================= HEADER ================= */}
//         <div className="modal-header">
//           <span className="modal-title">Add Social Media Campaigns</span>
//           <button className="modal-close" onClick={onClose}>×</button>
//         </div>

//         {/* ================= STEPPER ================= */}
//         <div className="stepper">
//           <div className={`step ${step === 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
//             <div className="circle">{step > 1 ? "✓" : "1"}</div>
//             <span>Campaign Details</span>
//           </div>

//           <div className="line" />

//           <div className={`step ${step === 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
//             <div className="circle">{step > 2 ? "✓" : "2"}</div>
//             <span>Content & Configuration</span>
//           </div>

//           <div className="line" />

//           <div className={`step ${step === 3 ? "active" : ""}`}>
//             <div className="circle">3</div>
//             <span>Schedule Campaign</span>
//           </div>
//         </div>

//         {/* ================= STEP 1 ================= */}
//         {step === 1 && (
//           <div className="step-content">
//             <h2>Campaign Details</h2>

//             <div className={`form-group ${submitted && !campaignName ? "error" : ""}`}>
//               <label>Campaign Name *</label>
//               <input
//                 value={campaignName}
//                 onChange={(e) => setCampaignName(e.target.value)}
//                 placeholder="e.g. New Product Launch"
//               />
//             </div>

//             <div className="form-row">
//               <div className={`form-group half ${submitted && !objective ? "error" : ""}`}>
//                 <label>Campaign Objective *</label>
//                 <select value={objective} onChange={(e) => setObjective(e.target.value)}>
//                   <option value="">Select Objective</option>
//                   <option value="leads">Lead Generation</option>
//                   <option value="awareness">Brand Awareness</option>
//                 </select>
//               </div>

//               <div className={`form-group half ${submitted && !audience ? "error" : ""}`}>
//                 <label>Target Audience *</label>
//                 <select value={audience} onChange={(e) => setAudience(e.target.value)}>
//                   <option value="">Select Audience</option>
//                   <option value="all">All Users</option>
//                 </select>
//               </div>
//             </div>

//             <div className="form-row">
//               <div className={`form-group half ${submitted && !startDate ? "error" : ""}`}>
//                 <label>Start Date *</label>
//                 <LocalizationProvider dateAdapter={AdapterDayjs}>
//                   <DatePicker
//                     format="DD/MM/YYYY"
//                     value={startDate ? dayjs(startDate) : null}
//                     onChange={(v) =>
//                       setStartDate(v ? v.format("YYYY-MM-DD") : "")
//                     }
//                     slots={{ openPickerIcon: CalendarTodayIcon }}
//                   />
//                 </LocalizationProvider>
//               </div>

//               <div className={`form-group half ${submitted && !endDate ? "error" : ""}`}>
//                 <label>End Date *</label>
//                 <LocalizationProvider dateAdapter={AdapterDayjs}>
//                   <DatePicker
//                     format="DD/MM/YYYY"
//                     value={endDate ? dayjs(endDate) : null}
//                     onChange={(v) =>
//                       setEndDate(v ? v.format("YYYY-MM-DD") : "")
//                     }
//                     slots={{ openPickerIcon: CalendarTodayIcon }}
//                   />
//                 </LocalizationProvider>
//               </div>
//             </div>
//           </div>
//         )}

// {/* ================= STEP 2 ================= */}
// {step === 2 && (
//   <div className="step-content">
//     <h2>Content & Configuration</h2>
//     {/* SELECT AD ACCOUNTS */}
//     <div className={`section-card ${submitted && accounts.length === 0 ? "error" : ""}`}>
//       <h3>Select Ad Accounts</h3>
//       <p className="section-subtitle">
//         Select your social media ad accounts
//       </p>

//       <div className="account-row">
//         {[
//           { id: "instagram", label: "Instagram", icon: instagramIcon },
//           { id: "facebook", label: "Facebook", icon: facebookIcon },
//           { id: "linkedin", label: "LinkedIn", icon: linkedinIcon },
//         ].map((acc) => (
//           <div
//             key={acc.id}
//             className={`account-card ${accounts.includes(acc.id) ? "selected" : ""}`}
//             onClick={() => toggleAccount(acc.id)}
//           >
//             <div className="account-left">
//               <img src={acc.icon} alt={acc.label} />
//               <span>{acc.label}</span>
//             </div>
//             <div
//               className={`account-checkbox ${
//                 accounts.includes(acc.id) ? "checked" : ""
//               }`}
//             />
//           </div>
//         ))}
//       </div>
//     </div>

//     {/* CAMPAIGN MODE */}
//     <div className={`section-card ${submitted && !mode ? "error" : ""}`}>
//       <h3>Campaign Mode</h3>
//       <p className="section-subtitle">
//         Choose a campaign mode to optimize your ad strategy
//       </p>

//       <div className="mode-row">
//         {/* ORGANIC */}
//         <div
//           className={`mode-card ${mode === "organic" ? "selected" : ""}`}
//           onClick={() => setMode("organic")}
//         >
//           <div className="mode-left">
//             <div className={`radio ${mode === "organic" ? "checked" : ""}`} />
//             <div className="mode-text">
//               <h4>Organic Posting</h4>
//               <p>Post to your connected social accounts without ad spend.</p>
//             </div>
//           </div>
//           <span className="badge">No Budget Required</span>
//         </div>

//         {/* PAID */}
//         <div
//           className={`mode-card ${mode === "paid" ? "selected" : ""}`}
//           onClick={() => setMode("paid")}
//         >
//           <div className="mode-left">
//             <div className={`radio ${mode === "paid" ? "checked" : ""}`} />
//             <div className="mode-text">
//               <h4>Paid Advertising</h4>
//               <p>Boost your reach and engagement with targeted ads.</p>
//             </div>
//           </div>
//           <span className="badge outlined">Budget Setup Required</span>
//         </div>
//       </div>
//     </div>
//     {/* ================= CAMPAIGN CONTENT ================= */}
// {mode && (
//   <div className="section-card">
//     <h2>Campaign Content</h2>
//     <p className="section-subtitle">
//       Create your post content with AI assistance
//     </p>

//     {/* Instagram */}
//     <div className="content-row">
//       <img src={instagramIcon} alt="Instagram" />
//       <textarea placeholder="What would you like to share?" />
//     </div>

//     {/* Facebook */}
//     <div className="content-row">
//       <img src={facebookIcon} alt="Facebook" />
//       <input placeholder="What would you like to share?" />
//     </div>

//     {/* LinkedIn */}
//     <div className="content-row">
//       <img src={linkedinIcon} alt="LinkedIn" />
//       <input placeholder="What would you like to share?" />
//     </div>
//   </div>
// )}
//   </div>
// )}

// {/* ================= STEP 3 ================= */}
// {step === 3 && (
//   <div className="step-content">
//   <h3>Schedule Campaign</h3>
//     <div className="section-card">
//       {/* HEADER */}
//       <div className="schedule-header">
//         <div>
//           <h3>Schedule</h3>
//           <p className="section-subtitle">
//             Select a date and time for the campaign.
//           </p>
//         </div>

//         <button className="ai-btn">
//           ✨ AI-Optimization Timing
//         </button>
//       </div>

//       {/* DATE + TIME */}
//       <div className="schedule-row">
//         <div className="form-group half">
//           <label>Select Date Range</label>
//           <LocalizationProvider dateAdapter={AdapterDayjs}>
//             <DatePicker
//               format="DD/MM/YYYY"
//               slots={{ openPickerIcon: CalendarTodayIcon }}
//             />
//           </LocalizationProvider>
//         </div>

//         <div className="form-group half">
//           <label>Enter Time</label>
//           <input type="time" />
//         </div>
//       </div>
//     </div>
//   </div>
// )}

//         {/* ================= FOOTER ================= */}
//         <div className="modal-actions">
//   <button className="cancel-btn" onClick={onClose}>
//     Cancel
//   </button>

//   {step === 3 ? (
//     <button className="next-btn" onClick={handleSaveAndPost}>
//       Save & Post
//     </button>
//   ) : (
//     <button className="next-btn" onClick={handleNext}>
//       Next
//     </button>
//   )}
// </div>
//       </div>     
//     </div>
//   );
// }
