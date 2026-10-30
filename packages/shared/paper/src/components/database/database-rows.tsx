import { DatabaseCell } from './database-cell'
import { type DatabaseRowsProps, tableLabel, useRelationTitles } from './lib'

/** A table view's rows; every relation it shows is named from one read of its target. */
export function DatabaseRows({ db, columns, title, rows, commit, onOpen }: DatabaseRowsProps) {
  const titles = useRelationTitles(
    columns.flatMap((column) => (column.type === 'relation' && column.table ? [column.table] : [])),
  )

  return (
    <tbody>
      {rows.map((row) => {
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
                  titles={titles}
                  commit={(value) => void commit(id, column.name, value)}
                />
                {column === title && onOpen && (
                  <button
                    type="button"
                    className="wsx-db-open"
                    aria-label="Open"
                    title="Open beside the page"
                    onClick={() => onOpen(id)}
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
  )
}
