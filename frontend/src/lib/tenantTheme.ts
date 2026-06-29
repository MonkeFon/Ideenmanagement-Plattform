const VARS = ['--primary', '--primary-foreground', '--ring'] as const

function hexToRgbTriple(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

export function applyTenantBrand(color: string | null | undefined): void {
  const rgb = color ? hexToRgbTriple(color) : null
  if (!rgb) { clearTenantBrand(); return }
  const root = document.documentElement
  root.style.setProperty('--primary', rgb)
  root.style.setProperty('--primary-foreground', '255 255 255')
  root.style.setProperty('--ring', rgb)
}

export function clearTenantBrand(): void {
  const root = document.documentElement
  for (const v of VARS) root.style.removeProperty(v)
}
