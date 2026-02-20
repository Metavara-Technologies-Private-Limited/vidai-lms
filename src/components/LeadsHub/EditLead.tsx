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

import { LeadAPI, DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import { fetchLeads } from "../../store/leadSlice";
import type { Lead, Department, Employee } from "../../services/leads.api";
import type { AppDispatch } from "../../store";
import type { NextActionStatus } from "../../types/leads.types";

// ====================== Time Slots ======================
const timeSlots = [
  "09:00 AM - 09:30 AM", "09:30 AM - 10:00 AM", "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM", "11:00 AM - 11:30 AM", "11:30 AM - 12:00 PM",
  "12:00 PM - 12:30 PM", "12:30 PM - 01:00 PM", "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM", "03:00 PM - 03:30 PM", "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM", "04:30 PM - 05:00 PM", "05:00 PM - 05:30 PM",
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

const isNextActionStatus = (v: string): v is NextActionStatus =>
  v === "pending" || v === "completed";

// ====================== Format Lead ID ======================
const formatLeadId = (id: string): string => {
  if (id.match(/^#?LN-\d+$/i)) return id.startsWith('#') ? id : `#${id}`;
  const lnMatch = id.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = id.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#LN-${(hash % 900) + 100}`;
};

// ====================== Stepper ======================
const steps = ["Patient Details", "Medical Details", "Book Appointment"] as const;

// ====================== Component ======================
export default function EditLead() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const [currentStep, setCurrentStep] = React.useState(1);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = React.useState<Employee[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [employeeError, setEmployeeError] = React.useState<string | null>(null);

  const [leadData, setLeadData] = React.useState<Lead | null>(null);
  const [clinicId, setClinicId] = React.useState<number>(1);

  // Step 1
  const [fullName, setFullName] = React.useState("");
  const [contactNo, setContactNo] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [age, setAge] = React.useState("");
  const [marital, setMarital] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [partnerName, setPartnerName] = React.useState("");
  const [partnerAge, setPartnerAge] = React.useState("");
  const [partnerGender, setPartnerGender] = React.useState("");
  const [source, setSource] = React.useState("");
  const [subSource, setSubSource] = React.useState("");
  const [campaign, setCampaign] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [nextType, setNextType] = React.useState("");
  const [nextStatus, setNextStatus] = React.useState("");
  const [nextDesc, setNextDesc] = React.useState("");

  // Step 2
  const [treatmentInterest, setTreatmentInterest] = React.useState("");
  const [treatments, setTreatments] = React.useState<string[]>([]);

  // Step 3
  const [wantAppointment, setWantAppointment] = React.useState<"yes" | "no">("yes");
  const [department, setDepartment] = React.useState("");
  const [appointmentDate, setAppointmentDate] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);
  const [slot, setSlot] = React.useState("");
  const [remark, setRemark] = React.useState("");

  // ====================== Fetch Lead ======================
  React.useEffect(() => {
    if (!id) { setError("No lead ID provided"); setLoading(false); return; }
    const load = async () => {
      try {
        setLoading(true);
        const lead = await LeadAPI.getById(id);
        setLeadData(lead);
        setClinicId(lead.clinic_id ?? 1);
        setFullName(lead.full_name ?? "");
        setContactNo(lead.contact_no ?? "");
        setEmail(lead.email ?? "");
        setLocation(lead.location ?? "");
        setGender(lead.partner_gender === "male" ? "Male" : lead.partner_gender === "female" ? "Female" : "");
        setAge(lead.age?.toString() ?? "");
        setMarital(lead.marital_status === "married" ? "Married" : lead.marital_status === "single" ? "Single" : "");
        setAddress(lead.address ?? "");
        setLanguage(lead.language_preference ?? "");
        setIsCouple(lead.partner_inquiry ? "yes" : "no");
        setPartnerName(lead.partner_full_name ?? "");
        setPartnerAge(lead.partner_age?.toString() ?? "");
        setPartnerGender(lead.partner_gender === "male" ? "Male" : lead.partner_gender === "female" ? "Female" : "");
        setSource(lead.source ?? "");
        setSubSource(lead.sub_source ?? "");
        setAssignee(lead.assigned_to_id?.toString() ?? "");
        setNextStatus(lead.next_action_status ?? "");
        setNextDesc(lead.next_action_description ?? "");
        setTreatmentInterest(lead.treatment_interest ?? "");
        if (lead.treatment_interest) {
          setTreatments(lead.treatment_interest.split(",").map((t) => t.trim()));
        }
        setWantAppointment(lead.book_appointment ? "yes" : "no");
        setDepartment(lead.department_id?.toString() ?? "");
        setAppointmentDate(lead.appointment_date ?? "");
        if (lead.appointment_date) setSelectedDate(dayjs(lead.appointment_date));
        setSlot(lead.slot ?? "");
        setRemark(lead.remark ?? "");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load lead");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ====================== Fetch Departments ======================
  React.useEffect(() => {
    if (!clinicId) return;
    const load = async () => {
      try {
        setLoadingDepartments(true);
        setDepartments(await DepartmentAPI.listActiveByClinic(clinicId));
      } catch (err: unknown) {
        console.error("Failed to load departments:", err instanceof Error ? err.message : err);
      } finally {
        setLoadingDepartments(false);
      }
    };
    load();
  }, [clinicId]);

  // ====================== Fetch Employees ======================
  React.useEffect(() => {
    if (!clinicId) return;
    const load = async () => {
      try {
        setLoadingEmployees(true);
        setEmployeeError(null);
        const emps = await EmployeeAPI.listByClinic(clinicId);
        setEmployees(Array.isArray(emps) ? emps : []);
      } catch (err: unknown) {
        setEmployeeError(err instanceof Error ? err.message : "Failed to load employees");
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    load();
  }, [clinicId]);

  // ====================== Filter Personnel ======================
  React.useEffect(() => {
    if (!department || employees.length === 0) { setFilteredPersonnel([]); return; }
    const selectedDept = departments.find((d) => d.id === Number(department));
    if (!selectedDept) { setFilteredPersonnel([]); return; }
    const normalize = (s: string) => (s ?? "").trim().toLowerCase().normalize("NFC");
    setFilteredPersonnel(
      employees.filter((emp) => normalize(emp.department_name) === normalize(selectedDept.name))
    );
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

  const sectionLabel = {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#94A3B8",
    letterSpacing: "0.08em",
    mb: 1.5,
  };

  // ====================== Save — optimistic: show success + navigate immediately ======================
  const handleSave = async () => {
    if (!leadData || !id || saving) return;

    const resolvedStatus = isNextActionStatus(nextStatus) ? nextStatus : null;
    const updateData: Partial<Lead> = {
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
      source,
      sub_source: subSource || "",
      assigned_to_id: intOrNull(assignee),
      next_action_status: resolvedStatus,
      next_action_description: nextDesc || "",
      treatment_interest: treatments.join(",") || treatmentInterest,
      book_appointment: wantAppointment === "yes",
      appointment_date: appointmentDate,
      slot,
      remark: remark || "",
    };

    // ── Optimistic: show success & navigate immediately ──
    setSaving(true);
    setShowSuccess(true);
    setTimeout(() => navigate("/leads", { replace: true }), 800);

    // ── Fire API in background — user is already gone ──
    LeadAPI.update(id, updateData)
      .then(() => dispatch(fetchLeads()))
      .catch((err: unknown) => {
        // API failed silently in background — log it
        console.error("❌ Lead update failed:", err instanceof Error ? err.message : err);
      });
  };

  // ====================== Loading / Error ======================
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

  const leadLabel = leadData.id ? formatLeadId(leadData.id.toString()) : "";

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {employeeError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setEmployeeError(null)}>
          Could not load employees: <strong>{employeeError}</strong>
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: "12px", overflow: "hidden" }}>

        {/* ---- Header ---- */}
        <Box sx={{ bgcolor: "#FFFFFF", px: 4, py: 1.5 }}>
          <Typography fontSize="18px" fontWeight={700} color="#0F172A">
            Edit Lead Details{" "}
            <Typography component="span" fontSize="14px" fontWeight={400} color="#64748B">
              ({leadLabel})
            </Typography>
          </Typography>
        </Box>

        {/* ---- Stepper ---- */}
        <Box sx={{ px: 4, py: 1.5, bgcolor: "#FFFFFF" }}>
          <Box sx={{
            display: "inline-flex", alignItems: "center",
            bgcolor: "#F8FAFC", border: "1px solid #E2E8F0",
            borderRadius: "10px", px: 1, py: 0.75, gap: 0.5,
          }}>
            {steps.map((label, index) => {
              const step = index + 1;
              const active = currentStep === step;
              const completed = currentStep > step;
              const stepColor = completed ? "#10B981" : active ? "#F97316" : "transparent";
              const textColor = completed ? "#10B981" : active ? "#F97316" : "#94A3B8";
              const bgColor = active || completed ? "#FFFFFF" : "transparent";
              return (
                <Box key={step} sx={{
                  display: "flex", alignItems: "center", gap: 1,
                  px: 2, py: 0.75, borderRadius: "8px", bgcolor: bgColor,
                  boxShadow: active || completed ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s",
                }}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: "50%", bgcolor: stepColor,
                    border: completed || active ? "none" : "1.5px solid #CBD5E1",
                    color: completed || active ? "#FFF" : "#94A3B8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 700, flexShrink: 0,
                  }}>
                    {completed ? "✓" : step}
                  </Box>
                  <Typography fontSize="13px" fontWeight={600} color={textColor} noWrap>{label}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ---- Scrollable Form ---- */}
        <Box sx={{
          bgcolor: "white", px: 4, pt: 3, pb: 2, overflowY: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
        }}>

          {/* STEP 1 */}
          {currentStep === 1 && (
            <Box>
              <Typography sx={sectionLabel}>LEAD INFORMATION</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
                <Box><Typography sx={labelStyle}>Full Name *</Typography><TextField fullWidth size="small" value={fullName} onChange={(e) => setFullName(e.target.value)} sx={inputStyle} /></Box>
                <Box><Typography sx={labelStyle}>Contact No. *</Typography><TextField fullWidth size="small" value={contactNo} onChange={(e) => setContactNo(e.target.value)} sx={inputStyle} /></Box>
                <Box><Typography sx={labelStyle}>Email *</Typography><TextField fullWidth size="small" value={email} onChange={(e) => setEmail(e.target.value)} sx={inputStyle} /></Box>
                <Box><Typography sx={labelStyle}>Location/ Address</Typography><TextField fullWidth size="small" value={location} onChange={(e) => setLocation(e.target.value)} sx={inputStyle} /></Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Gender *</Typography>
                  <TextField select fullWidth size="small" value={gender} onChange={(e) => setGender(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Box>
                <Box><Typography sx={labelStyle}>Age *</Typography><TextField fullWidth size="small" type="number" value={age} onChange={(e) => setAge(e.target.value)} sx={inputStyle} /></Box>
                <Box>
                  <Typography sx={labelStyle}>Marital Status</Typography>
                  <TextField select fullWidth size="small" value={marital} onChange={(e) => setMarital(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                  </TextField>
                </Box>
                <Box><Typography sx={labelStyle}>Address</Typography><TextField fullWidth size="small" value={address} onChange={(e) => setAddress(e.target.value)} sx={inputStyle} /></Box>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography sx={labelStyle}>Language Preference</Typography>
                <TextField select fullWidth size="small" value={language} onChange={(e) => setLanguage(e.target.value)} sx={{ ...inputStyle, maxWidth: "25%" }}>
                  <MenuItem value="">-- Select --</MenuItem>
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                  <MenuItem value="Kannada">Kannada</MenuItem>
                </TextField>
              </Box>

              <Typography sx={sectionLabel}>PARTNER INFORMATION</Typography>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ ...labelStyle, mb: 0.5 }}>Is This Inquiry For A Couple?</Typography>
                <RadioGroup row value={isCouple} onChange={(e) => setIsCouple(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>
              {isCouple === "yes" && (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
                  <Box><Typography sx={labelStyle}>Full Name</Typography><TextField fullWidth size="small" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} sx={inputStyle} /></Box>
                  <Box><Typography sx={labelStyle}>Age</Typography><TextField fullWidth size="small" type="number" value={partnerAge} onChange={(e) => setPartnerAge(e.target.value)} sx={inputStyle} /></Box>
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

              <Typography sx={sectionLabel}>SOURCE & CAMPAIGN DETAILS</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
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
                <Box><Typography sx={labelStyle}>Campaign Name</Typography><TextField fullWidth size="small" value={campaign} onChange={(e) => setCampaign(e.target.value)} sx={inputStyle} /></Box>
              </Box>

              <Typography sx={sectionLabel}>ASSIGNEE & NEXT ACTION DETAILS</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField select fullWidth size="small" value={assignee} onChange={(e) => setAssignee(e.target.value)} sx={inputStyle}
                    disabled={loadingEmployees}
                    InputProps={{ endAdornment: loadingEmployees ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null }}>
                    <MenuItem value=""><em>-- Select Employee --</em></MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id.toString()}>
                        {emp.emp_name} ({emp.emp_type}){emp.department_name ? ` - ${emp.department_name}` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
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
                <Box>
                  <Typography sx={labelStyle}>Next Action Description</Typography>
                  <TextField fullWidth size="small" value={nextDesc} onChange={(e) => setNextDesc(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>
            </Box>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <Box>
              <Typography sx={sectionLabel}>TREATMENT INFORMATION</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography sx={labelStyle}>Treatment Interest *</Typography>
                <TextField select fullWidth size="small" value={treatmentInterest}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTreatmentInterest(v);
                    if (v && !treatments.includes(v)) setTreatments((prev) => [...prev, v]);
                  }}
                  sx={{ ...inputStyle, maxWidth: "50%" }}>
                  <MenuItem value="" disabled>Select</MenuItem>
                  <MenuItem value="Medical Checkup">Medical Checkup</MenuItem>
                  <MenuItem value="IVF">IVF</MenuItem>
                  <MenuItem value="IUI">IUI</MenuItem>
                  <MenuItem value="Consultation">Consultation</MenuItem>
                </TextField>
              </Box>
              {treatments.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
                  {treatments.map((t) => (
                    <Chip key={t} label={t} size="small"
                      onDelete={() => setTreatments((prev) => prev.filter((x) => x !== t))}
                      sx={{ bgcolor: "#FEE2E2", color: "#B91C1C", fontWeight: 600, border: "1px solid #FCA5A5",
                        "& .MuiChip-deleteIcon": { color: "#B91C1C", "&:hover": { color: "#991B1B" } } }} />
                  ))}
                </Stack>
              )}
              <Typography sx={sectionLabel}>DOCUMENTS & REPORTS</Typography>
              <Box sx={{ border: "2px dashed #E2E8F0", borderRadius: "10px", p: 3, display: "inline-block", bgcolor: "#F8FAFC", minWidth: "400px" }}>
                <Button variant="contained" component="label"
                  sx={{ bgcolor: "#64748B", textTransform: "none", borderRadius: "8px", fontWeight: 600, "&:hover": { bgcolor: "#475569" } }}>
                  Choose File <input type="file" hidden />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>No File Chosen</Typography>
              </Box>
            </Box>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <Box>
              <Typography sx={sectionLabel}>APPOINTMENT DETAILS</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ ...labelStyle, mb: 0.5 }}>Want to Book an Appointment?</Typography>
                <RadioGroup row value={wantAppointment} onChange={(e) => setWantAppointment(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Department *</Typography>
                  <TextField select fullWidth size="small" value={department}
                    onChange={(e) => { setDepartment(e.target.value); setAssignee(""); }}
                    sx={inputStyle} disabled={loadingDepartments}
                    InputProps={{ endAdornment: loadingDepartments ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null }}>
                    <MenuItem value=""><em>-- Select Department --</em></MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id.toString()}>{dept.name}</MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField select fullWidth size="small" value={assignee} onChange={(e) => setAssignee(e.target.value)}
                    sx={inputStyle} disabled={loadingEmployees || !department}>
                    {!department ? (
                      <MenuItem value="" disabled>Select department first</MenuItem>
                    ) : filteredPersonnel.length === 0 ? (
                      <MenuItem value="" disabled>No employees in this department</MenuItem>
                    ) : (
                      filteredPersonnel.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id.toString()}>{emp.emp_name} ({emp.emp_type})</MenuItem>
                      ))
                    )}
                  </TextField>
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Date *</Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker value={selectedDate}
                      onChange={(d) => { setSelectedDate(d); if (d) setAppointmentDate(d.format("YYYY-MM-DD")); }}
                      slotProps={{ textField: { size: "small", fullWidth: true, sx: inputStyle } }} />
                  </LocalizationProvider>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Select Slot *</Typography>
                  <TextField select fullWidth size="small" value={slot} onChange={(e) => setSlot(e.target.value)} sx={inputStyle}>
                    <MenuItem value=""><em>Select Time Slot</em></MenuItem>
                    {timeSlots.map((ts) => <MenuItem key={ts} value={ts}>{ts}</MenuItem>)}
                  </TextField>
                </Box>
              </Box>
              <Box>
                <Typography sx={labelStyle}>Remark</Typography>
                <TextField fullWidth size="small" multiline rows={2} placeholder="Type Here..." value={remark} onChange={(e) => setRemark(e.target.value)} sx={inputStyle} />
              </Box>
            </Box>
          )}
        </Box>

        {/* ---- Footer ---- */}
        <Box sx={{ bgcolor: "white", px: 4, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">Step {currentStep} of 3</Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button onClick={() => navigate("/leads")} disabled={saving}
              sx={{ textTransform: "none", color: "#64748B", fontWeight: 600, px: 3, borderRadius: "8px",
                border: "1px solid #E2E8F0", "&:hover": { bgcolor: "#F8FAFC" } }}>
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button onClick={() => setCurrentStep((s) => s - 1)} disabled={saving} variant="outlined"
                sx={{ textTransform: "none", borderColor: "#E2E8F0", color: "#1E293B", fontWeight: 600,
                  px: 3, borderRadius: "8px", "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" } }}>
                Back
              </Button>
            )}
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={saving} variant="contained"
                sx={{ bgcolor: "#1E293B", textTransform: "none", fontWeight: 600, px: 4, borderRadius: "8px", "&:hover": { bgcolor: "#0F172A" } }}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} variant="contained"
                sx={{ bgcolor: "#1E293B", textTransform: "none", fontWeight: 600, px: 4,
                  minWidth: 100, borderRadius: "8px", boxShadow: "none",
                  "&:hover": { bgcolor: "#0F172A", boxShadow: "none" } }}>
                {saving ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Save"}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Success Toast */}
      <Fade in={showSuccess}>
        <Box sx={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          bgcolor: "#10B981", color: "white", px: 4, py: 2, borderRadius: "12px",
          display: "flex", alignItems: "center", gap: 1.5, zIndex: 10000,
          boxShadow: "0px 10px 20px rgba(16,185,129,0.3)" }}>
          <CheckCircleIcon sx={{ fontSize: 24 }} />
          <Typography variant="body1" fontWeight={700}>Saved Successfully!</Typography>
        </Box>
      </Fade>
    </Box>
  );
}