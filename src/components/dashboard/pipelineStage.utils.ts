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
  contacted: ["contacted"],
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
};

const getEquivalentStatusKeys = (statusKey: string): string[] => {
  const normalized = normalizeStageName(statusKey);
  return equivalentStatuses[normalized] ?? [normalized];
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

  return pipeline.stages
    .filter((stage) => isActiveStageStatus(stage.stage_status))
    .slice()
    .sort((left, right) => left.stage_order - right.stage_order);
};

const resolveLeadStatusText = (lead: Lead): string => {
  const anyLead = lead as Lead & {
    stage_name?: string;
    pipeline_stage_name?: string;
  };

  return (
    anyLead.stage_name ||
    anyLead.pipeline_stage_name ||
    lead.lead_status ||
    lead.status ||
    ""
  );
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

  const byName = new Map(
    stages.map((stage) => [normalizeStageName(stage.stage_name), stage]),
  );
  const normalizedLeadStatus = normalizeStageName(resolveLeadStatusText(lead));
  const exact = byName.get(normalizedLeadStatus);
  if (exact) return exact;

  const candidateKeys = getEquivalentStatusKeys(normalizedLeadStatus);
  for (const candidate of candidateKeys) {
    const matched = byName.get(candidate);
    if (matched) return matched;
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

  for (const lead of leads) {
    if (lead?.is_active === false) continue;
    const stage = resolveLeadStage(lead, stages);
    if (!stage) continue;
    stageCounts[stage.id] = (stageCounts[stage.id] ?? 0) + 1;
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
