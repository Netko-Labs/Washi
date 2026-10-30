import type { ApprovalDecision, ApprovalRequest } from '@washi/domain'
import type { TodayTurn } from '../../today'

export type StopReason = TodayTurn['receipt']['stopReason']

export type InboxKind = 'mention' | 'washi' | 'reminder'
export type InboxFilter = 'all' | 'needs' | 'mentions' | 'washi'

/** One line in the list: `who verb where`, a second line, a time. The host shapes mentions this way. */
export interface InboxRow {
  id: string
  kind: InboxKind
  /** Wall-clock ms. */
  at: number
  /** A person's name — a reminder's row name — or null for Washi (the mascot leads the row). */
  who: string | null
  verb: string
  where: string | null
  detail: string | null
  mono?: boolean
  unread?: boolean
  onOpen?: () => void
}

export interface DayGroup {
  label: string
  rows: InboxRow[]
}

export interface InboxProps {
  /** Rows the host adds — the studio's mentions and reminders. Washi's turns and questions come from the stores. */
  rows?: InboxRow[]
}

export interface InboxRowProps {
  row: InboxRow
  now: number
}

export interface NeedRowProps {
  request: ApprovalRequest
  now: number
  onDecide: (decision: ApprovalDecision) => Promise<void>
}

export interface InboxChipProps {
  filter: InboxFilter
  active: InboxFilter
  count?: number
  onPick: (filter: InboxFilter) => void
}
