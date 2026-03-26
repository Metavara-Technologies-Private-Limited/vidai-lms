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
type ProfileClinic = {
  clinic_id: number;
  clinic__name: string;
};

export const syncClinic = async (
  clinic: ProfileClinic,
  email: string,
) => {
  const res = await clinicApi.searchByName(clinic.clinic__name);

  if (res.data.length > 0) return;

  await clinicApi.create({
    name: clinic.clinic__name,
    email,
  });
};
const clinicSlice = createSlice({
  name: "clinic",
  initialState,
  reducers: {
    setSelectedClinic: (state, action) => {
      state.data = action.payload;
    },
  },
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

export const { setSelectedClinic } = clinicSlice.actions;
export const selectClinic = (state: RootState) => state.clinic.data;
export const selectClinicLoading = (state: RootState) => state.clinic.loading;
