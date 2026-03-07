/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { CampaignAPI } from "../services/campaign.api";
import type { RootState } from ".";
import type { CampaignStatus } from "../types/campaigns.types";

type CampaignState = {
  data: any[];
  loading: boolean;
  error: string | null;
};

const initialState: CampaignState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchCampaign = createAsyncThunk(
  "campaign/fetchCampaign",
  async () => {
    const res = await CampaignAPI.list();
    return res.data;
  }
);

export const updateCampaignStatus = createAsyncThunk(
  "campaign/updateCampaignStatus",
  async ({ id, status }: { id: string; status: CampaignStatus }, { getState, rejectWithValue }) => {
    try {
      const apiStatus =
        status === "Live"      ? "live"      :
        status === "Stopped"   ? "stopped"   :
        status === "Scheduled" ? "scheduled" : "draft";

      // ✅ Get full campaign data from Redux store
      const state = getState() as RootState;
      const fullCampaign = state.campaign.data.find((c: any) => c.id === id);

      if (!fullCampaign) return rejectWithValue("Campaign not found");

      // ✅ Send full campaign data with updated status
      await CampaignAPI.updateStatus(id, apiStatus, { ...fullCampaign, status: apiStatus });
      return { id, status };
    } catch (err: any) {
      return rejectWithValue(err.response?.data ?? "Failed to update status");
    }
  }
);

const campaignSlice = createSlice({
  name: "campaign",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaign.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCampaign.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load campaigns";
      })

      // ✅ Optimistic update while API call is in-flight
      .addCase(updateCampaignStatus.pending, (state, action) => {
        const { id, status } = action.meta.arg;
        const campaign = state.data.find((c: any) => c.id === id);
        if (campaign) {
          campaign.status = status;
          campaign.is_active = status === "Live";
        }
      })

      // ✅ API succeeded — keep Redux as-is (already updated in pending)
      .addCase(updateCampaignStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        const campaign = state.data.find((c: any) => c.id === id);
        if (campaign) {
          campaign.status = status;
          campaign.is_active = status === "Live";
        }
      })

      .addCase(updateCampaignStatus.rejected, (state, action) => {
  console.error("Status update failed:", action.payload);
  // Re-fetch to revert optimistic update
  // (handled outside, but at minimum log it)
})
  },
});

export default campaignSlice.reducer;

<<<<<<< Updated upstream
export const { updateCampaignStatus } = campaignSlice.actions;

// Selector
export const selectCampaign = (state: RootState) =>
  state.campaign.data;
export const selectCampaignLoading = (state: RootState) =>
  state.campaign.loading;
=======
export const selectCampaign = (state: RootState) => state.campaign.data;
>>>>>>> Stashed changes
