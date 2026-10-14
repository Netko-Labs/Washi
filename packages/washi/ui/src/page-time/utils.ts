import type { SheetSummary } from '@washi/domain'

/** An HLC string starts with 14 digits of wall-clock milliseconds. */
export function editedAt(hlc: string): number {
  return Number(hlc.slice(0, 14))
}

export function relativeTime(hlc: string): string {
  return relativeMs(editedAt(hlc))
}

export function relativeMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'recently'
  const minutes = Math.floor((Date.now() - ms) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

/** Most recently edited first — where a person left off is what they look for. */
export function byRecent(sheets: SheetSummary[]): SheetSummary[] {
  return [...sheets].sort((a, b) => editedAt(b.hlcUpdated) - editedAt(a.hlcUpdated))
}
