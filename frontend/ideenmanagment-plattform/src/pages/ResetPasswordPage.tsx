import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, FormField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/api/auth';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validation';
import { handleApiError } from '@/lib/apiError';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: params.get('email') ?? '',
      token: params.get('token') ?? '',
      newPassword: '',
    },
  });
  const submit = form.handleSubmit(async (v) => {
    try {
      await authApi.resetPassword(v);
      toast.success('Passwort zurückgesetzt. Bitte anmelden.');
      nav('/login');
    } catch (e) {
      handleApiError(e, form.setError);
    }
  });
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Passwort zurücksetzen</CardTitle>
          <CardDescription>Neues Passwort vergeben</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <FormField label="E-Mail" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </FormField>
            <FormField label="Token" error={form.formState.errors.token?.message}>
              <Input {...form.register('token')} />
            </FormField>
            <FormField label="Neues Passwort" error={form.formState.errors.newPassword?.message}>
              <Input type="password" autoComplete="new-password" {...form.register('newPassword')} />
            </FormField>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>Speichern</Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">Zur Anmeldung</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

