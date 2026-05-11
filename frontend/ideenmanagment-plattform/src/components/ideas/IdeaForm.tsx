import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Textarea, FormField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ideaSchema, type IdeaFormValues } from '@/lib/validation';
import { handleApiError } from '@/lib/apiError';
import type { CategoryResponse, IdeaDetailResponse } from '@/types/api';

export function IdeaForm({
  initial,
  categories,
  onSubmit,
  submitLabel = 'Speichern',
}: {
  initial?: Partial<IdeaDetailResponse>;
  categories: CategoryResponse[];
  onSubmit: (values: IdeaFormValues) => Promise<void>;
  submitLabel?: string;
}) {
  const form = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      categoryId: initial?.categoryId ?? '',
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (e) {
      handleApiError(e, form.setError);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Titel" htmlFor="title" error={form.formState.errors.title?.message}>
        <Input id="title" {...form.register('title')} />
      </FormField>
      <FormField label="Kategorie" error={form.formState.errors.categoryId?.message}>
        <Select
          value={form.watch('categoryId')}
          onValueChange={(v) => form.setValue('categoryId', v, { shouldValidate: true })}
        >
          <SelectTrigger><SelectValue placeholder="Wählen …" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label="Beschreibung (Markdown unterstützt)"
        htmlFor="description"
        error={form.formState.errors.description?.message}
      >
        <Textarea id="description" rows={10} {...form.register('description')} />
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}

