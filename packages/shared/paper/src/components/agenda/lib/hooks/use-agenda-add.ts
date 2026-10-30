import { useState } from 'react'
import { SENT_NOTE, useLandedNote } from '../../../form'
import type { AgendaAdd, AgendaPick } from '../types'

/**
 * Which day's + or event's ⋯ is open; a suggestion sent through a link is said back, since
 * nothing lands (D120).
 */
export function useAgendaAdd(isSuggesting: boolean): AgendaAdd {
  const [pick, setPick] = useState<AgendaPick>(null)
  const landed = useLandedNote()
  return {
    pick,
    adding: pick?.kind === 'add' ? pick.day : null,
    open: (day) => {
      landed.clear()
      setPick({ kind: 'add', day })
    },
    openEvent: (row) => setPick({ kind: 'event', row }),
    close: () => setPick(null),
    note: landed.note,
    landed: () => {
      if (isSuggesting) landed.show(SENT_NOTE)
    },
  }
}
