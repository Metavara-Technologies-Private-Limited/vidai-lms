import { http } from "./http";

export type PipelineIndustryType =
  | "healthcare"
  | "ivf"
  | "pharma"
  | "diagnostics"
  | "corporate"
  | "education"
  | "saas"
  | "manufacturing"
  | "research"
  | "government"
  | "other";

export type PipelineStageType = "lead" | "engagement" | "conversion" | "closure";
export type PipelineStageStatus = "open" | "won" | "lost";
export type PipelineRuleActionType =
  | "call"
  | "email"
  | "whatsapp"
  | "sms"
  | "appointment"
  | "custom";
export type PipelineFieldType = "text" | "number" | "date" | "dropdown";

export interface PipelineStageRule {
  id?: string;
  action_type: PipelineRuleActionType;
  is_enabled: boolean;
  is_required: boolean;
  auto_move: boolean;
  allow_manual_move: boolean;
}

export interface PipelineStageField {
  id?: string;
  field_name: string;
  field_type: PipelineFieldType;
  is_mandatory: boolean;
}

export interface PipelineStage {
  id: string;
  stage_name: string;
  stage_type: PipelineStageType;
  stage_status: PipelineStageStatus;
  stage_order: number;
  stage_color?: string;
  entry_rule?: "manual" | "auto";
  rules: PipelineStageRule[];
  fields: PipelineStageField[];
}

export interface Pipeline {
  id: string;
  clinic_id?: number;
  clinic?: number;
  pipeline_name: string;
  industry_type: PipelineIndustryType;
  is_active: boolean;
  stages: PipelineStage[];
}

export interface CreatePipelinePayload {
  clinic_id: number;
  pipeline_name: string;
  industry_type: PipelineIndustryType;
  is_active?: boolean;
}

export interface UpdatePipelinePayload {
  pipeline_name?: string;
  industry_type?: PipelineIndustryType;
  is_active?: boolean;
}

export interface CreatePipelineStagePayload {
  pipeline_id: string;
  stage_name: string;
  stage_type: PipelineStageType;
  stage_status?: PipelineStageStatus;
  stage_order?: number;
  stage_color?: string;
  entry_rule?: "manual" | "auto";
}

export interface UpdatePipelineStagePayload {
  stage_name: string;
  stage_type: PipelineStageType;
  stage_status: PipelineStageStatus;
  stage_order: number;
  stage_color?: string;
  entry_rule?: "manual" | "auto";
}

type PipelineStageApiResponse = Partial<PipelineStage> & {
  id?: string;
  stage_id?: string | number;
  stage_uuid?: string;
  uuid?: string;
  pk?: string | number;
  stage_name?: string;
  stage_type?: PipelineStageType;
  stage_status?: PipelineStageStatus;
  stage_order?: number;
  stage_color?: string;
  color_code?: string;
  entry_rule?: "manual" | "auto";
  rules?: PipelineStageRule[];
  fields?: PipelineStageField[];
};

type PipelineApiResponse = Partial<Pipeline> & {
  id?: string;
  pipeline_name?: string;
  industry_type?: PipelineIndustryType;
  is_active?: boolean;
  clinic_id?: number;
  clinic?: number;
  stages?: PipelineStageApiResponse[];
};

const normalizeStage = (
  stage: PipelineStageApiResponse,
  index: number,
): PipelineStage => ({
  id: String(
    stage.id ??
      stage.stage_id ??
      stage.stage_uuid ??
      stage.uuid ??
      stage.pk ??
      `stage-${index}`,
  ),
  stage_name: stage.stage_name ?? "Untitled Stage",
  stage_type: stage.stage_type ?? "lead",
  stage_status: stage.stage_status ?? "open",
  stage_order: stage.stage_order ?? index,
  stage_color: stage.stage_color ?? stage.color_code,
  entry_rule: stage.entry_rule,
  rules: Array.isArray(stage.rules) ? stage.rules : [],
  fields: Array.isArray(stage.fields) ? stage.fields : [],
});

const normalizePipeline = (pipeline: PipelineApiResponse): Pipeline => {
  const stages = Array.isArray(pipeline.stages)
    ? pipeline.stages.map((stage, index) => normalizeStage(stage, index))
    : [];

  return {
    id: String(pipeline.id ?? ""),
    clinic_id: pipeline.clinic_id,
    clinic: pipeline.clinic,
    pipeline_name: pipeline.pipeline_name ?? "Untitled Pipeline",
    industry_type: pipeline.industry_type ?? "other",
    is_active: pipeline.is_active ?? true,
    stages: stages.sort((left, right) => left.stage_order - right.stage_order),
  };
};

export const pipelineApi = {
  async list(clinicId: number): Promise<Pipeline[]> {
    const response = await http.get<PipelineApiResponse[]>("/pipelines/", {
      params: { clinic_id: clinicId },
    });
    return Array.isArray(response.data)
      ? response.data.map(normalizePipeline)
      : [];
  },

  async create(payload: CreatePipelinePayload): Promise<Pipeline> {
    const response = await http.post<PipelineApiResponse>("/pipelines/create/", payload);
    return normalizePipeline(response.data);
  },

  async getById(pipelineId: string): Promise<Pipeline> {
    const response = await http.get<PipelineApiResponse>(`/pipelines/${pipelineId}/`);
    return normalizePipeline(response.data);
  },

  async update(pipelineId: string, payload: UpdatePipelinePayload): Promise<Pipeline> {
    const response = await http.put<PipelineApiResponse>(`/pipelines/${pipelineId}/`, payload);
    return normalizePipeline(response.data);
  },

  async duplicate(pipelineId: string): Promise<Pipeline> {
    const response = await http.post<PipelineApiResponse>(
      `/pipelines/${pipelineId}/duplicate/`,
      {},
    );
    return normalizePipeline(response.data);
  },

  async archive(pipelineId: string): Promise<Pipeline> {
    const response = await http.post<PipelineApiResponse>(
      `/pipelines/${pipelineId}/archive/`,
      {},
    );
    return normalizePipeline(response.data);
  },

  async remove(pipelineId: string): Promise<void> {
    await http.delete(`/pipelines/${pipelineId}/delete/`);
  },

  async createStage(payload: CreatePipelineStagePayload): Promise<PipelineStage> {
    try {
      const response = await http.post<PipelineStageApiResponse>(
        "/pipelines/stages/create/",
        payload,
      );
      return normalizeStage(response.data, 0);
    } catch (error) {
      const candidate = error as {
        response?: { status?: number };
      };

      if (candidate?.response?.status !== 400) {
        throw error;
      }

      const fallbackPayload: Record<string, unknown> = {
        ...payload,
        pipeline: payload.pipeline_id,
        stage_status: payload.stage_status ?? "open",
      };

      const response = await http.post<PipelineStageApiResponse>(
        "/pipelines/stages/create/",
        fallbackPayload,
      );
      return normalizeStage(response.data, 0);
    }
  },

  async updateStage(
    stageId: string,
    payload: UpdatePipelineStagePayload,
  ): Promise<PipelineStage> {
    try {
      const response = await http.put<PipelineStageApiResponse>(
        `/pipelines/stages/${stageId}/update/`,
        payload,
      );
      return normalizeStage(response.data, payload.stage_order);
    } catch (error) {
      const candidate = error as { response?: { status?: number } };
      if (candidate?.response?.status !== 404) {
        throw error;
      }

      const response = await http.put<PipelineStageApiResponse>(
        `/pipelines/stages/${stageId}/`,
        payload,
      );
      return normalizeStage(response.data, payload.stage_order);
    }
  },

  async archiveStage(stageId: string): Promise<void> {
    try {
      await http.post(`/pipelines/stages/${stageId}/archive/`, {});
    } catch (error) {
      const candidate = error as { response?: { status?: number } };
      if (candidate?.response?.status !== 404) {
        throw error;
      }

      await http.post(`/pipelines/stages/${stageId}/archive`, {});
    }
  },

  async removeStage(stageId: string): Promise<void> {
    try {
      await http.delete(`/pipelines/stages/${stageId}/delete/`);
    } catch (error) {
      const candidate = error as { response?: { status?: number } };
      if (candidate?.response?.status !== 404) {
        throw error;
      }

      await http.delete(`/pipelines/stages/${stageId}/`);
    }
  },
};