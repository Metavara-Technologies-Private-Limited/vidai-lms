export interface InsuranceReferral {
  id: number;
  provider: string;      // Insurance Company
  manager: string;       // Relationship Manager
  email: string;
  phone: string;
  referrals: number;
}

export const insuranceMock: InsuranceReferral[] = [
  {
    id: 1,
    provider: "Star Health Insurance",
    manager: "Kiran Mehta",
    email: "kiran@starhealth.com",
    phone: "+91 90123 45678",
    referrals: 5,
  },
  {
    id: 2,
    provider: "ICICI Lombard",
    manager: "Neha Kapoor",
    email: "neha@icici.com",
    phone: "+91 91234 56789",
    referrals: 3,
  },
  {
    id: 3,
    provider: "HDFC Ergo",
    manager: "Rohit Sharma",
    email: "rohit@hdfc.com",
    phone: "+91 99876 54321",
    referrals: 4,
  },
];