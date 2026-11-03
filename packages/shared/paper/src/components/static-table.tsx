import { formatNumber, styled } from '../lib'
import type { StaticCell, StaticTableProps } from '../lib/types'
import { usePaperHost } from '../provider'
import { inlineText } from './inline-text'
import { cell } from './states'

const shown = (value: unknown) => String(value ?? '')

/**
 * A table the page writes itself — a markdown table, one to one: `columns` heads it, each row is a
 * list of cells, words read their inline marks. Phones stack it into cards like any table.
 */
export function StaticTable({ columns, rows, ...rest }: StaticTableProps) {
  const { locale } = usePaperHost()
  const numeric = new Set(
    columns.flatMap((_, at) => (rows.some((row) => typeof row[at] === 'number') ? [at] : [])),
  )
  const drawn = (value: StaticCell | undefined) => {
    if (typeof value === 'number') return formatNumber(value, locale)
    if (typeof value === 'string') return inlineText(value, undefined, shown)
    return cell(value, locale)
  }
  return (
    <div {...styled(rest, 'wsx-table-wrap')}>
      <table className="wsx-table" data-static="">
        <thead>
          <tr>
            {columns.map((label, at) => (
              <th key={`${at}-${label}`} data-num={numeric.has(at) || undefined}>
                {inlineText(label, undefined, shown)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((label, at) => (
                <td
                  key={`${at}-${label}`}
                  data-label={label}
                  data-num={numeric.has(at) || undefined}
                  data-bool={typeof row[at] === 'boolean' ? String(row[at]) : undefined}
                >
                  <span className="wsx-cell-text">{drawn(row[at])}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
