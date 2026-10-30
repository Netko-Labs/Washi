import { formatNumber } from '../../lib'
import { usePaperHost } from '../../provider'
import { type ChoiceCellProps, hueAt, type RelationCellProps, type ScalarCellProps } from './lib'

/** Text, number and URL: typed in place, written when the cell is left. */
export function TextCell({ column, value, commit }: ScalarCellProps) {
  const shown = value === null || value === undefined || Array.isArray(value) ? '' : String(value)
  const numeric = column.type === 'number'
  return (
    <input
      key={shown}
      className="wsx-db-input"
      data-num={numeric || undefined}
      type={numeric ? 'number' : column.type === 'url' ? 'url' : 'text'}
      defaultValue={shown}
      placeholder="Empty"
      aria-label={column.name}
      onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
      onBlur={(event) => {
        const next = event.currentTarget.value.trim()
        if (next === shown) return
        if (!next) return commit(null)
        commit(numeric ? Number(next) : next)
      }}
    />
  )
}

export function CheckCell({ column, value, commit }: ScalarCellProps) {
  return (
    <input
      type="checkbox"
      className="wsx-db-check wsx-form-check"
      aria-label={column.name}
      checked={value === true}
      onChange={(event) => commit(event.currentTarget.checked)}
    />
  )
}

/** Multi-select and relation: chips to drop, a menu to add. */
export function ListCell({ column, value, commit, choices, unknown }: ChoiceCellProps) {
  const items = Array.isArray(value) ? value : []
  const label = (item: string) =>
    choices.find((choice) => choice.value === item)?.label ?? unknown ?? item
  const rest = choices.filter((choice) => !items.includes(choice.value))
  return (
    <span className="wsx-db-list">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="wsx-db-chip"
          data-hue={
            column.type === 'multi_select'
              ? hueAt(choices.findIndex((choice) => choice.value === item))
              : undefined
          }
          data-relation={column.type === 'relation' || undefined}
          title="Remove"
          onClick={() => commit(items.filter((each) => each !== item))}
        >
          {label(item)} <span aria-hidden>×</span>
        </button>
      ))}
      {rest.length > 0 && (
        <select
          className="wsx-db-add"
          aria-label={`Add to ${column.name}`}
          value=""
          onChange={(event) =>
            event.currentTarget.value && commit([...items, event.currentTarget.value])
          }
        >
          <option value="">+</option>
          {rest.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      )}
    </span>
  )
}

/** Related rows by their titles, never their ids; a target table gone reads as a quiet dash. */
export function RelationCell({ choices, ...props }: RelationCellProps) {
  if (choices === null) {
    return (
      <span
        className="wsx-db-formula"
        title="The table it points at is gone — it may be in the Trash"
      >
        <span className="wsx-db-placeholder">—</span>
      </span>
    )
  }
  return <ListCell {...props} choices={choices ?? []} unknown={choices ? '—' : '…'} />
}

/** A formula's or rollup's value, read-only: it is computed on read, never typed. */
export function FormulaCell({ column, value }: ScalarCellProps) {
  const { locale } = usePaperHost()
  const shown =
    value === null || value === undefined
      ? '—'
      : typeof value === 'boolean'
        ? value
          ? '✓'
          : '—'
        : typeof value === 'number'
          ? formatNumber(value, locale, column.format)
          : String(value)
  return (
    <span
      className="wsx-db-formula"
      data-num={typeof value === 'number' || undefined}
      title={column.expr ?? (column.rollup && `${column.rollup.fn} of ${column.rollup.table}`)}
      data-formula
    >
      {shown}
    </span>
  )
}
