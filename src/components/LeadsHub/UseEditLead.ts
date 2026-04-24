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
import { authApi } from "../../services/auth.api";
import {
  pipelineApi,
  isActiveStageStatus,
  type Pipeline,
  type PipelineStage,
} from "../../services/pipeline.api";
import { fetchLeads } from "../../store/leadSlice";
import { selectCampaign } from "../../store/campaignSlice";
import { selectUser } from "../../store/authSlice";
import { selectClinic } from "../../store/clinicSlice";
import type { Lead, LeadPayload, Department, Employee } from "../../services/leads.api";
import type { AppDispatch } from "../../store";
import type { NextActionStatus } from "../../types/leads.types";
import { TASK_TYPES, TASK_STATUS_FOR_TYPE } from "./LeadTaskConfig";
import {
  hasAnySubcategoryActionPermission,
  resolveUserRole,
} from "../../utils/roleAccess";
import { fetchReferralDepartments } from "../../services/referral.api";
import type { ReferralDepartment } from "../../services/referral.api";

// ====================== App-type config import ======================
import {
  IS_MEDICAL_APP,
  IS_CONTRACTS_APP,
  ACTIVE_FLOW_COPY,
} from "../../config/appType";

const STORAGE_KEY_SELECTED_INDUSTRY = "leads_selected_industry";
const STORAGE_KEY_SELECTED_PIPELINE = "leads_selected_pipeline_id";

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

export type NextActionStatusOption = { label: string; value: string };

type AssigneeOption = {
  id: number;
  first_name: string | undefined;
  last_name: string | undefined;
  username: string | undefined;
  role: string | undefined;
  designation: string | undefined;
  email: string | undefined;
};

const assigneeOptionLabel = (option: AssigneeOption): string => {
  const fullName = `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  const secondary = option.role || option.designation;
  return secondary ? `${primary} (${secondary})` : primary;
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
        first_name: typeof record.first_name === "string" ? record.first_name : undefined,
        last_name: typeof record.last_name === "string" ? record.last_name : undefined,
        username: typeof record.username === "string" ? record.username : undefined,
        role: typeof record.role === "string" ? record.role : undefined,
        designation: typeof record.designation === "string" ? record.designation : undefined,
        email: typeof record.email === "string" ? record.email : undefined,
      };
    })
    .filter((item): item is AssigneeOption => item !== null);
};

export const personnelOptionLabel = (option: AssigneeOption): string =>
  assigneeOptionLabel(option);

// ====================== Helpers ======================
export const strOrNull = (val: string | undefined | null): string | null =>
  val && val.trim() !== "" ? val.trim() : null;

export const intOrNull = (val: string | undefined | null): number | null => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) ? n : null;
};

export const intOrFallback = (
  val: string | undefined | null,
  fallback: number,
): number => {
  const n = Number(val);
  return val && val.trim() !== "" && !isNaN(n) && n > 0 ? n : fallback;
};

export const isNextActionStatus = (v: string): v is NextActionStatus =>
  v === "pending" || v === "completed";

export const formatLeadId = (
  id: string | number | null | undefined,
): string => {
  const safeId = id == null ? "" : String(id);
  if (!safeId) return "#LN-000";
  if (safeId.match(/^#?LN-\d+$/i))
    return safeId.startsWith("#") ? safeId : `#${safeId}`;
  const lnMatch = safeId.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = safeId.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = safeId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

// ====================== Stepper labels ======================
export const STEPS = [
  ACTIVE_FLOW_COPY.step1,
  ACTIVE_FLOW_COPY.step2,
  ACTIVE_FLOW_COPY.step3,
] as const;
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

// ====================== Pipeline action-type helpers (mirrors AddNewLead) ======================

/** Action type labels from a single stage's enabled rules */
const deriveActionTypeOptions = (stage: PipelineStage): string[] => {
  const labels = stage.rules
    .filter((r) => r.is_enabled)
    .map((r) =>
      r.custom_label?.trim() ? r.custom_label.trim() : r.action_type,
    );
  return labels.length > 0 ? labels : [...TASK_TYPES];
};

/** Union of action type labels across all stages */
const deriveAllActionTypeOptions = (stages: PipelineStage[]): string[] => {
  const labels = Array.from(
    new Set(
      stages.flatMap((s) =>
        s.rules
          .filter((r) => r.is_enabled)
          .map((r) =>
            r.custom_label?.trim() ? r.custom_label.trim() : r.action_type,
          ),
      ),
    ),
  );
  return labels.length > 0 ? labels : [...TASK_TYPES];
};

// ====================== Helper ======================
const isTruthy = (val: unknown): boolean =>
  val === true || val === 1 || val === "1" || val === "true";

const capitalizeFirst = (value: string) =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

// ====================== Hook ======================
export function useEditLead() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector(selectUser) as Record<string, unknown> | null;
  const selectedClinic = useSelector(selectClinic);
  const role = resolveUserRole(authUser);
  const nestedAuthUser =
    authUser?.user && typeof authUser.user === "object"
      ? (authUser.user as Record<string, unknown>)
      : null;
  const permissions = authUser?.permissions ?? nestedAuthUser?.permissions;
  const canEditLeads =
    role === "super_admin" ||
    hasAnySubcategoryActionPermission(permissions, ["leads hub"], "edit");

  // ── Campaigns from Redux store ──
  const rawCampaigns = useSelector(selectCampaign);
  const campaigns = React.useMemo<CampaignOption[]>(
    () =>
      (rawCampaigns || []).map((api: RawCampaign) => ({
        id: api.id,
        name: capitalizeFirst(api.campaign_name ?? ""),
        source: api.campaign_mode === 1 ? "Social Media" : "Email",
        subSource:
          api.campaign_mode === 1
            ? (api.social_media?.[0]?.platform_name ?? "")
            : "Gmail",
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

  // ── Referral departments ──
  const [referralDepartments, setReferralDepartments] = React.useState<ReferralDepartment[]>([]);
  const [loadingReferralDepts, setLoadingReferralDepts] = React.useState(false);

  // ── Pipeline / stage state — now stores full PipelineStage objects ──
  const [pipelineStages, setPipelineStages] = React.useState<PipelineStage[]>([]);
  const [selectedNextActionStageId, setSelectedNextActionStageId] =
    React.useState<string | null>(null);

  // ── Next action type options — derived from pipeline rules ──
  const [nextActionTypeOptions, setNextActionTypeOptions] = React.useState<string[]>([
    ...TASK_TYPES,
  ]);

  // Lead meta
  const [leadData, setLeadData] = React.useState<Lead | null>(null);
  const [clinicId, setClinicId] = React.useState<number>(
    selectedClinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 1),
  );
  const [leadDepartmentId, setLeadDepartmentId] = React.useState<number | null>(null);

  // ── Step 1: shared fields ──
  const [fullName, setFullName] = React.useState("");
  const [contactNo, setContactNo] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [source, setSource] = React.useState("");
  const [subSource, setSubSource] = React.useState("");
  const [campaign, setCampaignId] = React.useState<string | number>("");
  const [assignee, setAssignee] = React.useState("");
  const [assigneeName, setAssigneeName] = React.useState("");
  const [assigneeSearch, setAssigneeSearch] = React.useState("");
  const [assigneeOptions, setAssigneeOptions] = React.useState<AssigneeOption[]>([]);
  const [assigneeLoading, setAssigneeLoading] = React.useState(false);
  const [leadGeneratedBySearch, setLeadGeneratedBySearch] = React.useState("");
  const [leadGeneratedByOptions, setLeadGeneratedByOptions] = React.useState<AssigneeOption[]>([]);
  const [leadGeneratedByLoading, setLeadGeneratedByLoading] = React.useState(false);
  const [nextType, setNextType] = React.useState("");
  const [nextStatus, setNextStatus] = React.useState("");
  const [nextDesc, setNextDesc] = React.useState("");

  // ── Lead Status (pipeline stage) ──
  const [leadStatus, setLeadStatus] = React.useState("");

  // ── Referral Department ──
  const [referralDepartment, setReferralDepartment] = React.useState("");

  // ── Step 1: MEDICAL-only fields ──
  const [gender, setGender] = React.useState("");
  const [age, setAge] = React.useState("");
  const [marital, setMarital] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [partnerName, setPartnerName] = React.useState("");
  const [partnerAge, setPartnerAge] = React.useState("");
  const [partnerGender, setPartnerGender] = React.useState("");

  // ── Step 1: CONTRACTS-only fields ──
  const [contactPersonName, setContactPersonName] = React.useState("");
  const [designation, setDesignation] = React.useState("");
  const [contactPersonPhone, setContactPersonPhone] = React.useState("");
  const [contactPersonEmail, setContactPersonEmail] = React.useState("");
  const [leadGeneratedBy, setLeadGeneratedBy] = React.useState("");
  const [leadGeneratedById, setLeadGeneratedById] = React.useState("");

  // Step 2
  const [treatmentInterest, setTreatmentInterest] = React.useState("");
  const [treatments, setTreatments] = React.useState<string[]>([]);
  const [documents, setDocuments] = React.useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = React.useState<ExistingDocument[]>([]);
  const initialExistingDocuments = React.useRef<ExistingDocument[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);

  // Step 3
  const [wantAppointment, setWantAppointment] = React.useState<"yes" | "no">("no");
  const [department, setDepartment] = React.useState("");
  const [appointmentPersonnel, setAppointmentPersonnel] = React.useState("");
  const [appointmentPersonnelSearch, setAppointmentPersonnelSearch] = React.useState("");
  const [appointmentPersonnelOptions, setAppointmentPersonnelOptions] = React.useState<AssigneeOption[]>([]);
  const [appointmentPersonnelLoading, setAppointmentPersonnelLoading] = React.useState(false);
  const [appointmentDate, setAppointmentDate] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);
  const [slot, setSlot] = React.useState("");
  const [remark, setRemark] = React.useState("");

  // ── Pipeline derived options ──────────────────────────────────────────────
  // Lead status dropdown: all active stages in order
  const leadStatusOptions = React.useMemo<NextActionStatusOption[]>(
    () =>
      pipelineStages.map((s) => ({
        label: s.stage_name.trim(),
        value: s.stage_name.trim(),
      })),
    [pipelineStages],
  );

  // Next action status: only stages with a higher stage_order than the selected lead status
  const filteredNextActionStatusOptions = React.useMemo<NextActionStatusOption[]>(() => {
    if (!leadStatus) {
      return pipelineStages.map((s) => ({
        label: s.stage_name.trim(),
        value: s.stage_name.trim(),
      }));
    }

    const currentStage = pipelineStages.find(
      (s) =>
        s.stage_name.trim().toLowerCase() === leadStatus.trim().toLowerCase(),
    );

    if (!currentStage) {
      return pipelineStages.map((s) => ({
        label: s.stage_name.trim(),
        value: s.stage_name.trim(),
      }));
    }

    return pipelineStages
      .filter((s) => s.stage_order > currentStage.stage_order)
      .map((s) => ({ label: s.stage_name.trim(), value: s.stage_name.trim() }));
  }, [pipelineStages, leadStatus]);

  // ── Auto-clear nextType if it's no longer valid for the selected stage ─────
  React.useEffect(() => {
    if (!nextType) return;
    if (nextActionTypeOptions.includes(nextType)) return;
    setNextType("");
  }, [nextType, nextActionTypeOptions]);

  // ── Auto-fill source & subSource when campaign changes ──
  React.useEffect(() => {
    if (!campaign) return;
    const matched = campaigns.find((c) => String(c.id) === String(campaign));
    if (!matched) return;
    setSource(matched.source);
    setSubSource(matched.subSource);
  }, [campaign, campaigns]);

  // ── Legacy availableTaskStatuses (kept for backward compat) ──
  const availableTaskStatuses = React.useMemo<{ label: string; value: string }[]>(
    () => {
      if (!nextType)
        return [
          { label: "To Do", value: "pending" },
          { label: "Done", value: "completed" },
        ];
      return (
        TASK_STATUS_FOR_TYPE[nextType] ?? [
          { label: "To Do", value: "pending" },
          { label: "Done", value: "completed" },
        ]
      );
    },
    [nextType],
  );

  // ====================== Pipeline effect (mirrors AddNewLead exactly) ======================
  React.useEffect(() => {
    const loadFromPipeline = async () => {
      const selectedIndustry =
        localStorage.getItem(STORAGE_KEY_SELECTED_INDUSTRY) ?? "";
      const selectedPipelineId =
        localStorage.getItem(STORAGE_KEY_SELECTED_PIPELINE) ?? "";

      try {
        let selectedPipeline: Pipeline | null = null;

        if (selectedPipelineId) {
          try {
            selectedPipeline = await pipelineApi.getById(selectedPipelineId);
          } catch {
            selectedPipeline = null;
          }
        }

        if (!selectedPipeline) {
          const pipelines = await pipelineApi.list(clinicId);
          const byIndustry = selectedIndustry
            ? pipelines.filter((p) => p.industry_type === selectedIndustry)
            : pipelines;

          selectedPipeline =
            pipelines.find((p) => p.id === selectedPipelineId) ??
            byIndustry.find((p) => p.is_active) ??
            byIndustry[0] ??
            pipelines.find((p) => p.is_active) ??
            pipelines[0] ??
            null;
        }

        const rawStages = selectedPipeline?.stages ?? [];
        const activeStages = rawStages
          .filter((s) => isActiveStageStatus(s.stage_status))
          .filter((s) => s.stage_name.trim())
          .sort((a, b) => {
            const aOrder = typeof a.stage_order === "number" ? a.stage_order : 0;
            const bOrder = typeof b.stage_order === "number" ? b.stage_order : 0;
            if (aOrder === bOrder) return 0;
            return aOrder - bOrder;
          });

        // Store full PipelineStage objects (rules are needed for action type derivation)
        setPipelineStages(activeStages);

        // Initial action type options = union across all active stages
        setNextActionTypeOptions(deriveAllActionTypeOptions(activeStages));
      } catch {
        // No pipeline configured — fall back to the static task type list
        setPipelineStages([]);
        setNextActionTypeOptions([...TASK_TYPES]);
      }
    };

    void loadFromPipeline();
  }, [clinicId]);

  // ── Fetch Referral Departments ──
  React.useEffect(() => {
    const load = async () => {
      try {
        setLoadingReferralDepts(true);
        const data = await fetchReferralDepartments(clinicId);
        setReferralDepartments(data);
      } catch {
        setReferralDepartments([]);
      } finally {
        setLoadingReferralDepts(false);
      }
    };
    load();
  }, [clinicId]);

  // ====================== Handlers ======================

  /**
   * Lead Status Change — mirrors AddNewLead exactly:
   * 1. Derives action type options from the selected stage's enabled rules.
   * 2. Auto-populates Next Action Status with the first stage after the
   *    selected lead status (by stage_order).
   * 3. Clears nextType so the user picks one valid for the new stage.
   */
  const handleLeadStatusChange = (value: string) => {
    const trimmed = value.trim();

    const matched = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    setSelectedNextActionStageId(matched?.id ?? null);

    // Action type options from the selected stage's enabled rules;
    // fall back to union across all stages when no stage is matched.
    const stageActionOptions = matched
      ? deriveActionTypeOptions(matched)
      : deriveAllActionTypeOptions(pipelineStages);
    setNextActionTypeOptions(stageActionOptions);

    // Auto-populate Next Action Status with the first stage after the selected
    // lead status (by stage_order). Clear when no valid lead status selected.
    const nextStages = pipelineStages
      .filter((s) => (matched ? s.stage_order > matched.stage_order : true))
      .sort((a, b) => a.stage_order - b.stage_order);

    const autoNextStatus =
      trimmed && nextStages[0] ? nextStages[0].stage_name.trim() : "";

    setLeadStatus(trimmed);
    setNextStatus(autoNextStatus);
    setNextType(""); // clear stale next type when lead status changes
  };

  /**
   * Next Action Type Change — accepts a plain string value (not an event),
   * matching the signature expected by EditLead.tsx's TextField onChange handler.
   * The caller in EditLead.tsx passes `e.target.value` directly.
   */
  const handleNextTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNextType(e.target.value);
  };

  const handleNextStatusChange = (value: string) => setNextStatus(value);

  const handleReferralDepartmentChange = (value: string) =>
    setReferralDepartment(value);

  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCampaignId(e.target.value);
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
    setSubSource("");
    setCampaignId("");
  };

  const handleSubSourceChange = (value: string) => {
    setSubSource(value);
    setCampaignId("");
  };

  const handleDateChange = (d: Date | Dayjs | null) => {
    const nextDate = d ? dayjs(d) : null;
    setSelectedDate(nextDate);
    if (nextDate) setAppointmentDate(nextDate.format("YYYY-MM-DD"));
  };

  const handleWantAppointmentChange = React.useCallback(
    (value: "yes" | "no") => {
      if (value !== "yes" && value !== "no") return;
      setWantAppointment(value);
      if (value === "no") {
        setDepartment("");
        setAppointmentPersonnel("");
        setAppointmentPersonnelSearch("");
        setAppointmentDate("");
        setSelectedDate(null);
        setSlot("");
        setRemark("");
      }
    },
    [],
  );

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

  const handleRemoveDocument = (index: number) =>
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  const handleRemoveExistingDocument = (index: number) =>
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));

  // ====================== Fetch Lead ======================
  React.useEffect(() => {
    if (!id) {
      setError("No lead ID provided");
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const lead = (await LeadAPI.getById(id)) as LeadResponse;
        setLeadData(lead as unknown as Lead);

        const resolvedClinicId =
          lead.clinic_id ??
          selectedClinic?.id ??
          Number(localStorage.getItem("clinic_id") ?? 1);
        setClinicId(resolvedClinicId);

        const origDeptId = lead.department_id ?? null;
        setLeadDepartmentId(
          typeof origDeptId === "number" ? origDeptId : null,
        );

        // ── Shared fields ──
        setFullName(lead.full_name ?? "");
        setContactNo(lead.contact_no ?? "");
        setEmail(lead.email ?? "");
        setLocation(lead.location ?? "");
        setAddress(lead.address ?? "");
        setSource(lead.source ?? "");
        setSubSource(lead.sub_source ?? "");

        const campaignId = (
          lead as unknown as { campaign_id?: string | number }
        ).campaign_id;
        if (campaignId) setCampaignId(String(campaignId));

        setAssignee(lead.assigned_to_id?.toString() ?? "");
        setAssigneeName(lead.assigned_to_name ?? "");
        setNextType(lead.next_action_type ?? "");
        setNextStatus(lead.next_action_status ?? "");
        setNextDesc(lead.next_action_description ?? "");

        // ── Lead Status (pipeline stage) ──
        const anyLead = lead as unknown as Record<string, unknown>;
        const rawLeadStatus =
          (anyLead.lead_status as string) ??
          (anyLead.stage_name as string) ??
          "";
        setLeadStatus(rawLeadStatus);

        // ── Referral Department ──
        const rawReferralDept = anyLead.referral_department_id;
        if (rawReferralDept != null)
          setReferralDepartment(String(rawReferralDept));

        // ── MEDICAL-only fields ──
        if (IS_MEDICAL_APP) {
          setGender(
            lead.gender === "male"
              ? "Male"
              : lead.gender === "female"
                ? "Female"
                : "",
          );
          setAge(lead.age?.toString() ?? "");
          setMarital(
            lead.marital_status === "married"
              ? "Married"
              : lead.marital_status === "single"
                ? "Single"
                : "",
          );
          setLanguage(lead.language_preference ?? "");
          setIsCouple(lead.partner_inquiry ? "yes" : "no");
          setPartnerName(lead.partner_full_name ?? "");
          setPartnerAge(lead.partner_age?.toString() ?? "");
          setPartnerGender(
            lead.partner_gender === "male"
              ? "Male"
              : lead.partner_gender === "female"
                ? "Female"
                : "",
          );
        }

        // ── CONTRACTS-only fields ──
        if (IS_CONTRACTS_APP) {
          setContactPersonName(
            (anyLead.contact_person_name as string) ?? "",
          );
          setDesignation((anyLead.designation as string) ?? "");
          setContactPersonPhone(
            (anyLead.contact_person_phone as string) ?? "",
          );
          setContactPersonEmail(
            (anyLead.contact_person_email as string) ?? "",
          );
          setLeadGeneratedBy(
            ((anyLead.lead_generated_by as string) ??
              (anyLead.personal_name as string) ??
              "") as string,
          );
          setLeadGeneratedById(
            (
              (anyLead.personal_id as number | string | undefined)?.toString() ??
              ""
            ) as string,
          );
        }

        setTreatmentInterest(lead.treatment_interest ?? "");
        if (lead.treatment_interest) {
          setTreatments(
            lead.treatment_interest.split(",").map((t) => t.trim()),
          );
        }

        const hasBooking = isTruthy(lead.book_appointment);
        setWantAppointment(hasBooking ? "yes" : "no");

        if (hasBooking) {
          if (IS_MEDICAL_APP)
            setDepartment(lead.department_id?.toString() ?? "");
          const personnelId = anyLead.personal_id as number | undefined;
          setAppointmentPersonnel(personnelId?.toString() ?? "");
          setAppointmentPersonnelSearch(
            (anyLead.personal_name as string) ?? "",
          );
          setAppointmentDate(lead.appointment_date ?? "");
          if (lead.appointment_date)
            setSelectedDate(dayjs(lead.appointment_date));
          setSlot(lead.slot ?? "");
          setRemark(lead.remark ?? "");
        }

        // ── Existing documents ──
        const embeddedDocs = (
          lead as unknown as { documents?: unknown[] }
        ).documents;
        if (Array.isArray(embeddedDocs) && embeddedDocs.length > 0) {
          const normalized = embeddedDocs.map((d) =>
            normalizeDocument(
              d as Parameters<typeof normalizeDocument>[0],
            ),
          );
          setExistingDocuments(normalized);
          initialExistingDocuments.current = normalized;
        } else {
          try {
            setDocsLoading(true);
            const rawDocs = await LeadAPI.getDocuments(id);
            if (Array.isArray(rawDocs) && rawDocs.length > 0) {
              setExistingDocuments(
                rawDocs.map((d) =>
                  normalizeDocument(
                    d as Parameters<typeof normalizeDocument>[0],
                  ),
                ),
              );
            }
          } catch {
            /* silently ignore */
          } finally {
            setDocsLoading(false);
          }
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load lead",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, selectedClinic?.id]);

  // ====================== Fetch Departments ======================
  React.useEffect(() => {
    if (!clinicId) return;
    const load = async () => {
      try {
        setLoadingDepartments(true);
        setDepartments(await DepartmentAPI.listActiveByClinic(clinicId));
      } catch (err: unknown) {
        console.error(
          "Failed to load departments:",
          err instanceof Error ? err.message : err,
        );
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
        setEmployeeError(
          err instanceof Error ? err.message : "Failed to load employees",
        );
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    load();
  }, [clinicId]);

  // ── Assignee search ──
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

  // ── Lead Generated By search ──
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

  // ── Appointment personnel search ──
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (
        wantAppointment !== "yes" ||
        !appointmentPersonnelSearch.trim()
      ) {
        setAppointmentPersonnelOptions([]);
        return;
      }
      try {
        setAppointmentPersonnelLoading(true);
        const response = await authApi.searchUsers({
          search: appointmentPersonnelSearch,
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
  }, [appointmentPersonnelSearch, wantAppointment]);

  const selectedAppointmentPersonnel = React.useMemo(() => {
    const selectedId = Number(appointmentPersonnel);
    if (Number.isFinite(selectedId)) {
      const matched = appointmentPersonnelOptions.find(
        (o) => o.id === selectedId,
      );
      if (matched) return matched;
    }
    if (!appointmentPersonnelSearch.trim()) return null;
    return {
      id: Number.isFinite(Number(appointmentPersonnel))
        ? Number(appointmentPersonnel)
        : 0,
      first_name: undefined,
      last_name: undefined,
      username: appointmentPersonnelSearch,
      role: undefined,
      designation: undefined,
      email: undefined,
    } satisfies AssigneeOption;
  }, [
    appointmentPersonnel,
    appointmentPersonnelOptions,
    appointmentPersonnelSearch,
  ]);

  // ── Filter Personnel by Department ──
  React.useEffect(() => {
    if (!department || employees.length === 0) {
      setFilteredPersonnel([]);
      return;
    }
    const selectedDept = departments.find(
      (d) => d.id === Number(department),
    );
    if (!selectedDept) {
      setFilteredPersonnel([]);
      return;
    }
    const normalize = (s: string) =>
      (s ?? "").trim().toLowerCase().normalize("NFC");
    setFilteredPersonnel(
      employees.filter(
        (emp) => normalize(emp.department_name) === normalize(selectedDept.name),
      ),
    );
  }, [department, employees, departments]);

  // ====================== Save ======================
  const handleSave = () => {
    if (!leadData || !id || saving) return;

    if (!canEditLeads) {
      const msg = "You do not have permission to edit leads.";
      setError(msg);
      toast.error(msg, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    const bookingActive = wantAppointment === "yes";

    if (bookingActive) {
      if (IS_MEDICAL_APP && !department) {
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

    const resolvedStatus = nextStatus || null;
    const resolvedDeptId: number =
      leadDepartmentId ?? leadData.department_id ?? clinicId;
    const coupleActive = IS_MEDICAL_APP && isCouple === "yes";
    const matchedGeneratedByOption = leadGeneratedByOptions.find(
      (option) => assigneeOptionLabel(option) === leadGeneratedBy,
    );
    const resolvedGeneratedById =
      intOrNull(leadGeneratedById) ??
      matchedGeneratedByOption?.id ??
      null;
    const referralDeptId = intOrNull(referralDepartment);

    const updateData = {
      clinic_id: clinicId,
      department_id: resolvedDeptId,
      stage_id: selectedNextActionStageId || null,
      full_name: fullName.trim(),
      contact_no: contactNo.trim(),
      email: strOrNull(email),
      location: location || "",
      address: address || "",
      source,
      sub_source: subSource || "",
      campaign_id: campaign ? String(campaign) : null,
      assigned_to_id: intOrNull(assignee),
      assigned_to_name: assigneeName.trim() || null,
      next_action_type: nextType || undefined,
      next_action_status: resolvedStatus,
      next_action_description: nextDesc || "",
      ...(leadStatus
        ? { lead_status: leadStatus as LeadPayload["lead_status"] }
        : {}),
      treatment_interest:
        treatments.length > 0
          ? treatments.join(",")
          : treatmentInterest || "",
      is_active: leadData?.is_active !== false,
      book_appointment: bookingActive,
      referral_department_id: referralDeptId ?? null,

      ...(IS_MEDICAL_APP
        ? {
            age: intOrNull(age),
            marital_status: marital
              ? (marital.toLowerCase() as "single" | "married")
              : null,
            gender: gender
              ? (gender.toLowerCase() as "male" | "female" | "other")
              : null,
            language_preference: language || "",
            partner_inquiry: coupleActive,
            partner_full_name: coupleActive ? partnerName || "" : "",
            partner_age: coupleActive ? intOrNull(partnerAge) : null,
            partner_gender:
              coupleActive && partnerGender
                ? (partnerGender.toLowerCase() as "male" | "female")
                : null,
          }
        : {}),

      ...(IS_CONTRACTS_APP
        ? {
            contact_person_name: contactPersonName || "",
            designation: designation || "",
            contact_person_phone: contactPersonPhone || "",
            contact_person_email: contactPersonEmail || "",
            lead_generated_by: leadGeneratedBy || "",
            personal_id: resolvedGeneratedById,
            personal_name: leadGeneratedBy || null,
          }
        : {}),

      ...(bookingActive
        ? {
            appointment_date: appointmentDate,
            slot,
            remark: remark || "",
            ...(IS_MEDICAL_APP
              ? {
                  personal_id: appointmentPersonnel
                    ? intOrNull(appointmentPersonnel)
                    : null,
                }
              : {}),
          }
        : {
            appointment_date: undefined,
            slot: undefined,
            remark: "",
            ...(IS_MEDICAL_APP ? { personal_id: null } : {}),
          }),
    };

    setShowSuccess(true);
    setSaving(true);

    const doSave = async () => {
      if (documents.length > 0) {
        await LeadAPI.updateWithDocuments(
          id,
          updateData as LeadPayload,
          documents,
        );
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
          dispatch(
            fetchLeads() as unknown as Parameters<typeof dispatch>[0],
          );
        }, 800);
      })
      .catch((err: unknown) => {
        let msg = "Failed to save lead";
        if (err instanceof Error) msg = err.message;
        const anyErr = err as {
          response?: {
            data?: { detail?: string; message?: string };
          };
          detail?: string;
        };
        if (anyErr?.response?.data?.detail)
          msg = anyErr.response.data.detail;
        else if (anyErr?.response?.data?.message)
          msg = anyErr.response.data.message;
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
    currentStep,
    setCurrentStep,
    loading,
    error,
    setError,
    saving,
    canEditLeads,
    showSuccess,
    campaigns,
    departments,
    employees,
    filteredPersonnel,
    loadingDepartments,
    loadingEmployees,
    employeeError,
    setEmployeeError,
    leadData,
    // ── Pipeline / stage ──
    leadStatusOptions,
    filteredNextActionStatusOptions,
    nextActionTypeOptions,
    leadStatus,
    handleLeadStatusChange,
    handleNextStatusChange,
    handleSourceChange,
    handleSubSourceChange,
    handleReferralDepartmentChange,
    referralDepartments,
    loadingReferralDepts,
    referralDepartment,
    // ── Shared fields ──
    fullName,
    setFullName,
    contactNo,
    setContactNo,
    email,
    setEmail,
    location,
    setLocation,
    address,
    setAddress,
    source,
    setSource,
    subSource,
    setSubSource,
    campaign,
    handleCampaignChange,
    assignee,
    setAssignee,
    assigneeName,
    setAssigneeName,
    assigneeSearch,
    setAssigneeSearch,
    assigneeOptions,
    assigneeLoading,
    nextType,
    nextStatus,
    setNextStatus,
    nextDesc,
    setNextDesc,
    availableTaskStatuses,
    handleNextTypeChange,
    // ── Medical-only fields ──
    gender,
    setGender,
    age,
    setAge,
    marital,
    setMarital,
    language,
    setLanguage,
    isCouple,
    setIsCouple,
    partnerName,
    setPartnerName,
    partnerAge,
    setPartnerAge,
    partnerGender,
    setPartnerGender,
    // ── Contracts-only fields ──
    contactPersonName,
    setContactPersonName,
    designation,
    setDesignation,
    contactPersonPhone,
    setContactPersonPhone,
    contactPersonEmail,
    setContactPersonEmail,
    leadGeneratedBy,
    setLeadGeneratedBy,
    leadGeneratedById,
    setLeadGeneratedById,
    leadGeneratedBySearch,
    setLeadGeneratedBySearch,
    leadGeneratedByOptions,
    leadGeneratedByLoading,
    // ── Step 2 ──
    treatmentInterest,
    setTreatmentInterest,
    treatments,
    setTreatments,
    documents,
    handleFileChange,
    handleRemoveDocument,
    existingDocuments,
    docsLoading,
    handleRemoveExistingDocument,
    // ── Step 3 ──
    wantAppointment,
    department,
    setDepartment,
    appointmentPersonnel,
    setAppointmentPersonnel,
    appointmentPersonnelSearch,
    setAppointmentPersonnelSearch,
    appointmentPersonnelOptions,
    appointmentPersonnelLoading,
    selectedAppointmentPersonnel,
    personnelOptionLabel,
    selectedDate,
    handleDateChange,
    slot,
    setSlot,
    remark,
    setRemark,
    handleSave,
    handleWantAppointmentChange,
    // ── App-type flags ──
    IS_MEDICAL_APP,
    IS_CONTRACTS_APP,
    ACTIVE_FLOW_COPY,
  };
}