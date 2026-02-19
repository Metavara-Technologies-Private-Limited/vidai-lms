import { http } from "./http";

// Types based on Swagger definition
interface EmployeeRead {
  id: number;
  emp_name: string;
  emp_type: string;
  department_name: string;
}

interface EmployeeCreate {
  user_id: number;
  clinic_id: number;
  department_id: number;
  emp_type: string;
  emp_name: string;
}

/**
 * Employee API Service
 * Handles all employee-related API calls
 */
export const employeeApi = {
  /**
   * GET /api/clinics/{clinic_id}/employees/
   * Retrieve all employees under a specific clinic
   */
  getByClinic: (clinicId: string) => 
    http.get<EmployeeRead[]>(`/clinics/${clinicId}/employees/`),

  /**
   * POST /api/employees/
   * Create an employee under a clinic and department
   */
  create: (data: EmployeeCreate) => 
    http.post<EmployeeRead>("/employees/", data),
};