import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { usersApi } from "../services/users.api";
import type { UserRecord } from "../services/users.api";
import { AxiosError } from "axios";
import type { RootState } from ".";

type UsersState = {
  data: UserRecord[];
  loading: boolean;
  error: string | null;
};

const initialState: UsersState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const users = await usersApi.list();
      return users;
    } catch (err: unknown) {
      console.log("User fetch error:", err);
      if (err instanceof AxiosError) {
        return rejectWithValue(err.message || "Failed to fetch users");
      }

      return rejectWithValue("Failed to fetch users");
    }
  },
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default usersSlice.reducer;

export const selectUsers = (state: RootState) => state.users.data;