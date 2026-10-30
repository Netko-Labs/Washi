import { AddProperty } from './add-property'
import { DatabaseRows } from './database-rows'
import {
  isRank,
  namedColumns,
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
    ? namedColumns(db.spec, view.columns)
    : db.spec.columns.filter((column) => !isRank(column))
  const columns = title && !shown.includes(title) ? [title, ...shown] : shown

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
        <DatabaseRows
          db={db}
          columns={columns}
          title={title}
          rows={records.rows}
          commit={commit}
          onOpen={actions.canOpen ? actions.open : undefined}
        />
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
