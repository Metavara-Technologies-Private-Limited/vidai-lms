import type { Clinic } from "../types/clinic.types";
import { http } from "./http";

export const clinicApi = {
  getById: (id: number) => http.get<Clinic>(`/clinics/${id}/detail/`),
};