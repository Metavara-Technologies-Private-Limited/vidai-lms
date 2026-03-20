import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  pipelineApi,
  type CreatePipelinePayload,
  type CreatePipelineStagePayload,
  type Pipeline,
  type PipelineStage,
  type UpdatePipelineStagePayload,
} from "../services/pipeline.api";
import type { RootState } from ".";

type PipelineState = {
  items: Pipeline[];
  selectedPipeline: Pipeline | null;
  loading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: PipelineState = {
  items: [],
  selectedPipeline: null,
  loading: false,
  detailLoading: false,
  saving: false,
  error: null,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const candidate = error as {
    response?: { data?: { detail?: string; message?: string } };
    message?: string;
  };

  return (
    candidate?.response?.data?.detail ||
    candidate?.response?.data?.message ||
    candidate?.message ||
    fallback
  );
};

const upsertPipeline = (items: Pipeline[], pipeline: Pipeline): Pipeline[] => {
  const existingIndex = items.findIndex((item) => item.id === pipeline.id);
  if (existingIndex === -1) {
    return [pipeline, ...items];
  }

  const nextItems = [...items];
  nextItems[existingIndex] = pipeline;
  return nextItems;
};

const mergeStage = (pipeline: Pipeline, stage: PipelineStage): Pipeline => {
  const stageIndex = pipeline.stages.findIndex((item) => item.id === stage.id);
  const nextStages = [...pipeline.stages];

  if (stageIndex === -1) {
    nextStages.push(stage);
  } else {
    nextStages[stageIndex] = stage;
  }

  nextStages.sort((left, right) => left.stage_order - right.stage_order);
  return { ...pipeline, stages: nextStages };
};

export const fetchPipelines = createAsyncThunk<Pipeline[], void, { rejectValue: string }>(
  "pipeline/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await pipelineApi.list();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load pipelines"));
    }
  },
);

export const fetchPipelineDetail = createAsyncThunk<
  Pipeline,
  string,
  { rejectValue: string }
>("pipeline/fetchDetail", async (pipelineId, { rejectWithValue }) => {
  try {
    return await pipelineApi.getById(pipelineId);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load pipeline details"));
  }
});

export const createPipeline = createAsyncThunk<
  Pipeline,
  CreatePipelinePayload,
  { rejectValue: string }
>("pipeline/create", async (payload, { rejectWithValue }) => {
  try {
    return await pipelineApi.create(payload);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to create pipeline"));
  }
});

export const createPipelineStage = createAsyncThunk<
  { pipelineId: string; stage: PipelineStage },
  CreatePipelineStagePayload,
  { rejectValue: string }
>("pipeline/createStage", async (payload, { rejectWithValue }) => {
  try {
    const stage = await pipelineApi.createStage(payload);
    return { pipelineId: payload.pipeline_id, stage };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to create stage"));
  }
});

export const updatePipelineStage = createAsyncThunk<
  { pipelineId: string; stage: PipelineStage },
  { pipelineId: string; stageId: string; payload: UpdatePipelineStagePayload },
  { rejectValue: string }
>("pipeline/updateStage", async ({ pipelineId, stageId, payload }, { rejectWithValue }) => {
  try {
    const stage = await pipelineApi.updateStage(stageId, payload);
    return { pipelineId, stage };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to update stage"));
  }
});

const pipelineSlice = createSlice({
  name: "pipeline",
  initialState,
  reducers: {
    clearPipelineError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPipelines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPipelines.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        if (state.selectedPipeline) {
          const refreshed = action.payload.find(
            (pipeline) => pipeline.id === state.selectedPipeline?.id,
          );
          if (refreshed) {
            state.selectedPipeline = refreshed;
          }
        }
      })
      .addCase(fetchPipelines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load pipelines";
      })
      .addCase(fetchPipelineDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPipelineDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedPipeline = action.payload;
        state.items = upsertPipeline(state.items, action.payload);
      })
      .addCase(fetchPipelineDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload ?? "Failed to load pipeline details";
      })
      .addCase(createPipeline.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createPipeline.fulfilled, (state, action) => {
        state.saving = false;
        state.items = upsertPipeline(state.items, action.payload);
        state.selectedPipeline = action.payload;
      })
      .addCase(createPipeline.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to create pipeline";
      })
      .addCase(createPipelineStage.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createPipelineStage.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.map((pipeline) =>
          pipeline.id === action.payload.pipelineId
            ? mergeStage(pipeline, action.payload.stage)
            : pipeline,
        );
        if (state.selectedPipeline?.id === action.payload.pipelineId) {
          state.selectedPipeline = mergeStage(state.selectedPipeline, action.payload.stage);
        }
      })
      .addCase(createPipelineStage.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to create stage";
      })
      .addCase(updatePipelineStage.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePipelineStage.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.map((pipeline) =>
          pipeline.id === action.payload.pipelineId
            ? mergeStage(pipeline, action.payload.stage)
            : pipeline,
        );
        if (state.selectedPipeline?.id === action.payload.pipelineId) {
          state.selectedPipeline = mergeStage(state.selectedPipeline, action.payload.stage);
        }
      })
      .addCase(updatePipelineStage.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to update stage";
      });
  },
});

export const { clearPipelineError } = pipelineSlice.actions;

export default pipelineSlice.reducer;

export const selectPipelines = (state: RootState) => state.pipeline.items;
export const selectSelectedPipeline = (state: RootState) => state.pipeline.selectedPipeline;
export const selectPipelineLoading = (state: RootState) => state.pipeline.loading;
export const selectPipelineDetailLoading = (state: RootState) => state.pipeline.detailLoading;
export const selectPipelineSaving = (state: RootState) => state.pipeline.saving;
export const selectPipelineError = (state: RootState) => state.pipeline.error;