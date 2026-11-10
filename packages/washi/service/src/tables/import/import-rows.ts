import { INSERT_ROW_CAP, type RecordData, type TableSpec, validateRecord } from '@washi/ink'
import { getTableByName, type Workspace } from '@washi/repository'
import { InkError } from '../errors'
import { runMutation } from '../service'
import { IDS_SHOWN, MAX_IMPORT_ROWS, REFUSED_SHOWN, SAMPLE_ROWS } from './constants'
import type {
  ColumnPlan,
  ImportBatch,
  ImportOptions,
  ImportResult,
  ImportSource,
  ReadyRow,
  RefusedRow,
  SourceRow,
  WrittenBatches,
} from './types'
import { coerceCell, planColumns, readSource } from './utils'

/** One source row made ready for the table, or refused with every reason it has. */
function readyRow(spec: TableSpec, plan: ColumnPlan, row: SourceRow): ReadyRow | RefusedRow {
  const data: RecordData = {}
  const whys: string[] = []
  for (const [source, name] of Object.entries(plan.columns)) {
    const column = spec.columns.find((each) => each.name === name)
    if (!column) continue
    const cell = coerceCell(column, row.fields[source])
    if ('why' in cell) whys.push(`${name}: ${cell.why}`)
    else if ('value' in cell) data[name] = cell.value
  }
  if (whys.length === 0) {
    for (const issue of validateRecord(spec, data)) whys.push(`${issue.path}: ${issue.message}`)
  }
  const where = row.line === undefined ? {} : { line: row.line }
  if (whys.length > 0) return { row: row.row, ...where, why: whys.join('; ') }
  if (Object.keys(data).length === 0) return { row: row.row, ...where, why: 'nothing to write' }
  return { row: row.row, data }
}

/** A write's refusal of one row in a batch (`row 3: …`) said by the file's own row number. */
const inFileWords = (message: string, batch: ReadyRow[]) =>
  message.replace(/^row (\d+):/, (_, at: string) => `row ${batch[Number(at) - 1]?.row ?? at}:`)

/** The rows in slices of `INSERT_ROW_CAP`, each one write, all or nothing; a refused one is said. */
function writeBatches(
  ws: Workspace,
  table: string,
  rows: ReadyRow[],
  author: string | null,
): WrittenBatches {
  const ids: string[] = []
  const batches: ImportBatch[] = []
  for (let at = 0; at < rows.length; at += INSERT_ROW_CAP) {
    const batch = rows.slice(at, at + INSERT_ROW_CAP)
    const span = { from: batch[0]?.row ?? 0, to: batch.at(-1)?.row ?? 0 }
    try {
      const written = runMutation(
        ws,
        { kind: 'insert', table, data: batch.map((row) => row.data) },
        author,
      )
      ids.push(...(written.ids ?? []))
      batches.push({ ...span, inserted: written.ids?.length ?? 0 })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      batches.push({ ...span, error: inFileWords(message, batch) })
    }
  }
  return { ids, batches }
}

/**
 * Rows from a CSV, TSV or JSON file into a table (D137): its columns matched to the table's by
 * name or `map`, each cell made ready for its column, every row checked as an insert would be —
 * a row that will not fit is refused with its place in the file and why, the rest written in
 * batches of 500 through `runMutation`, so each row is signed and kept in history (P1). A dry run
 * reads and checks without writing.
 */
export function importRows(
  ws: Workspace,
  tableName: string,
  source: ImportSource,
  options: ImportOptions,
  author: string | null,
): ImportResult {
  const table = getTableByName(ws, tableName)
  if (!table) throw new InkError(`unknown table "${tableName}"`)
  const read = readSource(source)
  const total = read.rows.length + read.refused.length
  if (total > MAX_IMPORT_ROWS) {
    throw new InkError(
      `${total.toLocaleString('en')} rows; one import takes ${MAX_IMPORT_ROWS.toLocaleString('en')} — split the file`,
    )
  }
  const plan = planColumns(table.spec, read.names, options.map)
  if (read.rows.length > 0 && Object.keys(plan.columns).length === 0) {
    throw new InkError(
      `none of the file's columns (${read.names.join(', ')}) is a column of ${table.name} (${table.spec.columns.map((column) => column.name).join(', ')}) — name them with map`,
    )
  }
  const ready: ReadyRow[] = []
  const refused: RefusedRow[] = [...read.refused]
  for (const row of read.rows) {
    const made = readyRow(table.spec, plan, row)
    if ('data' in made) ready.push(made)
    else refused.push(made)
  }
  refused.sort((a, b) => a.row - b.row)
  const dryRun = options.dryRun === true
  const written = dryRun ? { ids: [], batches: [] } : writeBatches(ws, table.name, ready, author)
  return {
    table: table.name,
    dryRun,
    read: total,
    inserted: dryRun ? 0 : written.ids.length,
    ids: written.ids.slice(0, IDS_SHOWN),
    idsTotal: written.ids.length,
    refused: refused.slice(0, REFUSED_SHOWN),
    refusedTotal: refused.length,
    batches: written.batches,
    columns: plan.columns,
    ignoredColumns: plan.ignored,
    ...(dryRun
      ? { wouldInsert: ready.length, sample: ready.slice(0, SAMPLE_ROWS).map((row) => row.data) }
      : {}),
  }
}
