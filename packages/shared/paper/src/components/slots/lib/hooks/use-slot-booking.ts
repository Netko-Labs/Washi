import { useState } from 'react'
import { useData } from '../../../../data'
import { resolveQuery, toRows } from '../../../../lib'
import { usePaperHost } from '../../../../provider'
import type { BindQuery } from '../../../../registry'
import { useSheetState } from '../../../../state'
import { rangeQuery } from '../../../agenda'
import { SENT_NOTE, useLandedNote } from '../../../form'
import type { Slot, SlotBooking } from '../types'
import { dayOf, isTaken, slotWords } from '../utils'

/**
 * The slot being booked, and a last look before it is: the week drawn may be stale, so the
 * picked day is read again as the row is sent, and a slot taken meanwhile is refused. Once the
 * row lands, the slot is said back for a few seconds. A time requested meanwhile is held too.
 */
export function useSlotBooking(
  bind: BindQuery,
  date: string,
  minutes: number,
  isSuggesting = false,
): SlotBooking {
  const host = usePaperHost()
  const { values } = useSheetState()
  const { refresh } = useData()
  const [picked, setPicked] = useState<Slot | null>(null)
  const landed = useLandedNote()

  const check = async () => {
    if (!picked) return null
    const { day, next } = dayOf(picked)
    const [result, asked] = await Promise.all([
      host.runQuery(resolveQuery(rangeQuery(bind, date, day, next), values)),
      host.requested?.(bind.table, date, day, next) ?? Promise.resolve([]),
    ])
    const held = asked.map((cell) => ({ [date]: cell }))
    const taken = isTaken(picked, toRows(result.rows), date, minutes)
      ? 'booked'
      : isTaken(picked, held, date, minutes)
        ? 'requested'
        : null
    if (!taken) return null
    refresh()
    return `${picked.label} was just ${taken} — pick another time`
  }

  return {
    picked,
    pick: (slot) => {
      landed.clear()
      setPicked(slot)
    },
    close: () => setPicked(null),
    check,
    booked: landed.note,
    landed: () => {
      if (!picked) return
      const words = slotWords(picked, host.locale)
      landed.show(isSuggesting ? `Requested ${words}. ${SENT_NOTE}` : `Booked ${words}`)
    },
  }
}
