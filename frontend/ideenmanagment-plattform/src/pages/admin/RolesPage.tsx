import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, FormField } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { rolesApi } from '@/api/roles';
import { QK } from '@/lib/queryClient';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { handleApiError } from '@/lib/apiError';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roleSchema, type RoleFormValues } from '@/lib/validation';

export default function RolesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const roles = useQuery({ queryKey: QK.roles, queryFn: () => rolesApi.list() });
  const perms = useQuery({ queryKey: QK.permissions, queryFn: () => rolesApi.permissions() });

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '' },
  });

  const create = useMutation({
    mutationFn: (v: RoleFormValues) => rolesApi.create({ name: v.name, description: v.description ?? null }),
    onSuccess: () => { toast.success('Rolle erstellt'); form.reset(); qc.invalidateQueries({ queryKey: QK.roles }); },
    onError: (e) => handleApiError(e, form.setError),
  });
  const remove = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.roles }); setSelected(null); },
    onError: (e) => handleApiError(e),
  });
  const togglePerm = useMutation({
    mutationFn: (v: { roleId: string; permId: string; assign: boolean }) =>
      v.assign ? rolesApi.assignPermission(v.roleId, { permissionId: v.permId }) : rolesApi.removePermission(v.roleId, v.permId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.roles }),
    onError: (e) => handleApiError(e),
  });

  if (roles.isLoading || perms.isLoading) return <PageLoading />;

  const role = roles.data?.find((r) => r.id === selected);

  return (
    <>
      <PageHeader title="Rollen & Permissions" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Rollen</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {roles.data?.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-2">
                <button className="text-left text-sm font-medium" onClick={() => setSelected(r.id)}>
                  {r.name}
                </button>
                <Button variant="ghost" size="icon" aria-label="Löschen" onClick={() => remove.mutate(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="mt-4 space-y-2">
              <FormField label="Neue Rolle" error={form.formState.errors.name?.message}>
                <Input placeholder="Name" {...form.register('name')} />
              </FormField>
              <Input placeholder="Beschreibung (optional)" {...form.register('description')} />
              <Button type="submit" disabled={create.isPending}>Erstellen</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{role ? `Permissions: ${role.name}` : 'Rolle wählen'}</CardTitle></CardHeader>
          <CardContent>
            {role ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {perms.data?.map((p) => {
                  const checked = role.permissions.includes(p.code);
                  return (
                    <label key={p.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          togglePerm.mutate({ roleId: role.id, permId: p.id, assign: !!v })
                        }
                      />
                      <div>
                        <div className="font-mono text-xs">{p.code}</div>
                        {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Wähle eine Rolle, um Permissions zu bearbeiten.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

