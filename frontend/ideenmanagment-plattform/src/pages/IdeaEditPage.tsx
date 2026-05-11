import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { ideasApi } from '@/api/ideas';
import { categoriesApi } from '@/api/categories';
import { QK } from '@/lib/queryClient';
import { PageLoading } from '@/components/common/LoadingSpinner';

export default function IdeaEditPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const categories = useQuery({ queryKey: QK.categories, queryFn: () => categoriesApi.list() });
  const idea = useQuery({
    queryKey: QK.idea(id!),
    queryFn: () => ideasApi.byId(id!),
    enabled: !!id,
  });

  const update = useMutation({
    mutationFn: (v: { title: string; description: string; categoryId: string }) =>
      ideasApi.update(id!, v),
    onSuccess: () => {
      toast.success('Gespeichert');
      qc.invalidateQueries({ queryKey: QK.idea(id!) });
      nav(`/ideas/${id}`);
    },
  });

  if (idea.isLoading || categories.isLoading) return <PageLoading />;

  return (
    <>
      <PageHeader title="Idee bearbeiten" />
      <IdeaForm
        initial={idea.data ?? undefined}
        categories={categories.data ?? []}
        onSubmit={async (v) => {
          await update.mutateAsync(v);
        }}
        submitLabel="Speichern"
      />
    </>
  );
}

