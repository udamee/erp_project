import { api, request, type LoginResponse } from "./api-client";

export interface SignupRequest {
  loginId: string;
  password: string;
  empName: string;
  deptId: number;
  email: string;
  phone: string;
}

export const authApi = {
  login: (loginId: string, password: string) =>
    request<LoginResponse>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ loginId, password }) },
      false,
    ),
  signup: (data: SignupRequest) => api.post<void>("/api/auth/signup", data),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }, false),
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    checkNewPassword: string;
  }) => api.patch<void>("/api/auth/password", data),
};
