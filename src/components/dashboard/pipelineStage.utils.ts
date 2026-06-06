import type { Lead } from "../../services/leads.api";
import {
  isActiveStageStatus,
  type Pipeline,
  type PipelineStage,
} from "../../services/pipeline.api";

export const normalizeStageName = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

const equivalentStatuses: Record<string, string[]> = {
  new: ["new"],
  "new-lead": ["new-lead", "new-leads", "new"],
  contacted: ["contacted"],
  "follow-up": ["follow-up", "followup", "follow-ups", "follow up"],
  "follow-ups": [
    "follow-ups",
    "follow-up",
    "followup",
    "follow-up-leads",
    "follow-up-lead",
    "follow-up-lead-stage",
    "follow-up-stage",
    "contacted",
  ],
  converted: ["converted", "converted-lead", "converted-leads"],
  lost: ["lost", "lost-lead", "lost-leads", "closed", "closed-lost"],
  "cycle-conversion": ["cycle-conversion", "cycleconversion"],
  appointment: ["appointment", "appointments"],
  negotiation: ["negotiation", "negotiating"],
  "proposal-sent": ["proposal-sent", "proposal"],
  "contract-signed": ["contract-signed", "contractsigned", "contract"],
  "converted-lead": ["converted-lead", "converted-leads", "converted"],
  "follow up": ["follow up", "follow-up", "followup", "follow-ups"],
  "contract signed": ["contract signed", "contract-signed", "contract"],
  "proposal sent": ["proposal sent", "proposal-sent", "proposal"],
  closed: ["closed", "lost", "closed-lost"],
};

const getEquivalentStatusKeys = (statusKey: string): string[] => {
  const normalized = normalizeStageName(statusKey);
  return equivalentStatuses[normalized] ?? [normalized];
};

const getStageMatchKeys = (stage: PipelineStage): string[] => {
  const rawKeys = [stage.stage_name, stage.stage_type, stage.stage_status]
    .map((value) => normalizeStageName(value))
    .filter(Boolean);

  return Array.from(
    new Set(rawKeys.flatMap((key) => getEquivalentStatusKeys(key))),
  );
};

const getStageStatusKeysForLooseMatch = (stage: PipelineStage): string[] => {
  const stageName = String(stage.stage_name ?? "").toLowerCase().trim();
  const byName = getEquivalentStatusKeys(stage.stage_name);
  const byType = stage.stage_type ? getEquivalentStatusKeys(stage.stage_type) : [];
  const byStatus = stage.stage_status ? getEquivalentStatusKeys(stage.stage_status) : [];
  const explicit = [
    stageName,
    String(stage.stage_name ?? "").toLowerCase().trim(),
    String(stage.stage_status ?? "").toLowerCase().trim(),
    String(stage.stage_type ?? "").toLowerCase().trim(),
  ];

  return Array.from(
    new Set(
      [...byName, ...byType, ...byStatus, ...explicit]
        .map((item) => String(item ?? "").toLowerCase().trim())
        .filter(Boolean),
    ),
  );
};

const getLeadCandidateKeys = (lead: Lead): string[] => {
  const anyLead = lead as Lead & {
    stage_name?: string;
    pipeline_stage_name?: string;
    task_type?: string;
    task?: string;
    next_action_description?: string;
  };

  const candidateValues = [
    resolveLeadStatusText(lead),
    anyLead.stage_name,
    anyLead.pipeline_stage_name,
    anyLead.task_type,
    anyLead.task,
    extractStageFromDescription(anyLead.next_action_description),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  return Array.from(
    new Set(candidateValues.flatMap((value) => getEquivalentStatusKeys(value))),
  );
};

const resolveActivePipeline = (pipelines: Pipeline[]): Pipeline | null => {
  if (!pipelines.length) return null;
  return (
    pipelines.find((pipeline) => pipeline.is_active) ?? pipelines[0] ?? null
  );
};

export const getActivePipelineStages = (
  pipelines: Pipeline[],
): PipelineStage[] => {
  const pipeline = resolveActivePipeline(pipelines);
  if (!pipeline || !Array.isArray(pipeline.stages)) return [];

  // Sort in descending order (highest stage_order first)
  return pipeline.stages
    .filter((stage) => isActiveStageStatus(stage.stage_status))
    .slice()
    .sort((left, right) => right.stage_order - left.stage_order);
};

const resolveLeadStatusText = (lead: Lead): string => {
  const anyLead = lead as Lead & {
    stage_name?: string;
    pipeline_stage_name?: string;
    task_type?: string;
    task?: string;
  };

  return (
    anyLead.stage_name ||
    anyLead.pipeline_stage_name ||
    anyLead.task_type ||
    anyLead.task ||
    lead.lead_status ||
    lead.status ||
    ""
  );
};

const getLeadCandidateStatusesForLooseMatch = (lead: Lead): string[] => {
  const anyLead = lead as Lead & {
    stage_name?: string;
    pipeline_stage_name?: string;
    task_type?: string;
    task?: string;
  };

  return [
    lead.lead_status,
    typeof lead.status === "string" ? lead.status : "",
    anyLead.stage_name,
    anyLead.pipeline_stage_name,
    anyLead.task_type,
    anyLead.task,
    extractStageFromDescription(lead.next_action_description),
  ]
    .map((value) => String(value ?? "").toLowerCase().trim())
    .filter(Boolean);
};

const doesLeadMatchStage = (lead: Lead, stage: PipelineStage): boolean => {
  if (
    lead.stage_id !== null &&
    lead.stage_id !== undefined &&
    String(lead.stage_id) === String(stage.id)
  ) {
    return true;
  }

  const stageKeys = getStageStatusKeysForLooseMatch(stage);
  const leadCandidateStatuses = getLeadCandidateStatusesForLooseMatch(lead);

  return stageKeys.some((key) => leadCandidateStatuses.includes(key));
};

const extractStageFromDescription = (
  description: string | null | undefined,
): string => {
  if (!description) return "";
  const match = description.match(/(?:^|\|)\s*Stage:\s*([^|]+)/i);
  return match?.[1]?.trim() ?? "";
};

export const resolveLeadStage = (
  lead: Lead,
  stages: PipelineStage[],
): PipelineStage | null => {
  if (!Array.isArray(stages) || stages.length === 0) return null;

  const byId = new Map(stages.map((stage) => [String(stage.id), stage]));
  if (lead.stage_id != null) {
    const matchedById = byId.get(String(lead.stage_id));
    if (matchedById) return matchedById;
  }

  const leadCandidateKeys = new Set(getLeadCandidateKeys(lead));

  for (const stage of stages) {
    const stageCandidateKeys = getStageMatchKeys(stage);
    if (stageCandidateKeys.some((key) => leadCandidateKeys.has(key))) {
      return stage;
    }
  }

  return null;
};

export const buildStageCountMap = (
  leads: Lead[],
  stages: PipelineStage[],
): Record<string, number> => {
  const stageCounts: Record<string, number> = {};
  for (const stage of stages) {
    stageCounts[stage.id] = 0;
  }

  for (const stage of stages) {
    for (const lead of leads) {
      if (lead?.is_active === false) continue;
      if (!doesLeadMatchStage(lead, stage)) continue;
      stageCounts[stage.id] = (stageCounts[stage.id] ?? 0) + 1;
    }
  }

  return stageCounts;
};

export const sumCountsByExactStageNames = (
  stages: PipelineStage[],
  stageCounts: Record<string, number>,
  stageNames: string[],
): number => {
  const normalizedNames = new Set(
    stageNames.map((name) => normalizeStageName(name)).filter(Boolean),
  );

  return stages.reduce((total, stage) => {
    const stageName = normalizeStageName(stage.stage_name);
    if (!normalizedNames.has(stageName)) return total;
    return total + (stageCounts[stage.id] ?? 0);
  }, 0);
};
