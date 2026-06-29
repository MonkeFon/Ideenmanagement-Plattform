export default function GeistesblitzLogo({
  size = 24,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >

      <path
        d="M3 11a9 9 0 0 1 18 0v9l-3-2-3 2-3-2-3 2-3-2z"
        fill="currentColor"
      />

      <circle cx="6.6"  cy="11.8" r="1.15" fill="#fb7185" opacity="0.55" />
      <circle cx="17.4" cy="11.8" r="1.15" fill="#fb7185" opacity="0.55" />

      <circle cx="8.6"  cy="9.6" r="1.75" fill="rgb(var(--primary))" />
      <circle cx="15.4" cy="9.6" r="1.75" fill="rgb(var(--primary))" />

      <circle cx="7.95" cy="8.95" r="0.6"  fill="currentColor" />
      <circle cx="14.75" cy="8.95" r="0.6" fill="currentColor" />

      <path
        d="M10.4 12.4 Q12 13.9 13.6 12.4"
        fill="none"
        stroke="rgb(var(--primary))"
        strokeWidth={0.7}
        strokeLinecap="round"
      />

      <path
        d="M13 13.6L9 18L11.5 18L10.5 20.4L15 15.9L12 15.9Z"
        fill="#facc15"
        stroke="#854d0e"
        strokeWidth={0.35}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
