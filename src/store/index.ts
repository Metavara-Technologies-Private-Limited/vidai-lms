import { configureStore } from "@reduxjs/toolkit";
import clinicReducer from "./clinicSlice";
import leadReducer from "./leadSlice";
import emailTemplateReducer from "./emailTemplateSlice";
import campaignReducer from "./campaignSlice";
import ticketReducer from "./ticketSlice"; // 1. Import the ticket reducer

export const store = configureStore({
  reducer: {
    clinic: clinicReducer,
    leads: leadReducer,
    emailTemplate: emailTemplateReducer,  
    campaign: campaignReducer, 
    tickets: ticketReducer, // 2. Register it as "tickets"
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;