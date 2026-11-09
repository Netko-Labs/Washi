import type { RowGuest, Viewer } from '@washi/domain'
import { approvedSuggestionFor, type Workspace } from '@washi/repository'
import { readableSet } from '../sheets/access'

/**
 * Who asked for a row through a page's link, kept with the row once a member approved it (D131):
 * their name for any member (members read every table), their email only for one who reads the
 * page they asked on — the same people who saw it in the Inbox.
 */
export function guestOfRecord(ws: Workspace, recordId: string, viewer: Viewer): RowGuest | null {
  const suggestion = approvedSuggestionFor(ws, recordId)
  if (!suggestion) return null
  const readsPage = readableSet(ws, viewer).has(suggestion.sheetId)
  return {
    name: suggestion.visitorName,
    email: readsPage && suggestion.visitorEmail ? suggestion.visitorEmail : null,
    sheetId: suggestion.sheetId,
    hlcAsked: suggestion.hlcCreated,
  }
}
