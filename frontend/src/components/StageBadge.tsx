import clsx from 'clsx'
import type { Stage } from '@/types/api'

const STYLE: Record<Stage, string> = {
  DRAFT:              'badge-gray',
  SUBMITTED:          'badge-blue',
  UNDER_REVIEW:       'badge-amber',
  PRIORITIZATION:     'badge-amber',
  APPROVED:           'badge-green',
  IN_IMPLEMENTATION:  'badge-blue',
  DONE:               'badge-green',
  REJECTED:           'badge-red',
  ARCHIVED:           'badge-gray',
}

const LABEL: Record<Stage, string> = {
  DRAFT: 'Entwurf',
  SUBMITTED: 'Eingereicht',
  UNDER_REVIEW: 'In Prüfung',
  PRIORITIZATION: 'Priorisierung',
  APPROVED: 'Genehmigt',
  IN_IMPLEMENTATION: 'In Umsetzung',
  DONE: 'Erledigt',
  REJECTED: 'Abgelehnt',
  ARCHIVED: 'Archiviert',
}

export default function StageBadge({ stage }: { stage: Stage }) {
  return <span className={clsx(STYLE[stage])}>{LABEL[stage]}</span>
}

export const stageLabels = LABEL
