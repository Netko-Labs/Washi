import type { MouseEvent } from 'react'
import { RECENTS_KEY_PREFIX, RECENTS_LIMIT } from './constants'
import type { RecentEntry } from './types'

/**
 * Sidebar entries are real links: a modified or middle click opens a browser tab like any link;
 * a plain click opens in place.
 */
export function openInPlace(event: MouseEvent, open: () => void): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  event.preventDefault()
  open()
}

/** Newest first, no repeats, never longer than the list Recents shows. */
export function pushRecent(list: RecentEntry[], id: string, at: number): RecentEntry[] {
  return [{ id, at }, ...list.filter((entry) => entry.id !== id)].slice(0, RECENTS_LIMIT)
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** `now` · `5m` · `2h` · `3d` — the age a Recents row shows. */
export function relativeAge(at: number, now: number): string {
  const gap = Math.max(0, now - at)
  if (gap < MINUTE) return 'now'
  if (gap < HOUR) return `${Math.floor(gap / MINUTE)}m`
  if (gap < DAY) return `${Math.floor(gap / HOUR)}h`
  return `${Math.floor(gap / DAY)}d`
}

export function readRecents(workspaceId: string): RecentEntry[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(RECENTS_KEY_PREFIX + workspaceId) ?? '[]',
    )
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is RecentEntry =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof (entry as RecentEntry).id === 'string' &&
            typeof (entry as RecentEntry).at === 'number',
        )
      : []
  } catch {
    return []
  }
}

export function writeRecents(workspaceId: string, list: RecentEntry[]): void {
  try {
    localStorage.setItem(RECENTS_KEY_PREFIX + workspaceId, JSON.stringify(list))
  } catch {
    // private mode: Recents lasts the visit
  }
}
