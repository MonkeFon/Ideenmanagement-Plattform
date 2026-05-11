import { ENDPOINTS } from './endpoints';
import { del, get, post, put } from './client';
import type {
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/api';

export const categoriesApi = {
  list: () => get<CategoryResponse[]>(ENDPOINTS.categories.list),
  byId: (id: string) => get<CategoryResponse>(ENDPOINTS.categories.byId(id)),
  create: (body: CreateCategoryRequest) => post<CategoryResponse>(ENDPOINTS.categories.list, body),
  update: (id: string, body: UpdateCategoryRequest) =>
    put<CategoryResponse>(ENDPOINTS.categories.byId(id), body),
  remove: (id: string) => del<void>(ENDPOINTS.categories.byId(id)),
};

