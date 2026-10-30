import {
  type ColumnPageProps,
  columnPagesWords,
  tableLabel,
  useColumnChange,
  useColumnPages,
} from './lib'

/** Deleting a property asks once, in words, before its values go with it. */
export function ColumnDelete({ db, column, onBack, onDone }: ColumnPageProps) {
  const { status, run } = useColumnChange()
  const pages = useColumnPages(db.table, column.name)
  const label = tableLabel(column.name)

  return (
    <div className="wsx-db-panel" role="alertdialog" aria-label={`Delete ${label}`}>
      <p className="wsx-db-confirm">Delete {label}? Its values go with it.</p>
      {pages.length > 0 && (
        <p className="wsx-db-column-pages">{columnPagesWords(pages, label, false)}</p>
      )}
      {status.error && (
        <p className="wsx-db-panel-error" role="alert">
          {status.error}
        </p>
      )}
      <div className="wsx-db-panel-foot">
        <span className="wsx-db-panel-hint" />
        {/* biome-ignore lint/a11y/noAutofocus: Cancel is the safe default of a destructive ask */}
        <button type="button" className="wsx-db-ghost" autoFocus onClick={onBack}>
          Cancel
        </button>
        <button
          type="button"
          className="wsx-db-button"
          data-danger
          disabled={status.busy}
          onClick={async () => {
            if (await run({ kind: 'remove', table: db.table, column: column.name })) onDone()
          }}
        >
          {status.busy ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
