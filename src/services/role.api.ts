import { http } from "./http";

export interface RolePermissionPayload {
  id?: number;
  module_key: string;
  category_key: string;
  subcategory_key: string | null;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_print: boolean;
}

export interface RolePayload {
  name: string;
  permissions: RolePermissionPayload[];
}

export interface RoleRead {
  id: number;
  name: string;
  permissions: (RolePermissionPayload & { id: number })[];
}

const wrap = <T>(res: { data: { data: T } }) => res.data.data;

export const roleApi = {
  list: () =>
    http
      .get<{ success: boolean; data: RoleRead[] }>("/roles/list/")
      .then(wrap),

  create: (payload: RolePayload) =>
    http
      .post<{ success: boolean; data: RoleRead }>("/roles/create/", payload)
      .then(wrap),

  update: (id: number, payload: RolePayload) =>
    http
      .put<{ success: boolean; data: RoleRead }>(`/roles/update/${id}/`, payload)
      .then(wrap),

  delete: (id: number) => http.delete(`/roles/delete/${id}/`),
};
