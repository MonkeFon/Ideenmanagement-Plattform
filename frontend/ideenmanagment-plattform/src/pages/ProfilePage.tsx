import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, FormField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usersApi } from '@/api/users';
import { authApi } from '@/api/auth';
import { QK } from '@/lib/queryClient';
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordFormValues,
  type ProfileFormValues,
} from '@/lib/validation';
import { handleApiError } from '@/lib/apiError';
import { PageLoading } from '@/components/common/LoadingSpinner';

export default function ProfilePage() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: QK.me, queryFn: () => usersApi.me() });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: { firstName: me.data?.firstName ?? '', lastName: me.data?.lastName ?? '' },
  });
  const updateProfile = useMutation({
    mutationFn: (v: ProfileFormValues) => usersApi.updateMe(v),
    onSuccess: () => {
      toast.success('Profil gespeichert');
      qc.invalidateQueries({ queryKey: QK.me });
    },
    onError: (e) => handleApiError(e, profileForm.setError),
  });

  const pwForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });
  const changePw = useMutation({
    mutationFn: (v: ChangePasswordFormValues) => authApi.changePassword(v),
    onSuccess: () => {
      toast.success('Passwort geändert');
      pwForm.reset();
    },
    onError: (e) => handleApiError(e, pwForm.setError),
  });

  if (me.isLoading) return <PageLoading />;

  return (
    <>
      <PageHeader title="Mein Profil" description={me.data?.email} />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="password">Passwort</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Persönliche Daten</CardTitle></CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit((v) => updateProfile.mutate(v))}
                className="space-y-4"
              >
                <FormField label="Vorname" error={profileForm.formState.errors.firstName?.message}>
                  <Input {...profileForm.register('firstName')} />
                </FormField>
                <FormField label="Nachname" error={profileForm.formState.errors.lastName?.message}>
                  <Input {...profileForm.register('lastName')} />
                </FormField>
                <Button type="submit" disabled={updateProfile.isPending}>Speichern</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader><CardTitle>Passwort ändern</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={pwForm.handleSubmit((v) => changePw.mutate(v))} className="space-y-4">
                <FormField label="Aktuelles Passwort" error={pwForm.formState.errors.currentPassword?.message}>
                  <Input type="password" autoComplete="current-password" {...pwForm.register('currentPassword')} />
                </FormField>
                <FormField label="Neues Passwort" error={pwForm.formState.errors.newPassword?.message}>
                  <Input type="password" autoComplete="new-password" {...pwForm.register('newPassword')} />
                </FormField>
                <Button type="submit" disabled={changePw.isPending}>Ändern</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

