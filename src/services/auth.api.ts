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

export const authApi = {
  login: async (data: LoginPayload) => {
    const res = await http.post<LoginResponse>("/login/", data);
    return res.data;
  },

  getProfile: async (token: string) => {
    const res = await http.get("/me/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  },
};