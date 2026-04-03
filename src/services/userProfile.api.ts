import { http } from "./http";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export interface UserProfileRead {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_no: string | null;
  designation: string | null;
  role_id: number | null;
  role_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_picture?: string | null;
  date_of_birth?: string | null;
}

const unwrap = <T>(res: { data: ApiEnvelope<T> }) => res.data.data;

export interface UserProfileCreatePayload {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_no?: string;
  designation?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface UserProfileUpdatePayload {
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_no?: string;
  designation?: string;
  role_id?: number | null;
  is_active?: boolean;
}

export const userProfileApi = {
  list: () =>
    http
      .get<ApiEnvelope<UserProfileRead[]>>("/user-profiles/")
      .then(unwrap),
  create: (payload: UserProfileCreatePayload) =>
    http
      .post<ApiEnvelope<UserProfileRead>>("/user-profiles/", payload)
      .then(unwrap),
  update: (profileId: number, payload: UserProfileUpdatePayload) =>
    http
      .put<ApiEnvelope<UserProfileRead>>(
        `/user-profiles/${profileId}/update/`,
        payload,
      )
      .then(unwrap),
};
