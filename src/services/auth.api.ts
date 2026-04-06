import type {
  ExternalLoginResponse,
  LoginPayload,
  LoginResponse,
  LoginType,
  NormalizedLoginResponse,
  UserSearchParams,
} from "../types/auth.types";
import { http } from "./http";

export const LOGIN_TYPE: LoginType = "INT";

const normalizeExternalResponse = (
  res: ExternalLoginResponse,
): NormalizedLoginResponse => ({
  token: res.token,
  refresh: "",
  user: {
    id: 0,
    username: res.user.username,
    email: res.user.email,
    first_name: res.user.first_name,
    last_name: res.user.last_name,
    designation: res.user.designation,
  },
  role: res.user.designation,
  permissions: {},
});

export const authApi = {
  login: async (
    data: LoginPayload,
    mode: LoginType,
  ): Promise<NormalizedLoginResponse> => {
    if (mode === "EXT") {
      const res = await http.post<ExternalLoginResponse>("/proxy/login/", data);
      return normalizeExternalResponse(res.data);
    }

    const res = await http.post<LoginResponse>("/auth/login/", data);
    const response = res.data;

    if (!response.success || !response.data?.access_token) {
      throw new Error(response.message || "Login failed");
    }

    return {
      token: response.data.access_token,
      refresh: response.data.refresh_token,
      user: { ...response.data.user },
      role: response.data.role,
      permissions: response.data.permissions,
    };
  },

  getProfile: async () => {
    const res = await http.get("/me/profile/");
    return res.data.data;
  },

  searchUsers: async (params: UserSearchParams) => {
    const res = await http.get("/users-search/", {
      params: {
        limit: params.limit ?? 10,
        offset: params.offset ?? 0,
        search: params.search ?? "",
      },
    });
    return res.data;
  },
};
