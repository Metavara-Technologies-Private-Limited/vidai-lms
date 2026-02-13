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
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// ── Redux ──────────────────────────────────────────────────────────
import { useSelector } from "react-redux";
import { selectCampaign } from "../../store/campaignSlice";

import type { FormState } from "../../types/leads.types";
import { LeadAPI, DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import type { Department, Employee } from "../../services/leads.api";

// ====================== Backend Payload Type ======================
export type LeadPayload = {
  clinic_id: number;
  department_id: number;
  campaign_id: string | null;
  assigned_to_id: number | null;
  personal_id: number | null;
  full_name: string;
  contact_no: string;
  age: number | null;
  marital_status: "single" | "married" | null;
  email: string | null;
  language_preference: string;
  location: string;
  address: string;
  partner_inquiry: boolean;
  partner_full_name: string;
  partner_age: number | null;
  partner_gender: "male" | "female" | null;
  source: string;
  sub_source?: string;
  lead_status?: "New" | "Contacted" | "Lost" | "Converted" | "Cycle Conversion" | "Follow-Ups";
  next_action_status?: "pending" | "completed" | null;
  next_action_description?: string;
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark: string;
  is_active: boolean;
};

// ====================== Helpers ======================
const strOrNull = (val: string | undefined | null): string | null =>
  val && val.trim() !== "" ? val.trim() : null;

const intOrNull = (val: string | undefined | null): number | null => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) ? n : null;
};

const intOrFallback = (val: string | undefined | null, fallback: number): number => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) && n > 0 ? n : fallback;
};

// ====================== Time Slots ======================
const timeSlots = [
  "09:00 AM - 09:30 AM", "09:30 AM - 10:00 AM", "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM", "11:00 AM - 11:30 AM", "11:30 AM - 12:00 PM",
  "12:00 PM - 12:30 PM", "12:30 PM - 01:00 PM", "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM", "03:00 PM - 03:30 PM", "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM", "04:30 PM - 05:00 PM", "05:00 PM - 05:30 PM",
  "05:30 PM - 06:00 PM",
];

// ====================== Component ======================
export default function AddNewLead() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [error, setError] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = React.useState<Employee[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [employeeError, setEmployeeError] = React.useState<string | null>(null);
  const [clinicId] = React.useState(1);

  // ── Pull campaigns from Redux (already fetched by CampaignsScreen) ──
  const rawCampaigns = useSelector(selectCampaign);

  // Normalise Redux shape → UI model
  // source  : campaign_mode 1 → "Social Media", else → "Email"
  // subSource: first platform name for social, "gmail" for email
  const allCampaigns = React.useMemo(
    () =>
      (rawCampaigns || []).map((api: any) => ({
        id: api.id as string,
        name: api.campaign_name ?? "",
        source: api.campaign_mode === 1 ? "Social Media" : "Email",
        subSource:
          api.campaign_mode === 1
            ? (api.social_media?.[0]?.platform_name ?? "")
            : "gmail",
        isActive: Boolean(api.is_active),
      })),
    [rawCampaigns]
  );

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
    campaign: "",       // UUID of the matched / selected campaign
    campaignName: "",   // display name — read-only, derived
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

  // ====================== Fetch Departments ======================
  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingDepartments(true);
        const depts = await DepartmentAPI.listActiveByClinic(clinicId);
        setDepartments(depts);
      } catch (err: any) {
        setError(`Departments: ${err?.response?.data?.detail || err?.message || "Failed to load"}`);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetch();
  }, [clinicId]);

  // ====================== Fetch Employees ======================
  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingEmployees(true);
        setEmployeeError(null);
        const emps = await EmployeeAPI.listByClinic(clinicId);
        setEmployees(Array.isArray(emps) ? emps : []);
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.detail || err?.message || "Failed to load employees";
        setEmployeeError(
          status === 401 ? "Unauthorized — please log in again" :
          status === 404 ? `Employees endpoint not found (clinic ${clinicId})` : msg
        );
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetch();
  }, [clinicId]);

  // ====================== Auto-match campaign from source + subSource ======================
  // Watches source and subSource. Finds campaigns in Redux that match BOTH.
  // • If exactly one match  → auto-set campaign UUID + name (read-only)
  // • If multiple matches   → let user pick from a filtered dropdown
  // • If no match / cleared → reset campaign fields
  const matchedCampaigns = React.useMemo(() => {
    if (!form.source) return [];

    return allCampaigns.filter((c) => {
      const sourceMatch =
        c.source.toLowerCase() === form.source.toLowerCase();

      // If subSource is also filled, require it to match too
      const subSourceMatch =
        !form.subSource ||
        c.subSource.toLowerCase() === form.subSource.toLowerCase();

      return sourceMatch && subSourceMatch;
    });
  }, [form.source, form.subSource, allCampaigns]);

  React.useEffect(() => {
    if (matchedCampaigns.length === 1) {
      // Exactly one match → auto-fill silently
      const c = matchedCampaigns[0];
      setForm((prev) => ({
        ...prev,
        campaign: c.id,
        campaignName: c.name,
      }));
      console.log(`=== Campaign auto-matched: "${c.name}" (id=${c.id}) ===`);
    } else {
      // 0 or multiple matches → clear campaign so user can pick / leave blank
      setForm((prev) => ({
        ...prev,
        campaign: "",
        campaignName: "",
      }));
    }
  }, [matchedCampaigns]);

  // ====================== Filter Personnel by Department ======================
  React.useEffect(() => {
    if (!form.department || employees.length === 0) { setFilteredPersonnel([]); return; }
    const selectedDeptId = Number(form.department);
    const selectedDept = departments.find((d) => d.id === selectedDeptId);
    if (!selectedDept) { setFilteredPersonnel([]); return; }
    const normalize = (s: string) => (s ?? "").trim().toLowerCase().normalize("NFC");
    const selectedName = normalize(selectedDept.name);
    setFilteredPersonnel(employees.filter((emp) => normalize(emp.department_name) === selectedName));
  }, [form.department, employees, departments]);

  // ====================== Styles ======================
  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px", fontSize: "0.875rem",
      "& fieldset": { borderColor: "#E2E8F0" },
      "&:hover fieldset": { borderColor: "#CBD5E1" },
      "&.Mui-focused fieldset": { borderColor: "#6366F1" },
    },
  };

  // Grey background for auto-filled / read-only fields
  const readOnlyStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px", fontSize: "0.875rem",
      bgcolor: "#F1F5F9",
      "& fieldset": { borderColor: "#E2E8F0" },
      "&:hover fieldset": { borderColor: "#E2E8F0" },
      "&.Mui-focused fieldset": { borderColor: "#E2E8F0" },
    },
  };

  const labelStyle = {
    fontSize: "0.75rem", fontWeight: 600, color: "#475569", mb: 0.5, display: "block",
  };

  const autoTag = (
    <Typography component="span" sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}>
      auto-filled
    </Typography>
  );

  // ====================== Handlers ======================
  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
    };

  // Changing source resets subSource and campaign so matching re-runs cleanly
  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      source: e.target.value,
      subSource: "",
      campaign: "",
      campaignName: "",
    }));
    setError(null);
  };

  // Changing subSource resets campaign so matching re-runs
  const handleSubSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      subSource: e.target.value,
      campaign: "",
      campaignName: "",
    }));
    setError(null);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, department: e.target.value, personnel: "", assignee: "" }));
    setError(null);
  };

  // ====================== Validate ======================
  const validateStep = (): boolean => {
    if (currentStep === 1) {
      if (!form.full_name.trim()) { setError("Full name is required"); return false; }
      if (!form.contact.trim()) { setError("Contact number is required"); return false; }
      if (!form.email.trim()) { setError("Email is required"); return false; }
      if (!form.gender) { setError("Gender is required"); return false; }
      if (!form.age) { setError("Age is required"); return false; }
      if (!form.source) { setError("Source is required"); return false; }
    }
    if (currentStep === 2) {
      if (form.treatments.length === 0) { setError("Please select at least one treatment"); return false; }
    }
    if (currentStep === 3) {
      if (!form.department) { setError("Department is required"); return false; }
      if (!form.appointmentDate) { setError("Appointment date is required"); return false; }
      if (!form.slot) { setError("Time slot is required"); return false; }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    if (currentStep === 3) { await submitForm(); return; }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep((prev) => prev - 1); };

  // ====================== Build Payload ======================
  const buildPayload = (): LeadPayload => {
    const payload: LeadPayload = {
      clinic_id: clinicId,
      department_id: intOrFallback(form.department, 1),
      full_name: form.full_name.trim(),
      contact_no: form.contact.trim(),
      source: form.source,
      sub_source: form.subSource || "",
      treatment_interest: form.treatments.join(","),
      appointment_date: form.appointmentDate,
      slot: form.slot,
      campaign_id: strOrNull(form.campaign),   // UUID or null — never ""
      email: strOrNull(form.email),
      language_preference: form.language || "",
      location: form.location || "",
      address: form.address || "",
      remark: form.remark || "",
      partner_full_name: form.partnerName || "",
      next_action_description: form.nextDesc || "",
      marital_status: form.marital ? (form.marital.toLowerCase() as "single" | "married") : null,
      partner_gender: form.partnerGender ? (form.partnerGender.toLowerCase() as "male" | "female") : null,
      next_action_status:
        form.nextStatus === "pending" || form.nextStatus === "completed" ? form.nextStatus : null,
      assigned_to_id: intOrNull(form.assignee),
      personal_id: null,
      age: intOrNull(form.age),
      partner_age: intOrNull(form.partnerAge),
      partner_inquiry: isCouple === "yes",
      book_appointment: form.wantAppointment === "yes",
      is_active: true,
      lead_status: "new",
    };
    console.log("=== PAYLOAD ===", JSON.stringify(payload, null, 2));
    return payload;
  };

  // ====================== Submit ======================
  const submitForm = async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      const response = await LeadAPI.create(buildPayload());
      console.log("✅ Lead created:", response);
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); navigate("/leads", { replace: true }); }, 1500);
    } catch (err: any) {
      console.error("❌ Lead create error:", err?.response?.data || err?.message);
      const data = err?.response?.data;
      let msg = "Failed to save lead";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.message) msg = data.message;
        else if (data.error) msg = `${data.error}${data.request_id ? ` (request_id: ${data.request_id})` : ""}`;
        else { const k = Object.keys(data)[0]; msg = `${k}: ${Array.isArray(data[k]) ? data[k][0] : data[k]}`; }
      } else msg = err?.message || msg;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================== Render ======================
  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh", p: 4 }}>

      {/* Breadcrumb */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer" }} onClick={() => navigate("/leads")}>VIDAI Leads</Typography>
        <Typography variant="body2" color="text.secondary">›</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer" }} onClick={() => navigate("/leads")}>Leads Hub</Typography>
        <Typography variant="body2" color="text.secondary">›</Typography>
        <Typography variant="body2" fontWeight={600} color="#1E293B">Add New Lead</Typography>
      </Stack>

      <Paper sx={{ borderRadius: "16px", overflow: "hidden" }}>

        {/* Header */}
        <Box sx={{ bgcolor: "white", p: 3, borderBottom: "1px solid #F1F5F9" }}>
          <Typography variant="h6" fontWeight={700} color="#1E293B">Add New Lead</Typography>
        </Box>

        {/* Step Indicator */}
        <Box sx={{ bgcolor: "white", px: 6, pt: 3, pb: 2, borderBottom: "1px solid #F1F5F9" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 3, bgcolor: "#F8FAFC", px: 3, py: 1.5, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            {[{ label: "Patient Details", step: 1 }, { label: "Medical Details", step: 2 }, { label: "Book Appointment", step: 3 }].map(({ label, step }) => (
              <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: "50%",
                  bgcolor: currentStep > step ? "#10B981" : currentStep === step ? (step === 3 ? "#3B82F6" : "#F97316") : "#E2E8F0",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem",
                }}>
                  {currentStep > step ? "✓" : step}
                </Box>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.875rem", color: currentStep > step ? "#10B981" : currentStep === step ? (step === 3 ? "#3B82F6" : "#F97316") : "#94A3B8" }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Form Body */}
        <Box sx={{ bgcolor: "white", p: 3, maxHeight: "calc(100vh - 400px)", overflowY: "auto", "&::-webkit-scrollbar": { width: "8px" }, "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" } }}>
          {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
          {employeeError && (
            <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setEmployeeError(null)}>
              Could not load employees: <strong>{employeeError}</strong>
            </Alert>
          )}

          {/* ===== STEP 1 ===== */}
          {currentStep === 1 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>LEAD INFORMATION</Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={labelStyle}>Full Name *</Typography>
                  <TextField fullWidth size="small" value={form.full_name} onChange={handleChange("full_name")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Contact No. *</Typography>
                  <TextField fullWidth size="small" value={form.contact} onChange={handleChange("contact")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Email *</Typography>
                  <TextField fullWidth size="small" value={form.email} onChange={handleChange("email")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Location</Typography>
                  <TextField fullWidth size="small" value={form.location} onChange={handleChange("location")} sx={inputStyle} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Gender *</Typography>
                  <TextField select fullWidth size="small" value={form.gender} onChange={handleChange("gender")} sx={inputStyle}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Age *</Typography>
                  <TextField fullWidth size="small" type="number" value={form.age} onChange={handleChange("age")} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Marital Status</Typography>
                  <TextField select fullWidth size="small" value={form.marital} onChange={handleChange("marital")} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
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
                  <MenuItem value="">-- Select --</MenuItem>
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                  <MenuItem value="Kannada">Kannada</MenuItem>
                </TextField>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>PARTNER INFORMATION</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ ...labelStyle, mb: 1 }}>Is This Inquiry For A Couple?</Typography>
                <RadioGroup row value={isCouple} onChange={(e) => setIsCouple(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>
              {isCouple === "yes" && (
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
                      <MenuItem value="">-- Select --</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </TextField>
                  </Box>
                </Box>
              )}

              {/* ===== SOURCE & CAMPAIGN DETAILS ===== */}
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>SOURCE & CAMPAIGN DETAILS</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>

                {/* 1. Source — user picks this first */}
                <Box>
                  <Typography sx={labelStyle}>Source *</Typography>
                  <TextField select fullWidth size="small" value={form.source} onChange={handleSourceChange} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                    <MenuItem value="Direct">Direct</MenuItem>
                    <MenuItem value="Email">Email</MenuItem>
                  </TextField>
                </Box>

                {/* 2. Sub-Source — user picks this second */}
                <Box>
                  <Typography sx={labelStyle}>Sub-Source</Typography>
                  <TextField select fullWidth size="small" value={form.subSource} onChange={handleSubSourceChange} sx={inputStyle} disabled={!form.source}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Facebook">Facebook</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="Google">Google</MenuItem>
                    <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                    <MenuItem value="gmail">Gmail</MenuItem>
                  </TextField>
                </Box>

                {/* 3. Campaign Name — derived from source + subSource, read-only */}
                <Box>
                  <Typography sx={labelStyle}>
                    Campaign Name
                    {form.campaignName && autoTag}
                  </Typography>

                  {matchedCampaigns.length > 1 ? (
                    // Multiple matches → let user pick which campaign
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={form.campaign}
                      onChange={(e) => {
                        const chosen = matchedCampaigns.find((c) => c.id === e.target.value);
                        setForm((prev) => ({
                          ...prev,
                          campaign: e.target.value,
                          campaignName: chosen?.name ?? "",
                        }));
                      }}
                      sx={inputStyle}
                    >
                      <MenuItem value="">-- Select campaign --</MenuItem>
                      {matchedCampaigns.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    // 0 or 1 match → read-only display field
                    <TextField
                      fullWidth
                      size="small"
                      value={form.campaignName || (form.source && matchedCampaigns.length === 0 ? "No matching campaign" : "")}
                      placeholder="Filled automatically"
                      InputProps={{ readOnly: true }}
                      sx={readOnlyStyle}
                    />
                  )}

                  {/* Helper hint */}
                  {form.source && matchedCampaigns.length === 0 && (
                    <Typography sx={{ fontSize: "0.68rem", color: "#94A3B8", mt: 0.5 }}>
                      No active campaign matches this source
                    </Typography>
                  )}
                  {matchedCampaigns.length > 1 && (
                    <Typography sx={{ fontSize: "0.68rem", color: "#F97316", mt: 0.5 }}>
                      {matchedCampaigns.length} campaigns match — please select one
                    </Typography>
                  )}
                </Box>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>ASSIGNEE & NEXT ACTION DETAILS</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField select fullWidth size="small" value={form.assignee} onChange={handleChange("assignee")} sx={inputStyle}
                    disabled={loadingEmployees}
                    InputProps={{ endAdornment: loadingEmployees ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null }}>
                    {loadingEmployees ? (
                      <MenuItem value="" disabled>Loading...</MenuItem>
                    ) : employees.length === 0 ? (
                      <MenuItem value="" disabled>{employeeError ? "Failed to load" : "No employees"}</MenuItem>
                    ) : (
                      employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id.toString()}>{emp.emp_name} ({emp.emp_type})</MenuItem>
                      ))
                    )}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Next Action Type</Typography>
                  <TextField select fullWidth size="small" value={form.nextType} onChange={handleChange("nextType")} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
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

          {/* ===== STEP 2 ===== */}
          {currentStep === 2 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>TREATMENT INFORMATION</Typography>
              <Box sx={{ mb: 3 }}>
                <Typography sx={labelStyle}>Treatment Interest *</Typography>
                <TextField select fullWidth size="small" value={form.treatmentInterest}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, treatmentInterest: value }));
                    if (value && !form.treatments.includes(value))
                      setForm((prev) => ({ ...prev, treatments: [...prev.treatments, value] }));
                  }}
                  sx={{ ...inputStyle, maxWidth: "50%" }} displayEmpty>
                  <MenuItem value="" disabled>Select</MenuItem>
                  <MenuItem value="Medical Checkup">Medical Checkup</MenuItem>
                  <MenuItem value="IVF">IVF</MenuItem>
                  <MenuItem value="IUI">IUI</MenuItem>
                  <MenuItem value="Consultation">Consultation</MenuItem>
                </TextField>
              </Box>
              {form.treatments.length > 0 && (
                <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                  {form.treatments.map((t) => (
                    <Chip key={t} label={t}
                      onDelete={() => setForm((prev) => ({ ...prev, treatments: prev.treatments.filter((x) => x !== t) }))}
                      sx={{ bgcolor: "#FEE2E2", color: "#B91C1C", fontWeight: 600, border: "1px solid #FCA5A5", "& .MuiChip-deleteIcon": { color: "#B91C1C", "&:hover": { color: "#991B1B" } } }}
                    />
                  ))}
                </Stack>
              )}
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>DOCUMENTS & REPORTS</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography sx={labelStyle}>Upload Documents</Typography>
                <Box sx={{ border: "2px dashed #E2E8F0", borderRadius: "12px", p: 3, display: "inline-block", textAlign: "center", bgcolor: "#F8FAFC", minWidth: "400px" }}>
                  <Button variant="contained" component="label" sx={{ bgcolor: "#64748B", textTransform: "none", borderRadius: "8px", fontWeight: 600, px: 3, py: 1, "&:hover": { bgcolor: "#475569" } }}>
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

          {/* ===== STEP 3 ===== */}
          {currentStep === 3 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>APPOINTMENT DETAILS</Typography>
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
                  <TextField select fullWidth size="small" value={form.department} onChange={handleDepartmentChange} sx={inputStyle}
                    disabled={loadingDepartments}
                    InputProps={{ endAdornment: loadingDepartments ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null }}>
                    {loadingDepartments ? (
                      <MenuItem value="" disabled>Loading...</MenuItem>
                    ) : departments.length === 0 ? (
                      <MenuItem value="" disabled>No departments available</MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id.toString()}>{dept.name}</MenuItem>
                      ))
                    )}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField select fullWidth size="small" value={form.assignee} onChange={handleChange("assignee")} sx={inputStyle} disabled={loadingEmployees || !form.department}>
                    {!form.department ? (
                      <MenuItem value="" disabled>Select department first</MenuItem>
                    ) : loadingEmployees ? (
                      <MenuItem value="" disabled>Loading...</MenuItem>
                    ) : filteredPersonnel.length === 0 ? (
                      <MenuItem value="" disabled>{employeeError ? "Failed to load" : "No employees in this department"}</MenuItem>
                    ) : (
                      filteredPersonnel.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id.toString()}>{emp.emp_name} ({emp.emp_type})</MenuItem>
                      ))
                    )}
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
                        if (newDate) setForm((prev) => ({ ...prev, appointmentDate: newDate.format("YYYY-MM-DD") }));
                      }}
                      slotProps={{ textField: { size: "small", fullWidth: true, sx: inputStyle } }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Select Slot *</Typography>
                  <TextField select fullWidth size="small" value={form.slot} onChange={handleChange("slot")} sx={inputStyle}>
                    {timeSlots.map((slot, i) => <MenuItem key={i} value={slot}>{slot}</MenuItem>)}
                  </TextField>
                </Box>
              </Box>
              <Box>
                <Typography sx={labelStyle}>Remark</Typography>
                <TextField fullWidth size="small" multiline rows={2} placeholder="Type Here..." value={form.remark} onChange={handleChange("remark")} sx={inputStyle} />
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ bgcolor: "white", p: 3, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => navigate("/leads")} sx={{ textTransform: "none", color: "#64748B", fontWeight: 700, px: 3 }}>Cancel</Button>
          {currentStep > 1 && (
            <Button onClick={handleBack} variant="outlined" disabled={isSubmitting}
              sx={{ textTransform: "none", borderColor: "#E2E8F0", color: "#1E293B", fontWeight: 700, px: 3, "&:hover": { borderColor: "#CBD5E1" } }}>
              Back
            </Button>
          )}
          {currentStep < 3 ? (
            <Button onClick={handleNext} variant="contained"
              sx={{ bgcolor: "#334155", textTransform: "none", fontWeight: 700, px: 4, "&:hover": { bgcolor: "#1E293B" } }}>
              Next
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained" disabled={isSubmitting}
              sx={{ bgcolor: "#334155", textTransform: "none", fontWeight: 700, px: 4, minWidth: "100px", "&:hover": { bgcolor: "#1E293B" } }}>
              {isSubmitting ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Save"}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Success Toast */}
      <Fade in={showSuccess}>
        <Box sx={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          bgcolor: "#10B981", color: "white", px: 4, py: 2, borderRadius: "12px",
          display: "flex", alignItems: "center", gap: 1.5, zIndex: 10000,
          boxShadow: "0px 10px 20px rgba(16, 185, 129, 0.3)",
        }}>
          <CheckCircleIcon sx={{ fontSize: 24 }} />
          <Typography variant="body1" fontWeight={700}>Saved Successfully!</Typography>
        </Box>
      </Fade>
    </Box>
  );
}