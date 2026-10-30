import type { AgentMascotState } from '../../mascot'
import { editedAt } from '../../page-time'
import { WASHI_LINGER_MS } from './constants'
import type { PillInput } from './types'

/** When Washi's last write here stops showing (ms); 0 if the last write was a person's. */
export function lingerUntil(sheet: PillInput['sheet']): number {
  return sheet?.editedBy === 'washi' ? editedAt(sheet.hlcUpdated) + WASHI_LINGER_MS : 0
}

/** Washi shows on a page only while it works there or just wrote it; otherwise nothing. */
export function pillStateFor({ mood, isBusy, sheet, now }: PillInput): AgentMascotState | null {
  if (isBusy) return mood
  if (lingerUntil(sheet) <= now) return null
  return mood === 'done' ? 'done' : 'writing'
}
