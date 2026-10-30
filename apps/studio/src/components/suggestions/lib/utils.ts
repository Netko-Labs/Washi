import type { Suggestion } from '@washi/domain'
import type { Cell } from '@washi/ink'
import { editedAt, type InboxRow } from '@washi/ui'
import { DETAIL_CELLS } from './constants'
import type { SuggestionActions } from './types'

/** A wall-clock date cell as the booking reads: "Tue 3 Nov 10:00"; zones never enter. */
export function whenWords(cell: Cell | undefined): string | null {
  if (typeof cell !== 'string') return null
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/.exec(cell)
  if (!match?.[1]) return null
  const day = new Date(`${match[1]}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  return match[2] ? `${day.replace(',', '')} ${match[2]}` : day.replace(',', '')
}

const said = (cell: Cell): string | null => {
  if (Array.isArray(cell)) return cell.length > 0 ? cell.join(', ') : null
  if (cell === null || cell === '') return null
  return typeof cell === 'boolean' ? (cell ? 'Yes' : 'No') : String(cell)
}

/** The booking's time first, then the first few things the visitor filled in. */
export function detailOf(suggestion: Suggestion): string {
  const { cells, dateColumn } = suggestion
  const when = dateColumn ? whenWords(cells[dateColumn]) : null
  const rest = Object.entries(cells)
    .filter(([column]) => column !== dateColumn)
    .flatMap(([, cell]) => {
      const words = said(cell)
      return words ? [words.length > 80 ? `${words.slice(0, 79)}…` : words] : []
    })
    .slice(0, DETAIL_CELLS)
  return [...(when ? [when] : []), ...rest].join(' · ')
}

/** "Ana Ruiz (ana@x.com) suggested a booking on Book a call", with Approve and Decline. */
export function rowOf(suggestion: Suggestion, actions: SuggestionActions): InboxRow {
  return {
    id: `suggestion:${suggestion.id}`,
    kind: 'suggestion',
    at: editedAt(suggestion.hlcCreated),
    who: `${suggestion.visitorName} (${suggestion.visitorEmail})`,
    verb: suggestion.kind === 'booking' ? 'suggested a booking on' : 'suggested a row on',
    where: suggestion.sheetTitle,
    detail: detailOf(suggestion),
    unread: !suggestion.isRead,
    onOpen: () => actions.open(suggestion),
    actions: [
      { label: 'Approve', isPrimary: true, run: () => actions.approve(suggestion.id) },
      { label: 'Decline', run: () => actions.decline(suggestion.id) },
    ],
  }
}
