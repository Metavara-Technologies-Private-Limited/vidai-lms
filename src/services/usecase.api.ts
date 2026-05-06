import { http } from "./http";

export interface UseCase {
  id: string;
  name: string;
  clinic: string;
  is_active: boolean;
  created_at: string;
}

const UseCaseService = {
  /**
   * List all active use cases for a clinic
   * GET /api/usecases/
   */
  getUseCases: async (clinicId: string | number): Promise<UseCase[]> => {
    const response = await http.get(`/usecases/`, {
      headers: { "X-Clinic-Id": String(clinicId) },
    });
    return response.data;
  },

  /**
   * Create a new use case
   * POST /api/usecases/create/
   */
  createUseCase: async (
    clinicId: string | number,
    name: string
  ): Promise<UseCase> => {
    const response = await http.post(
      `/usecases/create/`,
      { name },
      { headers: { "X-Clinic-Id": String(clinicId) } }
    );
    return response.data;
  },

  /**
   * Update an existing use case
   * PUT /api/usecases/{id}/update/
   */
  updateUseCase: async (
    clinicId: string | number,
    id: string,
    name: string
  ): Promise<UseCase> => {
    const response = await http.put(
      `/usecases/${id}/update/`,
      { name },
      { headers: { "X-Clinic-Id": String(clinicId) } }
    );
    return response.data;
  },
};

export default UseCaseService;