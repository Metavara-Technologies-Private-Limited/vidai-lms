export interface PractoReferral {
  id: number;
  accountManager: string;  // Practo Representative
  email: string;
  phone: string;
  referrals: number;
  campaign: string;        // Organic / Paid / Featured Listing
  city: string;
}

export const practoMock: PractoReferral[] = [
  {
    id: 1,
    accountManager: "Rakesh Gupta",
    email: "rakesh@practo.com",
    phone: "+91 98765 55667",
    referrals: 11,
    campaign: "Featured Listing",
    city: "Bangalore",
  },
  {
    id: 2,
    accountManager: "Neelam Jain",
    email: "neelam@practo.com",
    phone: "+91 91234 77889",
    referrals: 7,
    campaign: "Organic",
    city: "Hyderabad",
  },
  {
    id: 3,
    accountManager: "Amit Verma",
    email: "amit@practo.com",
    phone: "+91 99887 33445",
    referrals: 5,
    campaign: "Paid Campaign",
    city: "Chennai",
  },
];