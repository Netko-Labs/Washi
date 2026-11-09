import { clockChoices, readWhen, writeWhen } from '../../lib'
import { usePaperHost } from '../../provider'
import { tableLabel } from '../database'
import { ClockSelect, WhenInput } from '../when'
import type { FormClockProps, FormWhenProps } from './lib'

/** A date column: the day, and its hours one press away (+ Add time). */
export function FormWhen({ id, column, value, onChange, hasHours }: FormWhenProps) {
  const { locale } = usePaperHost()
  const when = readWhen(value)
  return (
    <WhenInput
      id={id}
      label={tableLabel(column.name)}
      locale={locale}
      value={hasHours === false ? { ...when, time: null, endTime: null } : when}
      onChange={(next) => onChange(writeWhen(next))}
      hasHours={hasHours}
    />
  )
}

/** A calendar's own time column (`time`, `end`): an hours list; an end's says how long it makes it. */
export function FormClock({ id, column, value, onChange, from }: FormClockProps) {
  const { locale } = usePaperHost()
  const time = typeof value === 'string' && value ? value.slice(-5) : ''
  const start = typeof from === 'string' && from ? from.slice(-5) : null
  return (
    <span id={id} className="wsx-when" data-look="field">
      <ClockSelect
        label={tableLabel(column.name)}
        className="wsx-field-input"
        value={time}
        choices={[{ value: '', label: '—' }, ...clockChoices(locale, start, time || null)]}
        onChange={(next) => onChange(next || null)}
      />
    </span>
  )
}
