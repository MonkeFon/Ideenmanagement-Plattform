import { ENDPOINTS } from './endpoints';
import { post, get } from './client';
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserDetailResponse,
} from '@/types/api';

export const authApi = {
  login: (body: LoginRequest) => post<AuthResponse>(ENDPOINTS.auth.login, body),
  register: (body: RegisterRequest) => post<AuthResponse>(ENDPOINTS.auth.register, body),
  refresh: (body: RefreshRequest) => post<AuthResponse>(ENDPOINTS.auth.refresh, body),
  logout: (body: RefreshRequest) => post<void>(ENDPOINTS.auth.logout, body),
  changePassword: (body: ChangePasswordRequest) => post<void>(ENDPOINTS.auth.changePassword, body),
  forgotPassword: (body: ForgotPasswordRequest) => post<void>(ENDPOINTS.auth.forgotPassword, body),
  resetPassword: (body: ResetPasswordRequest) => post<void>(ENDPOINTS.auth.resetPassword, body),
  me: () => get<UserDetailResponse>(ENDPOINTS.users.me),
};

