export interface Clinic {
  id: number;
  name: string;
  email: string;
  website?: string;
  google_ads_customer_id?: string;
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
