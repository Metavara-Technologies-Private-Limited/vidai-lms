// doctors.mock.ts

export interface DoctorReferral {
  id: number;
  name: string;
  email: string;
  phone: string;
  referrals: number;
  clinicName: string;
}
// 👉 Mock API Response
export const doctorsMock: DoctorReferral[] = [
  {
    id: 1,
    name: "Henry Cavil",
    email: "john.smith@email.com",
    phone: "+91 20451 20154",
    referrals: 10,
    clinicName: "Bloom Fertility Center",
  },
  {
    id: 2,
    name: "Lucas Bennett",
    email: "john.smith@email.com",
    phone: "+91 20451 20154",
    referrals: 8,
    clinicName: "Hope Springs Fertility Clinic",
  },
  {
    id: 3,
    name: "Oliver Grant",
    email: "john.smith@email.com",
    phone: "+91 20451 20154",
    referrals: 4,
    clinicName: "New Beginnings Fertility Institute",
  },
  {
    id: 4,
    name: "Noah Carter",
    email: "john.smith@email.com",
    phone: "+91 20451 20154",
    referrals: 3,
    clinicName: "Family Tree Fertility Services",
  },
  {
    id: 5,
    name: "Ethan Parker",
    email: "john.smith@email.com",
    phone: "+91 20451 20154",
    referrals: 2,
    clinicName: "Miracle Makers Fertility Clinic",
  },
];