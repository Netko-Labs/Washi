import type { RowActivity, RowChange, RowFieldChange } from '@washi/domain'
import type { RecordData, TableSpec } from '@washi/ink'
import { findRecordTableId, listRecordChanges, listTables, type Workspace } from '@washi/repository'
import { InkError } from './errors'

const DEFAULT_LIMIT = 20

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
  let previous: RecordData | null = null
  for (const { data, atMs, author } of listRecordChanges(ws, recordId)) {
    const kind = data === null ? 'deleted' : previous === null ? 'created' : 'edited'
    const fields = data === null ? [] : diff(previous ?? {}, data, skipped)
    if (kind === 'created' || kind === 'deleted' || fields.length > 0) {
      changes.push({ atMs, by: author, kind, fields })
    }
    previous = data
  }
  changes.reverse()
  return { changes: changes.slice(0, limit), more: changes.length > limit }
}
