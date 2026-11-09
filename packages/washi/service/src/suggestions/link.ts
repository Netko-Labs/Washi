import type { RequestedAsk, SuggestionAsk } from '@washi/domain'
import type { TableSpec } from '@washi/ink'
import { redactForShare, spanOf } from '@washi/paper/registry'
import {
  countPendingOnSheet,
  countSuggestionsSince,
  getTableByName,
  insertSuggestion,
  type Workspace,
} from '@washi/repository'
import type { WsxElement } from '@washi/wsx'
import { accessOf, asksEmail } from '../sheets/look-of'
import { hiddenIn, refuseReading, ShareRefusedError, sharedSheet } from '../sheets/share'
import { InkError } from '../tables/errors'
import { checkData } from '../tables/rules'
import { bookingFor, writableColumns } from './allowed'
import { BURST_LIMIT, BURST_MS, DAY_LIMIT, DAY_MS, PENDING_PER_PAGE } from './constants'
import { SuggestionRefusedError } from './errors'
import { insideOpenWindow, requestedSpans, takenBy } from './spans'

/** The page behind a link that takes suggestions, and what it lets a visitor write in `table`. */
function suggesting(ws: Workspace, token: string, table: string) {
  const { sheet, root: whole } = sharedSheet(ws, token)
  // Only what the link draws takes suggestions: never a form inside a secret tab (D127).
  const root = redactForShare(whole)
  if (!accessOf(root).suggest) throw new ShareRefusedError('this page does not take suggestions')
  const spec = getTableByName(ws, table)?.spec
  const writable = spec ? writableColumns(root, spec) : new Set<string>()
  if (!spec || writable.size === 0) {
    throw new ShareRefusedError(`this page takes no suggestions for "${table}"`)
  }
  return { sheet, root, spec, writable }
}

/** A form on the link learns the columns it may write — a redacted one by type, never a value. */
export function sharedWritable(ws: Workspace, token: string, table: string): TableSpec | null {
  try {
    const { spec, writable } = suggesting(ws, token, table)
    return { ...spec, columns: spec.columns.filter((column) => writable.has(column.name)) }
  } catch (cause) {
    if (cause instanceof ShareRefusedError) return null
    throw cause
  }
}

/** Pending times a link's calendar draws as Requested: the times only, never who asked. */
export function sharedRequested(
  ws: Workspace,
  token: string,
  ask: RequestedAsk,
  page?: string,
): string[] {
  const { root } = sharedSheet(ws, token, page)
  refuseReading(hiddenIn(ws, root, ask.table), [ask.date])
  return requestedSpans(ws, ask)
}

function refuseOverLimit(ws: Workspace, sheetId: string, ipHash: string, now: number) {
  if (countSuggestionsSince(ws, ipHash, now - BURST_MS) >= BURST_LIMIT) {
    throw new SuggestionRefusedError(
      'You have sent several suggestions in a few minutes — wait a little, then try again.',
      true,
    )
  }
  if (countSuggestionsSince(ws, ipHash, now - DAY_MS) >= DAY_LIMIT) {
    throw new SuggestionRefusedError(
      'You have sent as many suggestions as a day allows — try again tomorrow.',
      true,
    )
  }
  if (countPendingOnSheet(ws, sheetId) >= PENDING_PER_PAGE) {
    throw new SuggestionRefusedError(
      'This page has too many suggestions waiting — try again once its owner has gone through them.',
      true,
    )
  }
}

function refuseTakenTime(ws: Workspace, root: WsxElement, ask: SuggestionAsk) {
  const booking = bookingFor(root, ask.table, ask.cells)
  if (!booking) return null
  if (booking.minutes === undefined) return booking.date
  const span = spanOf(ask.cells[booking.date], booking.minutes)
  // A Slots with a Show-as column books only inside its Open windows (D133).
  if (span && booking.show && !insideOpenWindow(ws, ask.table, booking.date, booking.show, span)) {
    throw new SuggestionRefusedError('That time is not open for booking — pick another.')
  }
  const taken =
    span &&
    takenBy(ws, ask.table, booking.date, span, {
      minutes: booking.minutes,
      pending: true,
      show: booking.show,
    })
  if (taken) {
    throw new SuggestionRefusedError(`That time was just ${taken} — pick another.`)
  }
  return booking.date
}

/**
 * A visitor's row, kept pending for a member to approve (D120): only the columns the page's own
 * adds name, each cell checked as ink checks a write, a booked or requested time refused. The
 * route hashes the address; a filled trap is taken in silence and kept nowhere.
 */
export function suggestRow(
  ws: Workspace,
  token: string,
  ask: SuggestionAsk,
  ipHash: string,
  now = Date.now(),
): { id: string | null } {
  const { sheet, root, spec, writable } = suggesting(ws, token, ask.table)
  if (ask.trap) return { id: null }
  refuseOverLimit(ws, sheet.id, ipHash, now)
  // The page decides whether a visitor gives an email (D131); one it does not ask for is not kept.
  const email = asksEmail(root) ? (ask.email ?? '').trim() : ''
  if (asksEmail(root) && !email) throw new SuggestionRefusedError('Your email is needed.')
  const names = Object.keys(ask.cells)
  if (names.length === 0) throw new SuggestionRefusedError('Fill in a field first.')
  const stray = names.find((name) => !writable.has(name))
  if (stray) throw new SuggestionRefusedError(`“${stray}” is not something this page asks for.`)
  try {
    checkData(ws, spec, ask.cells)
  } catch (cause) {
    if (cause instanceof InkError) throw new SuggestionRefusedError(cause.message)
    throw cause
  }
  const dateColumn = refuseTakenTime(ws, root, ask)
  const id = insertSuggestion(ws, {
    sheetId: sheet.id,
    tableName: ask.table,
    kind: dateColumn ? 'booking' : 'row',
    dateColumn,
    cells: ask.cells,
    visitorName: ask.name,
    visitorEmail: email,
    ipHash,
  })
  return { id }
}
