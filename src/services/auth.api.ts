import { http } from "./http";

type LoginPayload = {
  username: string;
  email?: string;
  password: string;
};

type LoginResponse = {
  success?: boolean;
  message?: string;
  data?: {
    token?: string;
    access?: string;
    access_token?: string;
    auth_token?: string;
    accessToken?: string;
    refresh?: string;
    refresh_token?: string;
    user?: {
      id?: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
      designation: string;
    };
    role?: string;
    permissions?: Record<string, unknown>;
  };
  result?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  token?: string;
  access?: string;
  access_token?: string;
  auth_token?: string;
  accessToken?: string;
  key?: string;
  jwt?: string;
  id_token?: string;
  refresh?: string;
  refresh_token?: string;
  user?: {
    id?: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    designation: string;
  };
  role?: string;
  permissions?: Record<string, unknown>;
};

type NormalizedLoginResponse = {
  token: string;
  refresh?: string;
  user?: LoginResponse["user"];
  role?: string;
  permissions?: Record<string, unknown>;
};

type UserSearchParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

type TokenSource = Record<string, unknown>;

const pickToken = (source?: TokenSource): string | undefined => {
  if (!source) return undefined;

  const candidates = [
    source.token,
    source.access,
    source.access_token,
    source.auth_token,
    source.accessToken,
    source.key,
    source.jwt,
    source.id_token,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
};

const pickRefresh = (source?: TokenSource): string | undefined => {
  if (!source) return undefined;
  const raw = source.refresh ?? source.refresh_token;
  return typeof raw === "string" && raw.trim() ? raw : undefined;
};

const asRecord = (value: unknown): TokenSource | undefined =>
  value && typeof value === "object" ? (value as TokenSource) : undefined;

export const authApi = {
  login: async (data: LoginPayload): Promise<NormalizedLoginResponse> => {
    const res = await http.post<LoginResponse>("/auth/login/", data);
    const body = asRecord(res.data);
    const dataObj = asRecord(body?.data);
    const nestedDataObj = asRecord(dataObj?.data);
    const resultObj = asRecord(body?.result);
    const payloadObj = asRecord(body?.payload);

    const token =
      pickToken(body) ??
      pickToken(dataObj) ??
      pickToken(nestedDataObj) ??
      pickToken(resultObj) ??
      pickToken(payloadObj);

    if (!token) {
      throw new Error("Login response did not include an access token");
    }

    const user =
      (dataObj?.user as LoginResponse["user"]) ??
      (nestedDataObj?.user as LoginResponse["user"]) ??
      (body?.user as LoginResponse["user"]);

    const role =
      (dataObj?.role as string | undefined) ??
      (nestedDataObj?.role as string | undefined) ??
      (body?.role as string | undefined);

    const permissions =
      (dataObj?.permissions as Record<string, unknown> | undefined) ??
      (nestedDataObj?.permissions as Record<string, unknown> | undefined) ??
      (body?.permissions as Record<string, unknown> | undefined);

    return {
      token,
      refresh:
        pickRefresh(body) ??
        pickRefresh(dataObj) ??
        pickRefresh(nestedDataObj) ??
        pickRefresh(resultObj) ??
        pickRefresh(payloadObj),
      user,
      role,
      permissions,
    };
  },

  getProfile: async () => {
    const res = await http.get("/me/profile/");
    const body = res.data as Record<string, unknown>;

    const profile =
      (body?.data as Record<string, unknown> | undefined) ??
      (body?.profile as Record<string, unknown> | undefined) ??
      (body?.user as Record<string, unknown> | undefined) ??
      body;

    const nestedUser =
      profile?.user && typeof profile.user === "object"
        ? (profile.user as Record<string, unknown>)
        : null;

    if (nestedUser) {
      return {
        ...profile,
        ...nestedUser,
        clinics: profile.clinics ?? nestedUser.clinics,
        permissions: profile.permissions ?? nestedUser.permissions,
      };
    }

    return profile;
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
