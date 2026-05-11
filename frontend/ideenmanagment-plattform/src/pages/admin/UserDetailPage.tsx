import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, FormField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usersApi } from '@/api/users';
import { rolesApi } from '@/api/roles';
import { QK } from '@/lib/queryClient';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { handleApiError } from '@/lib/apiError';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const user = useQuery({ queryKey: QK.user(id!), queryFn: () => usersApi.byId(id!), enabled: !!id });
  const roles = useQuery({ queryKey: QK.roles, queryFn: () => rolesApi.list() });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      firstName: user.data?.firstName ?? '',
      lastName: user.data?.lastName ?? '',
      isActive: user.data?.isActive ?? true,
    },
  });

  const update = useMutation({
    mutationFn: (v: Values) => usersApi.update(id!, v),
    onSuccess: () => { toast.success('Gespeichert'); qc.invalidateQueries({ queryKey: QK.user(id!) }); },
    onError: (e) => handleApiError(e, form.setError),
  });

  const assign = useMutation({
    mutationFn: (roleId: string) => usersApi.assignRole(id!, { roleId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.user(id!) }); toast.success('Rolle zugewiesen'); },
    onError: (e) => handleApiError(e),
  });
  const unassign = useMutation({
    mutationFn: (roleId: string) => usersApi.removeRole(id!, roleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.user(id!) }); toast.success('Rolle entfernt'); },
    onError: (e) => handleApiError(e),
  });

  if (user.isLoading) return <PageLoading />;
  if (!user.data) return null;

  const userRoles = new Set(user.data.roles);
  const available = roles.data?.filter((r) => !userRoles.has(r.name)) ?? [];

  return (
    <>
      <PageHeader title={`${user.data.firstName} ${user.data.lastName}`} description={user.data.email} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => update.mutate(v))} className="space-y-4">
              <FormField label="Vorname"><Input {...form.register('firstName')} /></FormField>
              <FormField label="Nachname"><Input {...form.register('lastName')} /></FormField>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.watch('isActive')}
                  onCheckedChange={(v) => form.setValue('isActive', v)}
                />
                <span className="text-sm">Aktiv</span>
              </div>
              <Button type="submit" disabled={update.isPending}>Speichern</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rollen</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              {user.data.roles.map((rName) => {
                const roleObj = roles.data?.find((r) => r.name === rName);
                return (
                  <Badge key={rName} variant="secondary" className="gap-1">
                    {rName}
                    {roleObj && (
                      <button onClick={() => unassign.mutate(roleObj.id)} aria-label={`${rName} entfernen`}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                );
              })}
            </div>
            <div className="space-y-2">
              {available.map((r) => (
                <Button key={r.id} size="sm" variant="outline" onClick={() => assign.mutate(r.id)}>
                  + {r.name}
                </Button>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Permissions</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {user.data.permissions.map((p) => (
                  <Badge key={p} variant="outline">{p}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

