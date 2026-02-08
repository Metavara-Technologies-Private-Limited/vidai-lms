import type { Lead } from "../../types/leads.types";

export const leadsMock: Lead[] = [
  {
    initials: "JS",
    name: "John Smith",
    id: "#LN-201",
    date: "12/11/2025",
    time: "12:36 PM",
    location: "LA Jolla, California",
    source: "Social Media",
    status: "New",
    quality: "Hot",
    score: "82.04%",
    assigned: "Henry Cavil",
    task: "Call Patient",
    taskStatus: "Pending",
    activity: "Lead created",
  },
  {
    initials: "AJ",
    name: "Alex Johnson",
    id: "#LN-202",
    date: "12/11/2025",
    time: "10:15 AM",
    location: "Sunny C, California",
    source: "Email Campaign",
    status: "Appointment",
    quality: "Warm",
    score: "55.67%",
    assigned: "Emilia Clarke",
    task: "Book Appointment",
    taskStatus: "In Progress",
    activity: "Appointment scheduled",
  },
  {
    initials: "ML",
    name: "Mary Lee",
    id: "#LN-203",
    date: "12/12/2025",
    time: "09:30 AM",
    location: "San Diego, California",
    source: "Referral",
    status: "Follow-Ups",
    quality: "Hot",
    score: "78.22%",
    assigned: "Tom Hardy",
    task: "Follow-Up Call",
    taskStatus: "Pending",
    activity: "Follow-up reminder set",
  },
  {
    initials: "RK",
    name: "Robert King",
    id: "#LN-204",
    date: "12/12/2025",
    time: "11:00 AM",
    location: "Los Angeles, California",
    source: "Social Media",
    status: "Converted",
    quality: "Warm",
    score: "92.11%",
    assigned: "Chris Evans",
    task: "Send Contract",
    taskStatus: "Completed",
    activity: "Contract sent",
  },
  {
    initials: "SN",
    name: "Sarah Newman",
    id: "#LN-205",
    date: "12/13/2025",
    time: "02:45 PM",
    location: "San Francisco, California",
    source: "Email Campaign",
    status: "Lost",
    quality: "Cold",
    score: "30.00%",
    assigned: "Scarlett Johansson",
    task: "Re-Engage",
    taskStatus: "Pending",
    activity: "No response",
  },

  // Remaining leads auto-balanced
  {
    initials: "LP", name: "Lisa Parker", id: "#LN-206", date: "12/14/2025", time: "01:30 PM",
    location: "Santa Monica, California", source: "Referral", status: "New",
    quality: "Hot", score: "80.50%", assigned: "Henry Cavil", task: "Call Patient",
    taskStatus: "Pending", activity: "Call scheduled"
  },
  {
    initials: "DP", name: "David Patel", id: "#LN-207", date: "12/14/2025", time: "03:20 PM",
    location: "Los Angeles, California", source: "Email Campaign", status: "Follow-Ups",
    quality: "Warm", score: "61.33%", assigned: "Emilia Clarke", task: "Follow-Up Email",
    taskStatus: "In Progress", activity: "Email sent"
  },
  {
    initials: "KH", name: "Karen Hill", id: "#LN-208", date: "12/15/2025", time: "10:50 AM",
    location: "San Diego, California", source: "Social Media", status: "Appointment",
    quality: "Hot", score: "75.12%", assigned: "Tom Hardy", task: "Schedule Meeting",
    taskStatus: "Completed", activity: "Meeting booked"
  },
  {
    initials: "JB", name: "James Brown", id: "#LN-209", date: "12/15/2025", time: "12:10 PM",
    location: "San Francisco, California", source: "Referral", status: "Converted",
    quality: "Hot", score: "90.50%", assigned: "Chris Evans", task: "Send Contract",
    taskStatus: "Completed", activity: "Deal closed"
  },
  {
    initials: "EC", name: "Emma Clark", id: "#LN-210", date: "12/16/2025", time: "11:25 AM",
    location: "Santa Monica, California", source: "Email Campaign", status: "Lost",
    quality: "Cold", score: "40.12%", assigned: "Scarlett Johansson", task: "Re-Engage",
    taskStatus: "Pending", activity: "Follow-up pending"
  },
  {
    initials: "MW", name: "Michael White", id: "#LN-211", date: "12/16/2025", time: "02:15 PM",
    location: "LA Jolla, California", source: "Social Media", status: "Cycle Conversion",
    quality: "Warm", score: "65.33%", assigned: "Henry Cavil", task: "Follow-Up Call",
    taskStatus: "In Progress", activity: "Spoke with client"
  },
  {
    initials: "RL", name: "Rachel Lee", id: "#LN-212", date: "12/17/2025", time: "09:40 AM",
    location: "San Diego, California", source: "Referral", status: "New",
    quality: "Hot", score: "81.55%", assigned: "Emilia Clarke", task: "Call Patient",
    taskStatus: "Pending", activity: "Lead assigned"
  },
  {
    initials: "TC", name: "Tom Carter", id: "#LN-213", date: "12/17/2025", time: "01:00 PM",
    location: "Los Angeles, California", source: "Email Campaign", status: "Follow-Ups",
    quality: "Warm", score: "70.12%", assigned: "Tom Hardy", task: "Follow-Up Email",
    taskStatus: "In Progress", activity: "Awaiting reply"
  },
  {
    initials: "AL", name: "Anna Lopez", id: "#LN-214", date: "12/18/2025", time: "03:30 PM",
    location: "San Francisco, California", source: "Social Media", status: "Converted",
    quality: "Hot", score: "95.44%", assigned: "Chris Evans", task: "Send Contract",
    taskStatus: "Completed", activity: "Contract signed"
  },
  {
    initials: "BG", name: "Brian Green", id: "#LN-215", date: "12/18/2025", time: "11:15 AM",
    location: "Santa Monica, California", source: "Referral", status: "Lost",
    quality: "Cold", score: "25.67%", assigned: "Scarlett Johansson", task: "Re-Engage",
    taskStatus: "Pending", activity: "Not reachable"
  },
];
