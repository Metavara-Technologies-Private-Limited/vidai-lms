import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { clinicApi } from "../services/clinic.api";
import type { Clinic } from "../types/clinic.types";
import type { RootState } from ".";

type ApiError = {
  response?: {
    status?: number;
  };
};

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
  async (clinicId: number, { rejectWithValue }) => {
    try {
      const res = await clinicApi.getById(clinicId);
      return res.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError?.response?.status === 404) {
        return rejectWithValue("Clinic not found");
      }
      return rejectWithValue("Failed to load clinic");
    }
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
      if (typeof window !== "undefined" && action.payload?.id) {
        localStorage.setItem("clinic_id", String(action.payload.id));
      }
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
        if (typeof window !== "undefined" && action.payload?.id) {
          localStorage.setItem("clinic_id", String(action.payload.id));
        }
      })
      .addCase(fetchClinic.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        const payload = action.payload as string | undefined;
        // Do not block the page on stale clinic IDs from auth payload.
        state.error = payload === "Clinic not found" ? null : "Failed to load clinic";
        if (payload === "Clinic not found" && typeof window !== "undefined") {
          const currentStoredClinicId = Number(localStorage.getItem("clinic_id") || 0) || null;
          if (currentStoredClinicId === action.meta.arg) {
            localStorage.removeItem("clinic_id");
          }
        }
      });
  },
});

export default clinicSlice.reducer;

export const { setSelectedClinic } = clinicSlice.actions;
export const selectClinic = (state: RootState) => state.clinic.data;
export const selectClinicLoading = (state: RootState) => state.clinic.loading;
