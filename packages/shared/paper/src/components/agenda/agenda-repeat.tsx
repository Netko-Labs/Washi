import { useState } from 'react'
import {
  AGENDA_COPY_LIMIT,
  type AgendaRepeatProps,
  copyDates,
  copyPatch,
  dayKeyOf,
  EVERY_DAY,
  eventTime,
  isSameDays,
  repeatWords,
  shiftDay,
  WORKDAYS,
  weekdayChips,
} from './lib'

/**
 * The event again on each picked weekday after its own day, through a date, at the same hours —
 * the preview says what lands before anything does, and past the limit nothing is offered.
 */
export function AgendaRepeat({
  row,
  columns,
  locale,
  weekStart,
  isBusy,
  onCopy,
  onBack,
}: AgendaRepeatProps) {
  const from = dayKeyOf(row[columns.date]) ?? ''
  const [through, setThrough] = useState(() => shiftDay(from, 4))
  const [weekdays, setWeekdays] = useState<readonly number[]>(EVERY_DAY)
  const plan = copyDates(String(row[columns.date] ?? ''), through, weekdays)
  const isReady = plan.days.length > 0 && !plan.isOver
  const toggle = (day: number) =>
    setWeekdays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]))
  const chip = (label: string, isOn: boolean, onPress: () => void, key = label) => (
    <button
      key={key}
      type="button"
      className="wsx-agenda-chip"
      aria-pressed={isOn}
      onClick={onPress}
    >
      {label}
    </button>
  )

  return (
    <form
      className="wsx-agenda-copy"
      onSubmit={(event) => {
        event.preventDefault()
        if (isReady) onCopy(plan.shifts.map((shift) => copyPatch(row, columns, shift)))
      }}
    >
      <label className="wsx-field">
        <span className="wsx-field-label">Through</span>
        <input
          type="date"
          className="wsx-field-input"
          value={through}
          min={shiftDay(from, 1)}
          required
          // biome-ignore lint/a11y/noAutofocus: the end date is where this step starts
          autoFocus
          onChange={(event) => setThrough(event.target.value)}
        />
      </label>
      <fieldset className="wsx-agenda-days-pick">
        <legend className="wsx-field-label">On</legend>
        <div className="wsx-agenda-chips">
          {chip('Every day', isSameDays(weekdays, EVERY_DAY), () => setWeekdays(EVERY_DAY))}
          {chip('Weekdays', isSameDays(weekdays, WORKDAYS), () => setWeekdays(WORKDAYS))}
        </div>
        <div className="wsx-agenda-chips">
          {weekdayChips(weekStart, locale).map(({ day, label }) =>
            chip(label, weekdays.includes(day), () => toggle(day), String(day)),
          )}
        </div>
      </fieldset>
      <p className="wsx-agenda-copy-note" role="status" data-over={plan.isOver || undefined}>
        {repeatWords(plan, eventTime(row, columns), locale)}
      </p>
      <div className="wsx-form-actions">
        <button
          type="submit"
          className="wsx-button"
          data-tone="accent"
          data-size="sm"
          disabled={!isReady || isBusy}
          aria-busy={isBusy || undefined}
        >
          {isReady ? `Add ${plan.days.length}` : 'Add'}
        </button>
        <button type="button" className="wsx-button" data-variant="plain" onClick={onBack}>
          Back
        </button>
        <span className="wsx-agenda-copy-limit">At most {AGENDA_COPY_LIMIT} at once</span>
      </div>
    </form>
  )
}
