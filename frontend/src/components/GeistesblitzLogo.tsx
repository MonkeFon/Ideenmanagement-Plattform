/**
 * Geistesblitz mark — a cute ghost (big glossy eyes, rosy cheeks, little smile)
 * cradling a yellow lightning bolt.
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
      {/* Rosy blush cheeks — soft pink, semi-transparent so they read on either body colour */}
      <circle cx="6.6"  cy="11.8" r="1.15" fill="#fb7185" opacity="0.55" />
      <circle cx="17.4" cy="11.8" r="1.15" fill="#fb7185" opacity="0.55" />
      {/* Big glossy eyes — chip background colour so they punch through the body */}
      <circle cx="8.6"  cy="9.6" r="1.75" fill="rgb(var(--primary))" />
      <circle cx="15.4" cy="9.6" r="1.75" fill="rgb(var(--primary))" />
      {/* Catchlight glints — body colour, upper-left of each eye for that kawaii sparkle */}
      <circle cx="7.95" cy="8.95" r="0.6"  fill="currentColor" />
      <circle cx="14.75" cy="8.95" r="0.6" fill="currentColor" />
      {/* Little smile — punches through the body like the eyes */}
      <path
        d="M10.4 12.4 Q12 13.9 13.6 12.4"
        fill="none"
        stroke="rgb(var(--primary))"
        strokeWidth={0.7}
        strokeLinecap="round"
      />
      {/* Lightning bolt — always yellow regardless of theme */}
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
