import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, FormField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { registerSchema, type RegisterFormValues } from '@/lib/validation';
import { handleApiError } from '@/lib/apiError';

export default function RegisterPage() {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', userName: '', password: '', firstName: '', lastName: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const data = await authApi.register(values);
      setSession({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      });
      nav('/dashboard', { replace: true });
    } catch (e) {
      handleApiError(e, form.setError);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Konto erstellen</CardTitle>
          <CardDescription>Registrieren Sie sich, um Ideen einzureichen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Vorname" error={form.formState.errors.firstName?.message}>
                <Input {...form.register('firstName')} />
              </FormField>
              <FormField label="Nachname" error={form.formState.errors.lastName?.message}>
                <Input {...form.register('lastName')} />
              </FormField>
            </div>
            <FormField label="Benutzername" error={form.formState.errors.userName?.message}>
              <Input autoComplete="username" {...form.register('userName')} />
            </FormField>
            <FormField label="E-Mail" error={form.formState.errors.email?.message}>
              <Input type="email" autoComplete="email" {...form.register('email')} />
            </FormField>
            <FormField
              label="Passwort"
              error={form.formState.errors.password?.message}
              hint="Min. 8 Zeichen, Groß-/Kleinbuchstaben, Ziffer, Sonderzeichen"
            >
              <Input type="password" autoComplete="new-password" {...form.register('password')} />
            </FormField>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Registrieren
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Bereits ein Konto?{' '}
            <Link to="/login" className="text-primary hover:underline">Anmelden</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

