/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// useEditLead.ts  –  State, effects, handlers & helpers
// Consumed by EditLead.tsx (pure JSX layer)
// ============================================================
import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { LeadAPI, DepartmentAPI, EmployeeAPI, InterestAPI, LeadEmailAPI } from "../../services/leads.api";
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
import type {
  Lead,
  LeadPayload,
  Department,
  Employee,
} from "../../services/leads.api";
import type { AppDispatch, RootState } from "../../store";
import { TASK_TYPES, TASK_STATUS_FOR_TYPE } from "./LeadTaskConfig";
import {
  hasAnySubcategoryActionPermission,
  resolveUserRole,
} from "../../utils/roleAccess";
import { fetchReferralDepartments } from "../../services/referral.api";
import type { ReferralDepartment } from "../../services/referral.api";

import {
  IS_MEDICAL_APP,
  IS_CONTRACTS_APP,
  ACTIVE_FLOW_COPY,
} from "../../config/appType";
import { capitalizeFirst } from "../../utils/nameValidation";
import type { Interest } from "../../types/leads.types";

const STORAGE_KEY_SELECTED_INDUSTRY = "leads_selected_industry";
const STORAGE_KEY_SELECTED_PIPELINE = "leads_selected_pipeline_id";
const STORAGE_KEY_DEFAULT_PIPELINE = "leads_default_pipeline_id";

// ====================== Extended Lead type ======================
export interface LeadResponse extends Omit<Lead, "gender"> {
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
  const fullName =
    `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  return primary;
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
      : Array.isArray((root?.data as any)?.objects)
        ? ((root?.data as any).objects as unknown[])
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
          typeof record.designation === "string"
            ? record.designation
            : undefined,
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
  if (file.type.startsWith("image/"))
    return file.type.split("/")[1].toUpperCase();
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

const normalizeUsersList = (users: any[]): AssigneeOption[] => {
  return users.map((u) => ({
    id: u.id,
    first_name: u.first_name ?? u.firstName,
    last_name: u.last_name ?? u.lastName,
    username: u.username,
    role: u.role?.name || u.role,
    designation: undefined,
    email: u.email,
  }));
};

// ====================== Pipeline action-type helpers ======================

const deriveActionTypeOptions = (stage: PipelineStage): string[] => {
  const labels = stage.rules
    .filter((r) => r.is_enabled)
    .map((r) =>
      r.custom_label?.trim() ? r.custom_label.trim() : r.action_type,
    );
  return labels.length > 0 ? labels : [...TASK_TYPES];
};

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

// ====================== Task Status Options ======================
export const TASK_STATUS_OPTIONS = [
  { label: "To-do", value: "to_do" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
] as const;

export type TaskStatusValue = "to_do" | "in_progress" | "completed";

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

  const rawCampaigns = useSelector(selectCampaign);
  const campaigns = React.useMemo<CampaignOption[]>(
    () =>
      (rawCampaigns || []).flatMap((api: RawCampaign) => {
        const isEmail = api.campaign_mode === 3;
        const base = {
          id: api.id,
          name: capitalizeFirst(api.campaign_name ?? ""),
          source: isEmail ? "Direct" : "Social Media",
          isActive: api.is_active !== false,
        };

        if (isEmail) {
          return [{ ...base, subSource: "Gmail" }];
        }

        const platforms = (api.social_media || [])
          .map((p) => p?.platform_name ?? "")
          .filter((p) => Boolean(p.trim()));

        if (platforms.length === 0) {
          return [{ ...base, subSource: "" }];
        }

        return platforms.map((platform) => ({
          ...base,
          subSource: platform
            .split("_")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" "),
        }));
      }),
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

  // ── Pipeline / stage state ──
  const [pipelineStages, setPipelineStages] = React.useState<PipelineStage[]>([]);
  const [selectedNextActionStageId, setSelectedNextActionStageId] = React.useState<string | null>(null);

  // ── Next action type options ──
  const [nextActionTypeOptions, setNextActionTypeOptions] = React.useState<string[]>([...TASK_TYPES]);

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
  const [campaignName, setCampaignName] = React.useState("");
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

  // ── Task Status (action_status) ── NEW
  const [taskStatus, setTaskStatus] = React.useState("");

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
  const [interests, setInterests] = React.useState<Interest[]>([]);
  const [documents, setDocuments] = React.useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = React.useState<ExistingDocument[]>([]);
  const initialExistingDocuments = React.useRef<ExistingDocument[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  // const [_loadingInterests, setLoadingInterests] = React.useState(false);

  React.useEffect(() => {
    const loadInterests = async () => {
      try {
        // setLoadingInterests(true);

        const data = await InterestAPI.listActiveByClinic(clinicId);

        setInterests(data);
      } catch {
        setInterests([]);
      } finally {
        // setLoadingInterests(false);
      }
    };

    loadInterests();
  }, [clinicId]);

  React.useEffect(() => {
    if (!interests.length || !treatments.length) return;

    const selectedInterestNames = interests
      .filter((interest) => treatments.includes(String(interest.id)))
      .map((interest) => interest.name);

    setTreatmentInterest(selectedInterestNames.join(", "));
  }, [interests, treatments]);

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
  const users = useSelector((state: RootState) => state.users.data);

  const authMode = localStorage.getItem("auth_mode");
  const isInternal = authMode === "INT";

  // ── Pipeline derived options ──────────────────────────────────────────────
  const leadStatusOptions = React.useMemo<NextActionStatusOption[]>(
    () =>
      pipelineStages.map((s) => ({
        label: s.stage_name.trim(),
        value: s.stage_name.trim(),
      })),
    [pipelineStages],
  );

  const filteredNextActionStatusOptions = React.useMemo<NextActionStatusOption[]>(() => {
    if (!leadStatus) {
      return pipelineStages.map((s) => ({
        label: s.stage_name.trim(),
        value: s.stage_name.trim(),
      }));
    }
    const currentStage = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === leadStatus.trim().toLowerCase(),
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

  // ── Auto-clear nextType if no longer valid ─────────────────────────────────
  React.useEffect(() => {
    if (!nextType) return;
    if (nextActionTypeOptions.includes(nextType)) return;
    setNextType("");
  }, [nextType, nextActionTypeOptions]);

  // ── Campaign → source sync ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (!campaign) {
      setCampaignName("");
      return;
    }
    const matched = campaigns.find((c) => String(c.id) === String(campaign));
    if (!matched) return;
    setCampaignName(matched.name);
    setSource(matched.source);
  }, [campaign, campaigns]);

  // ── Legacy availableTaskStatuses ──
  const availableTaskStatuses = React.useMemo<{ label: string; value: string }[]>(() => {
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
  }, [nextType]);

  // ====================== Pipeline effect ======================
  React.useEffect(() => {
    const loadFromPipeline = async () => {
      const selectedIndustry = localStorage.getItem(STORAGE_KEY_SELECTED_INDUSTRY) ?? "";
      const selectedPipelineId =
        localStorage.getItem(STORAGE_KEY_SELECTED_PIPELINE) ??
        localStorage.getItem(STORAGE_KEY_DEFAULT_PIPELINE) ??
        "";
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
        setPipelineStages(activeStages);
        setNextActionTypeOptions(deriveAllActionTypeOptions(activeStages));
      } catch {
        setPipelineStages([]);
        setNextActionTypeOptions([...TASK_TYPES]);
      }
    };
    void loadFromPipeline();
  }, [clinicId]);

  // ── Reconciliation effect ─────────────────────────────────────────────────
  const pipelineStagesLoaded = pipelineStages.length > 0;
  React.useEffect(() => {
    if (!pipelineStagesLoaded) return;
    const nextStage = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === nextStatus.trim().toLowerCase(),
    );
    if (nextStage) {
      setNextActionTypeOptions(deriveActionTypeOptions(nextStage));
      return;
    }
    const leadStage = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === leadStatus.trim().toLowerCase(),
    );
    if (leadStage) {
      const afterStages = pipelineStages
        .filter((s) => s.stage_order > leadStage.stage_order)
        .sort((a, b) => a.stage_order - b.stage_order);
      const firstAfter = afterStages[0];
      setNextActionTypeOptions(
        firstAfter
          ? deriveActionTypeOptions(firstAfter)
          : deriveAllActionTypeOptions(pipelineStages),
      );
    } else {
      setNextActionTypeOptions(deriveAllActionTypeOptions(pipelineStages));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineStagesLoaded]);

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

  const handleLeadStatusChange = (value: string) => {
    const trimmed = value.trim();
    const matched = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    setSelectedNextActionStageId(matched?.id ?? null);
    const nextStages = pipelineStages
      .filter((s) => (matched ? s.stage_order > matched.stage_order : true))
      .sort((a, b) => a.stage_order - b.stage_order);
    const autoNextStatus = trimmed && nextStages[0] ? nextStages[0].stage_name.trim() : "";
    const autoNextStage = nextStages[0] ?? null;
    const stageActionOptions = autoNextStage
      ? deriveActionTypeOptions(autoNextStage)
      : deriveAllActionTypeOptions(pipelineStages);
    setNextActionTypeOptions(stageActionOptions);
    setLeadStatus(trimmed);
    setNextStatus(autoNextStatus);
    setNextType("");
  };

  const handleNextStatusChange = (value: string) => {
    const trimmed = value.trim();
    const matched = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    const stageActionOptions = matched
      ? deriveActionTypeOptions(matched)
      : deriveAllActionTypeOptions(pipelineStages);
    setNextActionTypeOptions(stageActionOptions);
    setNextStatus(trimmed);
    setNextType("");
  };

  const handleNextTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNextType(e.target.value);
  };

  const handleReferralDepartmentChange = (value: string) =>
    setReferralDepartment(value);

  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      setCampaignId("");
      setCampaignName("");
      return;
    }
    const matched = campaigns.find((c) => String(c.id) === String(value));
    if (!matched) {
      setCampaignId(value);
      return;
    }
    setCampaignId(value);
    setCampaignName(matched.name);
    setSource(matched.source);
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
    setSubSource("");
    setCampaignId("");
    setCampaignName("");
  };

  const handleSubSourceChange = (value: string) => {
    setSubSource(value);
    setCampaignId("");
    setCampaignName("");
  };

  const handleDateChange = (d: Date | Dayjs | null) => {
    const nextDate = d ? dayjs(d) : null;
    setSelectedDate(nextDate);
    if (nextDate) setAppointmentDate(nextDate.format("YYYY-MM-DD"));
  };

  const handleWantAppointmentChange = React.useCallback((value: "yes" | "no") => {
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
        setLeadDepartmentId(typeof origDeptId === "number" ? origDeptId : null);

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
        if (campaignId) {
          setCampaignId(String(campaignId));
        }

        setAssignee(lead.assigned_to_id?.toString() ?? "");
        setAssigneeName(lead.assigned_to_name ?? "");
        if (lead.assigned_to_id != null) {
          const assigneeId = Number(lead.assigned_to_id);
          setAssigneeOptions((prev): AssigneeOption[] => {
            const exists = prev.find((o) => o.id === assigneeId);
            if (exists) return prev;
            return [
              {
                id: assigneeId,
                first_name: lead.assigned_to_name?.split(" ")[0],
                last_name: lead.assigned_to_name?.split(" ").slice(1).join(" "),
                username: lead.assigned_to_name,
                role: undefined,
                designation: undefined,
                email: undefined,
              },
              ...prev,
            ];
          });
        }

        setNextType(lead.next_action_type ?? "");
        setNextStatus(lead.next_action_status ?? "");
        setNextDesc(lead.next_action_description ?? "");

        // ── Task Status — load from action_status ── NEW
        const anyLead = lead as unknown as Record<string, unknown>;
        const rawActionStatus = (anyLead.action_status as string) ?? "";
        setTaskStatus(rawActionStatus.trim().toLowerCase());

        // ── Lead Status (pipeline stage) ──
        const rawLeadStatus =
          (anyLead.stage_name as string) ??
          (anyLead.lead_status as string) ??
          "";
        setLeadStatus(rawLeadStatus);

        // ── Referral Department ──
        const rawReferralDept = anyLead.referral_department_id;
        if (rawReferralDept != null)
          setReferralDepartment(String(rawReferralDept));

        setLanguage(lead.language_preference ?? "");

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
          setContactPersonName((anyLead.contact_full_name as string) ?? "");
          setDesignation((anyLead.contact_designation as string) ?? "");
          setContactPersonPhone((anyLead.contact_phone as string) ?? "");
          setContactPersonEmail((anyLead.contact_email as string) ?? "");
          setLeadGeneratedBy(
            (anyLead.lead_generated_by_name as string) ??
              (anyLead.personal_name as string) ??
              "",
          );
          setLeadGeneratedById(
            (anyLead.personal_id as number | string | undefined)?.toString() ??
              "",
          );
        }

        // In the load effect inside useEditLead.ts, replace:
        const treatmentInterestData = lead.treatment_interest;
        const normalizedTreatmentIds: string[] = [];

        if (Array.isArray(treatmentInterestData)) {
          treatmentInterestData.forEach((item: any) => {
            const rawId = String(typeof item === "object" ? item.id : item);
            // The item.name might itself be comma-joined IDs — flatten them
            if (typeof item === "object" && item?.name) {
              const UUID_RE =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              const nameParts = String(item.name)
                .split(",")
                .map((p: string) => p.trim())
                .filter(Boolean);
              const allUUIDs = nameParts.every((p: string) => UUID_RE.test(p));
              if (allUUIDs && nameParts.length > 0) {
                // name is actually a list of sub-IDs — use those as the real IDs
                nameParts.forEach((subId: string) =>
                  normalizedTreatmentIds.push(subId),
                );
              } else {
                normalizedTreatmentIds.push(rawId);
              }
            } else {
              normalizedTreatmentIds.push(rawId);
            }
          });
        } else if (typeof treatmentInterestData === "string") {
          treatmentInterestData
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
            .forEach((id: string) => normalizedTreatmentIds.push(id));
        }

        setTreatments(normalizedTreatmentIds);

        // const selectedInterestNames = interests
        //   .filter((interest) =>
        //     normalizedTreatmentIds.includes(String(interest.id)),
        //   )
        //   .map((interest) => interest.name);

        // setTreatmentInterest(selectedInterestNames.join(", "));

        const hasBooking = isTruthy(lead.book_appointment);
        setWantAppointment(hasBooking ? "yes" : "no");

        if (hasBooking) {
          const personnelId = anyLead.personal_id;
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
        const embeddedDocs = (lead as unknown as { documents?: unknown[] })
          .documents;
        if (Array.isArray(embeddedDocs) && embeddedDocs.length > 0) {
          const normalized = embeddedDocs.map((d) =>
            normalizeDocument(d as Parameters<typeof normalizeDocument>[0]),
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
        setError(err instanceof Error ? err.message : "Failed to load lead");
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

  // ── Assignee search ──
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!assigneeSearch.trim()) {
        setAssigneeOptions([]);
        return;
      }
      try {
        setAssigneeLoading(true);
        if (isInternal) {
          const normalized = normalizeUsersList(users);
          const filtered = normalized.filter((u) =>
            `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.username ?? ""}`
              .toLowerCase()
              .includes(assigneeSearch.toLowerCase()),
          );
          setAssigneeOptions(filtered);
        } else {
          const response = await authApi.searchUsers({ search: assigneeSearch, limit: 20, offset: 0 });
          setAssigneeOptions(normalizeAssignees(response));
        }
      } catch {
        setAssigneeOptions([]);
      } finally {
        setAssigneeLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [assigneeSearch, isInternal, users]);

  // ── Lead Generated By search ──
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!leadGeneratedBySearch.trim()) {
        setLeadGeneratedByOptions([]);
        return;
      }
      try {
        setLeadGeneratedByLoading(true);
        if (isInternal) {
          const normalized = normalizeUsersList(users);
          const filtered = normalized.filter((u) =>
            `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.username ?? ""}`
              .toLowerCase()
              .includes(leadGeneratedBySearch.toLowerCase()),
          );
          setLeadGeneratedByOptions(filtered);
        } else {
          const response = await authApi.searchUsers({ search: leadGeneratedBySearch, limit: 20, offset: 0 });
          setLeadGeneratedByOptions(normalizeAssignees(response));
        }
      } catch {
        setLeadGeneratedByOptions([]);
      } finally {
        setLeadGeneratedByLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [leadGeneratedBySearch, isInternal, users]);

  // ── Appointment personnel search ──
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (wantAppointment !== "yes" || !appointmentPersonnelSearch.trim()) {
        setAppointmentPersonnelOptions([]);
        return;
      }
      try {
        setAppointmentPersonnelLoading(true);
        if (isInternal) {
          const normalized = normalizeUsersList(users);
          const filtered = normalized.filter((u) =>
            `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.username ?? ""}`
              .toLowerCase()
              .includes(appointmentPersonnelSearch.toLowerCase()),
          );
          setAppointmentPersonnelOptions(filtered);
        } else {
          const response = await authApi.searchUsers({ search: appointmentPersonnelSearch, limit: 20, offset: 0 });
          setAppointmentPersonnelOptions(normalizeAssignees(response));
        }
      } catch {
        setAppointmentPersonnelOptions([]);
      } finally {
        setAppointmentPersonnelLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [appointmentPersonnelSearch, wantAppointment, isInternal, users]);

  const selectedAppointmentPersonnel = React.useMemo(() => {
    const selectedId = Number(appointmentPersonnel);
    if (Number.isFinite(selectedId)) {
      const matched = appointmentPersonnelOptions.find((o) => o.id === selectedId);
      if (matched) return matched;
    }
    if (!appointmentPersonnelSearch.trim()) return null;
    return {
      id: Number.isFinite(Number(appointmentPersonnel)) ? Number(appointmentPersonnel) : 0,
      first_name: undefined,
      last_name: undefined,
      username: appointmentPersonnelSearch,
      role: undefined,
      designation: undefined,
      email: undefined,
    } satisfies AssigneeOption;
  }, [appointmentPersonnel, appointmentPersonnelOptions, appointmentPersonnelSearch]);

  // ── Filter Personnel by Department ──
  React.useEffect(() => {
    if (!department || employees.length === 0) {
      setFilteredPersonnel([]);
      return;
    }
    const selectedDept = departments.find((d) => d.id === Number(department));
    if (!selectedDept) {
      setFilteredPersonnel([]);
      return;
    }
    const normalize = (s: string) => (s ?? "").trim().toLowerCase().normalize("NFC");
    setFilteredPersonnel(
      employees.filter(
        (emp) => normalize(emp.department_name) === normalize(selectedDept.name),
      ),
    );
  }, [department, employees, departments]);

  // ── Filtered campaigns ─────────────────────────────────────────────────────
  const filteredCampaigns = React.useMemo<CampaignOption[]>(() => {
    if (!source && !subSource) return campaigns;
    const normalizeStr = (s: string) => s.trim().toLowerCase();

    return campaigns.filter((c) => {
      const sourceMatch = source ? normalizeStr(c.source) === normalizeStr(source) : true;

      const subSourceMatch = subSource
        ? normalizeStr(c.subSource) === normalizeStr(subSource)
        : true;

      return sourceMatch && subSourceMatch;
    });
  }, [campaigns, source, subSource]);

  // ====================== Save ======================
  const handleSave = () => {
    if (!leadData || !id || saving) return;

    if (!canEditLeads) {
      const msg = "You do not have permission to edit leads.";
      setError(msg);
      toast.error(msg, { position: "top-right", autoClose: 3000, theme: "colored" });
      return;
    }

    const bookingActive = wantAppointment === "yes";

    if (bookingActive) {
      if (IS_MEDICAL_APP && !department) {
        toast.error("Please select a department for the appointment.", {
          position: "top-right", autoClose: 3000, theme: "colored",
        });
        return;
      }
      if (!appointmentDate) {
        toast.error("Please select a date for the appointment.", {
          position: "top-right", autoClose: 3000, theme: "colored",
        });
        return;
      }
      if (!slot) {
        toast.error("Please select a time slot for the appointment.", {
          position: "top-right", autoClose: 3000, theme: "colored",
        });
        return;
      }
    }

    const resolvedStatus = nextStatus || null;
    const resolvedDeptId: number = leadDepartmentId ?? leadData.department_id ?? clinicId;
    const coupleActive = IS_MEDICAL_APP && isCouple === "yes";
    const matchedGeneratedByOption = leadGeneratedByOptions.find(
      (option) => assigneeOptionLabel(option) === leadGeneratedBy,
    );
    const resolvedGeneratedById =
      intOrNull(leadGeneratedById) ?? matchedGeneratedByOption?.id ?? null;
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
      // ── Task Status → action_status ── NEW
      action_status:
        (taskStatus.trim().toLowerCase() as TaskStatusValue) || null,
      ...(leadStatus
        ? { lead_status: leadStatus as LeadPayload["lead_status"] }
        : {}),
      treatment_interest:
        treatments.length > 0 ? treatments.join(",") : treatmentInterest || "",
      is_active: leadData?.is_active !== false,
      book_appointment: bookingActive,
      referral_department_id: referralDeptId ?? null,
      language_preference: language || "",
      ...(IS_MEDICAL_APP
        ? {
            age: intOrNull(age),
            marital_status: marital
              ? (marital.toLowerCase() as "single" | "married")
              : null,
            gender: gender
              ? (gender.toLowerCase() as "male" | "female" | "other")
              : null,
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
            contact_full_name: contactPersonName.trim() || null,
            contact_designation: designation.trim() || null,
            contact_phone: contactPersonPhone.trim() || null,
            contact_email: strOrNull(contactPersonEmail) ?? null,
            lead_generated_by_id: resolvedGeneratedById,
            lead_generated_by_name: leadGeneratedBy.trim() || null,
          }
        : {}),
      ...(bookingActive
        ? {
            appointment_date: appointmentDate,
            slot,
            remark: remark || "",
            personal_id:
              selectedAppointmentPersonnel?.id &&
              selectedAppointmentPersonnel.id !== 0
                ? selectedAppointmentPersonnel.id
                : (intOrNull(appointmentPersonnel) ?? null),
            personal_name: selectedAppointmentPersonnel
              ? `${selectedAppointmentPersonnel.first_name ?? ""} ${selectedAppointmentPersonnel.last_name ?? ""}`.trim() ||
                selectedAppointmentPersonnel.username
              : null,
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
        await LeadAPI.updateWithDocuments(id, updateData as LeadPayload, documents);
      } else {
        await LeadAPI.update(id, updateData as LeadPayload);
      }
    };

    doSave()
      .then(async () => {
        toast.success("Lead saved successfully!", {
          position: "top-right", autoClose: 1500, theme: "colored",
        });

        // ── Send appointment confirmation email if appointment is booked ──
        console.log("[EditLead Email Debug]", {
          wantAppointment,
          appointmentDate,
          slot,
          email,
          leadDataEmail: (leadData as any)?.email,
        });

        const bookingActive = wantAppointment === "yes";
        const finalAppointmentDate = appointmentDate || (leadData as any)?.appointment_date || "";
        const finalSlot = slot || (leadData as any)?.slot || "";
        const finalEmail = (email || (leadData as any)?.email || "").trim();

        console.log("[EditLead Email Send Check]", {
          bookingActive,
          finalAppointmentDate,
          finalSlot,
          finalEmail,
        });

        if (bookingActive && finalAppointmentDate && finalSlot && finalEmail) {
          const recipientEmail = finalEmail;
          if (recipientEmail) {
            try {
              // using LeadEmailAPI from top-level import
              const leadName = fullName.trim() || "Patient";
              const leadFirstName = leadName.split(/\s+/)[0] || "Patient";
              const clinicName = selectedClinic?.name || "Our Clinic";
              const senderEmail =
                (authUser?.email as string | undefined)?.trim() || undefined;
              const personnelName = selectedAppointmentPersonnel
                ? `${selectedAppointmentPersonnel.first_name ?? ""} ${selectedAppointmentPersonnel.last_name ?? ""}`.trim() ||
                  selectedAppointmentPersonnel.username ||
                  "-"
                : "-";
              const deptName =
                departments.find((d) => d.id.toString() === department)?.name ||
                "-";

              const subject = `Appointment Updated - ${finalAppointmentDate}`;
              const emailBody = [
                `Hi ${leadFirstName},`,
                "",
                `Your appointment details at ${clinicName} have been updated.`,
                "",
                `Date: ${finalAppointmentDate}`,
                `Time: ${finalSlot}`,
                `Doctor: ${personnelName}`,
                `Department: ${deptName}`,
                "",
                remark ? `Note: ${remark}` : "",
                "",
                `If you have any questions, please contact us.`,
                "",
                `Thank you,`,
                `${clinicName} Team`,
              ]
                .filter((line) => line !== undefined)
                .join("\n");

              await LeadEmailAPI.sendNow({
                lead: String(id),
                subject,
                sender_email: senderEmail || null,
                email_body: emailBody,
              });
            } catch {
              toast.warning(
                "Lead saved, but appointment email could not be sent.",
                { position: "top-right", autoClose: 3000, theme: "colored" },
              );
            }
          }
        }

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
        setError(msg);
        setShowSuccess(false);
        toast.error(msg, { position: "top-right", autoClose: 5000, theme: "colored" });
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
    filteredCampaigns,
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
    campaignName,
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
    // ── Task Status ── NEW
    taskStatus,
    setTaskStatus,
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
    interests,
  };
}