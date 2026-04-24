export interface CorporateReferral {
  id: number;
  name: string;          // HR Name
  company: string;       // Company Name
  email: string;
  phone: string;
  referrals: number;
}

export const corporateMock: CorporateReferral[] = [
  {
    id: 1,
    name: "Anita Sharma",
    company: "Infosys Pvt Ltd",
    email: "anita@infosys.com",
    phone: "+91 98765 12345",
    referrals: 6,
  },
  {
    id: 2,
    name: "Rahul Verma",
    company: "TCS Ltd",
    email: "rahul@tcs.com",
    phone: "+91 91234 56789",
    referrals: 4,
  },
  {
    id: 3,
    name: "Meera Reddy",
    company: "Wipro",
    email: "meera@wipro.com",
    phone: "+91 99887 77665",
    referrals: 3,
  },
];