import * as React from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Dayjs } from "dayjs";

import { useSelector } from "react-redux";
import { selectCampaign } from "../../store/campaignSlice";
import { selectUser } from "../../store/authSlice";
import {
  resolveUserRole,
  hasAnySubcategoryActionPermission,
} from "../../utils/roleAccess";

import type { FormState } from "../../types/leads.types";
import { LeadAPI, DepartmentAPI, LeadEmailAPI } from "../../services/leads.api";
import type { Department } from "../../services/leads.api";
import { authApi } from "../../services/auth.api";

import {
  getAutoNextActionStatus,
  ALLOWED_DOC_TYPES,
  MAX_DOC_SIZE_MB,
  strOrNull,
  intOrNull,
  type LeadPayload,
  type CampaignData,
  type ApiError,
} from "../LeadsHub/addNewLead.constants";

import { validateStep } from "../LeadsHub/addNewLead.validation";
import { Step1, Step2, Step3 } from "../LeadsHub/addNewLead.steps";

// ── Import appType config ─────────────────────────────────────────────────────
import {
  IS_MEDICAL_APP,
  IS_CONTRACTS_APP,
  ACTIVE_FLOW_COPY,
} from "../../config/appType";

// ── Helpers ──────────────────────────────────────────────────────────────────
const capitalizeFirst = (value: string) =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

const toReadableError = (value: unknown): string => {
  if (value == null) return "Unknown error";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const first = value[0];
    return first == null ? "Unknown error" : toReadableError(first);
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    const firstKey = Object.keys(obj)[0];
    if (!firstKey) return "Unknown error";
    return `${firstKey}: ${toReadableError(obj[firstKey])}`;
  }
  return "Unknown error";
};

type AssigneeOption = {
  id: number;
  first_name: string | undefined;
  last_name: string | undefined;
  username: string | undefined;
  role: string | undefined;
  designation: string | undefined;
  email: string | undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const normalizeAssignees = (raw: unknown): AssigneeOption[] => {
  const root = asRecord(raw);
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray(root?.objects)
      ? (root?.objects as unknown[])
      : Array.isArray(root?.results)
        ? (root?.results as unknown[])
        : Array.isArray(root?.data)
          ? (root?.data as unknown[])
          : [];

  return list
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;

      const idValue = record.id ?? record.user_id;
      const id =
        typeof idValue === "number"
          ? idValue
          : typeof idValue === "string"
            ? Number(idValue)
            : NaN;

      if (!Number.isFinite(id)) return null;

      return {
        id,
        first_name:
          typeof record.first_name === "string" ? record.first_name : undefined,
        last_name:
          typeof record.last_name === "string" ? record.last_name : undefined,
        username:
          typeof record.username === "string" ? record.username : undefined,
        role: typeof record.role === "string" ? record.role : undefined,
        designation:
          typeof record.designation === "string" ? record.designation : undefined,
        email: typeof record.email === "string" ? record.email : undefined,
      };
    })
    .filter((item): item is AssigneeOption => item !== null);
};

const assigneeLabel = (option: AssigneeOption): string => {
  const fullName = `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  const secondary = option.role || option.designation;
  return secondary ? `${primary} (${secondary})` : primary;
};

const personnelLabel = (option: AssigneeOption): string => assigneeLabel(option);

// ====================== Component ======================
export default function AddNewLead() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const loadingEmployees = false;
  const [clinicId] = React.useState(1);
  const [assigneeName, setAssigneeName] = React.useState("");
  const [assigneeSearch, setAssigneeSearch] = React.useState("");
  const [assigneeOptions, setAssigneeOptions] = React.useState<AssigneeOption[]>([]);
  const [assigneeLoading, setAssigneeLoading] = React.useState(false);
  const [leadGeneratedBySearch, setLeadGeneratedBySearch] = React.useState("");
  const [leadGeneratedById, setLeadGeneratedById] = React.useState("");
  const [leadGeneratedByOptions, setLeadGeneratedByOptions] = React.useState<AssigneeOption[]>([]);
  const [leadGeneratedByLoading, setLeadGeneratedByLoading] = React.useState(false);
  const [appointmentPersonnelInput, setAppointmentPersonnelInput] = React.useState("");
  const [appointmentPersonnelOptions, setAppointmentPersonnelOptions] = React.useState<AssigneeOption[]>([]);
  const [appointmentPersonnelLoading, setAppointmentPersonnelLoading] = React.useState(false);

  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [docDragOver, setDocDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const rawCampaigns = useSelector(selectCampaign);
  const authedUser = useSelector(selectUser);

  // ── Permission guard ─────────────────────────────────────────────────────────
  const _authUserRaw = authedUser as unknown as Record<string, unknown> | null;
  const _nestedUser =
    _authUserRaw?.user && typeof _authUserRaw.user === "object"
      ? (_authUserRaw.user as Record<string, unknown>)
      : null;
  const _role = resolveUserRole(_authUserRaw);
  const _perms = _authUserRaw?.permissions ?? _nestedUser?.permissions;
  const _leadAliases = ["leads hub"] as const;
  const canAddLeads =
    _role === "super_admin" ||
    hasAnySubcategoryActionPermission(_perms, [..._leadAliases], "add");
  // ─────────────────────────────────────────────────────────────────────────────

  const campaigns = React.useMemo(
    () =>
      (rawCampaigns || []).map((api: CampaignData) => ({
        id: api.id,
        name: capitalizeFirst(api.campaign_name ?? ""),
        source: api.campaign_mode === 1 ? "Social Media" : "Email",
        subSource:
          api.campaign_mode === 1
            ? capitalizeFirst(api.social_media?.[0]?.platform_name ?? "")
            : "Gmail",
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
    wantAppointment: "no",
    department: "",
    personnel: "",
    appointmentDate: "",
    slot: "",
    remark: "",
    // Contracts-only fields (optional in FormState type)
    contactFullName: "",
    designation: "",
    contactPhone: "",
    contactEmail: "",
    leadGeneratedBy: "",
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
          `Departments: ${toReadableError(error?.response?.data) || error?.message || "Failed"}`,
          { position: "top-right", autoClose: 3000, theme: "colored" },
        );
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [clinicId]);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!assigneeSearch.trim()) {
        setAssigneeOptions([]);
        return;
      }

      try {
        setAssigneeLoading(true);
        const response = await authApi.searchUsers({
          search: assigneeSearch,
          limit: 20,
          offset: 0,
        });
        setAssigneeOptions(normalizeAssignees(response));
      } catch {
        setAssigneeOptions([]);
      } finally {
        setAssigneeLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [assigneeSearch]);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!leadGeneratedBySearch.trim()) {
        setLeadGeneratedByOptions([]);
        return;
      }

      try {
        setLeadGeneratedByLoading(true);
        const response = await authApi.searchUsers({
          search: leadGeneratedBySearch,
          limit: 20,
          offset: 0,
        });
        setLeadGeneratedByOptions(normalizeAssignees(response));
      } catch {
        setLeadGeneratedByOptions([]);
      } finally {
        setLeadGeneratedByLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [leadGeneratedBySearch]);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.wantAppointment !== "yes") {
        setAppointmentPersonnelOptions([]);
        return;
      }

      if (!appointmentPersonnelInput.trim()) {
        setAppointmentPersonnelOptions([]);
        return;
      }

      try {
        setAppointmentPersonnelLoading(true);
        const response = await authApi.searchUsers({
          search: appointmentPersonnelInput,
          limit: 20,
          offset: 0,
        });
        setAppointmentPersonnelOptions(normalizeAssignees(response));
      } catch {
        setAppointmentPersonnelOptions([]);
      } finally {
        setAppointmentPersonnelLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    appointmentPersonnelInput,
    form.department,
    form.wantAppointment,
  ]);

  const selectedAppointmentPersonnel = React.useMemo(() => {
    const selectedId = Number(form.personnel);
    if (Number.isFinite(selectedId)) {
      const matched = appointmentPersonnelOptions.find((option) => option.id === selectedId);
      if (matched) return matched;
    }

    if (!appointmentPersonnelInput.trim()) return null;

    return {
      id: Number.isFinite(selectedId) ? selectedId : 0,
      first_name: undefined,
      last_name: undefined,
      username: appointmentPersonnelInput,
      role: undefined,
      designation: undefined,
      email: undefined,
    } satisfies AssigneeOption;
  }, [appointmentPersonnelInput, appointmentPersonnelOptions, form.personnel]);

  // ── Auto-fill source from campaign ──────────────────────────────
  React.useEffect(() => {
    if (!form.campaign) {
      setForm((prev) => ({ ...prev, campaignName: "", source: "", subSource: "" }));
      return;
    }
    const matched = campaigns.find((c) => c.id === form.campaign);
    if (!matched) return;
    setForm((prev) => ({
      ...prev,
      campaignName: capitalizeFirst(matched.name),
      source: capitalizeFirst(matched.source),
      subSource: capitalizeFirst(matched.subSource),
    }));
  }, [form.campaign, campaigns]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: capitalizeFirst(e.target.value) }));

  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, campaign: e.target.value }));

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppointmentPersonnelInput("");
    setForm((prev) => ({ ...prev, department: e.target.value, personnel: "" }));
  };

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
        toast.error(`"${file.name}" — unsupported type. Use PDF, Word, JPG or PNG.`, {
          position: "top-right", autoClose: 3000, theme: "colored",
        });
        return;
      }
      if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" — exceeds ${MAX_DOC_SIZE_MB}MB limit.`, {
          position: "top-right", autoClose: 3000, theme: "colored",
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
    const isValid = await validateStep(currentStep, form, isCouple, pendingFiles.length > 0);
    if (!isValid) return;
    if (currentStep === 3) {
      await submitForm();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ── Build Payload ────────────────────────────────────────────────
  const buildPayload = (): LeadPayload => {
    const shouldBookAppointment =
      form.wantAppointment === "yes" &&
      Boolean(form.appointmentDate && form.slot);

    const selectedDepartmentId = intOrNull(form.department);
    const fallbackDepartmentId = departments[0]?.id ?? 1;
    const departmentId = selectedDepartmentId ?? fallbackDepartmentId;

    const genderRaw = form.gender ?? "";
    const maritalRaw = form.marital ?? "";
    const partnerGenderRaw = form.partnerGender ?? "";

    const normalizedGender = genderRaw.toLowerCase().trim();
    const genderValue =
      normalizedGender === "male" || normalizedGender === "female"
        ? (normalizedGender as "male" | "female")
        : null;

    const maritalValue =
      maritalRaw.trim() !== ""
        ? (maritalRaw.toLowerCase() as "single" | "married")
        : null;

    const partnerGenderValue =
      partnerGenderRaw.trim() !== ""
        ? (partnerGenderRaw.toLowerCase() as "male" | "female")
        : null;

    const generatedByOption = leadGeneratedByOptions.find(
      (option) => assigneeLabel(option) === (form.leadGeneratedBy ?? "").trim(),
    );
    const resolvedGeneratedById = intOrNull(leadGeneratedById) ?? generatedByOption?.id ?? null;

    return {
      clinic_id: clinicId,
      department_id: departmentId,
      full_name: form.full_name.trim() || "Unknown Lead",
      contact_no: form.contact.trim() || "0000000000",
      source: form.source || "Direct",
      sub_source: form.subSource || "",
      treatment_interest:
        form.treatments.join(",") || form.treatmentInterest || "General",
      appointment_date: shouldBookAppointment ? (form.appointmentDate ?? null) : null,
      slot: shouldBookAppointment ? (form.slot ?? "") : "",
      campaign_id: strOrNull(form.campaign),
      email: strOrNull(form.email || form.contactEmail) ?? null,
      language_preference: form.language ?? "",
      location: form.location ?? "",
      address: form.address ?? "",
      remark: form.remark ?? "",
      partner_full_name: form.partnerName ?? "",
      next_action_description: form.nextDesc ?? "",
      next_action_type: form.nextType || undefined,
      gender: IS_MEDICAL_APP ? genderValue : null,
      marital_status: IS_MEDICAL_APP ? maritalValue : null,
      partner_gender: IS_MEDICAL_APP ? partnerGenderValue : null,
      next_action_status:
        form.nextStatus === "pending" || form.nextStatus === "completed"
          ? form.nextStatus
          : null,
      assigned_to_id: intOrNull(form.assignee) ?? null,
      assigned_to_name: assigneeName.trim() || null,
      lead_generated_by: form.leadGeneratedBy?.trim() || "",
      personal_id: IS_CONTRACTS_APP
        ? resolvedGeneratedById
        : (intOrNull(form.personnel) ?? null),
      personal_name: IS_CONTRACTS_APP
        ? (form.leadGeneratedBy?.trim() || null)
        : null,
      age: IS_MEDICAL_APP ? (intOrNull(form.age) ?? null) : null,
      partner_age: IS_MEDICAL_APP ? (intOrNull(form.partnerAge) ?? null) : null,
      partner_inquiry: IS_MEDICAL_APP ? isCouple === "yes" : false,
      book_appointment: shouldBookAppointment,
      is_active: true,
      lead_status: "new",
    };
  };

  // ── Submit ───────────────────────────────────────────────────────
  const submitForm = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const payload = buildPayload();
      const shouldSendAppointmentEmail =
        payload.book_appointment === true &&
        Boolean(payload.appointment_date && payload.slot);

      const response =
        pendingFiles.length > 0
          ? await LeadAPI.createWithDocuments(payload, pendingFiles)
          : await LeadAPI.create(payload);

      if (shouldSendAppointmentEmail) {
        try {
          await LeadAPI.update(String(response.id), {
            clinic_id: response.clinic_id ?? payload.clinic_id,
            department_id: response.department_id ?? payload.department_id,
            full_name: response.full_name || payload.full_name,
            contact_no: response.contact_no || payload.contact_no,
            source: response.source || payload.source,
            treatment_interest: response.treatment_interest || payload.treatment_interest,
            lead_status: "appointment",
            book_appointment: true,
            appointment_date: payload.appointment_date,
            slot: payload.slot,
            partner_inquiry: response.partner_inquiry ?? payload.partner_inquiry,
            is_active: response.is_active !== false,
          });
        } catch {
          toast.warning("Lead was created, but appointment status update failed.", {
            position: "top-right",
            autoClose: 2500,
            theme: "colored",
          });
        }

      }

      const recipientEmail =
        response.email?.trim() ||
        payload.email?.trim() ||
        form.contactEmail.trim() ||
        "";
      if (recipientEmail) {
        const leadFirstName = (response.full_name || payload.full_name || "Patient")
          .trim()
          .split(/\s+/)[0] || "Patient";

        const appointmentDateText = payload.appointment_date || "-";
        const appointmentSlotText = payload.slot || "-";
        const appointmentBookedText = payload.book_appointment ? "Yes" : "No";
        const senderName = [authedUser?.first_name, authedUser?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || authedUser?.username || "Team";
        const senderEmail = authedUser?.email?.trim() || undefined;

        const subject = payload.book_appointment
          ? `Appointment Booked - ${appointmentDateText}`
          : `Lead Registered - ${response.full_name || payload.full_name}`;

        const emailBody = [
          `Hi ${leadFirstName},`,
          "",
          payload.book_appointment
            ? `Your appointment has been booked successfully for ${appointmentDateText} at ${appointmentSlotText}.`
            : "Your lead has been registered successfully.",
          "",
          "Lead Details:",
          `- Lead Name: ${response.full_name || payload.full_name || "-"}`,
          `- Contact Number: ${response.contact_no || payload.contact_no || "-"}`,
          `- Email: ${recipientEmail}`,
          `- Location: ${response.location || payload.location || "-"}`,
          `- Address: ${response.address || payload.address || "-"}`,
          `- Department ID: ${String(response.department_id || payload.department_id || "-")}`,
          `- Source: ${response.source || payload.source || "-"}`,
          `- Sub Source: ${response.sub_source || payload.sub_source || "-"}`,
          `- Treatment Interest: ${response.treatment_interest || payload.treatment_interest || "-"}`,
          `- Assigned To: ${response.assigned_to_name || payload.assigned_to_name || "-"}`,
          `- Lead Generated By: ${payload.lead_generated_by || "-"}`,
          `- Contact Person Name: ${form.contactFullName || "-"}`,
          `- Contact Designation: ${form.designation || "-"}`,
          `- Contact Phone: ${form.contactPhone || "-"}`,
          `- Contact Email: ${form.contactEmail || "-"}`,
          `- Gender: ${payload.gender || "-"}`,
          `- Age: ${payload.age ?? "-"}`,
          `- Marital Status: ${payload.marital_status || "-"}`,
          `- Partner Name: ${payload.partner_full_name || "-"}`,
          `- Partner Gender: ${payload.partner_gender || "-"}`,
          `- Partner Age: ${payload.partner_age ?? "-"}`,
          `- Next Action Type: ${response.next_action_type || payload.next_action_type || "-"}`,
          `- Next Action Status: ${response.next_action_status || payload.next_action_status || "-"}`,
          `- Next Action Description: ${response.next_action_description || payload.next_action_description || "-"}`,
          `- Appointment Booked: ${appointmentBookedText}`,
          `- Appointment Date: ${appointmentDateText}`,
          `- Appointment Slot: ${appointmentSlotText}`,
          `- Remark: ${response.remark || payload.remark || "-"}`,
          "",
          `Sent by: ${senderName}`,
          `Sender Email: ${senderEmail || "-"}`,
          "",
          "If any detail needs correction, please reply to this email.",
          "",
          "Thank you.",
        ].join("\n");

        try {
          await LeadEmailAPI.sendNow({
            lead: response.id,
            subject,
            sender_email: senderEmail,
            email_body: emailBody,
          });
        } catch {
          toast.warning("Lead was created, but confirmation email could not be sent.", {
            position: "top-right",
            autoClose: 2500,
            theme: "colored",
          });
        }
      }

      console.log("✅ Lead created:", response);
      toast.success("Lead saved successfully!", {
        position: "top-right", autoClose: 1500, theme: "colored",
      });
      navigate("/leads", { replace: true });
    } catch (err) {
      const error = err as ApiError;
      const data = error?.response?.data;
      let msg = "Failed to save lead";
      if (data) {
        msg = toReadableError(data);
      } else {
        msg = error?.message || msg;
      }
      toast.error(msg, { position: "top-right", autoClose: 3000, theme: "colored" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step indicator config — labels from appType config ───────────
  const steps = [
    { label: ACTIVE_FLOW_COPY.detailsStep, step: 1 },   // "Lead Details" or "Patient Details"
    { label: ACTIVE_FLOW_COPY.medicalStep, step: 2 },    // "Product Details" or "Medical Details"
    { label: ACTIVE_FLOW_COPY.step3, step: 3 },          // "Book Appointment" (same for both)
  ];

  // ── Permission redirect ───────────────────────────────────────────
  if (!canAddLeads) {
    return <Navigate to="/leads" replace />;
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Paper
      sx={{
        overflow: "hidden",
        minHeight: "88vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: "white", px: 1, py: 1 }}>
        <Typography variant="h6" fontWeight={700} color="#1E293B">
          Add New Lead
        </Typography>
      </Box>

      {/* Step Indicator */}
      <Box sx={{ bgcolor: "white", px: 1, pt: 1, pb: 3 }}>
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
          p: 1,
          flex: 1,
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
            assigneeName={assigneeName}
            assigneeOptions={assigneeOptions}
            assigneeLoading={assigneeLoading}
            leadGeneratedByInput={form.leadGeneratedBy ?? ""}
            leadGeneratedByOptions={leadGeneratedByOptions}
            leadGeneratedByLoading={leadGeneratedByLoading}
            campaigns={campaigns}
            handleChange={handleChange}
            handleAssigneeInputChange={(value) => {
              setAssigneeSearch(value);
              setAssigneeName(value);
              setForm((prev) => ({ ...prev, assignee: "" }));
            }}
            handleAssigneeChange={(value) => {
              setForm((prev) => ({
                ...prev,
                assignee: value ? String(value.id) : "",
              }));
              setAssigneeName(value ? assigneeLabel(value) : "");
            }}
            handleLeadGeneratedByInputChange={(value) => {
              setLeadGeneratedBySearch(value);
              setLeadGeneratedById("");
              setForm((prev) => ({ ...prev, leadGeneratedBy: value }));
            }}
            handleLeadGeneratedByChange={(value) => {
              setLeadGeneratedById(value ? String(value.id) : "");
              setForm((prev) => ({
                ...prev,
                leadGeneratedBy: value ? assigneeLabel(value) : "",
              }));
            }}
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
            loadingDepartments={loadingDepartments}
            loadingEmployees={loadingEmployees}
            personnelInput={appointmentPersonnelInput}
            personnelOptions={appointmentPersonnelOptions}
            personnelLoading={appointmentPersonnelLoading}
            selectedPersonnel={selectedAppointmentPersonnel}
            handlePersonnelInputChange={(value) => {
              setAppointmentPersonnelInput(value);
              setForm((prev) => ({ ...prev, personnel: "" }));
            }}
            handlePersonnelChange={(value) => {
              setForm((prev) => ({ ...prev, personnel: value ? String(value.id) : "" }));
              setAppointmentPersonnelInput(value ? personnelLabel(value) : "");
            }}
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
          borderTop: "1px solid #F1F5F9",
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
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              "Save"
            )}
          </Button>
        )}
      </Box>
    </Paper>
  );
}