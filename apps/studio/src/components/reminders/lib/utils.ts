import type { ReminderHit } from '@washi/domain'
import { editedAt, type InboxRow } from '@washi/ui'
import { DAY_MS } from './constants'

const localDay = (day: string) => {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1).getTime()
}

/** From the reader's today: due in 2 days, due today, was due yesterday. */
export function dueLabel(dueDay: string, now = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const days = Math.round((localDay(dueDay) - today) / DAY_MS)
  if (days === 0) return 'is due today'
  if (days === 1) return 'is due tomorrow'
  if (days > 1) return `is due in ${days} days`
  if (days === -1) return 'was due yesterday'
  return `was due ${-days} days ago`
}

/** A hit as an Inbox row: the row's name · when it is due, the rule under it. */
export function rowOf(hit: ReminderHit, open: (hit: ReminderHit) => void): InboxRow {
  return {
    id: hit.id,
    kind: 'reminder',
    at: editedAt(hit.hlcCreated),
    who: hit.rowTitle,
    verb: dueLabel(hit.dueDay),
    where: null,
    detail: hit.reminderTitle,
    unread: !hit.isRead,
    onOpen: () => open(hit),
  }
}
