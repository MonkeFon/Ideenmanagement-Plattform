import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, FormField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/api/auth';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validation';
import { handleApiError } from '@/lib/apiError';

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const submit = form.handleSubmit(async (v) => {
    try {
      await authApi.forgotPassword(v);
      toast.success('Wenn die E-Mail existiert, wurde ein Link gesendet.');
      form.reset();
    } catch (e) {
      handleApiError(e, form.setError);
    }
  });
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Passwort vergessen</CardTitle>
          <CardDescription>Wir senden einen Reset-Link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <FormField label="E-Mail" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </FormField>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>Senden</Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">Zur Anmeldung</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

