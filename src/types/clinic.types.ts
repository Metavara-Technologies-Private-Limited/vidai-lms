export interface Clinic {
  id: number;
  name: string;
  email: string;
  department: Department[];
  is_default?: boolean;
}

export interface Department {
  id: number;
  name: string;
  is_active: boolean;
  clinic_id: number;
  created_at: string;
}
