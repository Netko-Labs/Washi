import type { Cell } from '@washi/ink'
import { listCell } from '../../lib'
import { CardValue, DatabaseCell, isRank, tableLabel, useDatabase } from '../database'
import type { AgendaEventFieldsProps } from './lib'

/**
 * The event's other properties, as its row page lists them — changed in place for a member, read
 * for anyone else. Its title and time are the card's own, above.
 */
export function AgendaEventFields({ row, table, columns, onWrite }: AgendaEventFieldsProps) {
  const db = useDatabase(table)
  if (!db || typeof db !== 'object') return null
  // A list arrives joined for the week's chips; its items are kept beside it.
  const valueOf = (name: string): Cell => listCell(row, name) ?? row[name] ?? null
  const own = new Set([columns.date, columns.time, columns.end, columns.title])
  const shown = db.spec.columns.filter(
    (column) => !own.has(column.name) && !isRank(column) && column.name in row,
  )
  const drawn = onWrite
    ? shown
    : shown.filter((column) => {
        const value = valueOf(column.name)
        return value !== null && value !== '' && value !== false
      })
  if (drawn.length === 0) return null

  return (
    <dl className="wsx-agenda-card-fields">
      {drawn.map((column) => (
        <div key={column.name} className="wsx-agenda-card-field">
          <dt>{tableLabel(column.name)}</dt>
          <dd>
            {onWrite ? (
              <DatabaseCell
                db={db}
                column={column}
                value={valueOf(column.name)}
                commit={(value) => onWrite({ [column.name]: value })}
              />
            ) : (
              <CardValue db={db} column={column} value={valueOf(column.name)} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
