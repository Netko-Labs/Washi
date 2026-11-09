import { isBusyCell, isOpenCell } from '../../../../registry'
import { HOUR_DEFAULT_MINUTES } from '../constants'
import type { AgendaColumns, DayBlocks, EventAnchor, HourBlock, HourRange, Row } from '../types'
import { eventWhen } from './when'

const DAY = 24 * 60
const CLOCK = /^(\d{2}):(\d{2})$/

/** `09:30` as minutes past midnight; anything else is null. */
const clockMinutes = (time: string | null | undefined): number | null => {
  const match = time ? CLOCK.exec(time) : null
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/** A bare day as minutes since the epoch day — wall clock, zones never enter. */
const dayMinutes = (day: string): number | null => {
  const ms = Date.parse(`${day}T00:00:00Z`)
  return Number.isNaN(ms) ? null : ms / 60_000
}

/** `HH:MM` back from minutes past midnight. */
export const clockOf = (minutes: number): string =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** A row's span in absolute minutes, or null for a whole day (it goes in the all-day row). */
function spanOf(row: Row, columns: AgendaColumns): { from: number; to: number } | null {
  const when = eventWhen(row, columns)
  const start = dayMinutes(when.day)
  const at = clockMinutes(when.time)
  if (start === null || at === null) return null
  const from = start + at
  const endDay = when.endDay ? dayMinutes(when.endDay) : start
  const until = clockMinutes(when.endTime)
  const to = endDay !== null && until !== null ? endDay + until : from + HOUR_DEFAULT_MINUTES
  return { from, to: Math.max(to, from + 15) }
}

/** Overlapping blocks side by side: each cluster of overlaps shares its width in lanes. */
function laneOut(blocks: HourBlock[]): HourBlock[] {
  const sorted = [...blocks].sort((a, b) => a.from - b.from || b.to - a.to)
  const out: HourBlock[] = []
  let cluster: HourBlock[] = []
  let lanes: number[] = []
  let reach = -1
  const close = () => {
    for (const block of cluster) out.push({ ...block, lanes: lanes.length })
    cluster = []
    lanes = []
  }
  for (const block of sorted) {
    if (block.from >= reach) close()
    const free = lanes.findIndex((end) => end <= block.from)
    const lane = free === -1 ? lanes.length : free
    lanes[lane] = block.to
    cluster.push({ ...block, lane })
    reach = Math.max(reach, block.to)
  }
  close()
  return out
}

/**
 * One day of a time grid (D133): timed rows as blocks in minutes past that midnight, cut to the
 * day; a row its Show-as column marks Open is a window drawn behind them; a bare day goes on top.
 */
export function dayBlocks(rows: Row[], columns: AgendaColumns, day: string): DayBlocks {
  const midnight = dayMinutes(day)
  if (midnight === null) return { timed: [], windows: [], allDay: [] }
  const timed: HourBlock[] = []
  const windows: HourBlock[] = []
  const allDay: Row[] = []
  for (const row of rows) {
    const show = columns.show ? row[columns.show] : undefined
    const span = spanOf(row, columns)
    if (!span) {
      const when = eventWhen(row, columns)
      const last = when.endDay ?? when.day
      if (when.day && when.day <= day && day <= last) allDay.push(row)
      continue
    }
    if (span.to <= midnight || span.from >= midnight + DAY) continue
    const block: HourBlock = {
      row,
      from: Math.max(span.from, midnight) - midnight,
      to: Math.min(span.to, midnight + DAY) - midnight,
      startsBefore: span.from < midnight,
      endsAfter: span.to > midnight + DAY,
      lane: 0,
      lanes: 1,
      isBusy: isBusyCell(show),
    }
    if (isOpenCell(show)) windows.push(block)
    else timed.push(block)
  }
  return { timed: laneOut(timed), windows, allDay }
}

/** The hours drawn: the page's `hours`, widened to whole hours so no block falls off the grid. */
export function hourRange(hours: string, days: DayBlocks[]): HourRange {
  const [open = '08:00', close = '20:00'] = hours.split('-')
  let from = clockMinutes(open) ?? 8 * 60
  let to = clockMinutes(close) ?? 20 * 60
  for (const day of days) {
    for (const block of [...day.timed, ...day.windows]) {
      from = Math.min(from, Math.floor(block.from / 60) * 60)
      to = Math.max(to, Math.ceil(block.to / 60) * 60)
    }
  }
  return { from: Math.max(0, from), to: Math.min(DAY, to) }
}

/** The half hour under a press `offset` pixels down the column, and an hour from it as a cell. */
export function slotAt(day: string, range: HourRange, offset: number, hourPx: number): string {
  const minute = range.from + Math.floor((offset / hourPx) * 2) * 30
  const from = Math.min(Math.max(minute, range.from), DAY - 30)
  const to = Math.min(from + HOUR_DEFAULT_MINUTES, DAY - 1)
  return `${day}T${clockOf(from)}/${day}T${clockOf(to === DAY - 1 ? 23 * 60 + 59 : to)}`
}

/** Where an element sits on screen, for a card to open beside it. */
export function anchorOf(element: Element): EventAnchor {
  const box = element.getBoundingClientRect()
  return { top: box.top, left: box.left, right: box.right, bottom: box.bottom }
}

const CARD_WIDTH = 460
const GAP = 8
const EDGE = 16

/**
 * Where a card opens beside its event (D134), as Proton and Teams place one: right of it if it
 * fits, else left, its top level with the event and kept on screen. Null where the screen is too
 * narrow for beside — a phone keeps the bottom sheet.
 */
export function cardPlacement(
  anchor: EventAnchor,
  height: number,
  view: { width: number; height: number },
): { top: number; left: number } | null {
  if (view.width < 720) return null
  const right = anchor.right + GAP
  const left =
    right + CARD_WIDTH + EDGE <= view.width ? right : Math.max(EDGE, anchor.left - GAP - CARD_WIDTH)
  const top = Math.min(Math.max(EDGE, anchor.top), Math.max(EDGE, view.height - height - EDGE))
  return { top, left }
}
