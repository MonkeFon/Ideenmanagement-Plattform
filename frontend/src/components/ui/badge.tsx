import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:     'border border-input text-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',

        gray:        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        green:       'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        amber:       'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        red:         'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
