import { useState } from 'react'
import { usePaperHost } from '../../provider'
import { type DateInputsProps, dateLabel, type ScalarCellProps } from './lib'

function split(value: ScalarCellProps['value']): [string, string] {
  const [start = '', end = ''] = typeof value === 'string' ? value.split('/') : []
  return [start.slice(0, 10), end.slice(0, 10)]
}

/** The start and an optional end, as in Notion; leaving both puts the cell back to reading. */
function DateInputs({ column, value, commit, onDone }: DateInputsProps) {
  const [start, end] = split(value)
  const write = (nextStart: string, nextEnd: string) => {
    if (!nextStart) return commit(null)
    commit(nextEnd ? `${nextStart}/${nextEnd}` : nextStart)
  }
  return (
    <span
      role="group"
      aria-label={column.name}
      className="wsx-db-date"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onDone()
      }}
    >
      <input
        type="date"
        className="wsx-db-input"
        aria-label={`${column.name} start`}
        // biome-ignore lint/a11y/noAutofocus: the cell was pressed to edit it
        autoFocus
        value={start}
        onChange={(event) => write(event.currentTarget.value, end)}
      />
      {start && (
        <input
          type="date"
          className="wsx-db-input"
          aria-label={`${column.name} end`}
          value={end}
          min={start}
          onChange={(event) => write(start, event.currentTarget.value)}
        />
      )}
    </span>
  )
}

/** Reads "Nov 4, 2026"; a press turns it into the pickers. */
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
