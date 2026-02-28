export interface ZoyaReferral {
  id: number;
  partnerName: string;     // Zoya Representative / Center
  coordinator: string;     // Contact Person
  email: string;
  phone: string;
  referrals: number;
  region: string;
}

export const zoyaMock: ZoyaReferral[] = [
  {
    id: 1,
    partnerName: "Zoya Fertility Network",
    coordinator: "Sneha Iyer",
    email: "sneha@zoya.com",
    phone: "+91 98765 33445",
    referrals: 9,
    region: "Bangalore",
  },
  {
    id: 2,
    partnerName: "Zoya Women's Care",
    coordinator: "Arjun Malhotra",
    email: "arjun@zoya.com",
    phone: "+91 91234 99887",
    referrals: 6,
    region: "Hyderabad",
  },
  {
    id: 3,
    partnerName: "Zoya Health Connect",
    coordinator: "Divya Reddy",
    email: "divya@zoya.com",
    phone: "+91 99876 22334",
    referrals: 4,
    region: "Chennai",
  },
];