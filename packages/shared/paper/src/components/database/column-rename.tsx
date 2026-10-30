import { useState } from 'react'
import { type ColumnPageProps, columnKey, tableLabel, useColumnChange } from './lib'
import { PropertyIcon } from './property-icon'

/** The menu opens on the property's name; Enter renames it, its values moving with it. */
export function ColumnRename({ db, column, onDone }: ColumnPageProps) {
  const [label, setLabel] = useState(tableLabel(column.name))
  const { status, run } = useColumnChange()

  const submit = async () => {
    const to = columnKey(label)
    if (!label.trim() || to === column.name) return onDone()
    if (await run({ kind: 'rename', table: db.table, column: column.name, to })) onDone()
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
      {status.error && (
        <p className="wsx-db-panel-error" role="alert">
          {status.error}
        </p>
      )}
    </form>
  )
}
