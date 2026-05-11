import { ENDPOINTS } from './endpoints';
import { get } from './client';
import type { AuditLogFilterQuery, AuditLogResponse, PagedResult } from '@/types/api';

export const auditApi = {
  list: (q: AuditLogFilterQuery) =>
    get<PagedResult<AuditLogResponse>>(ENDPOINTS.audit.list, { params: q }),
};

