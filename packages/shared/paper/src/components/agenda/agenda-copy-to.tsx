import { useState } from 'react'
import {
  type AgendaCopyPageProps,
  copyPatch,
  dayGap,
  dayKeyOf,
  dayWords,
  eventTime,
  shiftDay,
} from './lib'

/** One copy on a picked day: its time of day and length kept, only the date moved. */
export function AgendaCopyTo({
  row,
  columns,
  locale,
  isBusy,
  onCopy,
  onBack,
}: AgendaCopyPageProps) {
  const from = dayKeyOf(row[columns.date]) ?? ''
  const [day, setDay] = useState(() => shiftDay(from, 1))
  const gap = dayGap(from, day)
  const time = eventTime(row, columns)

  return (
    <form
      className="wsx-agenda-copy"
      onSubmit={(event) => {
        event.preventDefault()
        if (gap !== null) onCopy([copyPatch(row, columns, gap)])
      }}
    >
      <label className="wsx-field">
        <span className="wsx-field-label">Copy to</span>
        <input
          type="date"
          className="wsx-field-input"
          value={day}
          required
          // biome-ignore lint/a11y/noAutofocus: the picker is the one thing this step asks for
          autoFocus
          onChange={(event) => setDay(event.target.value)}
        />
      </label>
      <p className="wsx-agenda-copy-note">
        {time ? `Keeps ${time} and every property.` : 'Keeps every property.'}
      </p>
      <div className="wsx-form-actions">
        <button
          type="submit"
          className="wsx-button"
          data-tone="accent"
          data-size="sm"
          disabled={gap === null || isBusy}
          aria-busy={isBusy || undefined}
        >
          {gap === null ? 'Copy' : `Copy to ${dayWords(day, locale)}`}
        </button>
        <button type="button" className="wsx-button" data-variant="plain" onClick={onBack}>
          Back
        </button>
      </div>
    </form>
  )
}
