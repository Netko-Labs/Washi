import type { RecordData, TableSpec } from '@washi/ink'
import { bookingsOf, type SuggestTarget, suggestTargets } from '@washi/paper/registry'
import type { WsxElement } from '@washi/wsx'
import type { Booking } from './types'

const isStored = (type: string) => type !== 'formula' && type !== 'rollup'

/** A Board's card is titled like the board draws it: its `title`, else a title or name column. */
function boardTitle(spec: TableSpec, target: SuggestTarget): string | undefined {
  if (target.title) return target.title
  const names = spec.columns.map((column) => column.name)
  return (
    ['title', 'name'].find((name) => names.includes(name)) ??
    spec.columns.find((column) => column.type === 'text')?.name
  )
}

/**
 * What a visitor may write into `spec` through this page (D120): exactly the columns its own
 * Forms, calendars and boards name or seed — redacted ones too, for they are written, never read.
 */
export function writableColumns(root: WsxElement, spec: TableSpec): Set<string> {
  const stored = spec.columns.filter((column) => isStored(column.type)).map((each) => each.name)
  const out = new Set<string>()
  for (const target of suggestTargets(root)) {
    if (target.table !== spec.name) continue
    for (const name of [...(target.fields ?? stored), ...target.seeded]) out.add(name)
    const title = target.element === 'board' ? boardTitle(spec, target) : undefined
    if (title) out.add(title)
  }
  return new Set(stored.filter((name) => out.has(name)))
}

/**
 * The calendar a suggestion's date lands on, if any. A time on a Slots holds its slot length; a
 * bare day, an Agenda's +, holds nothing — a calendar day takes many events.
 */
export function bookingFor(root: WsxElement, table: string, cells: RecordData): Booking | null {
  const calendars = bookingsOf(root, table).filter(
    (target) => target.date && typeof cells[target.date] === 'string',
  )
  const isTimed = (target: SuggestTarget) =>
    target.minutes !== undefined && String(cells[target.date ?? '']).includes('T')
  const held = calendars.find(isTimed) ?? calendars.find((target) => target.minutes === undefined)
  return held?.date ? { date: held.date, minutes: held.minutes } : null
}
