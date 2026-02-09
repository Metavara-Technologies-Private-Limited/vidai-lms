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
  // ... Keep your existing 7 Email templates here ...
  {
    id: '1',
    name: 'Appointment Confirmation',
    subject: 'Your Consultation is Confirmed - {appointment_date}',
    useCase: 'Appointment',
    lastUpdatedAt: '24/12/2025 | 10:15 AM',
    createdBy: 'System',
    type: 'email',
  },
  // (Include IDs 2 through 7 from your original list here)

  // --- SMS MOCK DATA ---
  {
    id: '8',
    name: 'Quick Appointment Reminder',
    subject: 'Hi {lead_first_name}, your visit to {clinic_name} is tomorrow at {appointment_time}.',
    useCase: 'Reminder',
    lastUpdatedAt: '25/01/2026 | 11:30 AM',
    createdBy: 'System',
    type: 'sms',
  },
  {
    id: '9',
    name: 'Post-Visit Feedback',
    subject: 'How was your experience today? Tap here to leave a review: {review_link}',
    useCase: 'Feedback',
    lastUpdatedAt: '20/01/2026 | 09:15 AM',
    createdBy: 'Dr. Alex Carry',
    type: 'sms',
  },

  // --- WHATSAPP MOCK DATA ---
  {
    id: '10',
    name: 'WhatsApp Welcome Message',
    subject: 'Welcome to {clinic_name}! We are happy to assist you with your fertility journey.',
    useCase: 'Appointment',
    lastUpdatedAt: '05/02/2026 | 10:00 AM',
    createdBy: 'System',
    type: 'whatsapp',
  },
  {
    id: '11',
    name: 'Seasonal Health Tips',
    subject: 'Hi {lead_first_name}, here are 5 tips for maintaining wellness this spring!',
    useCase: 'Marketing',
    lastUpdatedAt: '01/02/2026 | 02:20 PM',
    createdBy: 'Dr. Emilia Clarke',
    type: 'whatsapp',
  },
  {
    id: '12',
    name: 'Consultation Documents',
    subject: 'Please find your requested documents attached for your upcoming appointment.',
    useCase: 'Follow-Up',
    lastUpdatedAt: '28/01/2026 | 04:45 PM',
    createdBy: 'Dr. John Snow',
    type: 'whatsapp',
  }
];