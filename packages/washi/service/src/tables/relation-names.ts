import type { Cell, RecordData, TableSpec } from '@washi/ink'
import { executeQuery, findRecordTableId, getTableByName, type Workspace } from '@washi/repository'
import { InkError } from './errors'

const ALL_ROWS = 100_000
const SHOWN = 10

const keyOf = (value: string) => value.trim().toLowerCase()

const listOf = (cell: Cell | undefined): string[] | null =>
  typeof cell === 'string' ? [cell] : Array.isArray(cell) ? cell : null

/** The target's rows by the words of its first text column — the names `db_link_column` matches. */
function namesOf(ws: Workspace, tableName: string) {
  const target = getTableByName(ws, tableName)
  if (!target) throw new InkError(`unknown table "${tableName}"`)
  const on = target.spec.columns.find((each) => each.type === 'text')?.name
  const ids = new Map<string, string[]>()
  if (on) {
    const rows = executeQuery(ws, target.id, target.spec, { table: target.name, limit: ALL_ROWS })
    for (const row of rows.rows) {
      const name = row[on]
      if (typeof name !== 'string' || !name.trim()) continue
      ids.set(keyOf(name), [...(ids.get(keyOf(name)) ?? []), String(row.id)])
    }
  }
  return { id: target.id, on, ids }
}

const quoted = (values: string[]) =>
  `${values
    .slice(0, SHOWN)
    .map((value) => `"${value}"`)
    .join(', ')}${values.length > SHOWN ? ', …' : ''}`

/**
 * A relation cell may name its rows instead of holding their ids: each value that is not a live
 * record of the target is matched to the target row whose first text column reads the same, case
 * and spaces aside, as `db_link_column` matches. A lone name is a list of one. A name nothing
 * matches, or more than one row bears, is refused in words — every row or none.
 */
export function relationsByName(ws: Workspace, spec: TableSpec, rows: RecordData[]): RecordData[] {
  const relations = spec.columns.filter((column) => column.type === 'relation' && column.table)
  if (relations.length === 0) return rows
  const out = rows.map((row) => ({ ...row }))
  for (const column of relations) {
    const table = column.table as string
    let names: ReturnType<typeof namesOf> | null = null
    const lookup = () => {
      names ??= namesOf(ws, table)
      return names
    }
    const unmatched = new Set<string>()
    const doubled = new Set<string>()
    for (const row of out) {
      const values = listOf(row[column.name])
      if (!values) continue
      const targetId = getTableByName(ws, table)?.id
      row[column.name] = values.map((value) => {
        if (targetId && findRecordTableId(ws, value) === targetId) return value
        const found = lookup().ids.get(keyOf(value)) ?? []
        if (found.length === 0) unmatched.add(value)
        if (found.length > 1) doubled.add(value)
        return found[0] ?? value
      })
    }
    if (unmatched.size > 0) {
      const on = lookup().on
      throw new InkError(
        `${column.name}: no ${table} row has ${on ? `its ${on}` : 'a text column'} reading ${quoted([...unmatched])} — pass a row's id, or its ${on ?? 'name'} as written; nothing changed`,
      )
    }
    if (doubled.size > 0) {
      throw new InkError(
        `${column.name}: more than one ${table} row is named ${quoted([...doubled])} — pass the row's id; nothing changed`,
      )
    }
  }
  return out
}
