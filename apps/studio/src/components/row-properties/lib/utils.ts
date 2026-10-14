import type { Column, StatusGroup } from './types'

export function statusGroup(column: Column, value: string): StatusGroup {
  if (column.groups?.done.includes(value)) return 'done'
  if (column.groups?.doing.includes(value)) return 'doing'
  return 'todo'
}

const DAY = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

/** `start/end` reads as a range; a lone date as itself. */
export function formatDate(value: string): string {
  const [start, end] = value.split('/')
  const show = (part: string | undefined) => (part ? DAY.format(new Date(part)) : '')
  return end ? `${show(start)} → ${show(end)}` : show(start)
}
