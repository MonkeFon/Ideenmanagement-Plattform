import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, Lightbulb, Plus, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ideasApi } from '@/api/ideas';
import { notificationsApi } from '@/api/notifications';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/lib/permissions';
import { QK } from '@/lib/queryClient';
import { IdeaCard } from '@/components/ideas/IdeaCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const myIdeas = useQuery({
    queryKey: QK.ideas({ authorId: user?.id, page: 1, pageSize: 5 }),
    queryFn: () => ideasApi.list({ authorId: user?.id, page: 1, pageSize: 5, sortBy: 'createdAt', sortDir: 'desc' }),
    enabled: !!user?.id,
  });

  const recent = useQuery({
    queryKey: QK.ideas({ recent: true }),
    queryFn: () => ideasApi.list({ page: 1, pageSize: 5, sortBy: 'createdAt', sortDir: 'desc' }),
  });

  const unread = useQuery({
    queryKey: QK.unreadCount,
    queryFn: () => notificationsApi.unreadCount(),
  });

  return (
    <>
      <PageHeader
        title={`Hallo, ${user?.firstName ?? ''}!`}
        description="Übersicht über die Ideen-Plattform"
        actions={
          hasPermission(PERMISSIONS.IdeasCreate) && (
            <Button asChild>
              <Link to="/ideas/new"><Plus className="mr-2 h-4 w-4" /> Neue Idee</Link>
            </Button>
          )
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4" /> Meine Ideen</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{myIdeas.data?.total ?? '–'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" /> Ungelesene Nachrichten</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{unread.data?.count ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Rollen</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{user?.roles?.join(', ') || '–'}</CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Neueste Ideen</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {recent.data?.items?.map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Meine Ideen</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {myIdeas.data?.items?.length ? (
            myIdeas.data.items.map((i) => <IdeaCard key={i.id} idea={i} />)
          ) : (
            <p className="text-sm text-muted-foreground">Noch keine eigenen Ideen.</p>
          )}
        </div>
      </section>
    </>
  );
}

