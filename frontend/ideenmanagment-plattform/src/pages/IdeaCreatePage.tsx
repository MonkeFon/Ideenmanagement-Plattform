import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { ideasApi } from '@/api/ideas';
import { categoriesApi } from '@/api/categories';
import { QK } from '@/lib/queryClient';
import { PageLoading } from '@/components/common/LoadingSpinner';

export default function IdeaCreatePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const categories = useQuery({ queryKey: QK.categories, queryFn: () => categoriesApi.list() });

  const create = useMutation({
    mutationFn: (v: { title: string; description: string; categoryId: string }) =>
      ideasApi.create(v),
    onSuccess: (idea) => {
      toast.success('Idee erstellt');
      qc.invalidateQueries({ queryKey: ['ideas'] });
      nav(`/ideas/${idea.id}`);
    },
  });

  if (categories.isLoading) return <PageLoading />;

  return (
    <>
      <PageHeader title="Neue Idee" description="Reichen Sie eine neue Idee ein" />
      <IdeaForm
        categories={categories.data ?? []}
        onSubmit={async (v) => {
          await create.mutateAsync(v);
        }}
        submitLabel="Erstellen"
      />
    </>
  );
}

