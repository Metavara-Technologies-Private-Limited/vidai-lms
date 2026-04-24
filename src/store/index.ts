import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import usersReducer from "./userSlice";
import clinicReducer from "./clinicSlice";
import leadReducer from "./leadSlice";
import emailTemplateReducer from "./emailTemplateSlice";
import campaignReducer from "./campaignSlice";
import ticketReducer from "./ticketSlice";
import templateReducer from "./templateSlice";
import emailHistoryReducer from "./emailHistorySlice";
import mailInsightsReducer from "./mailInsightsSlice";
import reputationReducer from "./reputationSlice";
import pipelineReducer from "./pipelineSlice";
import referralReducer from "./referralSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    clinic: clinicReducer,
    leads: leadReducer,
    emailTemplate: emailTemplateReducer,
    campaign: campaignReducer,
    tickets: ticketReducer,
    templates: templateReducer,
    emailHistory: emailHistoryReducer,
    mailInsights: mailInsightsReducer, // ✅ mail insights KPI
    reputation: reputationReducer,
    pipeline: pipelineReducer,
    referral: referralReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;