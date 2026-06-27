/**
 * Per-tenant brand theming.
 *
 * Each tenant carries a brand colour (hex) in its profile. Once a user is authenticated
 * we override the global `--primary` / `--ring` CSS variables with that colour, so the
 * whole app (buttons, badges, links, logo, focus rings) picks up the tenant's brand.
 *
 * The override is set as an inline style on <html>, which beats the stylesheet's light/dark
 * `--primary` rules, so the brand colour holds in both modes. `--primary-foreground` is
 * forced to white so labels stay legible on a reasonably dark brand colour.
 */

const VARS = ['--primary', '--primary-foreground', '--ring'] as const

/** "#239F91" → "35 159 145" (the space-separated rgb triple our CSS vars expect). */
function hexToRgbTriple(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** Apply a tenant brand colour, or fall back to the stylesheet default when absent/invalid. */
export function applyTenantBrand(color: string | null | undefined): void {
  const rgb = color ? hexToRgbTriple(color) : null
  if (!rgb) { clearTenantBrand(); return }
  const root = document.documentElement
  root.style.setProperty('--primary', rgb)
  root.style.setProperty('--primary-foreground', '255 255 255')
  root.style.setProperty('--ring', rgb)
}

/** Remove the inline overrides so the app reverts to its default (slate) brand. */
export function clearTenantBrand(): void {
  const root = document.documentElement
  for (const v of VARS) root.style.removeProperty(v)
}
