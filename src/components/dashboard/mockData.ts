import type { MockData } from "../../types/dashboard.types.ts";

export const mockData: MockData = {
  kpis: [
    { id: "totalLeads", label: "Total Leads", value: 125 },
    { id: "newLeads", label: "New Leads", value: 41 },
    { id: "appointments", label: "Appointments", value: 20 },
    { id: "followUps", label: "Follow Ups", value: 20 },
    { id: "totalConverted", label: "Total Converted", value: 51 },
    { id: "register", label: "Register", value: 36 },
    { id: "treatment", label: "Treatment", value: 20 },
    { id: "lostLeads", label: "Lost Leads", value: 8 },
  ],

  slaAlerts: {
    new: [
      {
        id: 1,
        title: "Hot lead waiting for first contact for 30 mins",
        time: "Just now",
        description: "Immediate follow-up required to avoid drop-off",
        severity: "high",
      },
      {
        id: 2,
        title: "SLA nearing breach for 3 hot leads",
        time: "10 min ago",
        description: "Respond within 5 minutes to stay compliant",
        severity: "medium",
      },
    ],
    earlier: [
      {
        id: 3,
        title: "Lead at risk of going cold",
        time: "55 min ago",
        description: "Multiple contact attempts without response",
        severity: "medium",
      },
      {
        id: 4,
        title: "Call connection rate dropped to 42%",
        time: "6hr ago",
        description: "Consider switching to WhatsApp follow-ups",
        severity: "high",
      },
      {
        id: 5,
        title: "New lead assigned to you",
        time: "12hr ago",
        description: "Please initiate contact within 10 minutes",
        severity: "medium",
      },
      {
        id: 6,
        title: "Average response time exceeds SLA",
        time: "1 day ago",
        description: "Current average: 18 mins | Target: 10 mins",
        severity: "medium",
      },
    ],
  },

  overview: {
    activeTab: "source",
  },
};
