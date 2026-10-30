import type { SuggestionInbox, Viewer } from '@washi/domain'
import { listPendingSuggestions, markSuggestionsRead, type Workspace } from '@washi/repository'
import { LOCAL_AUTHOR } from '../comments/constants'
import { readableSet } from '../sheets/access'

/** Pending suggestions on the pages this member reads, newest first; a trashed page's wait. */
export function suggestionInbox(ws: Workspace, viewer: Viewer): SuggestionInbox {
  const readable = readableSet(ws, viewer)
  const items = listPendingSuggestions(ws, viewer.id ?? LOCAL_AUTHOR.id).filter((suggestion) =>
    readable.has(suggestion.sheetId),
  )
  return { items, unread: items.filter((suggestion) => !suggestion.isRead).length }
}

export function unreadSuggestions(ws: Workspace, viewer: Viewer): number {
  return suggestionInbox(ws, viewer).unread
}

/** The given suggestions, or every one this member sees when none are named. */
export function markSuggestionsSeen(ws: Workspace, viewer: Viewer, ids?: string[]): void {
  const visible = suggestionInbox(ws, viewer).items.map((suggestion) => suggestion.id)
  const marked = ids ? visible.filter((id) => ids.includes(id)) : visible
  markSuggestionsRead(ws, viewer.id ?? LOCAL_AUTHOR.id, marked)
}
