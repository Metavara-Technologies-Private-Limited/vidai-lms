import type { Clinic } from "../types/clinic.types";
import { http } from "./http";

export const clinicApi = {
  /**
   * Corrected to match your Django URL pattern:
   * api/clinics/<int:clinic_id>/detail/
   */
  getById: (id: number) => http.get<Clinic>(`/clinics/${id}/detail/`),
};