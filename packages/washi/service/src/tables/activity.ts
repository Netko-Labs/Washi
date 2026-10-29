import type { RowActivity, RowChange, RowFieldChange } from '@washi/domain'
import type { RecordData, TableSpec } from '@washi/ink'
import {
  findRecordTableId,
  listRecordChanges,
  listTables,
  recordCreatedMs,
  type Workspace,
} from '@washi/repository'
import { InkError } from './errors'

const DEFAULT_LIMIT = 20
/** A first version this long after the row was made is a backfilled snapshot, not its creation. */
const SNAPSHOT_AFTER_MS = 1000

/** Formulas and rollups are worked out on read, never stored — so they never change. */
function computedNames(spec: TableSpec): Set<string> {
  return new Set(
    spec.columns
      .filter((column) => column.type === 'formula' || column.type === 'rollup')
      .map((column) => column.name),
  )
}

function diff(before: RecordData, after: RecordData, skipped: Set<string>): RowFieldChange[] {
  const columns = [...new Set([...Object.keys(before), ...Object.keys(after)])]
  return columns.flatMap((column) => {
    const from = before[column] ?? null
    const to = after[column] ?? null
    if (skipped.has(column) || JSON.stringify(from) === JSON.stringify(to)) return []
    return [{ column, from, to }]
  })
}

/** What each write did to a row, newest first: the versions in `record_changes`, compared in pairs. */
export function rowActivity(ws: Workspace, recordId: string, limit = DEFAULT_LIMIT): RowActivity {
  const tableId = findRecordTableId(ws, recordId)
  const table = tableId ? listTables(ws).find((each) => each.id === tableId) : undefined
  if (!table) throw new InkError(`unknown record "${recordId}"`)
  const skipped = computedNames(table.spec)

  const changes: RowChange[] = []
  const createdMs = recordCreatedMs(ws, recordId)
  let previous: RecordData | null = null
  let wasDeleted = false
  for (const [index, { data, atMs, author }] of listRecordChanges(ws, recordId).entries()) {
    // Rows older than the change log were backfilled from their last edit: that version is only
    // a baseline to diff against, never "added this row" at a time it wasn't.
    const isSnapshot =
      index === 0 && data !== null && createdMs !== null && atMs - createdMs > SNAPSHOT_AFTER_MS
    if (isSnapshot) {
      previous = data
      continue
    }
    // A version after a deletion is the row coming back (Trash → Restore), not a new row.
    const kind =
      data === null
        ? 'deleted'
        : previous === null
          ? wasDeleted
            ? 'restored'
            : 'created'
          : 'edited'
    const fields = data === null ? [] : diff(previous ?? {}, data, skipped)
    if (kind !== 'edited' || fields.length > 0) {
      changes.push({ atMs, by: author, kind, fields: kind === 'restored' ? [] : fields })
    }
    if (data === null) wasDeleted = true
    previous = data
  }
  changes.reverse()
  return { changes: changes.slice(0, limit), more: changes.length > limit }
}
