import type { Stage } from '@/types/api'
import { cn } from '@/lib/utils'

/**
 * Workflow-stage chip — a coloured status pill in a restrained, professional palette:
 * a soft tinted background with matching darker text and a subtle inset ring, rather
 * than a fully saturated badge. Each stage keeps its own hue (matching the Kanban board
 * accents in Workflow.tsx and the graph fills in IdeaGraph.tsx) so a stage looks the
 * same everywhere, but the muted tints keep the table readable and don't compete with
 * the tenant brand (--primary). Dark-mode variants use a translucent tint so the chips
 * stay legible on dark surfaces.
 */
const STAGE_STYLE: Record<Stage, string> = {
  SUBMITTED:
    'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20',
  UNDER_REVIEW:
    'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  PRIORITIZATION:
    'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
  APPROVED:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  IN_IMPLEMENTATION:
    'bg-cyan-50 text-cyan-700 ring-cyan-600/15 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/20',
  DONE:
    'bg-green-50 text-green-700 ring-green-600/15 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-400/20',
  REJECTED:
    'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  ARCHIVED:
    'bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-400/20',
}

const LABEL: Record<Stage, string> = {
  SUBMITTED: 'Eingereicht',
  UNDER_REVIEW: 'In Prüfung',
  PRIORITIZATION: 'Priorisierung',
  APPROVED: 'Genehmigt',
  IN_IMPLEMENTATION: 'In Umsetzung',
  DONE: 'Erledigt',
  REJECTED: 'Abgelehnt',
  ARCHIVED: 'Archiviert',
}

const CHIP =
  'inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset'

export default function StageBadge({ stage }: { stage: Stage }) {
  return <span className={cn(CHIP, STAGE_STYLE[stage])}>{LABEL[stage]}</span>
}

export const stageLabels = LABEL
