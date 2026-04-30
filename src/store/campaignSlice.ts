import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { CampaignAPI } from "../services/campaign.api";
import type { RootState } from ".";
import {
  CAMPAIGN_STATUS,
  STATUS_TO_API,
} from "../constants/campaigns.constants";
import type { CampaignAPIType } from "../types/campaigns.types";
import type { CampaignStatus } from "../constants/campaigns.constants";

type CampaignState = {
  data: CampaignAPIType[];
  loading: boolean;
  error: string | null;
};

const initialState: CampaignState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchCampaign = createAsyncThunk<
  CampaignAPIType[],
  void,
  { state: RootState; rejectValue: string }
>("campaign/fetchCampaign", async (_, { getState, rejectWithValue }) => {
  try {
    // Use Redux clinic state (same pattern as fetchLeads) so clinic
    // switches in the header are immediately reflected
    const clinicId = getState().clinic.data?.id;
    if (!clinicId) return rejectWithValue("Clinic not selected");
    const res = await CampaignAPI.list(clinicId);
    return res.data;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to fetch campaigns",
    );
  }
});

export const updateCampaignStatus = createAsyncThunk<
  { id: string; status: CampaignStatus },
  { id: string; status: CampaignStatus },
  { state: RootState; rejectValue: string }
>(
  "campaign/updateCampaignStatus",
  async ({ id, status }, { getState, rejectWithValue }) => {
    try {
      const apiStatus = STATUS_TO_API[status];

      const state = getState();
      const fullCampaign = state.campaign.data.find((c) => c.id === id);

      if (!fullCampaign) return rejectWithValue("Campaign not found");

      await CampaignAPI.updateStatus(id, apiStatus, {
        ...fullCampaign,
        status: apiStatus as CampaignStatus,
      });

      return { id, status };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }

      return rejectWithValue("Failed to update status");
    }
  },
);

const campaignSlice = createSlice({
  name: "campaign",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch campaigns
      .addCase(fetchCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCampaign.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load campaigns";
      })
      // Update Status
      .addCase(updateCampaignStatus.pending, (state, action) => {
        const { id, status } = action.meta.arg;
        const campaign = state.data.find((c) => c.id === id);

        if (campaign) {
          campaign.status = status;
          campaign.is_active = status === CAMPAIGN_STATUS.LIVE;
        }
      })
      .addCase(updateCampaignStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        const campaign = state.data.find((c) => c.id === id);

        if (campaign) {
          campaign.status = status;
          campaign.is_active = status === CAMPAIGN_STATUS.LIVE;
        }
      })
      .addCase(updateCampaignStatus.rejected, (_state, action) => {
        console.error("Status update failed:", action.payload);
      });
  },
});

export default campaignSlice.reducer;

export const selectCampaign = (state: RootState) => state.campaign.data;

export const selectCampaignLoading = (state: RootState) =>
  state.campaign.loading;