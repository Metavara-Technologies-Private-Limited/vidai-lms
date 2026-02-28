export interface DiagnosticReferral {
  id: number;
  labName: string;        // Lab Name
  contactPerson: string;  // Coordinator
  email: string;
  phone: string;
  referrals: number;
  city: string;
}

export const diagnosticMock: DiagnosticReferral[] = [
  {
    id: 1,
    labName: "Apollo Diagnostics",
    contactPerson: "Suresh Kumar",
    email: "apollo@lab.com",
    phone: "+91 98765 11223",
    referrals: 7,
    city: "Bangalore",
  },
  {
    id: 2,
    labName: "Thyrocare",
    contactPerson: "Priya Nair",
    email: "thyrocare@lab.com",
    phone: "+91 99887 66554",
    referrals: 5,
    city: "Hyderabad",
  },
  {
    id: 3,
    labName: "Metropolis Lab",
    contactPerson: "Anil Reddy",
    email: "metro@lab.com",
    phone: "+91 91234 45678",
    referrals: 4,
    city: "Chennai",
  },
];