import { Badge } from '@/components/ui/badge'
import type { Stage } from '@/types/api'
import type { VariantProps } from 'class-variance-authority'
import { badgeVariants } from '@/components/ui/badge'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

const VARIANT: Record<Stage, BadgeVariant> = {
  SUBMITTED:          'default',
  UNDER_REVIEW:       'amber',
  PRIORITIZATION:     'amber',
  APPROVED:           'green',
  IN_IMPLEMENTATION:  'default',
  DONE:               'green',
  REJECTED:           'red',
  ARCHIVED:           'gray',
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

export default function StageBadge({ stage }: { stage: Stage }) {
  return <Badge variant={VARIANT[stage]}>{LABEL[stage]}</Badge>
}

export const stageLabels = LABEL
