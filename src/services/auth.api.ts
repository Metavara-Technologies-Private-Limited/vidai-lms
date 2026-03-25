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

    return {
      access: res.data.token,
      user_id: 0,
      username: res.data.user.username,
      first_name: res.data.user.first_name,
      last_name: res.data.user.last_name,
      email: res.data.user.email,
      designation: res.data.user.designation,

      // ✅ required extras
      designation_label: res.data.user.designation,
      tenant: "",
      tenant_id: 0,
      is_staff: false,
      is_superuser: false,
      language_id: 1,
      language_code: "en",
      language_name: "English",

      // ✅ required permissions structure
      permissions: {
        modules: [],
      },
    };
  },
};
