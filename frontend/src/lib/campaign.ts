export type CampaignStatus = 'planned' | 'active' | 'ended'

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  ended: 'Beendet',
}

export function campaignStatus(starts: string | null, ends: string | null): CampaignStatus {
  const now = Date.now()
  if (starts && Date.parse(starts) > now) return 'planned'
  if (ends && Date.parse(ends) < now) return 'ended'
  return 'active'
}

export function fmtCampaignDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function campaignProgress(starts: string | null, ends: string | null): number | null {
  if (!starts || !ends) return null
  const s = Date.parse(starts), e = Date.parse(ends)
  if (!(e > s)) return null
  return Math.max(0, Math.min(100, Math.round(((Date.now() - s) / (e - s)) * 100)))
}

export function daysUntilEnd(ends: string | null): number | null {
  if (!ends) return null
  return Math.ceil((Date.parse(ends) - Date.now()) / 86_400_000)
}
