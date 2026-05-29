import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CampaignApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import { PageSpinner } from '@/components/Spinner'
import RoleGate from '@/components/RoleGate'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function CampaignDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['campaign', id], queryFn: () => CampaignApi.get(id) })

  const deleteM = useMutation({
    mutationFn: () => CampaignApi.delete(id),
    onSuccess: () => {
      toast.success('Kampagne gelöscht', {
        description: 'Verknüpfte Ideen bleiben bestehen, ihre Kampagnen-Zuordnung wurde entfernt.',
      })
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      qc.invalidateQueries({ queryKey: ['ideas'] })
      navigate('/campaigns')
    },
  })

  if (q.isLoading) return <PageSpinner />
  if (q.error || !q.data) return <div className="p-8 text-[13px] text-destructive">Kampagne nicht gefunden.</div>

  const { campaign: c, ideas } = q.data
  const window = formatWindow(c.startsAt, c.endsAt)

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-6">
      <Link to="/campaigns" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
        <ArrowLeft size={12} strokeWidth={2} /> Alle Kampagnen
      </Link>

      <header className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <span className="mt-1.5 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="eyebrow">Kampagne</div>
            <h1 className="mt-1 text-xl md:text-2xl font-semibold text-foreground tracking-tight break-words">
              {c.name}
            </h1>
            <p className="mt-2 text-[14px] text-foreground/90 leading-relaxed max-w-3xl whitespace-pre-wrap">{c.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span><span className="text-foreground font-medium tabular-nums">{ideas.length}</span> Ideen</span>
              {window && <span className="font-mono tabular-nums">{window}</span>}
              <span>angelegt von {c.createdByName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild><Link to={`/submit?campaign=${c.id}`}>Für diese Kampagne einreichen</Link></Button>
          <RoleGate allow={['INNOVATION_MANAGER', 'ADMIN', 'SUPERADMIN']}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Kampagne löschen" title="Kampagne löschen">
                  <Trash2 size={15} strokeWidth={1.75} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kampagne „{c.name}“ löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Die <span className="font-medium text-foreground">{ideas.length}</span>{' '}
                    {ideas.length === 1 ? 'verknüpfte Idee bleibt bestehen' : 'verknüpften Ideen bleiben bestehen'}
                    , ihre Zuordnung zur Kampagne wird aber entfernt. Dieser Vorgang lässt sich nicht rückgängig machen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => { e.preventDefault(); deleteM.mutate() }}
                    disabled={deleteM.isPending}
                  >
                    {deleteM.isPending ? 'Wird gelöscht…' : 'Löschen'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </RoleGate>
        </div>
      </header>

      <section>
        <div className="eyebrow mb-3">Ideen in dieser Kampagne</div>
        {ideas.length === 0 && (
          <Card className="p-6 text-[13px] text-muted-foreground text-center">
            Noch keine Ideen mit dieser Kampagne verknüpft. <Link to="/submit" className="text-foreground underline underline-offset-2 ml-1">Eine einreichen</Link>.
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ideas.map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>
    </div>
  )
}

function formatWindow(starts: string | null, ends: string | null): string | null {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  if (!starts && !ends) return null
  if (starts && ends) return `${fmt(starts)} → ${fmt(ends)}`
  if (starts) return `seit ${fmt(starts)}`
  return `bis ${fmt(ends!)}`
}
