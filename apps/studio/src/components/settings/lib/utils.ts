import type { ProviderId, SettingsTab } from './types'
import { PROVIDER_META, SETTINGS_GROUPS } from './values'

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
    const shape = meta.hint.endsWith('…')
      ? `keys start with ${meta.hint.replace('…', '')}`
      : `it is the ${meta.hint}`
    return `${meta.label.split(' · ').pop()} refused this key. Check it was copied whole — ${shape}. Nothing was saved.`
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

/** The section a `?tab=` names, as its tab reads. */
export function settingsLabel(tab: SettingsTab): string {
  const sections = SETTINGS_GROUPS.flatMap((group) => group.sections)
  return sections.find((section) => section.key === tab)?.label ?? 'Settings'
}

/** The plain fact under every approval: each turn sends the ask and what Washi reads to a model. */
export function sentToModel(provider: string | null): string {
  const label = PROVIDER_META[provider as ProviderId]?.label
  const to = label
    ? `${label}, the model provider of the key Washi runs on`
    : 'the model provider of the key Washi runs on'
  return `On every turn, what you ask and the pages Washi reads are sent to ${to}.`
}
