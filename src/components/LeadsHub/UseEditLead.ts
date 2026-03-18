// ============================================================
// useEditLead.ts  –  State, effects, handlers & helpers
// Consumed by EditLead.tsx (pure JSX layer)
// ============================================================
import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { LeadAPI, DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import { fetchLeads } from "../../store/leadSlice";
import { selectCampaign } from "../../store/campaignSlice";
import type { Lead, LeadPayload, Department, Employee } from "../../services/leads.api";
import type { AppDispatch } from "../../store";
import type { NextActionStatus } from "../../types/leads.types";
import { TASK_STATUS_FOR_TYPE, getAutoNextActionStatus } from "./LeadTaskConfig";

// ====================== Extended Lead type ======================
export interface LeadResponse extends Lead {
  gender?: "male" | "female" | "other" | null;
  language_preference?: string | null;
  next_action_type?: string;
}

// ====================== Existing document shape ======================
export interface ExistingDocument {
  url: string;
  name: string;
  id?: number | string;
}

// ====================== Campaign shape ======================
interface RawCampaign {
  id: string | number;
  campaign_name?: string;
  campaign_mode?: number;
  social_media?: { platform_name?: string }[];
  is_active?: boolean;
}

export interface CampaignOption {
  id: string | number;
  name: string;
  source: string;
  subSource: string;
  isActive: boolean;
}

// ====================== Helpers ======================
export const strOrNull = (val: string | undefined | null): string | null =>
  val && val.trim() !== "" ? val.trim() : null;

export const intOrNull = (val: string | undefined | null): number | null => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) ? n : null;
};

export const intOrFallback = (val: string | undefined | null, fallback: number): number => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) && n > 0 ? n : fallback;
};

export const isNextActionStatus = (v: string): v is NextActionStatus =>
  v === "pending" || v === "completed";

export const formatLeadId = (id: string): string => {
  if (id.match(/^#?LN-\d+$/i)) return id.startsWith("#") ? id : `#${id}`;
  const lnMatch = id.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = id.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#LN-${(hash % 900) + 100}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileTypeLabel = (file: File): string => {
  if (file.type === "application/pdf") return "PDF";
  if (file.type.startsWith("image/")) return file.type.split("/")[1].toUpperCase();
  if (file.type.includes("word")) return "DOC";
  return file.name.split(".").pop()?.toUpperCase() ?? "FILE";
};

export const normalizeDocument = (doc: {
  url?: string;
  file?: string;
  document?: string;
  name?: string;
  file_name?: string;
  original_name?: string;
  id?: number | string;
}): ExistingDocument => {
  const url = doc.url || doc.file || doc.document || "";
  const rawName =
    doc.name ||
    doc.file_name ||
    doc.original_name ||
    url.split("/").pop() ||
    "Document";
  return { url, name: rawName, id: doc.id };
};

// ====================== Time Slots ======================
export const TIME_SLOTS = [
  "09:00 AM - 09:30 AM", "09:30 AM - 10:00 AM", "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM", "11:00 AM - 11:30 AM", "11:30 AM - 12:00 PM",
  "12:00 PM - 12:30 PM", "12:30 PM - 01:00 PM", "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM", "03:00 PM - 03:30 PM", "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM", "04:30 PM - 05:00 PM", "05:00 PM - 05:30 PM",
  "05:30 PM - 06:00 PM",
];

// ====================== Stepper labels ======================
export const STEPS = ["Patient Details", "Medical Details", "Book Appointment"] as const;
export const TOTAL_STEPS = STEPS.length;

// ====================== Shared MUI styles ======================
export const inputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#6366F1" },
  },
};

export const readOnlyStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    backgroundColor: "#F1F5F9",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#E2E8F0" },
    "&.Mui-focused fieldset": { borderColor: "#E2E8F0" },
  },
};

export const labelStyle = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#475569",
  mb: 0.5,
  display: "block",
} as const;

export const sectionLabelStyle = {
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "#94A3B8",
  letterSpacing: "0.08em",
  mb: 1.5,
} as const;

// ====================== Helper: normalize truthy API value ======================
// Handles true, 1, "1", "true" from various backends
const isTruthy = (val: unknown): boolean =>
  val === true || val === 1 || val === "1" || val === "true";

// ====================== Hook ======================
export function useEditLead() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  // ── Campaigns from Redux store ──
  const rawCampaigns = useSelector(selectCampaign);
  const campaigns = React.useMemo<CampaignOption[]>(
    () =>
      (rawCampaigns || []).map((api: RawCampaign) => ({
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

  // UI state
  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Lookup data
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = React.useState<Employee[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [employeeError, setEmployeeError] = React.useState<string | null>(null);

  // Lead meta
  const [leadData, setLeadData] = React.useState<Lead | null>(null);
  const [clinicId, setClinicId] = React.useState<number>(1);

  // Track the lead's original department_id so we never overwrite it
  const [leadDepartmentId, setLeadDepartmentId] = React.useState<number | null>(null);

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
  const [campaign, setCampaignId] = React.useState<string | number>("");
  const [assignee, setAssignee] = React.useState("");
  const [nextType, setNextType] = React.useState("");
  const [nextStatus, setNextStatus] = React.useState("");
  const [nextDesc, setNextDesc] = React.useState("");

  // Step 2
  const [treatmentInterest, setTreatmentInterest] = React.useState("");
  const [treatments, setTreatments] = React.useState<string[]>([]);
  const [documents, setDocuments] = React.useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = React.useState<ExistingDocument[]>([]);
  const initialExistingDocuments = React.useRef<ExistingDocument[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);

  // Step 3 — appointment fields (completely separate from Step 1 assignee)
  const [wantAppointment, setWantAppointment] = React.useState<"yes" | "no">("no");
  const [department, setDepartment] = React.useState("");
  const [appointmentPersonnel, setAppointmentPersonnel] = React.useState("");
  const [appointmentDate, setAppointmentDate] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);
  const [slot, setSlot] = React.useState("");
  const [remark, setRemark] = React.useState("");

  // ── Auto-fill source & subSource when campaign selection changes ──
  React.useEffect(() => {
    if (!campaign) return;
    const matched = campaigns.find((c) => String(c.id) === String(campaign));
    if (!matched) return;
    setSource(matched.source);
    setSubSource(matched.subSource);
  }, [campaign, campaigns]);

  // ====================== Derived ======================
  const availableTaskStatuses = React.useMemo<{ label: string; value: string }[]>(() => {
    if (!nextType) {
      return [
        { label: "To Do", value: "pending" },
        { label: "Done", value: "completed" },
      ];
    }
    return TASK_STATUS_FOR_TYPE[nextType] ?? [
      { label: "To Do", value: "pending" },
      { label: "Done", value: "completed" },
    ];
  }, [nextType]);

  // ====================== Handlers ======================
  const handleNextTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value;
    setNextType(newType);
    setNextStatus(getAutoNextActionStatus(newType));
  };

  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCampaignId(e.target.value);
  };

  const handleDateChange = (d: Date | Dayjs | null) => {
    const nextDate = d ? dayjs(d) : null;
    setSelectedDate(nextDate);
    if (nextDate) setAppointmentDate(nextDate.format("YYYY-MM-DD"));
  };

  // ── FIX: Reliable Yes/No toggle for book appointment ──
  const handleWantAppointmentChange = React.useCallback((value: "yes" | "no") => {
    // Guard: only accept valid values
    if (value !== "yes" && value !== "no") return;

    setWantAppointment(value);

    if (value === "no") {
      // Clear all appointment-specific fields when user selects "No"
      setDepartment("");
      setAppointmentPersonnel("");
      setAppointmentDate("");
      setSelectedDate(null);
      setSlot("");
      setRemark("");
    }
  }, []);

  // ====================== File Handlers ======================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length === 0) return;
    setDocuments((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !existingNames.has(f.name))];
    });
    e.target.value = "";
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // ====================== Fetch Lead ======================
  React.useEffect(() => {
    if (!id) { setError("No lead ID provided"); setLoading(false); return; }
    const load = async () => {
      try {
        setLoading(true);
        const lead = await LeadAPI.getById(id) as LeadResponse;
        setLeadData(lead as unknown as Lead);
        setClinicId(lead.clinic_id ?? 1);

        // Save original department_id so we never lose it
        const origDeptId = lead.department_id ?? null;
        setLeadDepartmentId(typeof origDeptId === "number" ? origDeptId : null);

        setFullName(lead.full_name ?? "");
        setContactNo(lead.contact_no ?? "");
        setEmail(lead.email ?? "");
        setLocation(lead.location ?? "");
        setGender(lead.gender === "male" ? "Male" : lead.gender === "female" ? "Female" : "");
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

        const campaignId = (lead as unknown as { campaign_id?: string | number }).campaign_id;
        if (campaignId) setCampaignId(String(campaignId));

        setAssignee(lead.assigned_to_id?.toString() ?? "");
        setNextType(lead.next_action_type ?? "");
        setNextStatus(lead.next_action_status ?? "");
        setNextDesc(lead.next_action_description ?? "");

        setTreatmentInterest(lead.treatment_interest ?? "");
        if (lead.treatment_interest) {
          setTreatments(lead.treatment_interest.split(",").map((t) => t.trim()));
        }

        // ── FIX: Normalize book_appointment regardless of type (bool / number / string) ──
        const hasBooking = isTruthy(lead.book_appointment);
        setWantAppointment(hasBooking ? "yes" : "no");

        if (hasBooking) {
          setDepartment(lead.department_id?.toString() ?? "");
          const personnelId = (lead as unknown as { personal_id?: number }).personal_id;
          setAppointmentPersonnel(personnelId?.toString() ?? "");
          setAppointmentDate(lead.appointment_date ?? "");
          if (lead.appointment_date) setSelectedDate(dayjs(lead.appointment_date));
          setSlot(lead.slot ?? "");
          setRemark(lead.remark ?? "");
        }

        // ── Fetch existing documents ──
        const embeddedDocs = (lead as unknown as { documents?: unknown[] }).documents;
        if (Array.isArray(embeddedDocs) && embeddedDocs.length > 0) {
          const normalized = embeddedDocs.map((d) => normalizeDocument(d as Parameters<typeof normalizeDocument>[0]));
          setExistingDocuments(normalized);
          initialExistingDocuments.current = normalized;
        } else {
          try {
            setDocsLoading(true);
            const rawDocs = await LeadAPI.getDocuments(id);
            if (Array.isArray(rawDocs) && rawDocs.length > 0) {
              setExistingDocuments(rawDocs.map((d) => normalizeDocument(d as Parameters<typeof normalizeDocument>[0])));
            }
          } catch {
            // silently ignore — not critical
          } finally {
            setDocsLoading(false);
          }
        }
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
        const employeeList = await EmployeeAPI.listByClinic(clinicId);
        setEmployees(Array.isArray(employeeList) ? employeeList : []);
      } catch (err: unknown) {
        setEmployeeError(err instanceof Error ? err.message : "Failed to load employees");
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    load();
  }, [clinicId]);

  // ====================== Filter Personnel by Appointment Department ======================
  React.useEffect(() => {
    if (!department || employees.length === 0) { setFilteredPersonnel([]); return; }
    const selectedDept = departments.find((d) => d.id === Number(department));
    if (!selectedDept) { setFilteredPersonnel([]); return; }
    const normalize = (s: string) => (s ?? "").trim().toLowerCase().normalize("NFC");
    setFilteredPersonnel(
      employees.filter((emp) => normalize(emp.department_name) === normalize(selectedDept.name))
    );
  }, [department, employees, departments]);

  // ====================== Save ======================
  const handleSave = () => {
    if (!leadData || !id || saving) return;

    const bookingActive = wantAppointment === "yes";

    // ── Validate appointment fields before hitting the API ──
    if (bookingActive) {
      if (!department) {
        setError("Please select a department for the appointment.");
        return;
      }
      if (!appointmentDate) {
        setError("Please select a date for the appointment.");
        return;
      }
      if (!slot) {
        setError("Please select a time slot for the appointment.");
        return;
      }
    }

    const resolvedStatus = isNextActionStatus(nextStatus) ? nextStatus : null;

    const resolvedDepartmentId: number | null =
      bookingActive && department
        ? intOrNull(department)
        : leadDepartmentId;

    const resolvedDeptId: number =
      bookingActive && department
        ? (intOrNull(department) ?? resolvedDepartmentId ?? clinicId)
        : (resolvedDepartmentId ?? clinicId);

    const coupleActive = isCouple === "yes";

    const updateData = {
      clinic_id: clinicId,
      department_id: resolvedDeptId,
      full_name: fullName.trim(),
      contact_no: contactNo.trim(),
      email: strOrNull(email),
      age: intOrNull(age),
      marital_status: marital ? (marital.toLowerCase() as "single" | "married") : null,
      location: location || "",
      address: address || "",

      // ── Partner: only send partner fields when couple is active ──
      partner_inquiry: coupleActive,
      partner_full_name: coupleActive ? (partnerName || "") : "",
      partner_age: coupleActive ? intOrNull(partnerAge) : null,
      partner_gender: coupleActive && partnerGender
        ? (partnerGender.toLowerCase() as "male" | "female")
        : null,

      source,
      sub_source: subSource || "",

      // ── campaign_id: preserve original type — send null when empty ──
      campaign_id: campaign ? String(campaign) : null,

      assigned_to_id: intOrNull(assignee),
      next_action_type: nextType || undefined,
      next_action_status: resolvedStatus,
      next_action_description: nextDesc || "",
      treatment_interest: treatments.length > 0 ? treatments.join(",") : (treatmentInterest || ""),
      is_active: leadData?.is_active !== false,
      gender: gender ? (gender.toLowerCase() as "male" | "female" | "other") : null,
      language_preference: language || "",

      book_appointment: bookingActive,

      // ── appointment fields: omit entirely when not booking ──
      // API rejects null AND "" for appointment_date — must not send the key at all
      ...(bookingActive
        ? {
            appointment_date: appointmentDate,
            slot: slot,
            remark: remark || "",
            personal_id: appointmentPersonnel ? intOrNull(appointmentPersonnel) : null,
          }
        : {
            appointment_date: undefined,
            slot: undefined,
            remark: "",
            personal_id: null,
          }),
    };

    // Debug: log exact payload so you can compare with what API expects
    console.log("Saving lead payload:", JSON.stringify(updateData, null, 2));

    setShowSuccess(true);
    setSaving(true);

    const doSave = async () => {
      if (documents.length > 0) {
        await LeadAPI.updateWithDocuments(id, updateData as LeadPayload, documents);
      } else {
        await LeadAPI.update(id, updateData as LeadPayload);
      }
    };

    doSave()
      .then(() => {
        toast.success("Lead saved successfully!", {
          position: "top-right",
          autoClose: 1500,
          theme: "colored",
        });
        setTimeout(() => {
          navigate("/leads", { replace: true });
          dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
        }, 800);
      })
      .catch((err: unknown) => {
        let msg = "Failed to save lead";
        if (err instanceof Error) msg = err.message;
        const anyErr = err as { response?: { data?: { detail?: string; message?: string } }; detail?: string };
        if (anyErr?.response?.data?.detail) msg = anyErr.response.data.detail;
        else if (anyErr?.response?.data?.message) msg = anyErr.response.data.message;

        console.error("Save failed:", err);
        setError(msg);
        setShowSuccess(false);
        toast.error(msg, {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return {
    navigate,
    currentStep, setCurrentStep,
    loading,
    error, setError,
    saving,
    showSuccess,
    campaigns,
    departments,
    employees,
    filteredPersonnel,
    loadingDepartments,
    loadingEmployees,
    employeeError, setEmployeeError,
    leadData,
    fullName, setFullName,
    contactNo, setContactNo,
    email, setEmail,
    location, setLocation,
    gender, setGender,
    age, setAge,
    marital, setMarital,
    address, setAddress,
    language, setLanguage,
    isCouple, setIsCouple,
    partnerName, setPartnerName,
    partnerAge, setPartnerAge,
    partnerGender, setPartnerGender,
    source, setSource,
    subSource, setSubSource,
    campaign, handleCampaignChange,
    assignee, setAssignee,
    nextType,
    nextStatus, setNextStatus,
    nextDesc, setNextDesc,
    availableTaskStatuses,
    handleNextTypeChange,
    treatmentInterest, setTreatmentInterest,
    treatments, setTreatments,
    documents,
    handleFileChange,
    handleRemoveDocument,
    existingDocuments,
    docsLoading,
    handleRemoveExistingDocument,
    wantAppointment,
    department, setDepartment,
    appointmentPersonnel, setAppointmentPersonnel,
    selectedDate,
    handleDateChange,
    slot, setSlot,
    remark, setRemark,
    handleSave,
    handleWantAppointmentChange,
  };
}