import { ENDPOINTS } from './endpoints';
import { del, get, post, put } from './client';
import type {
  AssignPermissionRequest,
  CreateRoleRequest,
  PermissionResponse,
  RoleResponse,
  UpdateRoleRequest,
} from '@/types/api';

export const rolesApi = {
  list: () => get<RoleResponse[]>(ENDPOINTS.roles.list),
  byId: (id: string) => get<RoleResponse>(ENDPOINTS.roles.byId(id)),
  create: (body: CreateRoleRequest) => post<RoleResponse>(ENDPOINTS.roles.list, body),
  update: (id: string, body: UpdateRoleRequest) =>
    put<RoleResponse>(ENDPOINTS.roles.byId(id), body),
  remove: (id: string) => del<void>(ENDPOINTS.roles.byId(id)),
  permissions: () => get<PermissionResponse[]>(ENDPOINTS.roles.permissions),
  assignPermission: (id: string, body: AssignPermissionRequest) =>
    post<void>(ENDPOINTS.roles.rolePermissions(id), body),
  removePermission: (id: string, permId: string) =>
    del<void>(ENDPOINTS.roles.rolePermissionById(id, permId)),
};

