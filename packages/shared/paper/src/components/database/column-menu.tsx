import { useState } from 'react'
import { usePaperHost } from '../../provider'
import { ColumnDelete } from './column-delete'
import { ColumnOptions } from './column-options'
import { ColumnRename } from './column-rename'
import {
  CHOICE_TYPES,
  type ColumnMenuPage,
  type ColumnMenuProps,
  type SortDirection,
  tableLabel,
  walkMenu,
} from './lib'

/**
 * Rename, options and Delete change the table for everyone, through the host; Sort and Hide are
 * the reader's alone and never reach the page.
 */
export function ColumnMenu({ db, column, isTitle, local, onDone }: ColumnMenuProps) {
  const host = usePaperHost()
  const [page, setPage] = useState<ColumnMenuPage>('menu')
  const editable = Boolean(host.changeColumn)
  const label = tableLabel(column.name)
  const back = () => setPage('menu')

  if (page === 'options') {
    return <ColumnOptions db={db} column={column} onBack={back} onDone={onDone} />
  }
  if (page === 'delete') {
    return <ColumnDelete db={db} column={column} onBack={back} onDone={onDone} />
  }

  const sort = (direction: SortDirection) => {
    local.sortBy(column.name, direction)
    onDone()
  }

  return (
    <div className="wsx-db-menu" role="group" aria-label={label} onKeyDown={walkMenu}>
      {editable ? (
        <ColumnRename
          db={db}
          column={column}
          onBack={back}
          onDone={onDone}
          onRenamed={(to) => local.rename(column.name, to)}
        />
      ) : (
        <p className="wsx-db-panel-head">{label}</p>
      )}
      <div role="menu" aria-label={`${label} property`}>
        {editable && CHOICE_TYPES.has(column.type) && (
          <button
            type="button"
            role="menuitem"
            className="wsx-db-menu-item"
            onClick={() => setPage('options')}
          >
            <span aria-hidden>☰</span> Edit options
          </button>
        )}
        <button
          type="button"
          role="menuitem"
          className="wsx-db-menu-item"
          // biome-ignore lint/a11y/noAutofocus: a read-only menu has no name field to start in
          autoFocus={!editable}
          onClick={() => sort('asc')}
        >
          <span aria-hidden>↑</span> Sort ascending
        </button>
        <button
          type="button"
          role="menuitem"
          className="wsx-db-menu-item"
          onClick={() => sort('desc')}
        >
          <span aria-hidden>↓</span> Sort descending
        </button>
        {!isTitle && (
          <button
            type="button"
            role="menuitem"
            className="wsx-db-menu-item"
            onClick={() => {
              local.hide(column.name)
              onDone()
            }}
          >
            <span aria-hidden>◌</span> Hide
          </button>
        )}
        {editable && !isTitle && (
          <button
            type="button"
            role="menuitem"
            className="wsx-db-menu-item"
            data-danger
            onClick={() => setPage('delete')}
          >
            <span aria-hidden>×</span> Delete property
          </button>
        )}
      </div>
    </div>
  )
}
