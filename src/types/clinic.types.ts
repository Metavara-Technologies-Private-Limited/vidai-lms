export interface Clinic {
  id: number;
  name: string;
  department: Department[];
}

export interface Department {
  id: number;
  name: string;
  is_active: boolean;
  clinic_id: number;
  created_at: string;
}
