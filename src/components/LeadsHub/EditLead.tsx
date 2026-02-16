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
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BusinessIcon from "@mui/icons-material/Business";

// ✅ OPTION 1: Import EmployeeAPI from leads.api.ts (all in one place)
import { LeadAPI, DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import { fetchLeads } from "../../store/leadSlice";
import type { Lead, Department, Employee } from "../../services/leads.api";

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

// ====================== Component ======================
export default function EditLead() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();

  const [currentStep, setCurrentStep] = React.useState(1);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Dropdowns data
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = React.useState<Employee[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [employeeError, setEmployeeError] = React.useState<string | null>(null);

  // Lead data
  const [leadData, setLeadData] = React.useState<Lead | null>(null);
  const [clinicId, setClinicId] = React.useState<number>(1);

  // Form state - Patient Details (Step 1)
  const [fullName, setFullName] = React.useState("");
  const [contactNo, setContactNo] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [age, setAge] = React.useState("");
  const [marital, setMarital] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [language, setLanguage] = React.useState("");
  
  // Partner Information
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [partnerName, setPartnerName] = React.useState("");
  const [partnerAge, setPartnerAge] = React.useState("");
  const [partnerGender, setPartnerGender] = React.useState("");

  // Source & Campaign Details
  const [source, setSource] = React.useState("");
  const [subSource, setSubSource] = React.useState("");
  const [campaign, setCampaign] = React.useState("");

  // Assignee & Next Action
  const [assignee, setAssignee] = React.useState("");
  const [nextType, setNextType] = React.useState("");
  const [nextStatus, setNextStatus] = React.useState("");
  const [nextDesc, setNextDesc] = React.useState("");

  // Form state - Medical Details (Step 2)
  const [treatmentInterest, setTreatmentInterest] = React.useState("");
  const [treatments, setTreatments] = React.useState<string[]>([]);

  // Form state - Book Appointment (Step 3)
  const [wantAppointment, setWantAppointment] = React.useState<"yes" | "no">("yes");
  const [department, setDepartment] = React.useState("");
  const [personnel, setPersonnel] = React.useState("");
  const [appointmentDate, setAppointmentDate] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);
  const [slot, setSlot] = React.useState("");
  const [remark, setRemark] = React.useState("");

  // ====================== Fetch Lead Data ======================
  React.useEffect(() => {
    const fetchLeadData = async () => {
      if (!id) {
        setError("No lead ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Fetching lead with ID:", id);
        const lead = await LeadAPI.getById(id);
        console.log("✅ Fetched lead:", lead);
        
        setLeadData(lead);
        setClinicId(lead.clinic_id);

        // Populate form fields - Step 1
        setFullName(lead.full_name || "");
        setContactNo(lead.contact_no || "");
        setEmail(lead.email || "");
        setLocation(lead.location || "");
        setGender(lead.partner_gender === "male" ? "Male" : lead.partner_gender === "female" ? "Female" : "");
        setAge(lead.age?.toString() || "");
        setMarital(lead.marital_status === "married" ? "Married" : lead.marital_status === "single" ? "Single" : "");
        setAddress(lead.address || "");
        setLanguage(lead.language_preference || "");
        
        // Partner info
        setIsCouple(lead.partner_inquiry ? "yes" : "no");
        setPartnerName(lead.partner_full_name || "");
        setPartnerAge(lead.partner_age?.toString() || "");
        setPartnerGender(lead.partner_gender === "male" ? "Male" : lead.partner_gender === "female" ? "Female" : "");
        
        // Source
        setSource(lead.source || "");
        setSubSource(lead.sub_source || "");
        setCampaign("");
        
        // Assignee - store the ID as string
        setAssignee(lead.assigned_to_id?.toString() || "");
        setNextType("");
        setNextStatus(lead.next_action_status || "");
        setNextDesc(lead.next_action_description || "");
        
        // Medical - Step 2
        setTreatmentInterest(lead.treatment_interest || "");
        if (lead.treatment_interest) {
          setTreatments(lead.treatment_interest.split(",").map(t => t.trim()));
        }
        
        // Appointment - Step 3
        setWantAppointment(lead.book_appointment ? "yes" : "no");
        setDepartment(lead.department_id?.toString() || "");
        setPersonnel("");
        setAppointmentDate(lead.appointment_date || "");
        if (lead.appointment_date) {
          setSelectedDate(dayjs(lead.appointment_date));
        }
        setSlot(lead.slot || "");
        setRemark(lead.remark || "");

        setLoading(false);
      } catch (err: any) {
        console.error("❌ Failed to fetch lead:", err);
        setError(err?.response?.data?.detail || err?.message || "Failed to load lead");
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [id]);

  // ====================== Fetch Departments ======================
  React.useEffect(() => {
    if (!clinicId) return;

    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        console.log(`🔍 Fetching departments for clinic ${clinicId}...`);
        const depts = await DepartmentAPI.listActiveByClinic(clinicId);
        setDepartments(depts);
        console.log("=== DEPARTMENTS FROM API ===");
        depts.forEach(d => console.log(`  id=${d.id} | name="${d.name}"`));
      } catch (err: any) {
        const msg = err?.response?.data?.detail || err?.message || "Failed to load departments";
        console.error("❌ Error loading departments:", msg);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [clinicId]);

  // ====================== Fetch Employees ======================
  React.useEffect(() => {
    if (!clinicId) return;

    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        setEmployeeError(null);
        
        console.log(`🔍 Fetching employees for clinic ${clinicId}...`);
        const emps = await EmployeeAPI.listByClinic(clinicId);
        
        setEmployees(Array.isArray(emps) ? emps : []);
        console.log("=== EMPLOYEES FROM API ===");
        emps.forEach(e => console.log(`  id=${e.id} | emp_name="${e.emp_name}" | emp_type="${e.emp_type}" | department_name="${e.department_name}"`));
        
        if (emps.length === 0) {
          console.warn("⚠️ No employees found for clinic", clinicId);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.detail || err?.message || "Failed to load employees";
        const displayMsg =
          status === 401 ? "Unauthorized — please log in again" :
          status === 404 ? `Employees endpoint not found (clinic ${clinicId})` :
          status === 500 ? "Server error loading employees" : msg;
        
        console.error("❌ Error loading employees:", displayMsg);
        setEmployeeError(displayMsg);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [clinicId]);

  // ====================== Filter Personnel by Department ======================
  React.useEffect(() => {
    if (!department || employees.length === 0) {
      setFilteredPersonnel([]);
      return;
    }

    const selectedDeptId = Number(department);
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

    console.log("=== FILTER PERSONNEL DEBUG ===");
    console.log(`  Selected Dept id=${selectedDeptId} name="${selectedDept.name}" → "${selectedName}"`);
    employees.forEach((e) =>
      console.log(`  emp="${e.emp_name}" dept="${e.department_name}" → "${normalize(e.department_name)}" MATCH=${normalize(e.department_name) === selectedName}`)
    );
    console.log(`  Filtered: ${filtered.length} employees`);

    setFilteredPersonnel(filtered);
  }, [department, employees, departments]);

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

  // ====================== Navigation ======================
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

  // ====================== Department Change Handler ======================
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDeptId = e.target.value;
    setDepartment(selectedDeptId);
    
    // Reset personnel/assignee when department changes
    setPersonnel("");
    setAssignee("");
  };

  // ====================== Save Changes ======================
  const handleSave = async () => {
    if (!leadData || !id) return;

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        clinic_id: clinicId,
        department_id: intOrFallback(department, 1),
        full_name: fullName.trim(),
        contact_no: contactNo.trim(),
        email: strOrNull(email),
        age: intOrNull(age),
        marital_status: marital ? (marital.toLowerCase() as "single" | "married") : null,
        language_preference: language || "",
        location: location || "",
        address: address || "",
        partner_inquiry: isCouple === "yes",
        partner_full_name: partnerName || "",
        partner_age: intOrNull(partnerAge),
        partner_gender: partnerGender ? (partnerGender.toLowerCase() as "male" | "female") : null,
        source: source,
        sub_source: subSource || "",
        assigned_to_id: intOrNull(assignee),
        next_action_status: (nextStatus === "pending" || nextStatus === "completed") ? nextStatus : null,
        next_action_description: nextDesc || "",
        treatment_interest: treatments.join(",") || treatmentInterest,
        book_appointment: wantAppointment === "yes",
        appointment_date: appointmentDate,
        slot: slot,
        remark: remark || "",
      };

      console.log("💾 Saving lead:", updateData);

      await LeadAPI.update(id, updateData);
      
      console.log("✅ Lead updated successfully");

      // Refresh leads in Redux store
      dispatch(fetchLeads() as any);

      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/leads");
      }, 2000);

    } catch (err: any) {
      console.error("❌ Failed to save lead:", err);
      
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
          msg = `${data.error}${data.request_id ? ` (request_id: ${data.request_id})` : ""}`;
        } else {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          msg = `${firstKey}: ${Array.isArray(firstVal) ? firstVal[0] : firstVal}`;
        }
      } else {
        msg = err?.message || msg;
      }

      setError(msg);
      setSaving(false);
    }
  };

  // ====================== Loading State ======================
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading lead...</Typography>
        </Stack>
      </Box>
    );
  }

  // ====================== Error State ======================
  if (error && !leadData) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography fontWeight={600}>Failed to load lead</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
      </Box>
    );
  }

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
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Employee Error Warning */}
      {employeeError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setEmployeeError(null)}>
          Could not load employees: <strong>{employeeError}</strong>
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ borderRadius: "16px", overflow: "hidden" }}>
        {/* Header */}
        <Box sx={{ bgcolor: "white", p: 3, borderBottom: "1px solid #F1F5F9" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700} color="#1E293B">
              Edit Lead Details <Typography component="span" color="text.secondary">({leadData.id})</Typography>
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <BusinessIcon sx={{ color: "#6366F1", fontSize: 20 }} />
              <Typography variant="body2" fontWeight={600} color="#6366F1">
                Clinic ID: {clinicId}
              </Typography>
            </Stack>
          </Stack>
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
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>LEAD INFORMATION</Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={labelStyle}>Full Name *</Typography>
                  <TextField fullWidth size="small" value={fullName} onChange={(e) => setFullName(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Contact No. *</Typography>
                  <TextField fullWidth size="small" value={contactNo} onChange={(e) => setContactNo(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Email *</Typography>
                  <TextField fullWidth size="small" value={email} onChange={(e) => setEmail(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Location</Typography>
                  <TextField fullWidth size="small" value={location} onChange={(e) => setLocation(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Gender *</Typography>
                  <TextField select fullWidth size="small" value={gender} onChange={(e) => setGender(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Age *</Typography>
                  <TextField fullWidth size="small" type="number" value={age} onChange={(e) => setAge(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Marital Status</Typography>
                  <TextField select fullWidth size="small" value={marital} onChange={(e) => setMarital(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
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
                <TextField select fullWidth size="small" value={language} onChange={(e) => setLanguage(e.target.value)} sx={{ ...inputStyle, maxWidth: "25%" }}>
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
                    <TextField fullWidth size="small" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} sx={inputStyle} />
                  </Box>
                  <Box>
                    <Typography sx={labelStyle}>Age</Typography>
                    <TextField fullWidth size="small" type="number" value={partnerAge} onChange={(e) => setPartnerAge(e.target.value)} sx={inputStyle} />
                  </Box>
                  <Box>
                    <Typography sx={labelStyle}>Gender</Typography>
                    <TextField select fullWidth size="small" value={partnerGender} onChange={(e) => setPartnerGender(e.target.value)} sx={inputStyle}>
                      <MenuItem value="">-- Select --</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </TextField>
                  </Box>
                </Box>
              )}

              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>SOURCE & CAMPAIGN DETAILS</Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
                <Box>
                  <Typography sx={labelStyle}>Source *</Typography>
                  <TextField select fullWidth size="small" value={source} onChange={(e) => setSource(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                    <MenuItem value="Direct">Direct</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Sub-Source</Typography>
                  <TextField select fullWidth size="small" value={subSource} onChange={(e) => setSubSource(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Facebook">Facebook</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="Google">Google</MenuItem>
                    <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Campaign Name</Typography>
                  <TextField fullWidth size="small" value={campaign} onChange={(e) => setCampaign(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>ASSIGNEE & NEXT ACTION DETAILS</Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField 
                    select 
                    fullWidth 
                    size="small" 
                    value={assignee} 
                    onChange={(e) => setAssignee(e.target.value)} 
                    sx={inputStyle}
                    disabled={loadingEmployees}
                    InputProps={{
                      endAdornment: loadingEmployees ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null,
                    }}
                  >
                    <MenuItem value="">
                      <em>-- Select Employee --</em>
                    </MenuItem>
                    {loadingEmployees ? (
                      <MenuItem value="" disabled>Loading employees...</MenuItem>
                    ) : employees.length === 0 ? (
                      <MenuItem value="" disabled>{employeeError ? "Failed to load" : "No employees"}</MenuItem>
                    ) : (
                      employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id.toString()}>
                          {emp.emp_name} ({emp.emp_type})
                          {emp.department_name && ` - ${emp.department_name}`}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                  
                  {/* Status indicators */}
                  {loadingEmployees && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      ⏳ Loading employees...
                    </Typography>
                  )}
                  {!loadingEmployees && employeeError && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      ⚠️ {employeeError}
                    </Typography>
                  )}
                  {!loadingEmployees && !employeeError && employees.length === 0 && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                      ⚠️ No employees found
                    </Typography>
                  )}
                  {!loadingEmployees && !employeeError && employees.length > 0 && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                      ✅ {employees.length} employee(s) available
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Next Action Type</Typography>
                  <TextField select fullWidth size="small" value={nextType} onChange={(e) => setNextType(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Follow Up">Follow Up</MenuItem>
                    <MenuItem value="Call">Call</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Next Action Status</Typography>
                  <TextField select fullWidth size="small" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={labelStyle}>Next Action Description</Typography>
                <TextField fullWidth size="small" multiline rows={2} value={nextDesc} onChange={(e) => setNextDesc(e.target.value)} sx={inputStyle} />
              </Box>
            </Box>
          )}

          {/* STEP 2: MEDICAL DETAILS */}
          {currentStep === 2 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>TREATMENT INFORMATION</Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography sx={labelStyle}>Treatment Interest *</Typography>
                <TextField 
                  select 
                  fullWidth 
                  size="small" 
                  value={treatmentInterest} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setTreatmentInterest(value);
                    if (value && !treatments.includes(value)) {
                      setTreatments(prev => [...prev, value]);
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

              {treatments.length > 0 && (
                <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: "wrap", useFlexGap: true }}>
                  {treatments.map((treatment) => (
                    <Chip 
                      key={treatment}
                      label={treatment}
                      onDelete={() => setTreatments(prev => prev.filter(t => t !== treatment))}
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

              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>DOCUMENTS & REPORTS</Typography>
              
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
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>APPOINTMENT DETAILS</Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ ...labelStyle, mb: 1 }}>Want to Book an Appointment?</Typography>
                <RadioGroup row value={wantAppointment} onChange={(e) => setWantAppointment(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Department *</Typography>
                  <TextField 
                    select 
                    fullWidth 
                    size="small" 
                    value={department} 
                    onChange={handleDepartmentChange}
                    sx={inputStyle}
                    disabled={loadingDepartments}
                    InputProps={{
                      endAdornment: loadingDepartments ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null,
                    }}
                  >
                    <MenuItem value="">
                      <em>-- Select Department --</em>
                    </MenuItem>
                    {loadingDepartments ? (
                      <MenuItem value="" disabled>Loading departments...</MenuItem>
                    ) : departments.length === 0 ? (
                      <MenuItem value="" disabled>No departments available</MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField 
                    select 
                    fullWidth 
                    size="small" 
                    value={assignee} 
                    onChange={(e) => setAssignee(e.target.value)} 
                    sx={inputStyle}
                    disabled={loadingEmployees || !department}
                  >
                    {!department ? (
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
                  {department && filteredPersonnel.length === 0 && !loadingEmployees && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      No personnel available for this department
                    </Typography>
                  )}
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
                          setAppointmentDate(newDate.format("YYYY-MM-DD"));
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
                    value={slot} 
                    onChange={(e) => setSlot(e.target.value)} 
                    sx={inputStyle}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Select Time Slot</em>
                    </MenuItem>
                    {timeSlots.map((timeSlot) => (
                      <MenuItem key={timeSlot} value={timeSlot}>
                        {timeSlot}
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
                  value={remark} 
                  onChange={(e) => setRemark(e.target.value)} 
                  sx={inputStyle} 
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer Actions */}
        <Box sx={{ bgcolor: "white", p: 3, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">Step {currentStep} of 3</Typography>
          
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button 
              onClick={() => navigate("/leads")}
              disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
                variant="contained"
                sx={{ 
                  bgcolor: currentStep === 3 ? "#10B981" : "#334155", 
                  textTransform: "none", 
                  fontWeight: 700,
                  px: 4,
                  minWidth: "100px",
                  "&:hover": { bgcolor: currentStep === 3 ? "#059669" : "#1E293B" }
                }}
              >
                {saving ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  "Save Lead"
                )}
              </Button>
            )}
          </Box>
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