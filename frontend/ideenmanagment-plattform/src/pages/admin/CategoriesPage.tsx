import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, FormField, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { categoriesApi } from '@/api/categories';
import { QK } from '@/lib/queryClient';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { handleApiError } from '@/lib/apiError';
import { categorySchema, type CategoryFormValues } from '@/lib/validation';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: QK.categories, queryFn: () => categoriesApi.list() });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const create = useMutation({
    mutationFn: (v: CategoryFormValues) =>
      categoriesApi.create({ name: v.name, description: v.description ?? null }),
    onSuccess: () => { toast.success('Erstellt'); form.reset(); qc.invalidateQueries({ queryKey: QK.categories }); },
    onError: (e) => handleApiError(e, form.setError),
  });

  const update = useMutation({
    mutationFn: (v: { id: string; isActive: boolean; name: string; description?: string | null }) =>
      categoriesApi.update(v.id, { name: v.name, description: v.description ?? null, isActive: v.isActive }),
    onSuccess: () => { toast.success('Gespeichert'); qc.invalidateQueries({ queryKey: QK.categories }); },
    onError: (e) => handleApiError(e),
  });
  const remove = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.categories }); },
    onError: (e) => handleApiError(e),
  });

  if (list.isLoading) return <PageLoading />;

  return (
    <>
      <PageHeader title="Kategorien" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Neue Kategorie</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-3">
              <FormField label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </FormField>
              <FormField label="Beschreibung">
                <Textarea rows={3} {...form.register('description')} />
              </FormField>
              <Button type="submit" disabled={create.isPending}>Erstellen</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Übersicht</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR><TH>Name</TH><TH>Beschreibung</TH><TH>Aktiv</TH><TH /></TR>
              </THead>
              <TBody>
                {list.data?.map((c) => (
                  <TR key={c.id}>
                    <TD>{c.name}</TD>
                    <TD className="text-sm text-muted-foreground">{c.description ?? '–'}</TD>
                    <TD>
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={(v) =>
                          update.mutate({ id: c.id, isActive: v, name: c.name, description: c.description })
                        }
                      />
                    </TD>
                    <TD className="text-right">
                      <Button variant="ghost" size="icon" aria-label="Löschen" onClick={() => remove.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

