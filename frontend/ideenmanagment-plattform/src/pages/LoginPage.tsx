import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, FormField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { loginSchema, type LoginFormValues } from '@/lib/validation';
import { handleApiError } from '@/lib/apiError';

export default function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { emailOrUserName: '', password: '' },
  });

  useEffect(() => {
    if (params.get('expired')) toast.warning('Sitzung abgelaufen, bitte erneut anmelden.');
  }, [params]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const data = await authApi.login(values);
      setSession({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        permissions: [],
      });
      const redirect = params.get('redirect');
      nav(redirect ? decodeURIComponent(redirect) : '/dashboard', { replace: true });
    } catch (e) {
      handleApiError(e, form.setError);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Anmelden</CardTitle>
          <CardDescription>Willkommen zurück bei der Ideen-Plattform.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <FormField label="E-Mail oder Benutzername" htmlFor="ident" error={form.formState.errors.emailOrUserName?.message}>
              <Input id="ident" autoComplete="username" {...form.register('emailOrUserName')} />
            </FormField>
            <FormField label="Passwort" htmlFor="pwd" error={form.formState.errors.password?.message}>
              <Input id="pwd" type="password" autoComplete="current-password" {...form.register('password')} />
            </FormField>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Anmelden
            </Button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Passwort vergessen?
            </Link>
            <Link to="/register" className="text-primary hover:underline">
              Konto erstellen
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

