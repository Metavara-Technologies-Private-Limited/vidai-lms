import * as React from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Dayjs } from "dayjs";

import { useSelector } from "react-redux";
import { selectCampaign } from "../../store/campaignSlice";

import type { FormState } from "../../types/leads.types";
import { LeadAPI, DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import type { Department, Employee } from "../../services/leads.api";

import {
  getAutoNextActionStatus,
  ALLOWED_DOC_TYPES,
  MAX_DOC_SIZE_MB,
  strOrNull,
  intOrNull,
  intOrFallback,
  type LeadPayload,
  type CampaignData,
  type ApiError,
} from "../LeadsHub/addNewLead.constants";

import { validateStep } from "../LeadsHub/addNewLead.validation";
import { Step1, Step2, Step3 } from "../LeadsHub/addNewLead.steps";

// ====================== Component ======================
export default function AddNewLead() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = React.useState<Employee[]>(
    [],
  );
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [clinicId] = React.useState(1);

  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [docDragOver, setDocDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const rawCampaigns = useSelector(selectCampaign);

  const campaigns = React.useMemo(
    () =>
      (rawCampaigns || []).map((api: CampaignData) => ({
        id: api.id,
        name: api.campaign_name ?? "",
        source: api.campaign_mode === 1 ? "Social Media" : "Email",
        subSource:
          api.campaign_mode === 1
            ? (api.social_media?.[0]?.platform_name ?? "")
            : "gmail",
        isActive: Boolean(api.is_active),
      })),
    [rawCampaigns],
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
    wantAppointment: "yes",
    department: "",
    personnel: "",
    appointmentDate: "",
    slot: "",
    remark: "",
  });

  // ── Fetch Departments ────────────────────────────────────────────
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const departments = await DepartmentAPI.listActiveByClinic(clinicId);
        setDepartments(departments);
      } catch (err) {
        const error = err as ApiError;
        toast.error(
          `Departments: ${error?.response?.data?.detail || error?.message || "Failed"}`,
          {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          },
        );
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [clinicId]);

  // ── Fetch Employees ──────────────────────────────────────────────
  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const employees = await EmployeeAPI.listByClinic(clinicId);
        setEmployees(Array.isArray(employees) ? employees : []);
      } catch (err) {
        const error = err as ApiError;
        const status = error?.response?.status;
        const msg =
          status === 401
            ? "Unauthorized — please log in again"
            : status === 404
              ? `Employees endpoint not found (clinic ${clinicId})`
              : error?.response?.data?.detail ||
                error?.message ||
                "Failed to load employees";
        toast.warning(`Employees: ${msg}`, {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [clinicId]);

  // ── Auto-fill source from campaign ──────────────────────────────
  React.useEffect(() => {
    if (!form.campaign) {
      setForm((prev) => ({
        ...prev,
        campaignName: "",
        source: "",
        subSource: "",
      }));
      return;
    }
    const matched = campaigns.find((c) => c.id === form.campaign);
    if (!matched) return;
    setForm((prev) => ({
      ...prev,
      campaignName: matched.name,
      source: matched.source,
      subSource: matched.subSource,
    }));
  }, [form.campaign, campaigns]);

  // ── Filter personnel by department ──────────────────────────────
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
    setFilteredPersonnel(
      employees.filter(
        (emp) =>
          normalize(emp.department_name) === normalize(selectedDept.name),
      ),
    );
  }, [form.department, employees, departments]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, campaign: e.target.value }));

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({
      ...prev,
      department: e.target.value,
      personnel: "",
      assignee: "",
    }));

  const handleNextTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value;
    setForm((prev) => ({
      ...prev,
      nextType: newType,
      nextStatus: getAutoNextActionStatus(newType),
    }));
  };

  // ── File Handlers ────────────────────────────────────────────────
  const addFiles = (files: File[]) => {
    files.forEach((file) => {
      if (!ALLOWED_DOC_TYPES.includes(file.type)) {
        toast.error(
          `"${file.name}" — unsupported type. Use PDF, Word, JPG or PNG.`,
          {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          },
        );
        return;
      }
      if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" — exceeds ${MAX_DOC_SIZE_MB}MB limit.`, {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        return;
      }
      setPendingFiles((prev) =>
        prev.find((f) => f.name === file.name && f.size === file.size)
          ? prev
          : [...prev, file],
      );
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));

  // ── Navigation ───────────────────────────────────────────────────
  const handleNext = async () => {
    const isValid = await validateStep(
      currentStep,
      form,
      isCouple,
      pendingFiles.length > 0,
    );
    if (!isValid) return;
    if (currentStep === 3) {
      await submitForm();
      return;
    }
    setCurrentStep((prev) => prev + 1);
    toast.success("Step completed!", {
      position: "top-right",
      autoClose: 1000,
      theme: "colored",
    });
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ── Build Payload ────────────────────────────────────────────────
  const buildPayload = (): LeadPayload => ({
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
  });

  // ── Submit ───────────────────────────────────────────────────────
  const submitForm = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const payload = buildPayload();
      const response =
        pendingFiles.length > 0
          ? await LeadAPI.createWithDocuments(payload, pendingFiles)
          : await LeadAPI.create(payload);
      console.log("✅ Lead created:", response);
      toast.success("Lead saved successfully!", {
        position: "top-right",
        autoClose: 1500,
        theme: "colored",
      });
      navigate("/leads", { replace: true });
    } catch (err) {
      const error = err as ApiError;
      const data = error?.response?.data;
      let msg = "Failed to save lead";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.message) msg = data.message;
        else if (data.error)
          msg = `${data.error}${data.request_id ? ` (${data.request_id})` : ""}`;
        else {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          msg = `${firstKey}: ${Array.isArray(firstVal) ? firstVal[0] : firstVal}`;
        }
      } else {
        msg = error?.message || msg;
      }
      toast.error(msg, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step indicator config ────────────────────────────────────────
  const steps = [
    { label: "Patient Details", step: 1 },
    { label: "Medical Details", step: 2 },
    { label: "Book Appointment", step: 3 },
  ];

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Paper sx={{ overflow: "hidden", minHeight: "100vh" }}>
      {/* Header */}
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
          {steps.map(({ label, step }) => (
            <Box
              key={step}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
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
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#CBD5E1",
            borderRadius: "4px",
          },
        }}
      >
        {currentStep === 1 && (
          <Step1
            form={form}
            isCouple={isCouple}
            setIsCouple={setIsCouple}
            employees={employees}
            loadingEmployees={loadingEmployees}
            campaigns={campaigns}
            handleChange={handleChange}
            handleCampaignChange={handleCampaignChange}
            handleNextTypeChange={handleNextTypeChange}
          />
        )}

        {currentStep === 2 && (
          <Step2
            form={form}
            setForm={setForm}
            pendingFiles={pendingFiles}
            docDragOver={docDragOver}
            setDocDragOver={setDocDragOver}
            fileInputRef={fileInputRef}
            addFiles={addFiles}
            removeFile={removeFile}
            handleFileInputChange={handleFileInputChange}
          />
        )}

        {currentStep === 3 && (
          <Step3
            form={form}
            setForm={setForm}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            departments={departments}
            filteredPersonnel={filteredPersonnel}
            loadingDepartments={loadingDepartments}
            loadingEmployees={loadingEmployees}
            handleChange={handleChange}
            handleDepartmentChange={handleDepartmentChange}
          />
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: "white",
          p: 3,
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
        }}
      >
        <Button
          onClick={() => navigate("/leads")}
          sx={{
            textTransform: "none",
            color: "#64748B",
            fontWeight: 700,
            px: 3,
          }}
        >
          Cancel
        </Button>
        {currentStep > 1 && (
          <Button
            onClick={handleBack}
            variant="outlined"
            disabled={isSubmitting}
            sx={{
              textTransform: "none",
              borderColor: "#E2E8F0",
              color: "#1E293B",
              fontWeight: 700,
              px: 3,
              "&:hover": { borderColor: "#CBD5E1" },
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
              "&:hover": { bgcolor: "#1E293B" },
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              bgcolor: "#334155",
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              minWidth: "100px",
              "&:hover": { bgcolor: "#1E293B" },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Save"
            )}
          </Button>
        )}
      </Box>
    </Paper>
  );
}
