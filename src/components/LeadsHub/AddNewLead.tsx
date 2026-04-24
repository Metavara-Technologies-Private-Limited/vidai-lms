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

import { useSelector, useDispatch } from "react-redux";
import { selectCampaign } from "../../store/campaignSlice";
import { selectUser } from "../../store/authSlice";
import { selectClinic } from "../../store/clinicSlice";
import {
  loadReferralSources,
  loadDashboardCounts,
} from "../../store/referralSlice";
import type { AppDispatch } from "../../store";
import {
  resolveUserRole,
  hasAnySubcategoryActionPermission,
} from "../../utils/roleAccess";

import type { FormState } from "../../types/leads.types";
import { LeadAPI, DepartmentAPI, LeadEmailAPI } from "../../services/leads.api";
import type { Department } from "../../services/leads.api";
import { authApi } from "../../services/auth.api";
import {
  pipelineApi,
  isActiveStageStatus,
  type Pipeline,
  type PipelineStage,
} from "../../services/pipeline.api";

import {
  ALLOWED_DOC_TYPES,
  MAX_DOC_SIZE_MB,
  TASK_TYPES,
  strOrNull,
  intOrNull,
  type LeadPayload,
  type LeadGeneratedByObject,
  type ReferralSourceObject,
  type NextActionStatusOption,
  type CampaignData,
  type ApiError,
} from "../LeadsHub/addNewLead.constants";

import { validateStep } from "../LeadsHub/addNewLead.validation";
import { Step1, Step2, Step3 } from "../LeadsHub/addNewLead.steps";

import {
  IS_MEDICAL_APP,
  IS_CONTRACTS_APP,
  ACTIVE_FLOW_COPY,
} from "../../config/appType";
import { sanitizeNameInput } from "../../utils/nameValidation";

import { fetchReferralDepartments } from "../../services/referral.api";
import type { ReferralDepartment } from "../../services/referral.api";

const STORAGE_KEY_SELECTED_INDUSTRY = "leads_selected_industry";
const STORAGE_KEY_SELECTED_PIPELINE = "leads_selected_pipeline_id";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const assigneeLabel = (option: AssigneeOption): string => {
  const fullName = `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  const secondary = option.role || option.designation;
  return secondary ? `${primary} (${secondary})` : primary;
};

const personnelLabel = (option: AssigneeOption): string => assigneeLabel(option);

const toLeadGeneratedByObject = (option: AssigneeOption): LeadGeneratedByObject => ({
  id: option.id,
  first_name: option.first_name ?? "",
  last_name: option.last_name ?? "",
  role: option.role ?? option.designation ?? "",
  email: option.email ?? "",
});

const INPUT_TOAST_OPTIONS = { position: "top-right" as const, autoClose: 1400 };

const showInputToast = (toastId: string, message: string) => {
  if (!toast.isActive(toastId)) {
    toast.error(message, { ...INPUT_TOAST_OPTIONS, toastId });
  }
};

const sanitizeEmailInput = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9@._%+-]/g, "");

// ── Derive action type labels from a single stage's enabled rules ─────────────
const deriveActionTypeOptions = (stage: PipelineStage): string[] => {
  const labels = stage.rules
    .filter((r) => r.is_enabled)
    .map((r) => (r.custom_label?.trim() ? r.custom_label.trim() : r.action_type));
  return labels.length > 0 ? labels : [...TASK_TYPES];
};

// ── Derive union of action type labels across all stages ──────────────────────
const deriveAllActionTypeOptions = (stages: PipelineStage[]): string[] => {
  const labels = Array.from(
    new Set(
      stages.flatMap((s) =>
        s.rules
          .filter((r) => r.is_enabled)
          .map((r) => (r.custom_label?.trim() ? r.custom_label.trim() : r.action_type)),
      ),
    ),
  );
  return labels.length > 0 ? labels : [...TASK_TYPES];
};

// ====================== Component ======================
export default function AddNewLead() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const loadingEmployees = false;

  const [assigneeName, setAssigneeName] = React.useState("");
  const [assigneeSearch, setAssigneeSearch] = React.useState("");
  const [assigneeOptions, setAssigneeOptions] = React.useState<AssigneeOption[]>([]);
  const [assigneeLoading, setAssigneeLoading] = React.useState(false);

  const [leadGeneratedBySearch, setLeadGeneratedBySearch] = React.useState("");
  const [selectedLeadGeneratedBy, setSelectedLeadGeneratedBy] =
    React.useState<LeadGeneratedByObject | null>(null);
  const [leadGeneratedByOptions, setLeadGeneratedByOptions] = React.useState<AssigneeOption[]>([]);
  const [leadGeneratedByLoading, setLeadGeneratedByLoading] = React.useState(false);

  const [appointmentPersonnelInput, setAppointmentPersonnelInput] = React.useState("");
  const [appointmentPersonnelOptions, setAppointmentPersonnelOptions] = React.useState<AssigneeOption[]>([]);
  const [appointmentPersonnelLoading, setAppointmentPersonnelLoading] = React.useState(false);

  const [referralDepartments, setReferralDepartments] = React.useState<ReferralDepartment[]>([]);
  const [loadingReferralDepts, setLoadingReferralDepts] = React.useState(false);

  // ── File state ─────────────────────────────────────────────────────────────
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [docDragOver, setDocDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Pipeline / stage state ─────────────────────────────────────────────────
  const [nextActionTypeOptions, setNextActionTypeOptions] = React.useState<string[]>([]);
  const [pipelineStageNames, setPipelineStageNames] = React.useState<string[]>([]);
  // Store full PipelineStage objects so rules are accessible
  const [pipelineStages, setPipelineStages] = React.useState<PipelineStage[]>([]);
  const [selectedNextActionStageId, setSelectedNextActionStageId] = React.useState<string | null>(null);

  // Derived options consumed by Step1 — order comes from stage_order on the objects
  const leadStatusOptions = React.useMemo<NextActionStatusOption[]>(
    () =>
      pipelineStages.map((s) => ({
        label: s.stage_name.trim(),
        value: s.stage_name.trim(),
      })),
    [pipelineStages],
  );

  const rawCampaigns = useSelector(selectCampaign);
  const authedUser = useSelector(selectUser);
  const selectedClinic = useSelector(selectClinic);
  const clinicId = selectedClinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 1);

  // ── Permission guard ───────────────────────────────────────────────────────
  const _authUserRaw = authedUser as unknown as Record<string, unknown> | null;
  const _nestedUser =
    _authUserRaw?.user && typeof _authUserRaw.user === "object"
      ? (_authUserRaw.user as Record<string, unknown>)
      : null;
  const _role = resolveUserRole(_authUserRaw);
  const _perms = _authUserRaw?.permissions ?? _nestedUser?.permissions;
  const authIsLoaded = authedUser != null;
  const canAddLeads =
    _role === "super_admin" ||
    hasAnySubcategoryActionPermission(_perms, ["leads hub"], "add");

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
    leadStatus: "",
    treatmentInterest: "",
    treatments: [],
    wantAppointment: "no",
    department: "",
    personnel: "",
    appointmentDate: "",
    slot: "",
    remark: "",
    contactFullName: "",
    designation: "",
    contactPhone: "",
    contactEmail: "",
    leadGeneratedBy: "",
    referralDepartment: "",
  });

  // Next action status = only stages that come AFTER the selected lead status
  const filteredNextActionStatusOptions = React.useMemo<NextActionStatusOption[]>(() => {
    if (!form.leadStatus) {
      return pipelineStageNames.map((name) => ({ label: name, value: name }));
    }

    const currentStage = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === form.leadStatus.trim().toLowerCase(),
    );

    if (!currentStage) {
      return pipelineStageNames.map((name) => ({ label: name, value: name }));
    }

    // Only show stages with a higher stage_order than the selected lead status
    return pipelineStages
      .filter((s) => s.stage_order > currentStage.stage_order)
      .map((s) => ({ label: s.stage_name, value: s.stage_name }));

  }, [pipelineStages, pipelineStageNames, form.leadStatus]);

  // ── Fetch Departments ──────────────────────────────────────────────────────
  React.useEffect(() => {
    setDepartments([]);
    setForm((prev) => ({ ...prev, department: "", personnel: "" }));
    const fetchDeps = async () => {
      try {
        setLoadingDepartments(true);
        const fetched = await DepartmentAPI.listActiveByClinic(clinicId);
        setDepartments(fetched);
        if (fetched.length > 0) {
          setForm((prev) => prev.department ? prev : { ...prev, department: String(fetched[0].id) });
        }
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
    fetchDeps();
  }, [clinicId]);

  // ── Load pipeline stages ───────────────────────────────────────────────────
  React.useEffect(() => {
    const loadFromPipeline = async () => {
      const selectedIndustry = localStorage.getItem(STORAGE_KEY_SELECTED_INDUSTRY) ?? "";
      const selectedPipelineId = localStorage.getItem(STORAGE_KEY_SELECTED_PIPELINE) ?? "";

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

        const rawStages = (selectedPipeline?.stages ?? []);
        const activeStages = rawStages
          .filter((s) => isActiveStageStatus(s.stage_status))
          .filter((s) => s.stage_name.trim())
          .sort((a, b) => {
            const aOrder = typeof a.stage_order === "number" ? a.stage_order : 0;
            const bOrder = typeof b.stage_order === "number" ? b.stage_order : 0;
            if (aOrder === bOrder) return 0;
            return aOrder - bOrder;
          });

        const stageNames = activeStages.map((s) => s.stage_name.trim());

        setPipelineStageNames(stageNames);
        // Store full stage objects — rules are needed for action type derivation
        setPipelineStages(activeStages);

        // Initial options = union of enabled rule labels across all active stages
        setNextActionTypeOptions(deriveAllActionTypeOptions(activeStages));
      } catch {
        // No pipeline configured — fall back to the static task type list
        setNextActionTypeOptions([...TASK_TYPES]);
      }
    };

    void loadFromPipeline();
  }, [clinicId]);

  // ── Auto-clear nextType if it's no longer valid for the selected stage ─────
  React.useEffect(() => {
    if (!form.nextType) return;
    if (nextActionTypeOptions.includes(form.nextType)) return;
    setForm((prev) => ({ ...prev, nextType: "" }));
  }, [form.nextType, nextActionTypeOptions]);

  // ── Fetch Referral Departments ─────────────────────────────────────────────
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

  // ── Assignee search ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!assigneeSearch.trim()) { setAssigneeOptions([]); return; }
      try {
        setAssigneeLoading(true);
        const response = await authApi.searchUsers({ search: assigneeSearch, limit: 20, offset: 0 });
        setAssigneeOptions(normalizeAssignees(response));
      } catch {
        setAssigneeOptions([]);
      } finally {
        setAssigneeLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [assigneeSearch]);

  // ── Lead Generated By search ───────────────────────────────────────────────
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!leadGeneratedBySearch.trim()) { setLeadGeneratedByOptions([]); return; }
      try {
        setLeadGeneratedByLoading(true);
        const response = await authApi.searchUsers({ search: leadGeneratedBySearch, limit: 20, offset: 0 });
        setLeadGeneratedByOptions(normalizeAssignees(response));
      } catch {
        setLeadGeneratedByOptions([]);
      } finally {
        setLeadGeneratedByLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [leadGeneratedBySearch]);

  // ── Appointment personnel search ───────────────────────────────────────────
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.wantAppointment !== "yes" || !appointmentPersonnelInput.trim()) {
        setAppointmentPersonnelOptions([]);
        return;
      }
      try {
        setAppointmentPersonnelLoading(true);
        const response = await authApi.searchUsers({ search: appointmentPersonnelInput, limit: 20, offset: 0 });
        setAppointmentPersonnelOptions(normalizeAssignees(response));
      } catch {
        setAppointmentPersonnelOptions([]);
      } finally {
        setAppointmentPersonnelLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [appointmentPersonnelInput, form.department, form.wantAppointment]);

  const selectedAppointmentPersonnel = React.useMemo(() => {
    const selectedId = Number(form.personnel);
    if (Number.isFinite(selectedId)) {
      const matched = appointmentPersonnelOptions.find((o) => o.id === selectedId);
      if (matched) return matched;
    }
    if (!appointmentPersonnelInput.trim()) return null;
    return {
      id: Number.isFinite(Number(form.personnel)) ? Number(form.personnel) : 0,
      first_name: undefined, last_name: undefined,
      username: appointmentPersonnelInput,
      role: undefined, designation: undefined, email: undefined,
    } satisfies AssigneeOption;
  }, [appointmentPersonnelInput, appointmentPersonnelOptions, form.personnel]);

  // ── Auto-fill source/subSource from campaign ───────────────────────────────
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      if (field === "full_name") {
        const sanitized = sanitizeNameInput(rawValue);
        if (sanitized !== rawValue) showInputToast("add-lead-name-invalid", "enter only alphanumeric");
        setForm((prev) => ({ ...prev, full_name: sanitized }));
        return;
      }
      if (field === "contact") {
        const rawDigits = rawValue.replace(/\D/g, "");
        const digitsOnly = rawDigits.slice(0, 15);
        if (/\D/.test(rawValue)) showInputToast("add-lead-contact-invalid", "only digits are allowed");
        if (rawDigits.length > 15) showInputToast("add-lead-contact-length", "only 15 digits allowed");
        setForm((prev) => ({ ...prev, contact: digitsOnly }));
        return;
      }
      if (field === "email") {
        const sanitized = sanitizeEmailInput(rawValue);
        if (sanitized !== rawValue.toLowerCase()) showInputToast("add-lead-email-invalid", "enter valid email characters only");
        setForm((prev) => ({ ...prev, email: sanitized }));
        return;
      }
      setForm((prev) => ({ ...prev, [field]: capitalizeFirst(rawValue) }));
    };

  const handleSelectChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCampaignChange = (value: string) =>
    setForm((prev) => ({ ...prev, campaign: value }));

  const handleSourceChange = (value: string) =>
    setForm((prev) => ({ ...prev, source: value, subSource: "", campaign: "", campaignName: "" }));

  const handleSubSourceChange = (value: string) =>
    setForm((prev) => ({ ...prev, subSource: value, campaign: "", campaignName: "" }));

  const handleDepartmentChange = (value: string) => {
    setAppointmentPersonnelInput("");
    setForm((prev) => ({ ...prev, department: value, personnel: "" }));
  };

  // ── Lead Status Change ────────────────────────────────────────────────────
  // Auto-populates Next Action Status with the first stage after the selected
  // lead status, then derives Next Action Type from that auto-populated stage.
  const handleLeadStatusChange = (value: string) => {
    const trimmed = value.trim();

    // Find the matching stage to track its id (used in payload)
    const matched = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    setSelectedNextActionStageId(matched?.id ?? null);

    // Auto-populate Next Action Status with the first stage that comes
    // after the selected lead status (by stage_order).
    const nextStages = pipelineStages
      .filter((s) => (matched ? s.stage_order > matched.stage_order : true))
      .sort((a, b) => a.stage_order - b.stage_order);

    const autoNextStatus =
      trimmed && nextStages[0] ? nextStages[0].stage_name.trim() : "";

    // Derive action type options from the auto-populated next action status stage.
    // Fall back to the union across all stages when no next stage exists.
    const autoNextStage = nextStages[0] ?? null;
    const stageActionOptions = autoNextStage
      ? deriveActionTypeOptions(autoNextStage)
      : deriveAllActionTypeOptions(pipelineStages);

    setNextActionTypeOptions(stageActionOptions);

    setForm((prev) => ({
      ...prev,
      leadStatus: trimmed,
      nextStatus: autoNextStatus,
      nextType: "",
    }));
  };

  const handleNextTypeChange = (value: string) =>
    setForm((prev) => ({ ...prev, nextType: value }));

  // ── Next Action Status Change ─────────────────────────────────────────────
  // Re-derives Next Action Type options from the newly selected status stage.
  const handleNextStatusChange = (value: string) => {
    const trimmed = value.trim();

    // Find the stage matching the selected next action status
    const matched = pipelineStages.find(
      (s) => s.stage_name.trim().toLowerCase() === trimmed.toLowerCase(),
    );

    // Action type options come from the selected next action status stage's
    // enabled rules; fall back to the union across all stages when unmatched.
    const stageActionOptions = matched
      ? deriveActionTypeOptions(matched)
      : deriveAllActionTypeOptions(pipelineStages);

    setNextActionTypeOptions(stageActionOptions);

    setForm((prev) => ({ ...prev, nextStatus: trimmed, nextType: "" }));
  };

  const handleReferralDepartmentChange = (value: string) =>
    setForm((prev) => ({ ...prev, referralDepartment: value }));

  // ── File Handlers ──────────────────────────────────────────────────────────
  const addFiles = (files: File[]) => {
    files.forEach((file) => {
      if (!ALLOWED_DOC_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" — unsupported type. Use PDF, Word, JPG or PNG.`, { position: "top-right", autoClose: 3000, theme: "colored" });
        return;
      }
      if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" — exceeds ${MAX_DOC_SIZE_MB}MB limit.`, { position: "top-right", autoClose: 3000, theme: "colored" });
        return;
      }
      setPendingFiles((prev) =>
        prev.find((f) => f.name === file.name && f.size === file.size) ? prev : [...prev, file],
      );
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    const isValid = await validateStep(currentStep, form, isCouple, pendingFiles.length > 0);
    if (!isValid) return;
    if (currentStep === 3) { await submitForm(); return; }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ── Build Payload ──────────────────────────────────────────────────────────
  const buildPayload = (): LeadPayload => {
    const shouldBookAppointment =
      form.wantAppointment === "yes" && Boolean(form.appointmentDate && form.slot);

    const selectedDepartmentId = intOrNull(form.department);
    const departmentId = selectedDepartmentId ?? (departments[0]?.id ?? 0);

    const normalizedGender = (form.gender ?? "").toLowerCase().trim();
    const genderValue =
      normalizedGender === "male" || normalizedGender === "female"
        ? (normalizedGender as "male" | "female")
        : null;

    const maritalValue =
      (form.marital ?? "").trim() !== ""
        ? (form.marital.toLowerCase() as "single" | "married")
        : null;

    const partnerGenderValue =
      (form.partnerGender ?? "").trim() !== ""
        ? (form.partnerGender.toLowerCase() as "male" | "female")
        : null;

    const referralDeptId = intOrNull(form.referralDepartment);

    const resolvedNextActionStatus: string | null = (form.nextStatus ?? "").trim() || null;
    const resolvedNextActionType: string | undefined = (form.nextType ?? "").trim() || undefined;
    const resolvedNextActionDescription = (form.nextDesc ?? "").trim() || undefined;

    return {
      clinic_id: clinicId,
      department_id: departmentId,
      stage_id: selectedNextActionStageId || null,
      full_name: form.full_name.trim() || "Unknown Lead",
      contact_no: form.contact.trim() || "0000000000",
      source: form.source || "Direct",
      sub_source: form.subSource || "",
      treatment_interest: form.treatments.join(",") || form.treatmentInterest || "General",
      appointment_date: shouldBookAppointment ? (form.appointmentDate ?? null) : null,
      slot: shouldBookAppointment ? (form.slot ?? "") : "",
      campaign_id: strOrNull(form.campaign),
      email: strOrNull(form.email || form.contactEmail) ?? null,
      language_preference: form.language ?? "",
      location: form.location ?? "",
      address: form.address ?? "",
      remark: form.remark ?? "",
      partner_full_name: form.partnerName ?? "",
      next_action_description: resolvedNextActionDescription,
      next_action_type: resolvedNextActionType,
      next_action_status: resolvedNextActionStatus,
      gender: IS_MEDICAL_APP ? genderValue : null,
      marital_status: IS_MEDICAL_APP ? maritalValue : null,
      partner_gender: IS_MEDICAL_APP ? partnerGenderValue : null,
      ...(form.leadStatus ? { lead_status: form.leadStatus as LeadPayload["lead_status"] } : {}),
      assigned_to_id: intOrNull(form.assignee) ?? null,
      assigned_to_name: assigneeName.trim() || null,
      personal_id: IS_CONTRACTS_APP
        ? (selectedLeadGeneratedBy?.id ?? null)
        : (intOrNull(form.personnel) ?? null),
      personal_name: IS_CONTRACTS_APP
        ? selectedLeadGeneratedBy
          ? `${selectedLeadGeneratedBy.first_name} ${selectedLeadGeneratedBy.last_name}`.trim()
          : null
        : null,
      age: IS_MEDICAL_APP ? (intOrNull(form.age) ?? null) : null,
      partner_age: IS_MEDICAL_APP ? (intOrNull(form.partnerAge) ?? null) : null,
      partner_inquiry: IS_MEDICAL_APP ? isCouple === "yes" : false,
      book_appointment: shouldBookAppointment,
      is_active: true,
      referral_department_id: referralDeptId ?? null,

      // ── Contact Information (contracts app) ───────────────────────────
      ...(IS_CONTRACTS_APP && {
        contact_full_name: form.contactFullName.trim() || null,
        contact_designation: form.designation.trim() || null,
        contact_phone: form.contactPhone.trim() || null,
        contact_email: strOrNull(form.contactEmail) ?? null,
      }),
    };
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submitForm = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const payload = buildPayload();
      const referralDeptNameForEmail =
        referralDepartments.find((d) => d.id === intOrNull(form.referralDepartment))?.name || "-";
      const shouldSendAppointmentEmail =
        payload.book_appointment === true && Boolean(payload.appointment_date && payload.slot);

      const referralSourceObject: ReferralSourceObject | undefined =
        IS_CONTRACTS_APP && selectedLeadGeneratedBy
          ? {
              first_name: selectedLeadGeneratedBy.first_name,
              last_name: selectedLeadGeneratedBy.last_name,
              email: selectedLeadGeneratedBy.email,
              role: selectedLeadGeneratedBy.role,
            }
          : undefined;

      const response =
        pendingFiles.length > 0
          ? await LeadAPI.createWithDocuments(payload, pendingFiles, referralSourceObject)
          : await LeadAPI.create(payload, referralSourceObject);

      if (shouldSendAppointmentEmail) {
        const postAppointmentStage =
          pipelineStageNames.find((s) => s.toLowerCase() === "appointment") ??
          pipelineStageNames[pipelineStageNames.length - 1] ??
          null;

        try {
          await LeadAPI.update(String(response.id), {
            clinic_id: response.clinic_id ?? payload.clinic_id,
            department_id: response.department_id ?? payload.department_id,
            full_name: response.full_name || payload.full_name,
            contact_no: response.contact_no || payload.contact_no,
            source: response.source || payload.source,
            treatment_interest: response.treatment_interest || payload.treatment_interest,
            next_action_status: postAppointmentStage,
            book_appointment: true,
            appointment_date: payload.appointment_date,
            slot: payload.slot,
            partner_inquiry: response.partner_inquiry ?? payload.partner_inquiry,
            is_active: response.is_active !== false,
          });
        } catch {
          toast.warning("Lead was created, but appointment status update failed.", {
            position: "top-right", autoClose: 2500, theme: "colored",
          });
        }
      }

      const recipientEmail =
        response.email?.trim() || payload.email?.trim() || form.contactEmail.trim() || "";

      if (recipientEmail) {
        const leadFirstName =
          (response.full_name || payload.full_name || "Patient").trim().split(/\s+/)[0] || "Patient";
        const appointmentDateText = payload.appointment_date || "-";
        const appointmentSlotText = payload.slot || "-";
        const appointmentBookedText = payload.book_appointment ? "Yes" : "No";
        const senderName =
          [authedUser?.first_name, authedUser?.last_name].filter(Boolean).join(" ").trim() ||
          authedUser?.username ||
          "Team";
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
          `- Referral Department: ${referralDeptNameForEmail}`,
          `- Treatment Interest: ${response.treatment_interest || payload.treatment_interest || "-"}`,
          `- Assigned To: ${response.assigned_to_name || payload.assigned_to_name || "-"}`,
          `- Lead Generated By (First Name): ${selectedLeadGeneratedBy?.first_name || "-"}`,
          `- Lead Generated By (Last Name): ${selectedLeadGeneratedBy?.last_name || "-"}`,
          `- Lead Generated By (Role): ${selectedLeadGeneratedBy?.role || "-"}`,
          `- Lead Generated By (Email): ${selectedLeadGeneratedBy?.email || "-"}`,
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
          `- Next Action Status: ${response.next_action_status || payload.next_action_status || "-"}`,
          `- Next Action Type: ${response.next_action_type || payload.next_action_type || "-"}`,
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
            position: "top-right", autoClose: 2500, theme: "colored",
          });
        }
      }

      toast.success("Lead saved successfully!", { position: "top-right", autoClose: 1500, theme: "colored" });

      if (payload.referral_department_id) {
        try {
          dispatch(loadReferralSources({ referral_department_id: payload.referral_department_id }));
          dispatch(loadDashboardCounts(clinicId));
        } catch (err) {
          console.warn("Failed to refresh referral data:", err);
        }
      }

      navigate("/leads", { replace: true });
    } catch (err) {
      const error = err as ApiError;
      const data = error?.response?.data;
      const msg = data ? toReadableError(data) : (error?.message || "Failed to save lead");
      toast.error(msg, { position: "top-right", autoClose: 3000, theme: "colored" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step indicator ─────────────────────────────────────────────────────────
  const steps = [
    { label: ACTIVE_FLOW_COPY.detailsStep, step: 1 },
    { label: ACTIVE_FLOW_COPY.medicalStep, step: 2 },
    { label: ACTIVE_FLOW_COPY.step3, step: 3 },
  ];

  if (!authIsLoaded) return null;
  if (!canAddLeads) return <Navigate to="/leads" replace />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Paper sx={{ overflow: "hidden", minHeight: "88vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ bgcolor: "white", px: 1, py: 1 }}>
        <Typography variant="h6" fontWeight={700} color="#1E293B">Add New Lead</Typography>
      </Box>

      {/* Step Indicator */}
      <Box sx={{ bgcolor: "white", px: 1, pt: 1, pb: 3 }}>
        <Box
          sx={{
            display: "inline-flex", alignItems: "center", gap: 3,
            bgcolor: "#F8FAFC", px: 3, py: 1.5, borderRadius: "12px", border: "1px solid #E2E8F0",
          }}
        >
          {steps.map(({ label, step }) => (
            <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 24, height: 24, borderRadius: "50%",
                  bgcolor:
                    currentStep > step ? "#10B981"
                    : currentStep === step ? (step === 3 ? "#3B82F6" : "#F97316")
                    : "#E2E8F0",
                  color: "white", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 700, fontSize: "0.75rem",
                }}
              >
                {currentStep > step ? "✓" : step}
              </Box>
              <Typography
                variant="body2" fontWeight={600}
                sx={{
                  fontSize: "0.875rem",
                  color:
                    currentStep > step ? "#10B981"
                    : currentStep === step ? (step === 3 ? "#3B82F6" : "#F97316")
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
          bgcolor: "white", p: 1, flex: 1, overflowY: "auto",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
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
            leadGeneratedByInput={
              selectedLeadGeneratedBy
                ? `${selectedLeadGeneratedBy.first_name} ${selectedLeadGeneratedBy.last_name}`.trim()
                : leadGeneratedBySearch
            }
            leadGeneratedByOptions={leadGeneratedByOptions}
            leadGeneratedByLoading={leadGeneratedByLoading}
            selectedLeadGeneratedBy={selectedLeadGeneratedBy}
            campaigns={campaigns}
            leadStatusOptions={leadStatusOptions}
            nextActionStatusOptions={filteredNextActionStatusOptions}
            nextActionTypeOptions={nextActionTypeOptions}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleAssigneeInputChange={(value) => {
              setAssigneeSearch(value);
              setAssigneeName(value);
              setForm((prev) => ({ ...prev, assignee: "" }));
            }}
            handleAssigneeChange={(value) => {
              setForm((prev) => ({ ...prev, assignee: value ? String(value.id) : "" }));
              setAssigneeName(value ? assigneeLabel(value) : "");
            }}
            handleLeadGeneratedByInputChange={(value) => {
              setLeadGeneratedBySearch(value);
              if (selectedLeadGeneratedBy) setSelectedLeadGeneratedBy(null);
            }}
            handleLeadGeneratedByChange={(value) => {
              if (value) {
                setSelectedLeadGeneratedBy(toLeadGeneratedByObject(value));
                setLeadGeneratedBySearch(assigneeLabel(value));
              } else {
                setSelectedLeadGeneratedBy(null);
                setLeadGeneratedBySearch("");
              }
            }}
            handleCampaignChange={handleCampaignChange}
            handleSourceChange={handleSourceChange}
            handleSubSourceChange={handleSubSourceChange}
            handleLeadStatusChange={handleLeadStatusChange}
            handleNextStatusChange={handleNextStatusChange}
            handleNextTypeChange={handleNextTypeChange}
            handleReferralDepartmentChange={handleReferralDepartmentChange}
            referralDepartments={referralDepartments}
            loadingReferralDepts={loadingReferralDepts}
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
          bgcolor: "white", p: 3, display: "flex", justifyContent: "flex-end",
          gap: 2, borderTop: "1px solid #F1F5F9",
        }}
      >
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
            sx={{
              textTransform: "none", borderColor: "#E2E8F0", color: "#1E293B",
              fontWeight: 700, px: 3, "&:hover": { borderColor: "#CBD5E1" },
            }}
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
            sx={{
              bgcolor: "#334155", textTransform: "none", fontWeight: 700,
              px: 4, minWidth: "100px", "&:hover": { bgcolor: "#1E293B" },
            }}
          >
            {isSubmitting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Save"}
          </Button>
        )}
      </Box>
    </Paper>
  );
}