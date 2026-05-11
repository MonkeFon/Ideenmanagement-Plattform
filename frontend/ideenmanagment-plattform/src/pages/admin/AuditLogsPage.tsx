import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/common/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { auditApi } from '@/api/auditLogs';
import { QK } from '@/lib/queryClient';
import { DateText } from '@/components/common/DateText';
import { Badge } from '@/components/ui/badge';
import type { AuditAction, AuditLogFilterQuery } from '@/types/api';

const ACTIONS: AuditAction[] = [
  'Create', 'Update', 'Delete', 'Login', 'Logout', 'LoginFailed',
  'Approve', 'Reject', 'Archive', 'RoleAssigned', 'RoleRemoved', 'PasswordChanged',
];
const ALL = '__all__';

export default function AuditLogsPage() {
  const [q, setQ] = useState<AuditLogFilterQuery>({ page: 1, pageSize: 20 });
  const list = useQuery({ queryKey: QK.auditLogs(q), queryFn: () => auditApi.list(q) });

  return (
    <>
      <PageHeader title="Audit-Logs" description="Aktivitäten und Änderungen" />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Input placeholder="EntityName" value={q.entityName ?? ''} onChange={(e) => setQ({ ...q, entityName: e.target.value || undefined, page: 1 })} />
        <Select value={q.action ?? ALL} onValueChange={(v) => setQ({ ...q, action: v === ALL ? undefined : (v as AuditAction), page: 1 })}>
          <SelectTrigger><SelectValue placeholder="Aktion" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Alle Aktionen</SelectItem>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={q.from ?? ''} onChange={(e) => setQ({ ...q, from: e.target.value || undefined, page: 1 })} />
        <Input type="date" value={q.to ?? ''} onChange={(e) => setQ({ ...q, to: e.target.value || undefined, page: 1 })} />
      </div>
      <Table>
        <THead>
          <TR><TH>Zeitpunkt</TH><TH>Benutzer</TH><TH>Aktion</TH><TH>Entität</TH><TH>IP</TH></TR>
        </THead>
        <TBody>
          {list.data?.items?.map((l) => (
            <TR key={l.id}>
              <TD><DateText value={l.timestamp} /></TD>
              <TD>{l.userName ?? '–'}</TD>
              <TD><Badge variant="outline">{l.action}</Badge></TD>
              <TD className="text-xs">{l.entityName} {l.entityId && `· ${l.entityId.slice(0,8)}`}</TD>
              <TD className="text-xs text-muted-foreground">{l.ipAddress ?? '–'}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {list.data && (
        <Pagination
          page={list.data.page}
          pageSize={list.data.pageSize}
          total={list.data.total}
          totalPages={list.data.totalPages}
          hasNext={list.data.hasNext}
          hasPrevious={list.data.hasPrevious}
          onPageChange={(p) => setQ((s) => ({ ...s, page: p }))}
          onPageSizeChange={(s) => setQ((cur) => ({ ...cur, pageSize: s, page: 1 }))}
        />
      )}
    </>
  );
}

