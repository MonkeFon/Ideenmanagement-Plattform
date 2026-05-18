/**
 * Geistesblitz mark — a friendly ghost cradling a yellow lightning bolt.
 *
 * Designed to read at sidebar (24-28 px) and mobile-header (20 px) sizes.
 *
 * Colours:
 *   - Ghost body fills with `currentColor` (inherits from the surrounding chip's
 *     text colour — typically `text-primary-foreground`, i.e. white in light mode
 *     and slate-900 in dark mode).
 *   - Eyes fill with `rgb(var(--primary))` so they always show the chip's
 *     *background* colour — punching dark holes through the white ghost in
 *     light mode and light dots through the dark ghost in dark mode.
 *   - The bolt is intentionally fixed yellow (amber-400) so it pops against
 *     either body colour and gives the mark its `Blitz` (lightning) reference.
 */
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
      {/* Ghost body — dome + three scalloped feet */}
      <path
        d="M3 11a9 9 0 0 1 18 0v9l-3-2-3 2-3-2-3 2-3-2z"
        fill="currentColor"
      />
      {/* Big round eyes — chip background colour so they punch through the body */}
      <circle cx="8.5"  cy="9.5" r="1.5" fill="rgb(var(--primary))" />
      <circle cx="15.5" cy="9.5" r="1.5" fill="rgb(var(--primary))" />
      {/* Sparkle highlights — same colour as the body, for that anime-cute glint */}
      <circle cx="9"   cy="9"  r="0.45" fill="currentColor" />
      <circle cx="16"  cy="9"  r="0.45" fill="currentColor" />
      {/* Lightning bolt — always yellow regardless of theme */}
      <path
        d="M13 13L9 17.5L11.5 17.5L10.5 20L15 15.5L12 15.5Z"
        fill="#facc15"
        stroke="#854d0e"
        strokeWidth={0.35}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
