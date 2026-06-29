import clsx from 'clsx'

export default function Spinner({
  size = 16,
  className,
  label,
}: {
  size?: number
  className?: string
  label?: string
}) {
  const stroke = Math.max(1.5, size / 14)
  return (
    <span className={clsx('inline-flex items-center gap-2 text-muted-foreground', className)} role="status">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth={stroke} />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      </svg>
      {label && <span className="text-[13px]">{label}</span>}
      {!label && <span className="sr-only">Wird geladen…</span>}
    </span>
  )
}

export function PageSpinner({ label = 'Wird geladen…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <Spinner size={20} label={label} />
    </div>
  )
}
