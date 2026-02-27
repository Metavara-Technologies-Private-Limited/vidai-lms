import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
export interface EmailHistoryItem {
  id: string;
  to: string;
  subject: string;
  message: string;
  created_at: string;
  ticket_id: string; 
}

interface EmailHistoryState {
  emails: EmailHistoryItem[];
}

const initialState: EmailHistoryState = {
  emails: [],
};

const emailHistorySlice = createSlice({
  name: "emailHistory",
  initialState,
  reducers: {
    addEmail: (state, action: PayloadAction<EmailHistoryItem>) => {
      // Add new email to top
      state.emails.unshift(action.payload);
    },
    clearEmails: (state) => {
      state.emails = [];
    },
  },
});

export const { addEmail, clearEmails } = emailHistorySlice.actions;
export default emailHistorySlice.reducer;
