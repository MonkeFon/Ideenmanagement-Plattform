import { ENDPOINTS } from './endpoints';
import { del, get, post, put } from './client';
import type {
  AssignRoleRequest,
  PagedResult,
  UpdateProfileRequest,
  UpdateUserRequest,
  UserDetailResponse,
  UserFilterQuery,
  UserResponse,
} from '@/types/api';

export const usersApi = {
  me: () => get<UserDetailResponse>(ENDPOINTS.users.me),
  updateMe: (body: UpdateProfileRequest) => put<UserResponse>(ENDPOINTS.users.me, body),
  list: (q: UserFilterQuery) =>
    get<PagedResult<UserResponse>>(ENDPOINTS.users.list, { params: q }),
  byId: (id: string) => get<UserDetailResponse>(ENDPOINTS.users.byId(id)),
  update: (id: string, body: UpdateUserRequest) =>
    put<UserResponse>(ENDPOINTS.users.byId(id), body),
  remove: (id: string) => del<void>(ENDPOINTS.users.byId(id)),
  activate: (id: string) => post<void>(ENDPOINTS.users.activate(id)),
  deactivate: (id: string) => post<void>(ENDPOINTS.users.deactivate(id)),
  assignRole: (id: string, body: AssignRoleRequest) =>
    post<void>(ENDPOINTS.users.roles(id), body),
  removeRole: (id: string, roleId: string) => del<void>(ENDPOINTS.users.roleById(id, roleId)),
};

