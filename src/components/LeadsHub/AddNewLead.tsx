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
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// ── Redux ──────────────────────────────────────────────────────────
import { useSelector } from "react-redux";
import { selectCampaign } from "../../store/campaignSlice";

import type { FormState } from "../../types/leads.types";
import { LeadAPI, DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import type { Department, Employee } from "../../services/leads.api";

// ====================== Task Type Config ======================
// Single source of truth — same rules used in LeadsTable
export const TASK_TYPES = [
  "Follow Up",
  "Call Patient",
  "Book Appointment",
  "Send Message",
  "Send Email",
  "Review Details",
  "No Action",
] as const;

export type TaskType = typeof TASK_TYPES[number];

// Rules:
//   "Book Appointment" → only "Done" is allowed
//   All others        → only "To Do" is allowed
export const TASK_STATUS_FOR_TYPE: Record<string, { label: string; value: string }[]> = {
  "Follow Up":        [{ label: "To Do",    value: "pending"   }],
  "Call Patient":     [{ label: "To Do",    value: "pending"   }],
  "Book Appointment": [{ label: "Done",     value: "completed" }],
  "Send Message":     [{ label: "To Do",    value: "pending"   }],
  "Send Email":       [{ label: "To Do",    value: "pending"   }],
  "Review Details":   [{ label: "To Do",    value: "pending"   }],
  "No Action":        [{ label: "To Do",    value: "pending"   }],
};

// Auto-derive the backend value when a task type is picked
export const getAutoNextActionStatus = (taskType: string): "pending" | "completed" | "" => {
  if (!taskType) return "";
  return taskType === "Book Appointment" ? "completed" : "pending";
};

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
  lead_status?: "new" | "contacted";
  next_action_status?: "pending" | "completed" | null;
  next_action_description?: string;
  next_action_type?: string;
  treatment_interest: string;
  book_appointment: boolean;
  appointment_date: string;
  slot: string;
  remark: string;
  is_active: boolean;
};

// ====================== Campaign Type ======================
type CampaignData = {
  id: string;
  campaign_name?: string;
  campaign_mode?: number;
  social_media?: Array<{ platform_name?: string }>;
  is_active?: boolean;
};

// ====================== API Error Type ======================
type ApiError = {
  response?: {
    status?: number;
    data?: {
      detail?: string;
      message?: string;
      error?: string;
      request_id?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
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

// ====================== Toast Helpers ======================
const showSequentialToasts = async (
  messages: Array<{ type: "error" | "warning" | "info"; text: string }>
) => {
  for (const msg of messages) {
    await new Promise<void>((resolve) => {
      const fn =
        msg.type === "error"
          ? toast.error
          : msg.type === "warning"
          ? toast.warning
          : toast.info;
      fn(msg.text, {
        position: "top-right",
        autoClose: 1500,
        theme: "colored",
        onClose: () => resolve(),
      });
    });
    await new Promise((r) => setTimeout(r, 200));
  }
};

const showWarningsNonBlocking = (
  messages: Array<{ type: "error" | "warning" | "info"; text: string }>
) => {
  messages.forEach((msg, i) => {
    setTimeout(() => {
      const fn =
        msg.type === "error"
          ? toast.error
          : msg.type === "warning"
          ? toast.warning
          : toast.info;
      fn(msg.text, { position: "top-right", autoClose: 2000, theme: "colored" });
    }, i * 300);
  });
};

// ====================== Component ======================
export default function AddNewLead() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = React.useState<Employee[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [clinicId] = React.useState(1);

  const rawCampaigns = useSelector(selectCampaign);

  const campaigns = React.useMemo(
    () =>
      (rawCampaigns || []).map((api: CampaignData) => ({
        id: api.id,
        name: api.campaign_name ?? "",
        source: api.campaign_mode === 1 ? "Social Media" : "Email",
        subSource:
          api.campaign_mode === 1 ? (api.social_media?.[0]?.platform_name ?? "") : "gmail",
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
    campaign: "",
    campaignName: "",
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

  // ====================== Computed: available task statuses ======================
  // Only show statuses valid for the selected task type.
  // If no task type selected → show all options.
  const availableTaskStatuses = React.useMemo<{ label: string; value: string }[]>(() => {
    if (!form.nextType) {
      return [
        { label: "To Do",    value: "pending"   },
        { label: "Done",     value: "completed" },
      ];
    }
    return TASK_STATUS_FOR_TYPE[form.nextType] ?? [
      { label: "To Do",    value: "pending"   },
      { label: "Done",     value: "completed" },
    ];
  }, [form.nextType]);

  // ====================== Fetch Departments ======================
  React.useEffect(() => {
    const fetchDepts = async () => {
      try {
        setLoadingDepartments(true);
        const depts = await DepartmentAPI.listActiveByClinic(clinicId);
        setDepartments(depts);
      } catch (err) {
        const error = err as ApiError;
        toast.error(`Departments: ${error?.response?.data?.detail || error?.message || "Failed"}`, {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepts();
  }, [clinicId]);

  // ====================== Fetch Employees ======================
  React.useEffect(() => {
    const fetchEmps = async () => {
      try {
        setLoadingEmployees(true);
        const emps = await EmployeeAPI.listByClinic(clinicId);
        setEmployees(Array.isArray(emps) ? emps : []);
      } catch (err) {
        const error = err as ApiError;
        const status = error?.response?.status;
        const msg =
          status === 401
            ? "Unauthorized — please log in again"
            : status === 404
            ? `Employees endpoint not found (clinic ${clinicId})`
            : error?.response?.data?.detail || error?.message || "Failed to load employees";
        toast.warning(`Employees: ${msg}`, { position: "top-right", autoClose: 3000, theme: "colored" });
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmps();
  }, [clinicId]);

  // ====================== Auto-fill source from campaign ======================
  React.useEffect(() => {
    if (!form.campaign) {
      setForm((prev) => ({ ...prev, campaignName: "", source: "", subSource: "" }));
      return;
    }
    const matched = campaigns.find((c) => c.id === form.campaign);
    if (!matched) return;
    setForm((prev) => ({ ...prev, campaignName: matched.name, source: matched.source, subSource: matched.subSource }));
  }, [form.campaign, campaigns]);

  // ====================== Filter personnel by department ======================
  React.useEffect(() => {
    if (!form.department || employees.length === 0) {
      setFilteredPersonnel([]);
      return;
    }
    const selectedDeptId = Number(form.department);
    const selectedDept = departments.find((d) => d.id === selectedDeptId);
    if (!selectedDept) { setFilteredPersonnel([]); return; }
    const normalize = (s: string) => (s ?? "").trim().toLowerCase().normalize("NFC");
    const selectedName = normalize(selectedDept.name);
    setFilteredPersonnel(employees.filter((emp) => normalize(emp.department_name) === selectedName));
  }, [form.department, employees, departments]);

  // ====================== When task type changes → auto-set status ======================
  const handleNextTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value;
    const autoStatus = getAutoNextActionStatus(newType);
    setForm((prev) => ({ ...prev, nextType: newType, nextStatus: autoStatus }));
  };

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

  const readOnlyStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      fontSize: "0.875rem",
      bgcolor: "#F1F5F9",
      "& fieldset": { borderColor: "#E2E8F0" },
      "&:hover fieldset": { borderColor: "#E2E8F0" },
      "&.Mui-focused fieldset": { borderColor: "#E2E8F0" },
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
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, campaign: e.target.value }));

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, department: e.target.value, personnel: "", assignee: "" }));

  // ====================== Validation ======================
  const validateStep = async (): Promise<boolean> => {
    const errors: Array<{ type: "error" | "warning" | "info"; text: string }> = [];
    const warnings: Array<{ type: "error" | "warning" | "info"; text: string }> = [];

    if (currentStep === 1) {
      if (!form.full_name.trim()) errors.push({ type: "error", text: "Full name is required!" });
      if (!form.contact.trim())   errors.push({ type: "error", text: "Contact number is required!" });
      if (!form.email.trim())     errors.push({ type: "error", text: "Email is required!" });
      if (!form.gender)           errors.push({ type: "error", text: "Gender is required!" });
      if (!form.age)              errors.push({ type: "error", text: "Age is required!" });
      if (!form.source)           errors.push({ type: "error", text: "Source is required!" });
      if (errors.length > 0) { await showSequentialToasts(errors); return false; }

      if (!form.location.trim())  warnings.push({ type: "warning", text: "Location is not provided!" });
      if (!form.marital)          warnings.push({ type: "warning", text: "Marital status is not selected!" });
      if (!form.address.trim())   warnings.push({ type: "warning", text: "Address is not provided!" });
      if (!form.language)         warnings.push({ type: "warning", text: "Language preference is not selected!" });
      if (isCouple === "yes") {
        if (!form.partnerName.trim()) warnings.push({ type: "warning", text: "Partner name is not provided!" });
        if (!form.partnerAge)         warnings.push({ type: "warning", text: "Partner age is not provided!" });
        if (!form.partnerGender)      warnings.push({ type: "warning", text: "Partner gender is not selected!" });
      }
      if (!form.subSource && !form.campaign) warnings.push({ type: "warning", text: "Sub-source is not provided!" });
      if (!form.assignee)   warnings.push({ type: "warning", text: "Lead is not assigned to anyone!" });
      if (!form.nextType)   warnings.push({ type: "warning", text: "Next action type is not selected!" });
      if (!form.nextStatus) warnings.push({ type: "warning", text: "Next action status is not selected!" });
      if (!form.nextDesc.trim()) warnings.push({ type: "warning", text: "Next action description is not provided!" });
      if (warnings.length > 0) showWarningsNonBlocking(warnings);
    }

    if (currentStep === 2) {
      if (form.treatments.length === 0) {
        errors.push({ type: "error", text: "Please select at least one treatment!" });
      }
      if (errors.length > 0) { await showSequentialToasts(errors); return false; }
      if (!form.documents) showWarningsNonBlocking([{ type: "info", text: "No documents uploaded" }]);
    }

    if (currentStep === 3) {
      if (!form.department)      errors.push({ type: "error", text: "Department is required!" });
      if (!form.appointmentDate) errors.push({ type: "error", text: "Appointment date is required!" });
      if (!form.slot)            errors.push({ type: "error", text: "Time slot is required!" });
      if (errors.length > 0) { await showSequentialToasts(errors); return false; }
      if (!form.assignee)      warnings.push({ type: "warning", text: "Lead is not assigned to any personnel!" });
      if (!form.remark.trim()) warnings.push({ type: "info",    text: "No remark added for appointment" });
      if (warnings.length > 0) showWarningsNonBlocking(warnings);
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (!isValid) return;
    if (currentStep === 3) { await submitForm(); return; }
    setCurrentStep((prev) => prev + 1);
    toast.success("Step completed!", { position: "top-right", autoClose: 1000, theme: "colored" });
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

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
      campaign_id: strOrNull(form.campaign),
      email: strOrNull(form.email),
      language_preference: form.language || "",
      location: form.location || "",
      address: form.address || "",
      remark: form.remark || "",
      partner_full_name: form.partnerName || "",
      next_action_description: form.nextDesc || "",
      next_action_type: form.nextType || undefined,
      marital_status: form.marital
        ? (form.marital.toLowerCase() as "single" | "married")
        : null,
      partner_gender: form.partnerGender
        ? (form.partnerGender.toLowerCase() as "male" | "female")
        : null,
      next_action_status:
        form.nextStatus === "pending" || form.nextStatus === "completed"
          ? form.nextStatus
          : null,
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
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const payload = buildPayload();
      const response = await LeadAPI.create(payload);
      console.log("✅ Lead created:", response);
      toast.success("Lead saved successfully!", { position: "top-right", autoClose: 1500, theme: "colored" });
      navigate("/leads", { replace: true });
    } catch (err) {
      const error = err as ApiError;
      const data = error?.response?.data;
      let msg = "Failed to save lead";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.message) msg = data.message;
        else if (data.error) msg = `${data.error}${data.request_id ? ` (${data.request_id})` : ""}`;
        else {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          msg = `${firstKey}: ${Array.isArray(firstVal) ? firstVal[0] : firstVal}`;
        }
      } else {
        msg = error?.message || msg;
      }
      toast.error(msg, { position: "top-right", autoClose: 3000, theme: "colored" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const campaignSelected = Boolean(form.campaign);

  // ====================== Render ======================
  return (
    <Paper sx={{ overflow: "hidden", minHeight: "100vh" }}>
      <Box sx={{ bgcolor: "white", px: 3, py: 2 }}>
        <Typography variant="h6" fontWeight={700} color="#1E293B">
          Add New Lead
        </Typography>
      </Box>

      {/* Step Indicator */}
      <Box sx={{ bgcolor: "white", px: 6, pt: 3, pb: 2 }}>
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
          {[
            { label: "Patient Details", step: 1 },
            { label: "Medical Details", step: 2 },
            { label: "Book Appointment", step: 3 },
          ].map(({ label, step }) => (
            <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor:
                    currentStep > step
                      ? "#10B981"
                      : currentStep === step
                      ? step === 3
                        ? "#3B82F6"
                        : "#F97316"
                      : "#E2E8F0",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {currentStep > step ? "✓" : step}
              </Box>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  fontSize: "0.875rem",
                  color:
                    currentStep > step
                      ? "#10B981"
                      : currentStep === step
                      ? step === 3
                        ? "#3B82F6"
                        : "#F97316"
                      : "#94A3B8",
                }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Form Body */}
      <Box
        sx={{
          bgcolor: "white",
          p: 3,
          maxHeight: "calc(100vh - 400px)",
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
        }}
      >
        {/* ===== STEP 1 ===== */}
        {currentStep === 1 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
              LEAD INFORMATION
            </Typography>

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

            <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
              SOURCE & CAMPAIGN DETAILS
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
              <Box>
                <Typography sx={labelStyle}>Campaign Name</Typography>
                <TextField select fullWidth size="small" value={form.campaign} onChange={handleCampaignChange} sx={inputStyle}>
                  <MenuItem value="">-- None --</MenuItem>
                  {campaigns.length === 0 ? (
                    <MenuItem value="" disabled>No campaigns available</MenuItem>
                  ) : (
                    campaigns.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))
                  )}
                </TextField>
              </Box>
              <Box>
                <Typography sx={labelStyle}>
                  Source *
                  {campaignSelected && (
                    <Typography component="span" sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}>
                      auto-filled from campaign
                    </Typography>
                  )}
                </Typography>
                {campaignSelected ? (
                  <TextField fullWidth size="small" value={form.source} InputProps={{ readOnly: true }} sx={readOnlyStyle} />
                ) : (
                  <TextField select fullWidth size="small" value={form.source} onChange={handleChange("source")} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                    <MenuItem value="Direct">Direct</MenuItem>
                  </TextField>
                )}
              </Box>
              <Box>
                <Typography sx={labelStyle}>
                  Sub-Source
                  {campaignSelected && (
                    <Typography component="span" sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}>
                      auto-filled from campaign
                    </Typography>
                  )}
                </Typography>
                {campaignSelected ? (
                  <TextField fullWidth size="small" value={form.subSource} InputProps={{ readOnly: true }} sx={readOnlyStyle} />
                ) : (
                  <TextField select fullWidth size="small" value={form.subSource} onChange={handleChange("subSource")} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Facebook">Facebook</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="Google">Google</MenuItem>
                    <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                  </TextField>
                )}
              </Box>
            </Box>

            <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
              ASSIGNEE & NEXT ACTION DETAILS
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2 }}>
              {/* Assigned To */}
              <Box>
                <Typography sx={labelStyle}>Assigned To</Typography>
                <TextField
                  select fullWidth size="small" value={form.assignee}
                  onChange={handleChange("assignee")} sx={inputStyle}
                  disabled={loadingEmployees}
                  InputProps={{ endAdornment: loadingEmployees ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null }}
                >
                  {loadingEmployees ? (
                    <MenuItem value="" disabled>Loading...</MenuItem>
                  ) : employees.length === 0 ? (
                    <MenuItem value="" disabled>No employees</MenuItem>
                  ) : (
                    employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id.toString()}>
                        {emp.emp_name} ({emp.emp_type})
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Box>

              {/* Next Action Type — full task type list */}
              <Box>
                <Typography sx={labelStyle}>Next Action Type</Typography>
                <TextField
                  select fullWidth size="small"
                  value={form.nextType}
                  onChange={handleNextTypeChange}
                  sx={inputStyle}
                >
                  <MenuItem value="">-- Select --</MenuItem>
                  {TASK_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Next Action Status — filtered by task type selection */}
              <Box>
                <Typography sx={labelStyle}>
                  Next Action Status
                  {form.nextType && (
                    <Typography component="span" sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}>
                      auto-set for {form.nextType}
                    </Typography>
                  )}
                </Typography>
                <TextField
                  select fullWidth size="small"
                  value={form.nextStatus}
                  onChange={handleChange("nextStatus")}
                  sx={form.nextType ? readOnlyStyle : inputStyle}
                  // Make it read-only when task type is selected (status auto-set)
                  InputProps={{ readOnly: Boolean(form.nextType) }}
                >
                  {availableTaskStatuses.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
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
            <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
              TREATMENT INFORMATION
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography sx={labelStyle}>Treatment Interest *</Typography>
              <TextField
                select fullWidth size="small"
                value={form.treatmentInterest}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, treatmentInterest: value }));
                  if (value && !form.treatments.includes(value)) {
                    setForm((prev) => ({ ...prev, treatments: [...prev.treatments, value] }));
                  }
                }}
                sx={{ ...inputStyle, maxWidth: "50%" }}
                SelectProps={{ displayEmpty: true }}
              >
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
                  <Chip
                    key={t}
                    label={t}
                    onDelete={() =>
                      setForm((prev) => ({ ...prev, treatments: prev.treatments.filter((x) => x !== t) }))
                    }
                    sx={{
                      bgcolor: "#FEE2E2",
                      color: "#B91C1C",
                      fontWeight: 600,
                      border: "1px solid #FCA5A5",
                      "& .MuiChip-deleteIcon": { color: "#B91C1C", "&:hover": { color: "#991B1B" } },
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
              <Box
                sx={{
                  border: "2px dashed #E2E8F0",
                  borderRadius: "12px",
                  p: 3,
                  display: "inline-block",
                  textAlign: "center",
                  bgcolor: "#F8FAFC",
                  minWidth: "400px",
                }}
              >
                <Button
                  variant="contained"
                  component="label"
                  sx={{ bgcolor: "#64748B", textTransform: "none", borderRadius: "8px", fontWeight: 600, px: 3, py: 1, "&:hover": { bgcolor: "#475569" } }}
                >
                  Choose File
                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, documents: e.target.files ? e.target.files[0] : null }))
                    }
                  />
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
            <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
              APPOINTMENT DETAILS
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ ...labelStyle, mb: 1 }}>Want to Book an Appointment?</Typography>
              <RadioGroup
                row
                value={form.wantAppointment}
                onChange={(e) => setForm((prev) => ({ ...prev, wantAppointment: e.target.value as "yes" | "no" }))}
              >
                <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
              </RadioGroup>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
              <Box>
                <Typography sx={labelStyle}>Department *</Typography>
                <TextField
                  select fullWidth size="small" value={form.department}
                  onChange={handleDepartmentChange} sx={inputStyle}
                  disabled={loadingDepartments}
                  InputProps={{ endAdornment: loadingDepartments ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null }}
                >
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
                <TextField
                  select fullWidth size="small" value={form.assignee}
                  onChange={handleChange("assignee")} sx={inputStyle}
                  disabled={loadingEmployees || !form.department}
                >
                  {!form.department ? (
                    <MenuItem value="" disabled>Select department first</MenuItem>
                  ) : loadingEmployees ? (
                    <MenuItem value="" disabled>Loading...</MenuItem>
                  ) : filteredPersonnel.length === 0 ? (
                    <MenuItem value="" disabled>No employees in this department</MenuItem>
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
                      const asDayjs = newDate ? dayjs(newDate as Dayjs | Date) : null;
                      setSelectedDate(asDayjs);
                      if (asDayjs && asDayjs.isValid()) {
                        setForm((prev) => ({ ...prev, appointmentDate: asDayjs.format("YYYY-MM-DD") }));
                      }
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
              <TextField
                fullWidth size="small" multiline rows={2} placeholder="Type Here..."
                value={form.remark} onChange={handleChange("remark")} sx={inputStyle}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: "white", p: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          onClick={() => navigate("/leads")}
          sx={{ textTransform: "none", color: "#64748B", fontWeight: 700, px: 3 }}
        >
          Cancel
        </Button>
        {currentStep > 1 && (
          <Button
            onClick={handleBack}
            variant="outlined"
            disabled={isSubmitting}
            sx={{ textTransform: "none", borderColor: "#E2E8F0", color: "#1E293B", fontWeight: 700, px: 3, "&:hover": { borderColor: "#CBD5E1" } }}
          >
            Back
          </Button>
        )}
        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            sx={{ bgcolor: "#334155", textTransform: "none", fontWeight: 700, px: 4, "&:hover": { bgcolor: "#1E293B" } }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={isSubmitting}
            sx={{ bgcolor: "#334155", textTransform: "none", fontWeight: 700, px: 4, minWidth: "100px", "&:hover": { bgcolor: "#1E293B" } }}
          >
            {isSubmitting ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Save"}
          </Button>
        )}
      </Box>
    </Paper>
  );
}