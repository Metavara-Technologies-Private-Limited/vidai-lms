import { http } from "./http";

type LoginPayload = {
  username: string;
  password: string;
};

type LoginResponse = {
  token: string;
  user: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    designation: string;
  };
};

type UserSearchParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

export const authApi = {
  login: async (data: LoginPayload) => {
    const res = await http.post<LoginResponse>("/login/", data);
    return res.data;
  },

  getProfile: async () => {
    const res = await http.get("/me/profile");
    return res.data;
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