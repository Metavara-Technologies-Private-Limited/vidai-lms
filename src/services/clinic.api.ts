import type { Clinic } from "../types/clinic.types";
import { http } from "./http";

export const clinicApi = {
  list: async () => {
    try {
      return await http.get<Clinic[] | { results?: Clinic[]; data?: Clinic[] }>(
        "/clinics/",
      );
    } catch {
      return http.get<Clinic[] | { results?: Clinic[]; data?: Clinic[] }>(
        "/clinic/",
      );
    }
  },
  getById: (id: number) => http.get<Clinic>(`/clinics/${id}/detail/`),
  searchByName: (name: string) =>
    http.get<Clinic[]>(`/clinics/search/?name=${name}`),
  create: (payload: Partial<Clinic>) => http.post<Clinic>("/clinics/", payload),
};
