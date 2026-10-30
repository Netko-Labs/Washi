import { useState } from 'react'
import { useBind } from '../../../../lib'
import { useSheetState } from '../../../../state'
import { AGENDA_SPAN_DAYS } from '../constants'
import type { AgendaPeriod, AgendaPeriodOptions } from '../types'
import {
  addDays,
  addMonths,
  isoDay,
  monthKey,
  monthOf,
  monthSpan,
  rangeQuery,
  weekSpan,
  weekStartOf,
} from '../utils'

/**
 * Which week or month is shown, and its rows. The reader's own unless `stateKey` names page
 * state: then a month follows that key, and moving writes it, so a month picker moves with it.
 */
export function useAgendaPeriod({
  bind,
  date,
  weekStart,
  view,
  stateKey,
  locale,
}: AgendaPeriodOptions): AgendaPeriod {
  const [offset, setOffset] = useState(0)
  const sheet = useSheetState()
  const now = new Date()
  const today = isoDay(now)
  const thisMonth = addMonths(now, 0)
  const followed = view === 'month' && stateKey ? monthOf(sheet.values[stateKey]) : null
  const month = followed ?? addMonths(now, offset)
  const span =
    view === 'month'
      ? monthSpan(month, weekStart, today, locale)
      : weekSpan(weekStartOf(now, weekStart, offset), today, locale)
  const from = addDays(span.start, -AGENDA_SPAN_DAYS)
  const to = addDays(span.start, span.days.length)
  const state = useBind(rangeQuery(bind, date, isoDay(from), isoDay(to)))

  const moveTo = (target: Date) => {
    if (stateKey) sheet.set(stateKey, monthKey(target))
  }
  const isCurrent = view === 'month' ? monthKey(month) === monthKey(thisMonth) : offset === 0

  return {
    days: span.days,
    label: span.label,
    state,
    isCurrent,
    shift: (steps) =>
      view === 'month' && stateKey
        ? moveTo(addMonths(month, steps))
        : setOffset((current) => current + steps),
    reset: () => (view === 'month' && stateKey ? moveTo(thisMonth) : setOffset(0)),
  }
}
