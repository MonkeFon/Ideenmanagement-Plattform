import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ideasApi } from '@/api/ideas';
import { categoriesApi } from '@/api/categories';
import { QK } from '@/lib/queryClient';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { IdeaFilters } from '@/components/ideas/IdeaFilters';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionGate } from '@/components/common/PermissionGate';
import { PERMISSIONS } from '@/lib/permissions';
import type { IdeaFilterQuery } from '@/types/api';

export default function IdeasListPage() {
  const [query, setQuery] = useState<IdeaFilterQuery>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const categories = useQuery({ queryKey: QK.categories, queryFn: () => categoriesApi.list() });
  const ideas = useQuery({
    queryKey: QK.ideas(query),
    queryFn: () => ideasApi.list(query),
  });

  return (
    <>
      <PageHeader
        title="Ideen"
        description="Stöbern, suchen und filtern"
        actions={
          <PermissionGate permission={PERMISSIONS.IdeasCreate}>
            <Button asChild>
              <Link to="/ideas/new"><Plus className="mr-2 h-4 w-4" /> Neue Idee</Link>
            </Button>
          </PermissionGate>
        }
      />
      <IdeaFilters value={query} categories={categories.data ?? []} onChange={setQuery} />

      {ideas.isLoading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      )}
      {ideas.isError && <ErrorState onRetry={() => ideas.refetch()} />}
      {ideas.data && ideas.data.items.length === 0 && (
        <EmptyState title="Keine Ideen gefunden" description="Versuche andere Filter oder erstelle eine neue Idee." />
      )}
      {ideas.data && ideas.data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ideas.data.items.map((i) => <IdeaCard key={i.id} idea={i} />)}
          </div>
          <Pagination
            page={ideas.data.page}
            pageSize={ideas.data.pageSize}
            total={ideas.data.total}
            totalPages={ideas.data.totalPages}
            hasNext={ideas.data.hasNext}
            hasPrevious={ideas.data.hasPrevious}
            onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
            onPageSizeChange={(s) => setQuery((q) => ({ ...q, pageSize: s, page: 1 }))}
          />
        </>
      )}
    </>
  );
}

