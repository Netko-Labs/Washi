import type { Column, StatusGroup } from './types'

export function statusGroup(column: Column, value: string): StatusGroup {
  if (column.groups?.done.includes(value)) return 'done'
  if (column.groups?.doing.includes(value)) return 'doing'
  return 'todo'
}

const DAY = { month: 'short', day: 'numeric', year: 'numeric' } as const
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** `start/end` reads as a range; a lone date as itself. A bare day is a calendar day, not UTC midnight. */
export function formatDate(value: string): string {
  const [start, end] = value.split('/')
  const show = (part: string | undefined) =>
    part
      ? new Date(part).toLocaleDateString(undefined, {
          ...DAY,
          ...(DATE_ONLY.test(part) && { timeZone: 'UTC' }),
        })
      : ''
  return end ? `${show(start)} → ${show(end)}` : show(start)
}
