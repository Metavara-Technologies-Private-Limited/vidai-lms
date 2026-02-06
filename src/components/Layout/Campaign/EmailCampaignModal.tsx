// import { useState } from "react";
// import { v4 as uuid } from "uuid";
// import "../../../../src/styles/Campaign/EmailCampaignModal.css";

// // Import the Campaign type from the parent (adjust path if needed)
// import { Campaign } from "../../../pages/Campaigns"; // Assuming this path; copy the interface if import fails

// interface EmailCampaignModalProps {
//   onClose: () => void;
//   onSave: (campaign: Campaign) => void; // Updated to match Campaign type
// }

// export default function EmailCampaignModal({ onClose, onSave }: EmailCampaignModalProps) {
//   const [step, setStep] = useState(1);
//   const [touched, setTouched] = useState<Record<string, boolean>>({});
//   const [isSaving, setIsSaving] = useState(false); // For loading state

//   // Step 1 - Campaign Details
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [objective, setObjective] = useState("");
//   const [targetAudience, setTargetAudience] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   // Step 2 - Email Setup
//   const [audienceList, setAudienceList] = useState("");
//   const [subject, setSubject] = useState("");
//   const [emailContent, setEmailContent] = useState("");

//   const markTouched = (field: string) => {
//     setTouched((prev) => ({ ...prev, [field]: true }));
//   };

//   const getError = (field: string, value: string) => {
//     if (!touched[field]) return "";
//     return value.trim() === "" ? "Required" : "";
//   };

//   const getDateError = () => {
//     if (!touched.startDate || !touched.endDate) return "";
//     if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
//       return "Start date must be before or equal to end date";
//     }
//     return "";
//   };

//   const isStep1Valid =
//     name.trim() !== "" &&
//     objective !== "" &&
//     targetAudience !== "" &&
//     startDate !== "" &&
//     endDate !== "" &&
//     new Date(startDate) <= new Date(endDate);

//   const isStep2Valid = audienceList !== "" && subject.trim() !== "" && emailContent.trim() !== "";

//   const isStep3Valid = 
//     startDate !== "" && 
//     endDate !== "" && 
//     new Date(startDate) <= new Date(endDate);

//   const handleNext = () => {
//     if (step === 1 && isStep1Valid) setStep(2);
//     if (step === 2 && isStep2Valid) setStep(3);
//   };

//   // Updated: Async, loading, builds full Campaign object matching parent type
//   const handleSave = async (status: "Schedule" | "Draft") => {
//     if (isSaving) return;
//     setIsSaving(true);
//     try {
//       const campaign: Campaign = {
//         id: uuid(),
//         name,
//         type: "email",
//         status, // "Schedule" or "Draft" to match parent
//         start: startDate,
//         end: endDate,
//         platforms: ["gmail"], // Required for email campaigns
//         leads: 0, // Default for new campaigns
//         scheduledAt: status === "Schedule" ? startDate : undefined, // Set for scheduled campaigns
//       };
//       await onSave(campaign);
//     } catch (error) {
//       console.error("Error saving campaign:", error);
//       alert("Failed to save campaign. Please check your inputs and try again.");
//     } finally {
//       setIsSaving(false);
//       if (!error) onClose(); // Close only on success
//     }
//   };

//   return (
//     <div className="campaign-modal-overlay">
//       <div className="campaign-modal">
//         <button className="modal-close" onClick={onClose}>×</button>

//         <h2>Add Email Campaigns</h2>

//         {/* Stepper */}
//         <div className="stepper">
//           <div className={`step ${step >= 1 ? "active" : ""}`}>
//             <div className={`circle ${step > 1 ? "completed" : step === 1 ? "current" : ""}`}>
//               {step > 1 ? "✓" : "1"}
//             </div>
//             <span>Campaign Details</span>
//           </div>
//           <div className={`line ${step > 1 ? "completed" : ""}`} />
//           <div className={`step ${step >= 2 ? "active" : ""}`}>
//             <div className={`circle ${step > 2 ? "completed" : step === 2 ? "current" : ""}`}>
//               {step > 2 ? "✓" : "2"}
//             </div>
//             <span>Email Setup</span>
//           </div>
//           <div className={`line ${step > 2 ? "completed" : ""}`} />
//           <div className={`step ${step >= 3 ? "active" : ""}`}>
//             <div className={`circle ${step === 3 ? "current" : ""}`}>3</div>
//             <span>Schedule Email</span>
//           </div>
//         </div>

//         {/* Step 1 */}
//         {step === 1 && (
//           <div className="step-content">
//             <h3>Campaign Details</h3>

//             <div className="form-group">
//               <label>Campaign Name</label>
//               <div className="input-wrapper">
//                 <input
//                   type="text"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   onBlur={() => markTouched("name")}
//                   placeholder="e.g. New Product Launch"
//                   className={getError("name", name) !== "" ? "error" : ""}
//                 />
//                 <button className="ai-suggest">✨ AI Suggest</button>
//               </div>
//               {getError("name", name) && <span className="error-text">Required</span>}
//             </div>

//             <div className="form-group">
//               <label>Campaign Description</label>
//               <div className="input-wrapper">
//                 <textarea
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                   placeholder="e.g. Contains records of routine checks..."
//                 />
//                 <button className="ai-suggest">✨ AI Suggest</button>
//               </div>
//             </div>

//             <div className="form-row">
//               <div className="form-group half">
//                 <label>Campaign Objective</label>
//                 <select
//                   value={objective}
//                   onChange={(e) => setObjective(e.target.value)}
//                   onBlur={() => markTouched("objective")}
//                   className={getError("objective", objective) ? "error" : ""}
//                 >
//                   <option value="">Select Objective</option>
//                   <option value="leads">Lead Generation</option>
//                   <option value="engagement">Engagement</option>
//                   <option value="sales">Sales</option>
//                 </select>
//                 {getError("objective", objective) && <span className="error-text">Required</span>}
//               </div>

//               <div className="form-group half">
//                 <label>Target Audience</label>
//                 <select
//                   value={targetAudience}
//                   onChange={(e) => setTargetAudience(e.target.value)}
//                   onBlur={() => markTouched("targetAudience")}
//                   className={getError("targetAudience", targetAudience) ? "error" : ""}
//                 >
//                   <option value="">Select Audience</option>
//                   <option value="all">All Subscribers</option>
//                   <option value="active">Active Users</option>
//                   <option value="new">New Users</option>
//                 </select>
//                 {getError("targetAudience", targetAudience) && <span className="error-text">Required</span>}
//               </div>
//             </div>

//             <div className="form-row">
//               <div className="form-group half">
//                 <label>Start Date</label>
//                 <input
//                   type="date"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   onBlur={() => markTouched("startDate")}
//                   className={getError("startDate", startDate) ? "error" : ""}
//                 />
//                 {getError("startDate", startDate) && <span className="error-text">Required</span>}
//               </div>

//               <div className="form-group half">
//                 <label>End Date</label>
//                 <input
//                   type="date"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   onBlur={() => markTouched("endDate")}
//                   className={getError("endDate", endDate) ? "error" : ""}
//                 />
//                 {getError("endDate", endDate) && <span className="error-text">Required</span>}
//                 {getDateError() && <span className="error-text">{getDateError()}</span>}
//               </div>
//             </div>

//             <div className="modal-actions">
//               <button className="cancel-btn" onClick={onClose}>Cancel</button>
//               <button className="primary-btn" onClick={handleNext} disabled={!isStep1Valid}>
//                 Next
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Step 2: Email Setup */}
//         {step === 2 && (
//           <div className="step-content">
//             <h3>Email Setup</h3>

//             <div className="form-group">
//               <label>Select Audience</label>
//               <p className="helper-text">Choose which audience list to send this email to</p>
//               <select
//                 value={audienceList}
//                 onChange={(e) => setAudienceList(e.target.value)}
//                 onBlur={() => markTouched("audienceList")}
//                 className={getError("audienceList", audienceList) ? "error" : ""}
//               >
//                 <option value="">Select Audience List</option>
//                 <option value="all">All Subscribers</option>
//                 <option value="active">Active Customers</option>
//                 <option value="recent">Recent Purchasers</option>
//               </select>
//               {getError("audienceList", audienceList) && <span className="error-text">Required</span>}
//             </div>

//             <div className="form-group">
//               <label>Email Content</label>
//               <div className="email-actions">
//                 <button className="secondary-btn">Preview Email</button>
//                 <button className="secondary-btn">Email Template</button>
//               </div>
//               <p className="helper-text">Design your email with AI assistance</p>

//               <div className="form-group">
//                 <label>Subject Line</label>
//                 <div className="input-wrapper">
//                   <input
//                     type="text"
//                     value={subject}
//                     onChange={(e) => setSubject(e.target.value)}
//                     onBlur={() => markTouched("subject")}
//                     placeholder="New Product Launch"
//                     className={getError("subject", subject) ? "error" : ""}
//                   />
//                   <button className="ai-suggest">✨ AI Suggest</button>
//                 </div>
//                 {getError("subject", subject) && <span className="error-text">Required</span>}
//               </div>

//               <div className="form-group">
//                 <label>Email</label>
//                 <div className="input-wrapper">
//                   <textarea
//                     value={emailContent}
//                     onChange={(e) => setEmailContent(e.target.value)}
//                     onBlur={() => markTouched("emailContent")}
//                     placeholder="Write your email content here..."
//                     className={getError("emailContent", emailContent) ? "error" : ""}
//                   />
//                   <button className="ai-suggest">✨ AI Suggest</button>
//                 </div>
//                 {getError("emailContent", emailContent) && <span className="error-text">Required</span>}
//               </div>
//             </div>

//             <div className="modal-actions">
//               <button className="cancel-btn" onClick={onClose}>Cancel</button>
//               <button className="primary-btn" onClick={handleNext} disabled={!isStep2Valid}>
//                 Next
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Step 3: Schedule Email */}
//         {step === 3 && (
//           <div className="step-content">
//             <h3>Schedule Email</h3>

//             <div className="form-group">
//               <label>Schedule</label>
//               <p className="helper-text">Select a date range and time for when to send your email campaign</p>

//               <div className="schedule-container">
//                 <div className="date-range">
//                   <input
//                     type="date"
//                     value={startDate}
//                     onChange={(e) => setStartDate(e.target.value)}
//                     onBlur={() => markTouched("startDate")}
//                     className={getError("startDate", startDate) || getDateError() ? "error" : ""}
//                     placeholder="Start Date"
//                   />
//                   {getError("startDate", startDate) && <span className="error-text">Required</span>}
//                   <span>to</span>
//                   <input
//                     type="date"
//                     value={endDate}
//                     onChange={(e) => setEndDate(e.target.value)}
//                     onBlur={() => markTouched("endDate")}
//                     className={getError("endDate", endDate) || getDateError() ? "error" : ""}
//                     placeholder="End Date"
//                   />
//                   {getError("endDate", endDate) && <span className="error-text">Required</span>}
//                   {getDateError() && <span className="error-text">{getDateError()}</span>}
//                 </div>

//                 <div className="time-picker">
//                   <input type="time" defaultValue="12:30" />
//                   <button className="ai-suggest">✨ AI-Optimization Timing</button>
//                 </div>
//               </div>
//             </div>

//             <div className="modal-actions">
//               <button className="cancel-btn" onClick={onClose}>Cancel</button>
//               <button 
//                 className="draft-btn" 
//                 onClick={() => handleSave("Draft")}
//                 disabled={isSaving}
//               >
//                 {isSaving ? "Saving..." : "Save as Draft"}
//               </button>
//               <button
//                 className="primary-btn"
//                 onClick={() => handleSave("Schedule")}
//                 disabled={isSaving || !isStep3Valid}
//               >
//                 {isSaving ? "Scheduling..." : "Schedule"}
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }