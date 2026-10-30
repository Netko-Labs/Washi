import { formatNumber, listCell, styled, toneOf, useBind } from '../lib'
import type { TableProps, TableValueProps } from '../lib/types'
import { usePaperHost } from '../provider'
import { CardValue, tableLabel, useDatabase } from './database'
import { Bound, cell } from './states'

const SPEC_DRAWN = new Set(['select', 'status', 'person', 'multi_select'])

/** Rows as a plain table; the table's spec, once read, draws choices, people and money right. */
export function Table({ bind, columns, empty, ...rest }: TableProps) {
  const state = useBind(bind)
  const { openRow, locale } = usePaperHost()
  const db = useDatabase(bind.table)
  const known = typeof db === 'object' && db !== null ? db : null
  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const keys = columns ?? Object.keys(rows[0] ?? {}).filter((key) => key !== 'id')
        const numeric = new Set(
          keys.filter((key) => rows.some((row) => typeof row[key] === 'number')),
        )
        return (
          <div {...styled(rest, 'wsx-table-wrap')}>
            <table className="wsx-table">
              <thead>
                <tr>
                  {keys.map((key) => (
                    <th key={key} data-num={numeric.has(key) || undefined}>
                      {tableLabel(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={String(row.id ?? index)}
                    data-openable={openRow && typeof row.id === 'string' ? '' : undefined}
                    onClick={() => typeof row.id === 'string' && openRow?.(row.id)}
                  >
                    {keys.map((key, column) => {
                      const value = row[key]
                      return (
                        <td
                          key={key}
                          data-label={tableLabel(key)}
                          data-num={numeric.has(key) || undefined}
                          data-negative={(typeof value === 'number' && value < 0) || undefined}
                          data-bool={typeof value === 'boolean' ? String(value) : undefined}
                        >
                          <TableValue
                            row={row}
                            name={key}
                            isTitle={column === 0}
                            db={known}
                            locale={locale}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }}
    </Bound>
  )
}

/** One cell's words: money and choices by the spec, a list as pills, a word that means something toned. */
function TableValue({ row, name, isTitle, db, locale }: TableValueProps) {
  const value = row[name]
  const column = db?.spec.columns.find((each) => each.name === name)
  const items = isTitle ? undefined : listCell(row, name)
  if (typeof value === 'number') return formatNumber(value, locale, column?.format)
  if (!isTitle && db && column && SPEC_DRAWN.has(column.type)) {
    return <CardValue db={db} column={column} value={items ?? value} />
  }
  if (items && items.length > 0) {
    return (
      <span className="wsx-pills">
        {items.map((item) => (
          <span key={item} {...styled({ size: 'sm', tone: toneOf(item) }, 'wsx-badge')}>
            {item}
          </span>
        ))}
      </span>
    )
  }
  // A word that means something wears its tone here too (D84); a title never.
  const tone = !isTitle && typeof value === 'string' ? toneOf(value) : undefined
  if (tone) return <span {...styled({ size: 'sm', tone }, 'wsx-badge')}>{value}</span>
  return <span className="wsx-cell-text">{cell(value, locale)}</span>
}
