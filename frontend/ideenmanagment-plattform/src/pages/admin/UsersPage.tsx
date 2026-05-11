import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pagination } from '@/components/common/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { usersApi } from '@/api/users';
import { QK } from '@/lib/queryClient';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DateText } from '@/components/common/DateText';
import { handleApiError } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const perms = useAuthStore((s) => s.permissions);
  const canManage = hasPermission(perms, PERMISSIONS.UsersManage);

  const list = useQuery({
    queryKey: QK.users({ search: debounced, page }),
    queryFn: () => usersApi.list({ search: debounced || undefined, page, pageSize: 20 }),
  });

  const toggle = useMutation({
    mutationFn: (u: { id: string; active: boolean }) =>
      u.active ? usersApi.deactivate(u.id) : usersApi.activate(u.id),
    onSuccess: () => {
      toast.success('Status geändert');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => handleApiError(e),
  });

  return (
    <>
      <PageHeader title="Benutzer" description="Benutzer verwalten" />
      <div className="mb-3 max-w-sm">
        <Input placeholder="Suche …" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>E-Mail</TH>
            <TH>Rollen</TH>
            <TH>Aktiv</TH>
            <TH>Letzter Login</TH>
            <TH className="text-right">Aktion</TH>
          </TR>
        </THead>
        <TBody>
          {list.data?.items?.map((u) => (
            <TR key={u.id}>
              <TD>{u.firstName} {u.lastName} <span className="text-xs text-muted-foreground">({u.userName})</span></TD>
              <TD>{u.email}</TD>
              <TD>{u.roles.join(', ')}</TD>
              <TD>
                <Switch
                  checked={u.isActive}
                  disabled={!canManage}
                  onCheckedChange={() => toggle.mutate({ id: u.id, active: u.isActive })}
                  aria-label="Aktiv"
                />
              </TD>
              <TD><DateText value={u.lastLoginAt} /></TD>
              <TD className="text-right">
                {canManage && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/users/${u.id}`}>Details</Link>
                  </Button>
                )}
              </TD>
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
          onPageChange={setPage}
        />
      )}
    </>
  );
}

