import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import TemplateService from "../services/templates.api";
import type { APITemplateType } from "../services/templates.api";
import type { RootState } from ".";

type TemplateItem = Record<string, unknown>;

type TemplateState = {
  mail: TemplateItem[];
  sms: TemplateItem[];
  whatsapp: TemplateItem[];
  loading: boolean;
  error: string | null;
};

const initialState: TemplateState = {
  mail: [],
  sms: [],
  whatsapp: [],
  loading: false,
  error: null,
};

/**
 * 🔹 Fetch all templates (bulk load)
 */
export const fetchAllTemplates = createAsyncThunk(
  "templates/fetchAll",
  async () => {
    const [mail, sms, whatsapp] = await Promise.all([
      TemplateService.getTemplates("mail"),
      TemplateService.getTemplates("sms"),
      TemplateService.getTemplates("whatsapp"),
    ]);

    return {
      mail: Array.isArray(mail) ? mail : [],
      sms: Array.isArray(sms) ? sms : [],
      whatsapp: Array.isArray(whatsapp) ? whatsapp : [],
    };
  },
);

/**
 * 🔹 Fetch by type (optional when needed)
 */
export const fetchTemplatesByType = createAsyncThunk(
  "templates/fetchByType",
  async (type: APITemplateType) => {
    const res = await TemplateService.getTemplates(type);
    return { type, data: Array.isArray(res) ? res : [] };
  },
);

/**
 * 🔹 Delete template
 */
export const deleteTemplateThunk = createAsyncThunk(
  "templates/delete",
  async ({ type, id }: { type: APITemplateType; id: string }) => {
    await TemplateService.deleteTemplate(type, id);
    return { type, id };
  },
);

const templateSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.mail = action.payload.mail;
        state.sms = action.payload.sms;
        state.whatsapp = action.payload.whatsapp;
      })
      .addCase(fetchAllTemplates.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load templates";
      })

      // Fetch by type
      .addCase(fetchTemplatesByType.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        state[type] = data;
      })

      // Delete
      .addCase(deleteTemplateThunk.fulfilled, (state, action) => {
        const { type, id } = action.payload;
        state[type] = state[type].filter(
          (t) => (t as { id?: string | number }).id !== id,
        );
      });
  },
});

export default templateSlice.reducer;

/**
 * Selectors
 */
export const selectTemplates = (state: RootState) => state.templates;
export const selectTemplatesByType =
  (type: APITemplateType) => (state: RootState) =>
    state.templates[type];
export const selectTemplateLoading = (state: RootState) =>
  state.templates.loading;
