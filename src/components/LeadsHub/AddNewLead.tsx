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
  sub_source: string;
  lead_status: "new" | "contacted";
  next_action_status: "pending" | "completed" | null;
  next_action_description: string;
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark: string;
  is_active: boolean;
};

// ====================== Helpers ======================

/** Converts "" | undefined | null → null, otherwise returns the string */
const strOrNull = (val: string | undefined | null): string | null =>
  val && val.trim() !== "" ? val.trim() : null;

/** Converts a string number to integer, or null if invalid/zero */
const intOrNull = (val: string | undefined | null): number | null => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) ? n : null;
};

/** Converts a string number to integer, falls back to fallback value */
const intOrFallback = (val: string | undefined | null, fallback: number): number => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) && n > 0 ? n : fallback;
};

// ====================== Time Slots ======================
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

  // ====================== Fetch Departments ======================
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const depts = await DepartmentAPI.listActiveByClinic(clinicId);
        setDepartments(depts);
        console.log("=== DEPARTMENTS FROM API ===");
        depts.forEach(d => console.log(`  id=${d.id} | name="${d.name}"`));
      } catch (err: any) {
        const msg = err?.response?.data?.detail || err?.message || "Failed to load departments";
        setError(`Departments: ${msg}`);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [clinicId]);

  // ====================== Fetch Employees ======================
  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        setEmployeeError(null);
        const emps = await EmployeeAPI.listByClinic(clinicId);
        setEmployees(Array.isArray(emps) ? emps : []);
        console.log("=== EMPLOYEES FROM API ===");
        emps.forEach(e => console.log(`  id=${e.id} | emp_name="${e.emp_name}" | department_name="${e.department_name}"`));
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.detail || err?.message || "Failed to load employees";
        const displayMsg =
          status === 401 ? "Unauthorized — please log in again" :
          status === 404 ? `Employees endpoint not found (clinic ${clinicId})` : msg;
        setEmployeeError(displayMsg);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [clinicId]);

  // ====================== Filter Personnel ======================
  React.useEffect(() => {
    if (!form.department || employees.length === 0) {
      setFilteredPersonnel([]);
      return;
    }

    const selectedDeptId = Number(form.department);
    const selectedDept = departments.find((d) => d.id === selectedDeptId);

    if (!selectedDept) {
      setFilteredPersonnel([]);
      return;
    }

    const normalize = (s: string) =>
      (s ?? "").trim().toLowerCase().normalize("NFC");

    const selectedName = normalize(selectedDept.name);
    const filtered = employees.filter(
      (emp) => normalize(emp.department_name) === selectedName
    );

    console.log("=== FILTER DEBUG ===");
    console.log(`  Dept id=${selectedDeptId} name="${selectedDept.name}" → "${selectedName}"`);
    employees.forEach((e) =>
      console.log(`  emp="${e.emp_name}" dept="${e.department_name}" → "${normalize(e.department_name)}" MATCH=${normalize(e.department_name) === selectedName}`)
    );
    console.log(`  Matched: ${filtered.length}`);

    setFilteredPersonnel(filtered);
  }, [form.department, employees, departments]);

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

  // ====================== Handlers ======================
  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
    };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      department: e.target.value,
      personnel: "",
      assignee: "",
    }));
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
      if (form.treatments.length === 0) {
        setError("Please select at least one treatment");
        return false;
      }
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

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ====================== Build Payload ======================
  const buildPayload = (): LeadPayload => {
    const payload: LeadPayload = {
      // ── Required integers ──────────────────────────────────────────
      clinic_id: clinicId,
      department_id: intOrFallback(form.department, 1),

      // ── Required strings ──────────────────────────────────────────
      full_name: form.full_name.trim(),
      contact_no: form.contact.trim(),
      source: form.source,
      treatment_interest: form.treatments.join(","),
      appointment_date: form.appointmentDate,   // already "YYYY-MM-DD" from DatePicker
      slot: form.slot,

      // ── Nullable strings ──────────────────────────────────────────
      email: strOrNull(form.email),
      language_preference: form.language || "",
      location: form.location || "",
      address: form.address || "",
      sub_source: form.subSource || "",
      remark: form.remark || "",
      partner_full_name: form.partnerName || "",
      next_action_description: form.nextDesc || "",

      // ── Nullable — must be exact enum or null, NEVER empty string ──
      // ✅ marital_status: lowercase "single"|"married" or null
      marital_status: form.marital
        ? (form.marital.toLowerCase() as "single" | "married")
        : null,

      // ✅ partner_gender: lowercase "male"|"female" or null
      partner_gender: form.partnerGender
        ? (form.partnerGender.toLowerCase() as "male" | "female")
        : null,

      // ✅ next_action_status: "pending"|"completed" or null — NEVER ""
      next_action_status: (form.nextStatus === "pending" || form.nextStatus === "completed")
        ? form.nextStatus
        : null,

      // ✅ campaign_id: must be UUID or null — NEVER empty string
      campaign_id: null,

      // ── Nullable integers ─────────────────────────────────────────
      assigned_to_id: intOrNull(form.assignee),
      personal_id: null,
      age: intOrNull(form.age),
      partner_age: intOrNull(form.partnerAge),

      // ── Booleans ──────────────────────────────────────────────────
      partner_inquiry: isCouple === "yes",
      book_appointment: form.wantAppointment === "yes",
      is_active: true,

      // ── Fixed values ──────────────────────────────────────────────
      lead_status: "new",
    };

    // 🔍 Log exact payload before sending — makes 500 diagnosis easy
    console.log("=== PAYLOAD BEING SENT TO /leads/ ===");
    console.log(JSON.stringify(payload, null, 2));
    console.log("=====================================");

    return payload;
  };

  // ====================== Submit ======================
  const submitForm = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      const payload = buildPayload();
      const response = await LeadAPI.create(payload);
      console.log("✅ Lead created:", response);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/leads", { replace: true });
      }, 1500);
    } catch (err: any) {
      console.error("❌ Lead create error:", err?.response?.data || err?.message);

      // Extract the most useful error message from the response
      const data = err?.response?.data;
      let msg = "Failed to save lead";

      if (data) {
        if (typeof data === "string") {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.message) {
          msg = data.message;
        } else if (data.error) {
          // ✅ Handles { error: "Internal Server Error", request_id: "..." }
          msg = `${data.error}${data.request_id ? ` (request_id: ${data.request_id})` : ""}`;
        } else {
          // Show first field-level validation error
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          msg = `${firstKey}: ${Array.isArray(firstVal) ? firstVal[0] : firstVal}`;
        }
      } else {
        msg = err?.message || msg;
      }

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
            {[
              { label: "Patient Details", step: 1 },
              { label: "Medical Details", step: 2 },
              { label: "Book Appointment", step: 3 },
            ].map(({ label, step }) => (
              <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: "50%",
                  bgcolor: currentStep > step ? "#10B981" : currentStep === step ? (step === 3 ? "#3B82F6" : "#F97316") : "#E2E8F0",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem",
                }}>
                  {currentStep > step ? "✓" : step}
                </Box>
                <Typography variant="body2" fontWeight={600} sx={{
                  fontSize: "0.875rem",
                  color: currentStep > step ? "#10B981" : currentStep === step ? (step === 3 ? "#3B82F6" : "#F97316") : "#94A3B8",
                }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Form Body */}
        <Box sx={{
          bgcolor: "white", p: 3,
          maxHeight: "calc(100vh - 400px)", overflowY: "auto",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
          )}
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

              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>SOURCE & CAMPAIGN DETAILS</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Source *</Typography>
                  <TextField select fullWidth size="small" value={form.source} onChange={handleChange("source")} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                    <MenuItem value="Direct">Direct</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Sub-Source</Typography>
                  <TextField select fullWidth size="small" value={form.subSource} onChange={handleChange("subSource")} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
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
                        <MenuItem key={emp.id} value={emp.id.toString()}>
                          {emp.emp_name} ({emp.emp_type})
                        </MenuItem>
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
                    if (value && !form.treatments.includes(value)) {
                      setForm((prev) => ({ ...prev, treatments: [...prev.treatments, value] }));
                    }
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
                  <TextField select fullWidth size="small" value={form.assignee} onChange={handleChange("assignee")} sx={inputStyle}
                    disabled={loadingEmployees || !form.department}>
                    {!form.department ? (
                      <MenuItem value="" disabled>Select department first</MenuItem>
                    ) : loadingEmployees ? (
                      <MenuItem value="" disabled>Loading...</MenuItem>
                    ) : filteredPersonnel.length === 0 ? (
                      <MenuItem value="" disabled>{employeeError ? "Failed to load" : "No employees in this department"}</MenuItem>
                    ) : (
                      filteredPersonnel.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id.toString()}>
                          {emp.emp_name} ({emp.emp_type})
                        </MenuItem>
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
                    {timeSlots.map((slot, i) => (
                      <MenuItem key={i} value={slot}>{slot}</MenuItem>
                    ))}
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