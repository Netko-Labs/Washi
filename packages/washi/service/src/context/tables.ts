import type { Viewer } from '@washi/domain'
import type { ColumnSpec } from '@washi/ink'
import { listTables, tableStats, type Workspace } from '@washi/repository'
import { readablePages } from '../tables/catalog'
import { countsOf, rowsOf, stepsOf } from './rows'
import type { TableDigest } from './types'

/** A column's type; a status says which values mean done (its counts line lists the rest). */
const typeWords = (column: ColumnSpec) => {
  if (column.type === 'status' && column.groups) {
    return `status (done: ${column.groups.done.join(', ') || '—'})`
  }
  if (column.type === 'multi_select' && column.options?.length) {
    return `multi_select (${column.options.join(', ')})`
  }
  if (column.type === 'relation' && column.table) return `relation → ${column.table}`
  return column.type
}

/** How many rows hold each value of a status or select column, in the column's own order. */
function valueCounts(ws: Workspace, table: string, column: ColumnSpec): string {
  const counts = countsOf(ws, table, column.name)
  const order = column.type === 'status' ? stepsOf(column).order : (column.options ?? [])
  const rest = [...counts.keys()].filter((value) => !order.includes(value as string))
  // Every option is said, a zero too: it is how a reader learns the values a cell may take.
  return [...order, ...rest]
    .map((value) => `${value ?? 'empty'} ${counts.get(value) ?? 0}`)
    .join(' · ')
}

/**
 * Each table as the digest may say it — read only when the digest has room for it: columns and
 * types, how many rows, the counts per status and select value, where it shows, and its rows (all
 * of a small table; the open ones of a table asked for, or of any with a status).
 */
export function tableDigests(
  ws: Workspace,
  viewer: Viewer,
  wanted: string[] | undefined,
): TableDigest[] {
  const pagesOf = readablePages(ws, viewer)
  const stats = tableStats(ws)
  return listTables(ws).map((table) => {
    const { name, spec } = table
    const count = stats.get(table.id)?.rows ?? 0
    const hasStatus = spec.columns.some((column) => column.type === 'status')
    return {
      name,
      summary: () => {
        const shown = pagesOf(name)
        const counts = spec.columns
          .filter((column) => column.type === 'status' || column.type === 'select')
          .map((column) => `- ${column.name}: ${valueCounts(ws, name, column)}`)
        return [
          `### \`${name}\` — ${count} row${count === 1 ? '' : 's'}${shown.length ? `, shown on ${shown.map((page) => page.title).join(', ')}` : ', on no page'}`,
          `Columns: ${spec.columns.map((column) => `${column.name} ${typeWords(column)}`).join(' · ')}`,
          ...counts,
        ].join('\n')
      },
      rows: () => rowsOf(ws, name, spec.columns, count, wanted ? wanted.includes(name) : hasStatus),
    }
  })
}
