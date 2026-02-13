import { createSlice,  } from "@reduxjs/toolkit";
import type { PayloadAction  } from "@reduxjs/toolkit";
interface EmailTemplateState {
  selectedTemplate: {
    subject: string;
    content: string;
  } | null;
}

const initialState: EmailTemplateState = {
  selectedTemplate: null,
};

const emailTemplateSlice = createSlice({
  name: "emailTemplate",
  initialState,
  reducers: {
    setSelectedTemplate: (state, action: PayloadAction<{ subject: string; content: string }>) => {
      state.selectedTemplate = action.payload;
    },
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
    },
  },
});

export const { setSelectedTemplate, clearSelectedTemplate } = emailTemplateSlice.actions;
export default emailTemplateSlice.reducer;
