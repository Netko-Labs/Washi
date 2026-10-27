import { useState } from 'react'
import { useBind } from '../../../../lib'
import type { AgendaWeek, AgendaWeekOptions } from '../types'
import { addDays, isoDay, weekDays, weekLabel, weekQuery, weekStartOf } from '../utils'

/** Which week is shown, and its rows. The week is the reader's: nothing about it is saved. */
export function useAgendaWeek({ bind, date, weekStart, locale }: AgendaWeekOptions): AgendaWeek {
  const [offset, setOffset] = useState(0)
  const now = new Date()
  const start = weekStartOf(now, weekStart, offset)
  const state = useBind(weekQuery(bind, date, isoDay(start), isoDay(addDays(start, 7))))

  return {
    days: weekDays(start, isoDay(now), locale),
    label: weekLabel(start, locale),
    state,
    isThisWeek: offset === 0,
    shift: (weeks) => setOffset((current) => current + weeks),
    reset: () => setOffset(0),
  }
}
