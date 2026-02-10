export interface Template {
  id: string;
  name: string;
  subject: string;
  useCase: 'Appointment' | 'Follow-Up' | 'Reminder' | 'Re-engagement' | 'No-Show' | 'Feedback' | 'Marketing';
  lastUpdatedAt: string;
  createdBy: string;
  type: 'email' | 'sms' | 'whatsapp';
}

export const TEMPLATES_MOCK_DATA: Template[] = [
  // IDs 1-17: Email
  { id: '1', name: 'Appointment Confirmation', subject: 'Your Consultation is Confirmed - {appointment_date}', useCase: 'Appointment', lastUpdatedAt: '24/12/2025 | 10:15 AM', createdBy: 'System', type: 'email' },
  { id: '2', name: 'IVF Follow-Up', subject: 'Next Steps for your IVF Plan', useCase: 'Follow-Up', lastUpdatedAt: '31/10/2025 | 2:45 PM', createdBy: 'Dr. Alex Carry', type: 'email' },
  { id: '3', name: 'Consultation Reminder', subject: 'Your Appointment is Tomorrow', useCase: 'Reminder', lastUpdatedAt: '29/08/2025 | 8:30 AM', createdBy: 'Dr. Emilia Clarke', type: 'email' },
  { id: '4', name: 'Welcome Back', subject: 'Welcome Back to VIDAI Clinic', useCase: 'Re-engagement', lastUpdatedAt: '26/07/2025 | 4:00 PM', createdBy: 'System', type: 'email' },
  { id: '5', name: 'Booking Inquiry', subject: 'Checking In on Your Inquiry', useCase: 'Feedback', lastUpdatedAt: '21/06/2025 | 11:55 AM', createdBy: 'System', type: 'email' },
  { id: '6', name: 'Procedure Instructions', subject: 'Preparation for your Procedure', useCase: 'Follow-Up', lastUpdatedAt: '08/06/2025 | 12:00 PM', createdBy: 'Dr. Alex Carry', type: 'email' },
  { id: '7', name: 'No-Show Follow-Up', subject: 'We Missed You Today', useCase: 'No-Show', lastUpdatedAt: '25/05/2025 | 6:50 PM', createdBy: 'Dr. John Snow', type: 'email' },
  { id: '13', name: 'Post-IVF Care', subject: 'Important: Care Plan', useCase: 'Follow-Up', lastUpdatedAt: '09/02/2026 | 09:00 AM', createdBy: 'Dr. Alex Carry', type: 'email' },
  { id: '14', name: 'Monthly Newsletter', subject: 'February Edition', useCase: 'Marketing', lastUpdatedAt: '08/02/2026 | 11:20 AM', createdBy: 'System', type: 'email' },
  { id: '15', name: 'Lab Results', subject: 'Results Available', useCase: 'Appointment', lastUpdatedAt: '07/02/2026 | 02:45 PM', createdBy: 'System', type: 'email' },
  { id: '16', name: 'Missed Call', subject: 'Follow-up regarding inquiry', useCase: 'Re-engagement', lastUpdatedAt: '06/02/2026 | 04:10 PM', createdBy: 'Dr. John Snow', type: 'email' },
  { id: '17', name: 'Holiday Greetings', subject: 'Warm Wishes from VIDAI', useCase: 'Marketing', lastUpdatedAt: '05/02/2026 | 10:00 AM', createdBy: 'System', type: 'email' },
  { id: '18', name: 'Rescheduling', subject: 'New Appointment Time', useCase: 'Reminder', lastUpdatedAt: '04/02/2026 | 01:15 PM', createdBy: 'Dr. Emilia Clarke', type: 'email' },
  { id: '19', name: 'Feedback Survey', subject: 'Share Your Experience', useCase: 'Feedback', lastUpdatedAt: '03/02/2026 | 03:50 PM', createdBy: 'System', type: 'email' },
  { id: '20', name: 'Inactivity Reminder', subject: 'We haven’t seen you', useCase: 'No-Show', lastUpdatedAt: '02/02/2026 | 09:30 AM', createdBy: 'System', type: 'email' },
  { id: '21', name: 'Genetic Screening', subject: 'Screening Options', useCase: 'Appointment', lastUpdatedAt: '01/02/2026 | 11:00 AM', createdBy: 'Dr. Alex Carry', type: 'email' },
  { id: '22', name: 'Insurance Update', subject: 'Coverage Details', useCase: 'Follow-Up', lastUpdatedAt: '31/01/2026 | 04:20 PM', createdBy: 'System', type: 'email' },

  // IDs 8-9, 23-32: SMS
  { id: '8', name: 'Quick Reminder', subject: 'Hi {lead_first_name}, visit tomorrow at {appointment_time}.', useCase: 'Reminder', lastUpdatedAt: '25/01/2026 | 11:30 AM', createdBy: 'System', type: 'sms' },
  { id: '9', name: 'Post-Visit Feedback', subject: 'Tap here to review: {review_link}', useCase: 'Feedback', lastUpdatedAt: '20/01/2026 | 09:15 AM', createdBy: 'Dr. Alex Carry', type: 'sms' },
  { id: '23', name: 'Prescription Ready', subject: 'Ready for pickup at pharmacy.', useCase: 'Reminder', lastUpdatedAt: '09/02/2026 | 10:45 AM', createdBy: 'System', type: 'sms' },
  { id: '24', name: 'Check-in SMS', subject: 'Hope you are well today!', useCase: 'Follow-Up', lastUpdatedAt: '08/02/2026 | 02:10 PM', createdBy: 'Dr. John Snow', type: 'sms' },
  { id: '25', name: 'Offer SMS', subject: '10% off screenings this week!', useCase: 'Marketing', lastUpdatedAt: '07/02/2026 | 08:30 AM', createdBy: 'System', type: 'sms' },
  { id: '26', name: 'No-Show SMS', subject: 'We missed you. Reschedule?', useCase: 'No-Show', lastUpdatedAt: '06/02/2026 | 05:20 PM', createdBy: 'Dr. Alex Carry', type: 'sms' },
  { id: '27', name: 'OTP SMS', subject: 'Your login code is {otp_code}.', useCase: 'Appointment', lastUpdatedAt: '05/02/2026 | 12:00 PM', createdBy: 'System', type: 'sms' },
  { id: '28', name: 'Moved SMS', subject: 'Visit our new branch: {address}', useCase: 'Marketing', lastUpdatedAt: '04/02/2026 | 09:15 AM', createdBy: 'System', type: 'sms' },
  { id: '29', name: 'Survey SMS', subject: 'Take our survey: {link}', useCase: 'Feedback', lastUpdatedAt: '03/02/2026 | 01:40 PM', createdBy: 'System', type: 'sms' },
  { id: '30', name: 'Meds Reminder', subject: 'Take your morning meds.', useCase: 'Reminder', lastUpdatedAt: '02/02/2026 | 07:00 AM', createdBy: 'Dr. Emilia Clarke', type: 'sms' },
  { id: '31', name: 'Fee Received', subject: 'Payment received. Thank you!', useCase: 'Appointment', lastUpdatedAt: '01/02/2026 | 11:25 AM', createdBy: 'System', type: 'sms' },
  { id: '32', name: 'Urgent Update', subject: 'Call clinic regarding visit.', useCase: 'Follow-Up', lastUpdatedAt: '31/01/2026 | 02:50 PM', createdBy: 'Dr. Alex Carry', type: 'sms' },

  // IDs 10-12, 33-42: WhatsApp
  { id: '10', name: 'WA Welcome', subject: 'Welcome to clinic! Happy to assist.', useCase: 'Appointment', lastUpdatedAt: '05/02/2026 | 10:00 AM', createdBy: 'System', type: 'whatsapp' },
  { id: '11', name: 'WA Health Tips', subject: 'Tips for maintaining wellness!', useCase: 'Marketing', lastUpdatedAt: '01/02/2026 | 02:20 PM', createdBy: 'Dr. Emilia Clarke', type: 'whatsapp' },
  { id: '12', name: 'WA Documents', subject: 'Find requested documents attached.', useCase: 'Follow-Up', lastUpdatedAt: '28/01/2026 | 04:45 PM', createdBy: 'Dr. John Snow', type: 'whatsapp' },
  { id: '33', name: 'WA Video Link', subject: 'Zoom link: {zoom_link}', useCase: 'Appointment', lastUpdatedAt: '09/02/2026 | 08:15 AM', createdBy: 'System', type: 'whatsapp' },
  { id: '34', name: 'WA Diet Plan', subject: 'Diet chart ready! 🥗', useCase: 'Follow-Up', lastUpdatedAt: '08/02/2026 | 10:30 AM', createdBy: 'Dr. Emilia Clarke', type: 'whatsapp' },
  { id: '35', name: 'WA Blog Alert', subject: 'Latest blog: IVF Success 🌟', useCase: 'Marketing', lastUpdatedAt: '07/02/2026 | 04:00 PM', createdBy: 'System', type: 'whatsapp' },
  { id: '36', name: 'WA Review', subject: 'Rate us on Google! ⭐⭐⭐⭐⭐', useCase: 'Feedback', lastUpdatedAt: '06/02/2026 | 12:20 PM', createdBy: 'System', type: 'whatsapp' },
  { id: '37', name: 'WA Referral', subject: 'Refer a friend, get a kit! 🎁', useCase: 'Marketing', lastUpdatedAt: '05/02/2026 | 02:45 PM', createdBy: 'System', type: 'whatsapp' },
  { id: '38', name: 'WA Birthday', subject: 'Happy Birthday {name}! 🎂', useCase: 'Re-engagement', lastUpdatedAt: '04/02/2026 | 08:00 AM', createdBy: 'System', type: 'whatsapp' },
  { id: '39', name: 'WA Testimonial', subject: 'Achieved their dream! 🎥', useCase: 'Marketing', lastUpdatedAt: '03/02/2026 | 01:10 PM', createdBy: 'Dr. John Snow', type: 'whatsapp' },
  { id: '40', name: 'WA ID Proof', subject: 'Upload ID proof to book.', useCase: 'Appointment', lastUpdatedAt: '02/02/2026 | 11:55 AM', createdBy: 'System', type: 'whatsapp' },
  { id: '41', name: 'WA After-Care', subject: 'Quick tips for recovery. 💧', useCase: 'Follow-Up', lastUpdatedAt: '01/02/2026 | 09:30 AM', createdBy: 'Dr. Alex Carry', type: 'whatsapp' },
  { id: '42', name: 'WA Webinar', subject: 'Join LIVE Q&A session at 6 PM.', useCase: 'Marketing', lastUpdatedAt: '31/01/2026 | 10:15 AM', createdBy: 'System', type: 'whatsapp' },
];