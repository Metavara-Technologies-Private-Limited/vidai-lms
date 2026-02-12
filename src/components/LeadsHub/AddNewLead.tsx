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
  Alert,
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { FormState } from "../../types/leads.types";
import { LeadAPI } from "../../services/leads.api";

// ====================== Backend Payload Type ======================
export type LeadPayload = {
  clinic_id: number;
  department_id: number;
  campaign_id?: string | null;
  assigned_to_id?: number | null;
  personal_id?: number | null;
  full_name: string;
  contact_no: string;
  age?: number | null;
  marital_status?: "single" | "married" | null;
  email?: string | null;
  language_preference?: string;
  location?: string;
  address?: string;
  partner_inquiry: boolean;
  partner_full_name?: string;
  partner_age?: number | null;
  partner_gender?: "male" | "female" | null;
  source: string;
  sub_source?: string;
  lead_status?: "new" | "contacted";
  next_action_status?: "pending" | "completed" | null;
  next_action_description?: string;
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark?: string;
  is_active?: boolean;
};

// ====================== Time Slots Data ======================
const timeSlots = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  "11:30 AM - 12:00 PM",
  "12:00 PM - 12:30 PM",
  "12:30 PM - 01:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:00 PM - 03:30 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
  "04:30 PM - 05:00 PM",
  "05:00 PM - 05:30 PM",
  "05:30 PM - 06:00 PM",
];

// ====================== AddNewLead Component ======================
export default function AddNewLead() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [error, setError] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  const [form, setForm] = React.useState<FormState>({
    full_name: "",
    contact: "",
    email: "",
    location: "",
    gender: "",
    age: "",
    marital: "",
    address: "",
    language: "",

    partnerName: "",
    partnerAge: "",
    partnerGender: "",

    source: "",
    subSource: "",
    campaign: "",

    assignee: "",
    nextType: "",
    nextStatus: "",
    nextDesc: "",

    treatmentInterest: "",
    treatments: [],
    documents: null,

    wantAppointment: "yes",
    department: "",
    personnel: "",
    appointmentDate: "",
    slot: "",
    remark: "",
  });

  // ====================== Styles ======================
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

  // ====================== Handle Input Change ======================
  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  // ====================== Validate Step ======================
  const validateStep = (): boolean => {
    if (currentStep === 1) {
      if (!form.full_name || !form.contact || !form.email) {
        setError("Please fill in name, contact, and email");
        return false;
      }
      if (!form.gender || !form.age) {
        setError("Please fill in gender and age");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!form.source || form.treatments.length === 0) {
        setError("Please select source and at least one treatment");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!form.department || !form.appointmentDate || !form.slot) {
        setError("Please fill all appointment details");
        return false;
      }
    }

    return true;
  };

  // ====================== Handle Next / Submit ======================
  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep === 3) {
      await submitForm();
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // ====================== Submit Form ======================
  const submitForm = async () => {
    try {
      setError(null);

      const payload: LeadPayload = {
        clinic_id: 1,
        department_id: Number(form.department) || 1,
        full_name: form.full_name,
        contact_no: form.contact,
        email: form.email || null,
        age: form.age ? Number(form.age) : null,
        marital_status: form.marital ? form.marital.toLowerCase() as "single" | "married" : null,
        language_preference: form.language || "",
        location: form.location || "",
        address: form.address || "",
        partner_inquiry: isCouple === "yes",
        partner_full_name: form.partnerName || "",
        partner_age: form.partnerAge ? Number(form.partnerAge) : null,
        partner_gender: form.partnerGender ? form.partnerGender.toLowerCase() as "male" | "female" : null,
        source: form.source,
        sub_source: form.subSource || "",
        campaign_id: null,
        lead_status: "new",
        next_action_status: (form.nextStatus as "pending" | "completed" | "") || null,
        next_action_description: form.nextDesc || "",
        treatment_interest: form.treatments.join(","),
        book_appointment: form.wantAppointment === "yes",
        appointment_date: form.appointmentDate,
        slot: form.slot,
        remark: form.remark || "",
        is_active: true,
      };

      console.log("📤 Sending payload to backend:", JSON.stringify(payload, null, 2));

      // Show success immediately
      setShowSuccess(true);

      // Send to API in background
      LeadAPI.create(payload).then((response) => {
        console.log("✅ Lead created successfully:", response);
      }).catch((err) => {
        console.error("❌ Error saving lead:", err);
      });

      // Redirect after showing success message
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/leads", { replace: true });
      }, 1500);

    } catch (err: any) {
      console.error("❌ Error saving lead:", err);

      const errorMessage = 
        err?.response?.data?.detail || 
        err?.response?.data?.message ||
        Object.values(err?.response?.data || {})?.[0] ||
        err?.message || 
        "Failed to save lead";

      setError(
        typeof errorMessage === "string" 
          ? errorMessage 
          : JSON.stringify(errorMessage)
      );
    }
  };

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
        <Typography variant="body2" fontWeight={600} color="#1E293B">Add New Lead</Typography>
      </Stack>

      {/* Main Content */}
      <Paper sx={{ borderRadius: "16px", overflow: "hidden" }}>
        {/* Header */}
        <Box sx={{ bgcolor: "white", p: 3, borderBottom: "1px solid #F1F5F9" }}>
          <Typography variant="h6" fontWeight={700} color="#1E293B">
            Add New Lead
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

        {/* Form Content */}
        <Box sx={{ 
          bgcolor: "white", 
          p: 3, 
          maxHeight: "calc(100vh - 400px)", 
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" }
        }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

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
                  <TextField fullWidth size="small" value={form.full_name} onChange={handleChange("full_name")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Contact No.</Typography>
                  <TextField fullWidth size="small" value={form.contact} onChange={handleChange("contact")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Email</Typography>
                  <TextField fullWidth size="small" value={form.email} onChange={handleChange("email")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Location / Address</Typography>
                  <TextField fullWidth size="small" value={form.location} onChange={handleChange("location")} sx={inputStyle} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Gender</Typography>
                  <TextField select fullWidth size="small" value={form.gender} onChange={handleChange("gender")} sx={inputStyle}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Age</Typography>
                  <TextField fullWidth size="small" type="number" value={form.age} onChange={handleChange("age")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Marital Status</Typography>
                  <TextField select fullWidth size="small" value={form.marital} onChange={handleChange("marital")} sx={inputStyle}>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Address</Typography>
                  <TextField fullWidth size="small" value={form.address} onChange={handleChange("address")} sx={inputStyle} />
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography sx={labelStyle}>Language Preference</Typography>
                <TextField select fullWidth size="small" value={form.language} onChange={handleChange("language")} sx={{ ...inputStyle, maxWidth: "25%" }}>
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
                <RadioGroup row value={isCouple} onChange={(e) => setIsCouple(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Full Name</Typography>
                  <TextField fullWidth size="small" value={form.partnerName} onChange={handleChange("partnerName")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Age</Typography>
                  <TextField fullWidth size="small" type="number" value={form.partnerAge} onChange={handleChange("partnerAge")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Gender</Typography>
                  <TextField select fullWidth size="small" value={form.partnerGender} onChange={handleChange("partnerGender")} sx={inputStyle}>
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
                  <TextField select fullWidth size="small" value={form.source} onChange={handleChange("source")} sx={inputStyle}>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                    <MenuItem value="Direct">Direct</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Sub-Source</Typography>
                  <TextField select fullWidth size="small" value={form.subSource} onChange={handleChange("subSource")} sx={inputStyle}>
                    <MenuItem value="Facebook">Facebook</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="Google">Google</MenuItem>
                    <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Campaign Name</Typography>
                  <TextField fullWidth size="small" value={form.campaign} onChange={handleChange("campaign")} sx={inputStyle} />
                </Box>
              </Box>

              {/* ASSIGNEE & NEXT ACTION DETAILS */}
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                ASSIGNEE & NEXT ACTION DETAILS
              </Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField select fullWidth size="small" value={form.assignee} onChange={handleChange("assignee")} sx={inputStyle}>
                    <MenuItem value="Henry Cavill">Henry Cavill</MenuItem>
                    <MenuItem value="Emma Clarke">Emma Clarke</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Next Action Type</Typography>
                  <TextField select fullWidth size="small" value={form.nextType} onChange={handleChange("nextType")} sx={inputStyle}>
                    <MenuItem value="Follow Up">Follow Up</MenuItem>
                    <MenuItem value="Call">Call</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Next Action Status</Typography>
                  <TextField select fullWidth size="small" value={form.nextStatus} onChange={handleChange("nextStatus")} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={labelStyle}>Next Action Description</Typography>
                <TextField fullWidth size="small" value={form.nextDesc} onChange={handleChange("nextDesc")} sx={inputStyle} />
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
                  value={form.treatmentInterest} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, treatmentInterest: value }));
                    if (value && !form.treatments.includes(value)) {
                      setForm((prev) => ({ ...prev, treatments: [...prev.treatments, value] }));
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
              {form.treatments.length > 0 && (
                <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                  {form.treatments.map((treatment) => (
                    <Chip 
                      key={treatment}
                      label={treatment}
                      onDelete={() => setForm((prev) => ({ ...prev, treatments: prev.treatments.filter((t) => t !== treatment) }))}
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
                    <input type="file" hidden onChange={(e) => setForm((prev) => ({ ...prev, documents: e.target.files ? e.target.files[0] : null }))} />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {form.documents ? form.documents.name : "No File Chosen"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* STEP 3: BOOK APPOINTMENT - SIMPLIFIED */}
          {currentStep === 3 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
                APPOINTMENT DETAILS
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ ...labelStyle, mb: 1 }}>Want to Book an Appointment?</Typography>
                <RadioGroup row value={form.wantAppointment} onChange={(e) => setForm((prev) => ({ ...prev, wantAppointment: e.target.value as "yes" | "no" }))}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Department *</Typography>
                  <TextField select fullWidth size="small" value={form.department} onChange={handleChange("department")} sx={inputStyle}>
                    <MenuItem value="1">Consultation</MenuItem>
                    <MenuItem value="2">Treatment</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Personnel *</Typography>
                  <TextField select fullWidth size="small" value={form.personnel} onChange={handleChange("personnel")} sx={inputStyle}>
                    <MenuItem value="Dr. Alex Carrey">Dr. Alex Carrey</MenuItem>
                    <MenuItem value="Dr. Sarah Smith">Dr. Sarah Smith</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={labelStyle}>Date *</Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={selectedDate}
                      onChange={(newDate) => {
                        setSelectedDate(newDate);
                        if (newDate) {
                          setForm((prev) => ({ 
                            ...prev, 
                            appointmentDate: newDate.format('YYYY-MM-DD') 
                          }));
                        }
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: inputStyle,
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Select Slot *</Typography>
                  <TextField 
                    select 
                    fullWidth 
                    size="small" 
                    value={form.slot} 
                    onChange={handleChange("slot")} 
                    sx={inputStyle}
                  >
                    {timeSlots.map((slot, index) => (
                      <MenuItem key={index} value={slot}>
                        {slot}
                      </MenuItem>
                    ))}
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
                  value={form.remark} 
                  onChange={handleChange("remark")} 
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
}