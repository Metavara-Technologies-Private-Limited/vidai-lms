import { configureStore } from "@reduxjs/toolkit";
import clinicReducer from "./clinicSlice";
import leadReducer from "./leadSlice";
import emailTemplateReducer from "./emailTemplateSlice";
import campaignReducer from "./campaignSlice";

export const store = configureStore({
  reducer: {
    clinic: clinicReducer,
    leads: leadReducer,
    emailTemplate: emailTemplateReducer,  
    campaign: campaignReducer,  
  },
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
