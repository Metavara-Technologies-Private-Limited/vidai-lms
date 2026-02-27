// ============================================================
// useEditLead.ts  –  State, effects, handlers & helpers
// Consumed by EditLead.tsx (pure JSX layer)
// ============================================================
import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import type { DateValidationError, PickerChangeHandlerContext } from "@mui/x-date-pickers";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import { LeadAPI, DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import { fetchLeads } from "../../store/leadSlice";
import type { Lead, LeadPayload, Department, Employee } from "../../services/leads.api";
import type { AppDispatch } from "../../store";
import type { NextActionStatus } from "../../types/leads.types";
import { TASK_STATUS_FOR_TYPE, getAutoNextActionStatus } from "./leadTaskConfig";

// ====================== Extended Lead type ======================
// Covers API response fields not yet reflected in the generated Lead type.
export interface LeadResponse extends Lead {
  gender?: "male" | "female" | "other" | null;
  language_preference?: string | null;
  next_action_type?: string; // no null — Lead.next_action_type is string | undefined
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

// ====================== Time Slots (shared with Step 3 JSX) ======================
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

// ====================== Hook ======================
export function useEditLead() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  // UI state
  const [currentStep, setCurrentStep] = React.useState(1);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

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

  // ====================== Derived ======================
  const availableTaskStatuses = React.useMemo<{ label: string; value: string }[]>(() => {
    if (!nextType) {
      return [
        { label: "To Do", value: "pending"   },
        { label: "Done",  value: "completed" },
      ];
    }
    return TASK_STATUS_FOR_TYPE[nextType] ?? [
      { label: "To Do", value: "pending"   },
      { label: "Done",  value: "completed" },
    ];
  }, [nextType]);

  // ====================== Handlers ======================
  const handleNextTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value;
    setNextType(newType);
    setNextStatus(getAutoNextActionStatus(newType));
  };

  const handleDateChange = (
    d: Date | Dayjs | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: PickerChangeHandlerContext<DateValidationError>
  ) => {
    const nextDate = d ? dayjs(d) : null;
    setSelectedDate(nextDate);
    if (nextDate) setAppointmentDate(nextDate.format("YYYY-MM-DD"));
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

        // Step 1
        setFullName(lead.full_name ?? "");
        setContactNo(lead.contact_no ?? "");
        setEmail(lead.email ?? "");
        setLocation(lead.location ?? "");
        setGender(
          lead.gender === "male" ? "Male"
          : lead.gender === "female" ? "Female"
          : ""
        );
        setAge(lead.age?.toString() ?? "");
        setMarital(
          lead.marital_status === "married" ? "Married"
          : lead.marital_status === "single" ? "Single"
          : ""
        );
        setAddress(lead.address ?? "");
        setLanguage(lead.language_preference ?? "");
        setIsCouple(lead.partner_inquiry ? "yes" : "no");
        setPartnerName(lead.partner_full_name ?? "");
        setPartnerAge(lead.partner_age?.toString() ?? "");
        setPartnerGender(
          lead.partner_gender === "male" ? "Male"
          : lead.partner_gender === "female" ? "Female"
          : ""
        );
        setSource(lead.source ?? "");
        setSubSource(lead.sub_source ?? "");
        setAssignee(lead.assigned_to_id?.toString() ?? "");
        setNextType(lead.next_action_type ?? "");
        setNextStatus(lead.next_action_status ?? "");
        setNextDesc(lead.next_action_description ?? "");

        // Step 2
        setTreatmentInterest(lead.treatment_interest ?? "");
        if (lead.treatment_interest) {
          setTreatments(lead.treatment_interest.split(",").map((t) => t.trim()));
        }

        // Step 3
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

  // ====================== Filter Personnel by Department ======================
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
  const handleSave = async () => {
    if (!leadData || !id || saving) return;

    const resolvedStatus = isNextActionStatus(nextStatus) ? nextStatus : null;

    // Fields that exist in the API payload but are absent from the generated LeadPayload type.
    // Spread them separately with a minimal cast so the rest of updateData stays fully typed.
    const extraFields = {
      gender: gender ? (gender.toLowerCase() as "male" | "female" | "other") : null,
      language_preference: language || "",
    };

    const updateData: Partial<LeadPayload> = {
      clinic_id: clinicId,
      department_id: intOrFallback(department, 1),
      full_name: fullName.trim(),
      contact_no: contactNo.trim(),
      email: strOrNull(email),
      age: intOrNull(age),
      marital_status: marital ? (marital.toLowerCase() as "single" | "married") : null,
      location: location || "",
      address: address || "",
      partner_inquiry: isCouple === "yes",
      partner_full_name: partnerName || "",
      partner_age: intOrNull(partnerAge),
      partner_gender: partnerGender ? (partnerGender.toLowerCase() as "male" | "female") : null,
      source,
      sub_source: subSource || "",
      assigned_to_id: intOrNull(assignee),
      next_action_type: nextType || undefined,
      next_action_status: resolvedStatus,
      next_action_description: nextDesc || "",
      treatment_interest: treatments.length > 0 ? treatments.join(",") : treatmentInterest,
      book_appointment: wantAppointment === "yes",
      appointment_date: appointmentDate,
      slot,
      remark: remark || "",
      ...extraFields,
    } as Partial<LeadPayload>;

    setSaving(true);
    setShowSuccess(true);
    setTimeout(() => navigate("/leads", { replace: true }), 800);

    LeadAPI.update(id, updateData)
      .then(() => dispatch(fetchLeads()))
      .catch((err: unknown) => {
        console.error("❌ Lead update failed:", err instanceof Error ? err.message : err);
      });
  };

  return {
    // navigation
    navigate,
    // UI state
    currentStep, setCurrentStep,
    showSuccess,
    loading,
    error, setError,
    saving,
    // lookup data
    departments,
    employees,
    filteredPersonnel,
    loadingDepartments,
    loadingEmployees,
    employeeError, setEmployeeError,
    // lead meta
    leadData,
    // step 1
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
    campaign, setCampaign,
    assignee, setAssignee,
    nextType,
    nextStatus, setNextStatus,
    nextDesc, setNextDesc,
    availableTaskStatuses,
    handleNextTypeChange,
    // step 2
    treatmentInterest, setTreatmentInterest,
    treatments, setTreatments,
    // step 3
    wantAppointment, setWantAppointment,
    department, setDepartment,
    selectedDate,
    handleDateChange,
    slot, setSlot,
    remark, setRemark,
    // actions
    handleSave,
  };
}