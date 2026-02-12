import * as React from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Fade,
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import type { Lead } from "../../types/leads.types";

const STORAGE_KEY = "vidai_leads_data";

const EditLead: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [currentStep, setCurrentStep] = React.useState(1);
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Get lead data from localStorage or location state
  const [leadData, setLeadData] = React.useState<Lead | null>(() => {
    if (location.state?.lead) {
      return location.state.lead;
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const leads: Lead[] = JSON.parse(stored);
      // Try multiple matching patterns
      const foundLead = leads.find((l) => {
        const cleanLeadId = l.id.replace("#", "").replace("LN-", "").replace("LD-", "");
        const cleanParamId = id?.replace("#", "").replace("LN-", "").replace("LD-", "");
        
        return (
          l.id === id ||                           // Exact match
          l.id === `#${id}` ||                     // With hash
          l.id === `#LN-${id}` ||                  // With #LN- prefix
          l.id === `LN-${id}` ||                   // With LN- prefix
          l.id === `#LD-${id}` ||                  // With #LD- prefix
          l.id === `LD-${id}` ||                   // With LD- prefix
          l.id.replace("#", "") === id ||          // Without hash
          cleanLeadId === cleanParamId             // Clean comparison
        );
      });
      return foundLead || null;
    }
    return null;
  });

  // Form state - Patient Details (Step 1)
  const [fullName, setFullName] = React.useState(leadData?.name || "");
  const [contactNo, setContactNo] = React.useState("+91 54211 54121");
  const [email, setEmail] = React.useState("johns@gmail.com");
  const [location_address, setLocationAddress] = React.useState(leadData?.location || "");
  const [gender, setGender] = React.useState("Male");
  const [age, setAge] = React.useState("32");
  const [maritalStatus, setMaritalStatus] = React.useState("Married");
  const [address, setAddress] = React.useState(leadData?.location || "");
  const [languagePreference, setLanguagePreference] = React.useState("English");
  
  // Partner Information
  const [isCouple, setIsCouple] = React.useState("Yes");
  const [partnerName, setPartnerName] = React.useState("Jennifer Smith");
  const [partnerAge, setPartnerAge] = React.useState("29");
  const [partnerGender, setPartnerGender] = React.useState("Female");

  // Source & Campaign Details
  const [source, setSource] = React.useState(leadData?.source || "Social Media");
  const [subSource, setSubSource] = React.useState("Facebook");
  const [campaignName, setCampaignName] = React.useState("Facebook IVF Awareness - December");

  // Assignee & Next Action
  const [assignedTo, setAssignedTo] = React.useState(leadData?.assigned || "Henry Cavill");
  const [nextActionType, setNextActionType] = React.useState("Follow Up");
  const [nextActionStatus, setNextActionStatus] = React.useState("To Do");
  const [nextActionDescription, setNextActionDescription] = React.useState("Enter Description");

  // Form state - Medical Details (Step 2)
  const [treatmentInterest, setTreatmentInterest] = React.useState("");
  const [selectedTreatments, setSelectedTreatments] = React.useState<string[]>([]);

  // Add/remove treatment from selected list
  const toggleTreatment = (treatment: string) => {
    setSelectedTreatments((prev) =>
      prev.includes(treatment)
        ? prev.filter((t) => t !== treatment)
        : [...prev, treatment]
    );
  };

  // Form state - Book Appointment (Step 3)
  const [wantAppointment, setWantAppointment] = React.useState("Yes");
  const [department, setDepartment] = React.useState("Consultation");
  const [personnel, setPersonnel] = React.useState("Dr. Alex Carrey");
  const [appointmentDate, setAppointmentDate] = React.useState("12/09/2024");
  const [selectedSlot, setSelectedSlot] = React.useState("12:30 PM - 01:00 PM");
  const [remark, setRemark] = React.useState("");

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    // Update localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && leadData) {
      const leads: Lead[] = JSON.parse(stored);
      const updatedLeads = leads.map((lead) => {
        if (lead.id === leadData.id) {
          return {
            ...lead,
            name: fullName,
            location: location_address,
            source: source,
            assigned: assignedTo,
          };
        }
        return lead;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLeads));
    }

    // Show success message
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate("/leads");
    }, 2000);
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      fontSize: "0.875rem",
      "& fieldset": { borderColor: "#E2E8F0" },
      "&:hover fieldset": { borderColor: "#CBD5E1" },
      "&.Mui-focused fieldset": { borderColor: "#6366F1" },
    },
  };

  const labelStyle = {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#475569",
    mb: 0.5,
    display: "block",
  };

  if (!leadData) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Lead not found</Typography>
        <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh", p: 4 }}>
      {/* Breadcrumb */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer" }} onClick={() => navigate("/leads")}>
          VIDAI Leads
        </Typography>
        <Typography variant="body2" color="text.secondary">›</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer" }} onClick={() => navigate("/leads")}>
          Leads Hub
        </Typography>
        <Typography variant="body2" color="text.secondary">›</Typography>
        <Typography variant="body2" fontWeight={600} color="#1E293B">{fullName}</Typography>
      </Stack>

      {/* Main Content */}
      <Paper sx={{ borderRadius: "16px", overflow: "hidden" }}>
        {/* Header */}
        <Box sx={{ bgcolor: "white", p: 3, borderBottom: "1px solid #F1F5F9" }}>
          <Typography variant="h6" fontWeight={700} color="#1E293B">
            Edit Lead Details <Typography component="span" color="text.secondary">({leadData.id})</Typography>
          </Typography>
        </Box>

        {/* Step Indicator */}
        <Box sx={{ bgcolor: "white", px: 6, pt: 3, pb: 2, borderBottom: "1px solid #F1F5F9" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              bgcolor: "#F8FAFC",
              px: 3,
              py: 1.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
            }}
          >
            {/* Step 1 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: currentStep > 1 ? "#10B981" : currentStep === 1 ? "#F97316" : "#E2E8F0",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {currentStep > 1 ? "✓" : "1"}
              </Box>
              <Typography
                variant="body2"
                fontWeight={600}
                color={currentStep > 1 ? "#10B981" : currentStep === 1 ? "#F97316" : "#94A3B8"}
                sx={{ fontSize: "0.875rem" }}
              >
                Patient Details
              </Typography>
            </Box>

            {/* Step 2 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: currentStep > 2 ? "#10B981" : currentStep === 2 ? "#F97316" : "#E2E8F0",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {currentStep > 2 ? "✓" : "2"}
              </Box>
              <Typography
                variant="body2"
                fontWeight={600}
                color={currentStep > 2 ? "#10B981" : currentStep === 2 ? "#F97316" : "#94A3B8"}
                sx={{ fontSize: "0.875rem" }}
              >
                Medical Details
              </Typography>
            </Box>

            {/* Step 3 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: currentStep > 3 ? "#10B981" : currentStep === 3 ? "#3B82F6" : "#E2E8F0",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {currentStep > 3 ? "✓" : "3"}
              </Box>
              <Typography
                variant="body2"
                fontWeight={600}
                color={currentStep > 3 ? "#10B981" : currentStep === 3 ? "#3B82F6" : "#94A3B8"}
                sx={{ fontSize: "0.875rem" }}
              >
                Book Appointment
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Form Content - Scrollable */}
        <Box sx={{ 
          bgcolor: "white", 
          p: 3, 
          maxHeight: "calc(100vh - 400px)", 
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" }
        }}>
          {/* STEP 1: PATIENT DETAILS */}
          {currentStep === 1 && (
            <Box>
              {/* LEAD INFORMATION */}
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                LEAD INFORMATION
              </Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={labelStyle}>Full Name</Typography>
                  <TextField fullWidth size="small" value={fullName} onChange={(e) => setFullName(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Contact No.</Typography>
                  <TextField fullWidth size="small" value={contactNo} onChange={(e) => setContactNo(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Email</Typography>
                  <TextField fullWidth size="small" value={email} onChange={(e) => setEmail(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Location/ Address</Typography>
                  <TextField fullWidth size="small" value={location_address} onChange={(e) => setLocationAddress(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Gender</Typography>
                  <TextField select fullWidth size="small" value={gender} onChange={(e) => setGender(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Age</Typography>
                  <TextField fullWidth size="small" type="number" value={age} onChange={(e) => setAge(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Marital Status</Typography>
                  <TextField select fullWidth size="small" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Address</Typography>
                  <TextField fullWidth size="small" value={address} onChange={(e) => setAddress(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography sx={labelStyle}>Language Preference</Typography>
                <TextField select fullWidth size="small" value={languagePreference} onChange={(e) => setLanguagePreference(e.target.value)} sx={{ ...inputStyle, maxWidth: "25%" }}>
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                  <MenuItem value="Kannada">Kannada</MenuItem>
                </TextField>
              </Box>

              {/* PARTNER INFORMATION */}
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                PARTNER INFORMATION
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ ...labelStyle, mb: 1 }}>Is This Inquiry For A Couple?</Typography>
                <RadioGroup row value={isCouple} onChange={(e) => setIsCouple(e.target.value)}>
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Full Name</Typography>
                  <TextField fullWidth size="small" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Age</Typography>
                  <TextField fullWidth size="small" type="number" value={partnerAge} onChange={(e) => setPartnerAge(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Gender</Typography>
                  <TextField select fullWidth size="small" value={partnerGender} onChange={(e) => setPartnerGender(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </TextField>
                </Box>
              </Box>

              {/* SOURCE & CAMPAIGN DETAILS */}
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                SOURCE & CAMPAIGN DETAILS
              </Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Source</Typography>
                  <TextField select fullWidth size="small" value={source} onChange={(e) => setSource(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Sub-Source</Typography>
                  <TextField select fullWidth size="small" value={subSource} onChange={(e) => setSubSource(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Facebook">Facebook</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="Google">Google</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Campaign Name</Typography>
                  <TextField fullWidth size="small" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>

              {/* ASSIGNEE & NEXT ACTION DETAILS */}
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                ASSIGNEE & NEXT ACTION DETAILS
              </Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField select fullWidth size="small" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Henry Cavill">Henry Cavill</MenuItem>
                    <MenuItem value="Emma Clarke">Emma Clarke</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Next Action Type</Typography>
                  <TextField select fullWidth size="small" value={nextActionType} onChange={(e) => setNextActionType(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Follow Up">Follow Up</MenuItem>
                    <MenuItem value="Call">Call</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Next Action Status</Typography>
                  <TextField select fullWidth size="small" value={nextActionStatus} onChange={(e) => setNextActionStatus(e.target.value)} sx={inputStyle}>
                    <MenuItem value="To Do">To Do</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={labelStyle}>Next Action Description</Typography>
                <TextField fullWidth size="small" value={nextActionDescription} onChange={(e) => setNextActionDescription(e.target.value)} sx={inputStyle} />
              </Box>
            </Box>
          )}

          {/* STEP 2: MEDICAL DETAILS */}
          {currentStep === 2 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                TREATMENT INFORMATION
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography sx={labelStyle}>Treatment Interest</Typography>
                <TextField 
                  select 
                  fullWidth 
                  size="small" 
                  value={treatmentInterest} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setTreatmentInterest(value);
                    if (value && !selectedTreatments.includes(value)) {
                      toggleTreatment(value);
                    }
                  }} 
                  sx={{ ...inputStyle, maxWidth: "50%" }} 
                  displayEmpty
                >
                  <MenuItem value="" disabled>Select</MenuItem>
                  <MenuItem value="Medical Checkup">Medical Checkup</MenuItem>
                  <MenuItem value="IVF">IVF</MenuItem>
                  <MenuItem value="IUI">IUI</MenuItem>
                  <MenuItem value="Consultation">Consultation</MenuItem>
                </TextField>
              </Box>

              {/* Selected Treatments Chips */}
              {selectedTreatments.length > 0 && (
                <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                  {selectedTreatments.map((treatment) => (
                    <Chip 
                      key={treatment}
                      label={treatment}
                      onDelete={() => toggleTreatment(treatment)}
                      sx={{ 
                        bgcolor: "#FEE2E2",
                        color: "#B91C1C",
                        fontWeight: 600,
                        border: "1px solid #FCA5A5",
                        "& .MuiChip-deleteIcon": {
                          color: "#B91C1C",
                          fontSize: "18px",
                          "&:hover": { color: "#991B1B" }
                        }
                      }} 
                    />
                  ))}
                </Stack>
              )}

              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                DOCUMENTS & REPORTS
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography sx={labelStyle}>Upload Documents</Typography>
                <Box sx={{ 
                  border: "2px dashed #E2E8F0", 
                  borderRadius: "12px", 
                  p: 3, 
                  display: "inline-block",
                  textAlign: "center",
                  bgcolor: "#F8FAFC",
                  minWidth: "400px"
                }}>
                  <Button variant="contained" component="label" sx={{ 
                    bgcolor: "#64748B", 
                    textTransform: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    "&:hover": { bgcolor: "#475569" }
                  }}>
                    Choose File
                    <input type="file" hidden />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    No File Chosen
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* STEP 3: BOOK APPOINTMENT */}
          {currentStep === 3 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                APPOINTMENT DETAILS
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ ...labelStyle, mb: 1 }}>Want to Book an Appointment?</Typography>
                <RadioGroup row value={wantAppointment} onChange={(e) => setWantAppointment(e.target.value)}>
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Department *</Typography>
                  <TextField select fullWidth size="small" value={department} onChange={(e) => setDepartment(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Consultation">Consultation</MenuItem>
                    <MenuItem value="Treatment">Treatment</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Personnel *</Typography>
                  <TextField select fullWidth size="small" value={personnel} onChange={(e) => setPersonnel(e.target.value)} sx={inputStyle}>
                    <MenuItem value="Dr. Alex Carrey">Dr. Alex Carrey</MenuItem>
                    <MenuItem value="Dr. Sarah Smith">Dr. Sarah Smith</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={labelStyle}>Date *</Typography>
                  <TextField fullWidth size="small" type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} sx={inputStyle} InputLabelProps={{ shrink: true }} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Select Slot *</Typography>
                  <TextField select fullWidth size="small" value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)} sx={inputStyle}>
                    <MenuItem value="12:30 PM - 01:00 PM">12:30 PM - 01:00 PM</MenuItem>
                    <MenuItem value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box>
                <Typography sx={labelStyle}>Remark</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  multiline 
                  rows={2} 
                  placeholder="Type Here..." 
                  value={remark} 
                  onChange={(e) => setRemark(e.target.value)} 
                  sx={inputStyle} 
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer Actions */}
        <Box sx={{ bgcolor: "white", p: 3, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button 
            onClick={() => navigate("/leads")}
            sx={{ 
              textTransform: "none", 
              color: "#64748B", 
              fontWeight: 700,
              px: 3
            }}
          >
            Cancel
          </Button>
          
          {currentStep > 1 && (
            <Button 
              onClick={handleBack}
              variant="outlined"
              sx={{ 
                textTransform: "none", 
                borderColor: "#E2E8F0",
                color: "#1E293B",
                fontWeight: 700,
                px: 3,
                "&:hover": { borderColor: "#CBD5E1" }
              }}
            >
              Back
            </Button>
          )}

          {currentStep < 3 ? (
            <Button 
              onClick={handleNext}
              variant="contained"
              sx={{ 
                bgcolor: "#334155", 
                textTransform: "none", 
                fontWeight: 700,
                px: 4,
                "&:hover": { bgcolor: "#1E293B" }
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              variant="contained"
              sx={{ 
                bgcolor: "#334155", 
                textTransform: "none", 
                fontWeight: 700,
                px: 4,
                "&:hover": { bgcolor: "#1E293B" }
              }}
            >
              Save
            </Button>
          )}
        </Box>
      </Paper>

      {/* Success Message */}
      <Fade in={showSuccess}>
        <Box sx={{ 
          position: 'fixed', 
          top: 24, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          bgcolor: '#10B981', 
          color: 'white', 
          px: 4, 
          py: 2, 
          borderRadius: '12px',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          zIndex: 10000,
          boxShadow: '0px 10px 20px rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircleIcon sx={{ fontSize: 24 }} />
          <Typography variant="body1" fontWeight={700}>Saved Successfully!</Typography>
        </Box>
      </Fade>
    </Box>
  );
};

export default EditLead;
