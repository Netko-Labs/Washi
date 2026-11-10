import type { TableSpec } from '@washi/ink'
import { InkError } from '../../errors'
import type { ColumnPlan } from '../types'

/** A header as a column name would be written: `Issue title` → `issue_title`. */
const snakeOf = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const COMPUTED = new Set(['formula', 'rollup'])

/** The table column a source name lands in on its own: exactly, case-blind, or snake_cased. */
function matchOf(spec: TableSpec, source: string): string | undefined {
  const names = ['id', ...spec.columns.map((column) => column.name)]
  return (
    names.find((name) => name === source) ??
    names.find((name) => name.toLowerCase() === source.trim().toLowerCase()) ??
    names.find((name) => name === snakeOf(source))
  )
}

/**
 * The file's columns laid onto the table's. `map` names a target (or null to leave a column out);
 * the rest match by name. A column that lands nowhere, an id or a computed column is ignored and
 * said once — not fatal. A map naming no column, or two columns landing in one, is refused.
 */
export function planColumns(
  spec: TableSpec,
  sources: string[],
  map: Record<string, string | null> = {},
): ColumnPlan {
  const known = spec.columns.map((column) => column.name)
  for (const [from, to] of Object.entries(map)) {
    if (to !== null && to !== 'id' && !known.includes(to)) {
      throw new InkError(
        `map sends "${from}" to "${to}", which is not a column of ${spec.name}: ${known.join(', ')}`,
      )
    }
  }
  const columns: Record<string, string> = {}
  const ignored: ColumnPlan['ignored'] = []
  const takenBy = new Map<string, string>()
  for (const source of sources) {
    const mapped = Object.hasOwn(map, source) ? map[source] : undefined
    if (mapped === null) {
      ignored.push({ column: source, why: 'left out by map' })
      continue
    }
    const target = mapped ?? matchOf(spec, source)
    const column = spec.columns.find((each) => each.name === target)
    if (target === 'id') {
      ignored.push({ column: source, why: 'ids are made by the table' })
    } else if (!column) {
      ignored.push({ column: source, why: 'no such column — name one with map' })
    } else if (COMPUTED.has(column.type)) {
      ignored.push({
        column: source,
        why: `${column.name} is a ${column.type}, computed, never written`,
      })
    } else {
      const earlier = takenBy.get(column.name)
      if (earlier) {
        throw new InkError(
          `"${earlier}" and "${source}" both land in ${column.name}: map one of them elsewhere, or to null`,
        )
      }
      takenBy.set(column.name, source)
      columns[source] = column.name
    }
  }
  return { columns, ignored }
}
