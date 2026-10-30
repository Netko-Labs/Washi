import { DatabaseHead } from './database-head'
import { DatabaseRows } from './database-rows'
import { newRow, useCommit, useRowActions, useTableView, type ViewProps } from './lib'
import { ViewChips } from './view-chips'

/** Notion's table view: every cell edits in place; the title opens the row as its page. */
export function DatabaseTable({ db, view, empty }: ViewProps) {
  const { records, rows, columns, title, local } = useTableView(db, view)
  const { commit, error } = useCommit(db.table)
  const actions = useRowActions(db.table)

  return (
    <>
      <ViewChips db={db} local={local} />
      <div className="wsx-db-grid">
        <table className="wsx-table wsx-db-table">
          <DatabaseHead
            db={db}
            columns={columns}
            title={title}
            local={local}
            onAdd={actions.addProperty}
          />
          <DatabaseRows
            db={db}
            columns={columns}
            title={title}
            rows={rows}
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
    </>
  )
}
