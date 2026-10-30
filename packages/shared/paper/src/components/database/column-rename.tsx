import { useState } from 'react'
import {
  type ColumnRenameProps,
  columnKey,
  columnPagesWords,
  tableLabel,
  useColumnChange,
  useColumnPages,
} from './lib'
import { PropertyIcon } from './property-icon'

/** The menu opens on the property's name; Enter renames it, its values moving with it. */
export function ColumnRename({ db, column, onDone, onRenamed }: ColumnRenameProps) {
  const [label, setLabel] = useState(tableLabel(column.name))
  const { status, run } = useColumnChange()
  const pages = useColumnPages(db.table, column.name)

  const submit = async () => {
    const to = columnKey(label)
    if (!label.trim() || to === column.name) return onDone()
    if (!(await run({ kind: 'rename', table: db.table, column: column.name, to }))) return
    onRenamed(to)
    onDone()
  }

  return (
    <form
      className="wsx-db-panel"
      aria-label="Rename property"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <label className="wsx-db-panel-name">
        <PropertyIcon type={column.type} />
        <input
          // biome-ignore lint/a11y/noAutofocus: the menu opens because the person asked for it
          autoFocus
          aria-label="Property name"
          value={label}
          maxLength={64}
          readOnly={status.busy}
          onChange={(event) => setLabel(event.currentTarget.value)}
        />
      </label>
      {pages.length > 0 && (
        <p className="wsx-db-column-pages">
          {columnPagesWords(pages, tableLabel(column.name), true)}
        </p>
      )}
      {status.error && (
        <p className="wsx-db-panel-error" role="alert">
          {status.error}
        </p>
      )}
    </form>
  )
}
