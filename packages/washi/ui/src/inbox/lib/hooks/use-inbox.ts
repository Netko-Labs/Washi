import { useMemo, useState } from 'react'
import { useAgentStore } from '../../../stores'
import { useToday } from '../../../today'
import type { DayGroup, InboxFilter, InboxRow } from '../types'
import { groupByDay, matchesFilter } from '../utils'

/** The list: Washi's questions from the store, its turns from today, the host's rows, one filter. */
export function useInbox(extra: InboxRow[] | undefined) {
  const approvals = useAgentStore((state) => state.approvals)
  const { today } = useToday()
  const [filter, setFilter] = useState<InboxFilter>('all')
  const now = Date.now()

  const rows = useMemo<InboxRow[]>(() => {
    const turns = (today?.turns ?? []).map<InboxRow>((turn) => ({
      id: `${turn.sessionId}-${turn.at}`,
      kind: 'washi',
      at: turn.at,
      who: null,
      verb: turn.prompt || turn.sessionTitle,
      where: null,
      detail: turn.receipt.stopReason === 'error' ? (turn.receipt.error ?? 'failed') : null,
    }))
    return [...turns, ...(extra ?? [])]
  }, [today, extra])

  const groups: DayGroup[] = groupByDay(
    rows.filter((row) => matchesFilter(row, filter)),
    now,
  )
  const unread = rows.filter((row) => row.unread).length
  const mentions = (extra ?? []).filter((row) => row.kind === 'mention').length

  return { approvals, groups, filter, setFilter, now, unread, mentions, hasMentions: !!extra }
}
