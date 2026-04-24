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

const unwrapResponseData = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const isNotFoundError = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404;
};

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
    try {
      const res = await http.get("/me/profile/");
      return unwrapResponseData<Record<string, unknown>>(res.data);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const fallbackRes = await http.get("/profile/");
      return unwrapResponseData<Record<string, unknown>>(fallbackRes.data);
    }
  },

  updateMyPhoto: async (payload: FormData) => {
    try {
      const res = await http.patch("/me/photo/", payload);
      return unwrapResponseData<Record<string, unknown>>(res.data);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const fallbackRes = await http.patch("/me/profile/", payload);
      return unwrapResponseData<Record<string, unknown>>(fallbackRes.data);
    }
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
