import { api } from "./leads.api";

export type UseCase = {
  id: string;
  name: string;
  is_active?: boolean;
};

const storedClinicId = (): number =>
  Number(localStorage.getItem("clinic_id") ?? 0);

export const UseCaseAPI = {
  async list(): Promise<UseCase[]> {
    const clinicId = storedClinicId();

    const response = await api.get<UseCase[]>(
      "/usecases/",
      {
        headers: {
          "X-Clinic-Id": String(clinicId),
        },
      },
    );

    return response.data;
  },

  async create(payload: {
    name: string;
  }): Promise<UseCase> {
    const clinicId = storedClinicId();

    const response = await api.post<UseCase>(
      "/usecases/create/",
      payload,
      {
        headers: {
          "X-Clinic-Id": String(clinicId),
        },
      },
    );

    return response.data;
  },

  async update(
    id: string,
    payload: {
      name?: string;
      is_active?: boolean;
    },
  ): Promise<UseCase> {
    const clinicId = storedClinicId();

    const response = await api.put<UseCase>(
      `/usecases/${id}/update/`,
      payload,
      {
        headers: {
          "X-Clinic-Id": String(clinicId),
        },
      },
    );

    return response.data;
  },
};