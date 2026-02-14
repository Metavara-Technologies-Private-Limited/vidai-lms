// src/services/lab.api.ts
import { http } from "./http";

export interface Lab {
  id: string;
  name: string;
}

export const labApi = {
  getAll: () => http.get<Lab[]>("/labs/"),
};
