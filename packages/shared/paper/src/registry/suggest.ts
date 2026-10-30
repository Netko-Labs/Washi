import type { WsxElement } from '@washi/wsx'
import { tableOf, walk } from './share'
import type { Span, SuggestTarget } from './suggest-types'

const DAY_MINUTES = 24 * 60
const SLOT_MINUTES = 30
const MOMENT = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/

const names = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((name): name is string => typeof name === 'string') : []

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined

function targetOf(node: WsxElement): SuggestTarget | null {
  const { props } = node
  const bound = tableOf(props.bind)
  const date = text(props.date)
  switch (node.name) {
    case 'Form': {
      const table = text(props.table)
      if (!table) return null
      const defaults = props.defaults && typeof props.defaults === 'object' ? props.defaults : {}
      const fields = Array.isArray(props.fields) ? names(props.fields) : null
      return { element: 'form', table, fields, seeded: Object.keys(defaults) }
    }
    case 'Agenda':
      if (!bound || !date || !Array.isArray(props.add)) return null
      return { element: 'agenda', table: bound, fields: names(props.add), seeded: [date], date }
    case 'Slots':
      if (!bound || !date || !Array.isArray(props.add)) return null
      return {
        element: 'slots',
        table: bound,
        fields: names(props.add),
        seeded: [date],
        date,
        minutes: typeof props.minutes === 'number' ? props.minutes : SLOT_MINUTES,
      }
    case 'Board': {
      const groupBy = text(props.groupBy)
      if (!bound || !groupBy || props.onAdd !== undefined) return null
      const title = text(props.title)
      return { element: 'board', table: bound, fields: [], seeded: [groupBy], title }
    }
    default:
      return null
  }
}

/** Every element on the page a visitor could add a row through, read off the page itself. */
export function suggestTargets(root: WsxElement): SuggestTarget[] {
  const out: SuggestTarget[] = []
  walk(root, (node) => {
    const target = targetOf(node)
    if (target) out.push(target)
  })
  return out
}

/** The calendars over `table` on the page: what a pending time there holds. */
export function bookingsOf(root: WsxElement, table: string): SuggestTarget[] {
  return suggestTargets(root).filter((target) => target.table === table && target.date)
}

function minutesOf(value: string): number | null {
  const match = MOMENT.exec(value)
  if (!match?.[1]) return null
  const day = Date.parse(`${match[1]}T00:00:00Z`) / 60_000
  return day + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

/** What a date cell takes, as Slots reads it: `start/end`, a moment for `minutes`, a day whole. */
export function spanOf(value: unknown, minutes = SLOT_MINUTES): Span | null {
  if (typeof value !== 'string') return null
  const [start = '', end] = value.split('/')
  const from = minutesOf(start)
  if (from === null) return null
  const until = end ? minutesOf(end) : null
  if (until !== null) return { from, to: until }
  return { from, to: from + (start.includes('T') ? minutes : DAY_MINUTES) }
}

export const spansOverlap = (a: Span, b: Span): boolean => a.from < b.to && b.from < a.to
