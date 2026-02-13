import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { CampaignAPI } from "../services/campaign.api";
import type { RootState } from ".";

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

// 🔥 Fetch campaigns
export const fetchCampaign = createAsyncThunk(
  "campaign/fetchCampaign",
  async () => {
    const res = await CampaignAPI.list();
    return res.data;
  }
);

const campaignSlice = createSlice({
  name: "campaign",
  initialState,
  reducers: {
    // ✅ NEW: Update campaign status
    updateCampaignStatus: (state, action) => {
      const { id, status } = action.payload;

      const campaign = state.data.find((c: any) => c.id === id);
      if (campaign) {
        campaign.is_active = status === "Live";
      }
    },
  },
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
      });
  },
});

export default campaignSlice.reducer;

export const { updateCampaignStatus } = campaignSlice.actions;

// Selector
export const selectCampaign = (state: RootState) =>
  state.campaign.data;
