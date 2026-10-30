import type { Viewer } from '@washi/domain'
import { spanOf } from '@washi/paper/registry'
import {
  decideSuggestion,
  getSheet,
  getSuggestion,
  type SuggestionRecord,
  type Workspace,
} from '@washi/repository'
import { parse } from '@washi/wsx'
import { LOCAL_AUTHOR } from '../comments/constants'
import { readableSet, SheetNotFoundError } from '../sheets/access'
import { InkError } from '../tables/errors'
import { runMutation } from '../tables/service'
import { bookingFor } from './allowed'
import { SuggestionError } from './errors'
import { takenBy } from './spans'

/** Only a member who reads the suggestion's page decides it; to anyone else it is not there. */
function pendingFor(ws: Workspace, id: string, viewer: Viewer): SuggestionRecord {
  const suggestion = getSuggestion(ws, id)
  if (!suggestion || !readableSet(ws, viewer).has(suggestion.sheetId)) {
    throw new SheetNotFoundError(suggestion?.sheetId ?? id)
  }
  if (suggestion.status !== 'pending') {
    throw new SuggestionError(`This suggestion was ${suggestion.status} already.`)
  }
  return suggestion
}

/** A time its page's Slots holds, booked since it was asked for, is not booked twice. */
function refuseBookedTime(ws: Workspace, suggestion: SuggestionRecord) {
  const page = getSheet(ws, suggestion.sheetId)
  if (!page || suggestion.kind !== 'booking') return
  const booking = bookingFor(parse(page.source), suggestion.tableName, suggestion.cells)
  if (!booking || booking.minutes === undefined) return
  const span = spanOf(suggestion.cells[booking.date], booking.minutes)
  const minutes = booking.minutes
  if (span && takenBy(ws, suggestion.tableName, booking.date, span, { minutes, pending: false })) {
    throw new SuggestionError('That time is booked now — decline this one, or free the time first.')
  }
}

/**
 * A member approves (D120): the row lands through ink's own insert, checked against the table as
 * it is now, in history under that member's id (P1). Washi has no way to call this (A2).
 */
export function approveSuggestion(
  ws: Workspace,
  id: string,
  viewer: Viewer,
): { recordId: string | null } {
  const suggestion = pendingFor(ws, id, viewer)
  refuseBookedTime(ws, suggestion)
  const by = viewer.id ?? LOCAL_AUTHOR.id
  let recordId: string | null
  try {
    recordId =
      runMutation(ws, { kind: 'insert', table: suggestion.tableName, data: suggestion.cells }, by)
        .id ?? null
  } catch (cause) {
    if (cause instanceof InkError) {
      throw new SuggestionError(
        `It no longer fits “${suggestion.tableName}”: ${cause.message}. Decline it instead.`,
      )
    }
    throw cause
  }
  decideSuggestion(ws, id, { status: 'approved', by, recordId })
  return { recordId }
}

export function declineSuggestion(ws: Workspace, id: string, viewer: Viewer): void {
  pendingFor(ws, id, viewer)
  decideSuggestion(ws, id, { status: 'declined', by: viewer.id ?? LOCAL_AUTHOR.id, recordId: null })
}
