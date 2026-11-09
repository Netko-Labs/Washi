import { useRef } from 'react'
import { clockChoices, shiftClock, withDay, withoutTime, withStart, withTime } from '../../lib'
import { ClockSelect } from './clock-select'
import type { WhenInputProps } from './lib'

const INPUT = { field: 'wsx-field-input', cell: 'wsx-db-input' } as const

/**
 * A day and, when it has one, its hours: start and end from a list, the end's choices saying how
 * long each makes it. "Add time" turns a whole day into 09:00 for an hour; × makes it whole again.
 * A new start keeps the length; a new day carries the span. A whole day may end on a later day.
 */
export function WhenInput({
  label,
  value,
  onChange,
  look = 'field',
  id,
  autoFocus,
  locale,
  hasDay = true,
  hasHours = true,
}: WhenInputProps) {
  const input = INPUT[look]
  // A chip unmounts as it is pressed; focus goes back to the day, so the group never loses it.
  const dayInput = useRef<HTMLInputElement>(null)
  const change = (next: typeof value) => {
    onChange(next)
    dayInput.current?.focus()
  }
  const isTimed = hasHours && value.time !== null
  const hasEndDay = value.endDay !== null && value.endDay !== value.day

  return (
    <span role="group" aria-label={label} className="wsx-when" data-look={look}>
      {hasDay && (
        <input
          ref={dayInput}
          id={id}
          type="date"
          className={input}
          aria-label={`${label} day`}
          // biome-ignore lint/a11y/noAutofocus: pressed to edit, typing starts here
          autoFocus={autoFocus}
          value={value.day}
          onChange={(event) => onChange(withDay(value, event.currentTarget.value))}
        />
      )}
      {value.day && isTimed && (
        <span className="wsx-when-hours">
          <ClockSelect
            label={`${label} starts`}
            className={input}
            value={value.time ?? ''}
            choices={clockChoices(locale, null, value.time)}
            onChange={(time) => onChange(withStart(value, time))}
          />
          <span className="wsx-when-dash" aria-hidden>
            –
          </span>
          {hasEndDay && (
            <input
              type="date"
              className={input}
              aria-label={`${label} end day`}
              min={value.day}
              value={value.endDay ?? ''}
              onChange={(event) =>
                onChange({ ...value, endDay: event.currentTarget.value || null })
              }
            />
          )}
          <ClockSelect
            label={`${label} ends`}
            className={input}
            value={value.endTime ?? ''}
            choices={[
              ...(value.endTime ? [] : [{ value: '', label: 'No end' }]),
              ...clockChoices(locale, hasEndDay ? null : value.time, value.endTime),
            ]}
            onChange={(endTime) => onChange({ ...value, endTime: endTime || null })}
          />
          <button
            type="button"
            className="wsx-when-chip"
            title="No hours: the whole day"
            onClick={() => change(withoutTime(value))}
          >
            All day
          </button>
        </span>
      )}
      {value.day && !isTimed && (
        <span className="wsx-when-hours">
          {value.endDay !== null && (
            <>
              <span className="wsx-when-dash" aria-hidden>
                →
              </span>
              <input
                type="date"
                className={input}
                aria-label={`${label} end day`}
                min={value.day}
                value={value.endDay}
                onChange={(event) =>
                  onChange({ ...value, endDay: event.currentTarget.value || null })
                }
              />
            </>
          )}
          {hasHours && (
            <button
              type="button"
              className="wsx-when-chip"
              data-add
              onClick={() => change(withTime(value))}
            >
              + Add time
            </button>
          )}
          {value.endDay === null && (
            <button
              type="button"
              className="wsx-when-chip"
              data-add
              onClick={() =>
                change({ ...value, endDay: shiftClock(value.day, '00:00', 24 * 60).day })
              }
            >
              + End day
            </button>
          )}
        </span>
      )}
    </span>
  )
}
