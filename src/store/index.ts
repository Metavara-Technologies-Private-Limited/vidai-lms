import { configureStore } from "@reduxjs/toolkit";
import clinicReducer from "./clinicSlice";
import leadReducer from "./leadSlice";
import emailTemplateReducer from "./emailTemplateSlice";
import campaignReducer from "./campaignSlice";
import ticketReducer from "./ticketSlice"; 
import templateReducer from "./templateSlice"; 
import emailHistoryReducer from "./emailHistorySlice";

export const store = configureStore({
  reducer: {
    clinic: clinicReducer,
    leads: leadReducer,
    emailTemplate: emailTemplateReducer,
    campaign: campaignReducer,
    tickets: ticketReducer,
    templates: templateReducer,
    emailHistory: emailHistoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;