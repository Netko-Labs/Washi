import { useState } from 'react'
import { formatNumber } from '../../lib'
import { usePaperHost } from '../../provider'
import type { ScalarCellProps } from './lib'

/** Reads "3,550,000" (or "$3,550,000.00") in the vault's locale; a press gives the plain number. */
export function NumberCell({ column, value, commit }: ScalarCellProps) {
  const { locale } = usePaperHost()
  const [editing, setEditing] = useState(false)
  const number = typeof value === 'number' ? value : null
  if (!editing) {
    return (
      <button
        type="button"
        className="wsx-db-reading"
        data-num
        aria-label={`${column.name}: ${number ?? 'empty'}`}
        onClick={() => setEditing(true)}
      >
        {number === null ? (
          <span className="wsx-db-placeholder">Empty</span>
        ) : (
          formatNumber(number, locale, column.format)
        )}
      </button>
    )
  }
  return (
    <input
      className="wsx-db-input"
      data-num
      type="number"
      step="any"
      // biome-ignore lint/a11y/noAutofocus: the cell was pressed to edit it
      autoFocus
      defaultValue={number ?? ''}
      aria-label={column.name}
      onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
      onBlur={(event) => {
        setEditing(false)
        const next = event.currentTarget.value.trim()
        if (next === String(number ?? '')) return
        commit(next ? Number(next) : null)
      }}
    />
  )
}
