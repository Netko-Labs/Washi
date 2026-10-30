import { tableLabel, type ViewChipsProps } from './lib'

/** The reader's own sort and hidden properties, each a chip whose × undoes it. */
export function ViewChips({ db, local }: ViewChipsProps) {
  const sorted = local.sort && db.spec.columns.find((column) => column.name === local.sort?.column)
  const hidden = db.spec.columns.filter((column) => local.hidden.includes(column.name))
  if (!sorted && hidden.length === 0) return null
  const rising = local.sort?.direction === 'asc'

  return (
    <div className="wsx-db-chips-row">
      {sorted && (
        <button
          type="button"
          className="wsx-db-view-chip"
          aria-label={`Sorted by ${tableLabel(sorted.name)}, ${rising ? 'ascending' : 'descending'} — clear`}
          onClick={local.clearSort}
        >
          Sorted by {tableLabel(sorted.name)} {rising ? '↑' : '↓'}
          <span aria-hidden>×</span>
        </button>
      )}
      {hidden.map((column) => (
        <button
          key={column.name}
          type="button"
          className="wsx-db-view-chip"
          aria-label={`${tableLabel(column.name)} hidden — show it`}
          onClick={() => local.show(column.name)}
        >
          {tableLabel(column.name)} hidden
          <span aria-hidden>×</span>
        </button>
      ))}
    </div>
  )
}
