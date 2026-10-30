import { useState } from 'react'
import { SENT_NOTE, useLandedNote } from '../../../form'
import type { BoardDraft, BoardSuggest } from '../types'

/** A column's + New through a link that takes suggestions: a title asked for, then said sent. */
export function useBoardSuggest(): BoardSuggest {
  const [draft, setDraft] = useState<BoardDraft | null>(null)
  const landed = useLandedNote()
  return {
    draft,
    open: (next) => {
      landed.clear()
      setDraft(next)
    },
    close: () => setDraft(null),
    note: landed.note,
    landed: () => landed.show(SENT_NOTE),
  }
}
