import { PROVIDER_META } from './values'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** `just now` · `3 hours ago` · `2 days ago` — when a key was set. */
export function sinceLabel(iso: string, now = Date.now()): string {
  const gap = Math.max(0, now - new Date(iso).getTime())
  if (gap < HOUR) return 'just now'
  if (gap < DAY) return `${Math.floor(gap / HOUR)} hour${gap < 2 * HOUR ? '' : 's'} ago`
  const days = Math.floor(gap / DAY)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

/** The server's refusal, in words a person can act on; the raw line rides behind it. */
export function refusalFor(target: keyof typeof PROVIDER_META, raw: string): string {
  const meta = PROVIDER_META[target]
  if (/401|unauthori|invalid|refused/i.test(raw)) {
    return `${meta.label.split(' · ').pop()} refused this key. Check it was copied whole — keys start with ${meta.hint.replace('…', '')}. Nothing was saved.`
  }
  if (/412|key store|no key/i.test(raw)) {
    return 'This deployment has no key store, so there is nothing to set here.'
  }
  return 'That did not save. Nothing changed.'
}

export function clampInt(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function clampMoney(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null
}
