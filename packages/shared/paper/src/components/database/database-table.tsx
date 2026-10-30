import { AddProperty } from './add-property'
import { DatabaseCell } from './database-cell'
import {
  isRank,
  newRow,
  tableLabel,
  titleColumn,
  useCommit,
  useRecords,
  useRowActions,
  type ViewProps,
} from './lib'
import { PropertyIcon } from './property-icon'

/** Notion's table view: every cell edits in place; the title opens the row as its page. */
export function DatabaseTable({ db, view, empty }: ViewProps) {
  const records = useRecords(db.table, view.where)
  const { commit, error } = useCommit(db.table)
  const actions = useRowActions(db.table)

  const title = titleColumn(db.spec)
  const shown = view.columns
    ? db.spec.columns.filter((column) => view.columns?.includes(column.name))
    : db.spec.columns.filter((column) => !isRank(column))
  const columns = title ? [title, ...shown.filter((column) => column !== title)] : shown

  return (
    <div className="wsx-db-grid">
      <table className="wsx-table wsx-db-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.name}
                data-num={column.type === 'number' || column.format !== undefined || undefined}
              >
                <span className="wsx-db-th">
                  <PropertyIcon type={column.type} />
                  {tableLabel(column.name)}
                </span>
              </th>
            ))}
            <th className="wsx-db-plus-cell">
              <AddProperty
                onAdd={actions.addProperty}
                taken={db.spec.columns.map((column) => column.name)}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {records.rows.map((row) => {
            const id = String(row.id)
            return (
              <tr key={id}>
                {columns.map((column) => (
                  <td
                    key={column.name}
                    data-title={column === title || undefined}
                    data-label={tableLabel(column.name)}
                  >
                    <DatabaseCell
                      db={db}
                      column={column}
                      value={row[column.name]}
                      commit={(value) => void commit(id, column.name, value)}
                    />
                    {column === title && actions.canOpen && (
                      <button
                        type="button"
                        className="wsx-db-open"
                        aria-label="Open"
                        title="Open beside the page"
                        onClick={() => actions.open(id)}
                      >
                        <span aria-hidden>↗</span> Open
                      </button>
                    )}
                  </td>
                ))}
                <td />
              </tr>
            )
          })}
        </tbody>
      </table>
      {records.status === 'loading' && (
        <div className="wsx-empty" data-state="loading" aria-busy>
          Loading…
        </div>
      )}
      {records.status === 'ready' && records.rows.length === 0 && (
        <div className="wsx-empty" data-state="empty">
          {empty ?? 'No rows yet.'}
        </div>
      )}
      {records.status === 'error' && (
        <div className="wsx-empty" data-state="error" role="alert">
          This database could not load — {records.error}
        </div>
      )}
      {error && (
        <p className="wsx-db-error" role="alert">
          {error}
        </p>
      )}
      <div className="wsx-db-foot">
        <button
          type="button"
          className="wsx-db-new"
          onClick={() => void actions.addRow(newRow(db.spec))}
        >
          + New
        </button>
        {records.status === 'ready' && records.rows.length > 0 && (
          <span className="wsx-db-count">
            {records.rows.length} {records.rows.length === 1 ? 'row' : 'rows'}
          </span>
        )}
      </div>
    </div>
  )
}
