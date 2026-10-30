import type { UserTable } from '@washi/domain'
import {
  ARRAY_COLUMN_TYPES,
  COPY_ROW_CAP,
  type Filter,
  type QueryRow,
  type RecordData,
  type Scalar,
  type TableSpec,
  unknownQueryColumns,
  validateRecord,
} from '@washi/ink'
import { executeQuery, insertRecord, type Workspace } from '@washi/repository'
import { evaluateExpr, parseExpr, validateExpr } from '@washi/wsx'
import { InkError } from './errors'
import { checkData, checkListUse } from './rules'
import type { CopyMutation, CopyOverride, CopyResult } from './types'

const isComputed = (type: string) => type === 'formula' || type === 'rollup'

/** Unlike a rollup's, an unset param refuses: dropping the filter would copy far more rows. */
function resolveWhere(mutation: CopyMutation): Filter[] {
  return mutation.where.map((filter) => {
    const { value } = filter
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return { ...filter, value }
    }
    const read = mutation.params?.[value.param]
    if (read === undefined || read === null || read === '') {
      throw new InkError(`${filter.column} reads the param "${value.param}", which has no value`)
    }
    return { ...filter, value: read }
  })
}

function readableNames(spec: TableSpec): string[] {
  return [
    'id',
    ...spec.columns
      .filter((column) => !ARRAY_COLUMN_TYPES.has(column.type))
      .map((column) => column.name),
  ]
}

function checkNames(spec: TableSpec, columns: string[], at: string): void {
  const issues = validateRecord(spec, Object.fromEntries(columns.map((column) => [column, null])))
  if (issues.length > 0) {
    throw new InkError(issues.map((issue) => `${at}.${issue.path}: ${issue.message}`).join('; '))
  }
}

/** Each `set` names a stored column; an expr reads the source row's names and `$param`s. */
function checkSet(spec: TableSpec, mutation: CopyMutation): CopyOverride[] {
  checkNames(spec, Object.keys(mutation.set), 'set')
  for (const entry of mutation.each ?? []) checkNames(spec, Object.keys(entry), 'each')
  const shape = {
    state: readableNames(spec),
    args: Object.keys(mutation.params ?? {}).map((name) => `$${name}`),
    tables: {},
  }
  return Object.entries(mutation.set).map(([column, value]) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return { column, value }
    }
    let problems: string[]
    try {
      const ast = parseExpr(value.expr)
      problems = validateExpr(ast, shape).filter((problem) => !problem.startsWith('warning:'))
      if (problems.length === 0) return { column, ast }
    } catch (cause) {
      problems = [cause instanceof Error ? cause.message : String(cause)]
    }
    throw new InkError(`set.${column}: ${problems.join('; ')}`)
  })
}

function copyOf(
  spec: TableSpec,
  row: QueryRow,
  overrides: CopyOverride[],
  args: Record<string, Scalar>,
): RecordData {
  const data: RecordData = {}
  const cells: Record<string, Scalar> = {}
  for (const [name, cell] of Object.entries(row)) {
    if (!Array.isArray(cell)) cells[name] = cell
  }
  for (const column of spec.columns) {
    const cell = row[column.name]
    if (!isComputed(column.type) && cell !== null && cell !== undefined) data[column.name] = cell
  }
  const now = Date.now()
  for (const override of overrides) {
    if ('value' in override) {
      data[override.column] = override.value
      continue
    }
    try {
      data[override.column] = evaluateExpr(override.ast, {
        state: cells,
        args,
        rows: () => [],
        now,
      })
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      throw new InkError(`set.${override.column} on row ${String(row.id)}: ${reason}`)
    }
  }
  return data
}

/**
 * Every row `where` matches becomes a new row — one per `each` entry: its stored cells, `set` over
 * them, then the entry's. All or nothing —
 * past the cap nothing is copied, and each copy is checked like an insert before any lands.
 */
export function copyRecords(
  ws: Workspace,
  table: UserTable,
  mutation: CopyMutation,
  author: string | null = null,
): CopyResult {
  const where = resolveWhere(mutation)
  const unknown = unknownQueryColumns(table.spec, where)
  if (unknown.length > 0) throw new InkError(unknown.map((issue) => issue.message).join('; '))
  checkListUse(table.spec, where)
  const overrides = checkSet(table.spec, mutation)

  const cap = mutation.limit ?? COPY_ROW_CAP
  const { rows } = executeQuery(ws, table.id, table.spec, {
    table: table.name,
    params: mutation.params,
    where,
    limit: cap + 1,
  })
  if (rows.length > cap) {
    throw new InkError(`more than ${cap} rows match — nothing copied; narrow where`)
  }
  const entries = mutation.each ?? [{}]
  if (rows.length * entries.length > cap) {
    throw new InkError(`more than ${cap} copies — nothing copied; narrow where or each`)
  }

  const args = Object.fromEntries(
    Object.entries(mutation.params ?? {}).map(([name, value]) => [`$${name}`, value]),
  )
  const copies = rows.flatMap((row) => {
    const copy = copyOf(table.spec, row, overrides, args)
    return entries.map((entry) => ({ ...copy, ...entry }))
  })
  for (const data of copies) checkData(ws, table.spec, data)
  const ids = ws.sqlite.transaction(() =>
    copies.map((data) => insertRecord(ws, table.id, data, author)),
  )()
  return { affected: ids.length, ids }
}
