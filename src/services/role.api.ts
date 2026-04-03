import { http } from "./http";

export type RolePermissionPayload = {
  id?: number;
  module_key: string;
  category_key: string;
  subcategory_key: string | null;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_print: boolean;
};

export type RoleRead = {
  id: number;
  name: string;
  permissions: RolePermissionPayload[];
};

export type RoleWrite = {
  name: string;
  permissions: RolePermissionPayload[];
};

type ApiWrapped<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type RoleListResponse = ApiWrapped<RoleRead[]> | RoleRead[];
type RoleSingleResponse = ApiWrapped<RoleRead> | RoleRead;

const unwrapList = (payload: RoleListResponse): RoleRead[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
};

const unwrapOne = (payload: RoleSingleResponse): RoleRead => {
  if (payload && typeof payload === "object" && "data" in payload) {
    const wrapped = payload as ApiWrapped<RoleRead>;
    if (wrapped.data) {
      return wrapped.data;
    }
  }

  return payload as RoleRead;
};

export const roleApi = {
  list: async (): Promise<RoleRead[]> => {
    const response = await http.get<RoleListResponse>("/roles/list/");
    return unwrapList(response.data);
  },

  create: async (payload: RoleWrite): Promise<RoleRead> => {
    const response = await http.post<RoleSingleResponse>("/roles/create/", payload);
    return unwrapOne(response.data);
  },

  update: async (id: number, payload: RoleWrite): Promise<RoleRead> => {
    try {
      const response = await http.put<RoleSingleResponse>(`/roles/${id}/update/`, payload);
      return unwrapOne(response.data);
    } catch {
      const response = await http.put<RoleSingleResponse>(`/roles/update/${id}/`, payload);
      return unwrapOne(response.data);
    }
  },
};
