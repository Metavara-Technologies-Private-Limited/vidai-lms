import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { clinicApi } from "../services/clinic.api";
import type { Clinic } from "../types/clinic.types";
import type { RootState } from ".";

type ClinicState = {
  data: Clinic | null;
  loading: boolean;
  error: string | null;
};

const initialState: ClinicState = {
  data: null,
  loading: false,
  error: null,
};

// Fetch clinic once when app loads
export const fetchClinic = createAsyncThunk(
  "clinic/fetchClinic",
  async (clinicId: number) => {
    const res = await clinicApi.getById(clinicId);
    return res.data;
  },
);

const clinicSlice = createSlice({
  name: "clinic",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClinic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClinic.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchClinic.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load clinic";
      });
  },
});

export default clinicSlice.reducer;

export const selectClinic = (state: RootState) => state.clinic.data;
