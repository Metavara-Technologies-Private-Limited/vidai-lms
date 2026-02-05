import type { MockData } from "../../types/dashboard.types.ts";

export const mockData: MockData = {
  kpis: [
    { id: "totalLeads", label: "Total Leads", value: 125 },
    { id: "newLeads", label: "New Leads", value: 41 },
    { id: "appointments", label: "Appointments", value: 20 },
    { id: "followUps", label: "Follow Ups", value: 20 },
    { id: "totalConverted", label: "Total Converted", value: 56 }, 
    { id: "register", label: "Register", value: 36 },
    { id: "treatment", label: "Treatment", value: 20 },
    { id: "lostLeads", label: "Lost Leads", value: 8 },
  ],

  slaAlerts: {
    new: [
      { id: 1, title: "Hot lead waiting for first contact for 30 mins", time: "Just now", description: "Immediate follow-up required", severity: "high" },
      { id: 2, title: "SLA nearing breach for 3 hot leads", time: "10 min ago", description: "Respond within 5 minutes", severity: "medium" },
    ],
    earlier: [
      { id: 3, title: "Lead at risk of going cold", time: "55 min ago", description: "Multiple contact attempts without response", severity: "medium" },
      { id: 4, title: "Call connection rate dropped to 42%", time: "6hr ago", description: "Consider switching to WhatsApp", severity: "high" },
      { id: 5, title: "New lead assigned to you", time: "12hr ago", description: "Initiate contact within 10 mins", severity: "medium" },
      { id: 6, title: "Average response time exceeds SLA", time: "1 day ago", description: "Current average: 18 mins", severity: "medium" },
    ],
  },

  overview: {
    activeTab: "source",
    sourcePerformance: [
      { name: "Website", campaign: "Campaign A", hot: 29, warm: 13, cold: 7, convRate: 53.5, revenue: 295, cost: 24.8 },
      { name: "Chatbot", campaign: "Campaign B", hot: 20, warm: 6, cold: 8, convRate: 70.0, revenue: 412, cost: 33.9 },
      { name: "Social Media", campaign: "Campaign C", hot: 32, warm: 15, cold: 7, convRate: 55.0, revenue: 740.2, cost: 24.2 },
      { name: "Referral", campaign: "Campaign D", hot: 18, warm: 17, cold: 4, convRate: 69.2, revenue: 558, cost: 28.7 },
      { name: "Call Center", campaign: "Campaign E", hot: 46, warm: 11, cold: 10, convRate: 46.8, revenue: 433, cost: 34.2 },
      { name: "Walk-Ins", campaign: "Campaign F", hot: 23, warm: 8, cold: 6, convRate: 49.9, revenue: 271, cost: 26.5 },
    ],
    communicationPerformance: [
      { platform: "Email", high: 14, low: 6, no: 3 },
      { platform: "WhatsApp", high: 15, low: 7, no: 3 },
      { platform: "Call", high: 10, low: 3, no: 4 },
      { platform: "Chatbot", high: 5, low: 9, no: 3 },
    ],
    conversionTrendPerformance: [
      { month: "Jan", rate: 41.0 },
      { month: "Feb", rate: 31.5 },
      { month: "Mar", rate: 58.0 },
      { month: "Apr", rate: 47.3 },
      { month: "May", rate: 60.5 },
      { month: "Jun", rate: 49.0 },
      { month: "Jul", rate: 68.2 },
      { month: "Aug", rate: 23.5 },
      { month: "Sep", rate: 40.5 },
      { month: "Oct", rate: 33.2 },
      { month: "Nov", rate: 50.1 },
      { month: "Dec", rate: 25.4 },
    ],
    pipelineData: [
  { stage: "New Leads", value: 41, color: "#7d859d" },
  { stage: "Appointments", value: 20, color: "#8e96ad" },
  { stage: "Follow-Ups", value: 20, color: "#a3abc1" },
  { stage: "Converted Leads", value: 56, color: "#b8bed3" },
  { stage: "Cycle Conversion", value: 36, color: "#daddf0" },
  { stage: "Lost Leads", value: 8, color: "#eff1f9" },
],
appointmentsPerformance: [
  { status: "Appointments Booked", value: 36, color: "#daddf0" },
  { status: "Completed", value: 27, color: "#daddf0" },
  { status: "No-shows", value: 20, color: "#7d859d" }, // Highlighted per design
  { status: "Cancelled", value: 31, color: "#daddf0" },
],
teamPerformance: {
      members: [
        { name: "Alex Carry", role: "Doctor", img: "/avatars/alex.jpg", growth: "+8.8%" },
        { name: "Dr. Jenny Wick", role: "Doctor", img: "/avatars/jenny.jpg", growth: "-3.8%" },
        { name: "Emilia Fox", role: "Doctor", img: "/avatars/emilia.jpg", growth: "+8.8%", rank: "1st (Top)" },
        { name: "Cherry Jones", role: "Doctor", img: "/avatars/cherry.jpg", growth: "-2.1%" },
        { name: "Cody Fisher", role: "Doctor", img: "/avatars/cody.jpg", growth: "+8.8%", rank: "2nd" },
        { name: "Wade Warren", role: "Doctor", img: "/avatars/wade.jpg", growth: "+8.8%", rank: "3rd" },
      ],
      overview: { calls: "1,284", followUps: "742", appointments: "318", converted: "96", rate: "40.3%", revenue: "$10,954.0", sla: "90.4%" }
    }
  },
};