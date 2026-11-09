import { useState } from 'react'
import { readWhen, writeWhen } from '../../lib'
import { usePaperHost } from '../../provider'
import { WhenInput } from '../when'
import { type DateInputsProps, dateLabel, type ScalarCellProps } from './lib'

function split(value: ScalarCellProps['value']): [string, string] {
  const [start = '', end = ''] = typeof value === 'string' ? value.split('/') : []
  return [start, end]
}

/**
 * The day, its hours and an optional end, as in Notion — each change lands as it is picked, so
 * adding an hour is two presses. Leaving the group puts the cell back to reading.
 */
function DateInputs({ column, value, commit, onDone }: DateInputsProps) {
  const { locale } = usePaperHost()
  // What was picked shows at once; the write lands behind it.
  const [draft, setDraft] = useState(() => readWhen(value))
  return (
    <span
      role="group"
      aria-label={`${column.name}, editing`}
      className="wsx-db-date"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onDone()
      }}
    >
      <WhenInput
        label={column.name}
        look="cell"
        autoFocus
        locale={locale}
        value={draft}
        onChange={(when) => {
          setDraft(when)
          const cell = writeWhen(when)
          if (cell !== (typeof value === 'string' ? value : null)) commit(cell)
        }}
      />
    </span>
  )
}

/** Reads "Nov 4, 2026 · 10:00 AM – 11:00 AM"; a press turns it into the pickers. */
export function DateCell(props: ScalarCellProps) {
  const { locale } = usePaperHost()
  const [editing, setEditing] = useState(false)
  const [start, end] = split(props.value)
  if (editing) return <DateInputs {...props} onDone={() => setEditing(false)} />
  return (
    <button
      type="button"
      className="wsx-db-reading"
      aria-label={`${props.column.name}: ${start ? dateLabel(start, end, locale) : 'empty'}`}
      onClick={() => setEditing(true)}
    >
      {start ? dateLabel(start, end, locale) : <span className="wsx-db-placeholder">Empty</span>}
    </button>
  )
}
