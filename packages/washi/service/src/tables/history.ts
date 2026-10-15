import type { RecordData } from '@washi/ink'
import {
  type HistoryQuery,
  type HistoryRange,
  matchesFilters,
  type QueryResult,
  unknownQueryColumns,
} from '@washi/ink'
import { getTableByName, listChanges, type Workspace } from '@washi/repository'
import { InkError } from './errors'
import { checkListUse } from './rules'

const DAYS: Record<HistoryRange, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }
const DAY_MS = 86_400_000

/** UTC day ends, oldest first; today ends now. */
function dayEnds(range: HistoryRange, now: number): { day: string; end: number }[] {
  const today = Math.floor(now / DAY_MS) * DAY_MS
  return Array.from({ length: DAYS[range] }, (_, index) => {
    const start = today - (DAYS[range] - 1 - index) * DAY_MS
    return {
      day: new Date(start).toISOString().slice(0, 10),
      end: Math.min(start + DAY_MS - 1, now),
    }
  })
}

/** Replays the change log: how many rows matched `where` when each day closed. */
export function runHistory(ws: Workspace, query: HistoryQuery, now = Date.now()): QueryResult {
  const table = getTableByName(ws, query.table)
  if (!table) throw new InkError(`unknown table "${query.table}"`)
  const where = query.where ?? []
  const issues = unknownQueryColumns(table.spec, where)
  if (issues.length > 0) throw new InkError(issues.map((issue) => issue.message).join('; '))
  checkListUse(table.spec, where)

  const changes = listChanges(ws, table.id)
  const live = new Map<string, RecordData>()
  let next = 0
  const rows = dayEnds(query.range, now).map(({ day, end }) => {
    for (; next < changes.length && (changes[next]?.atMs ?? 0) <= end; next++) {
      const change = changes[next]
      if (!change) continue
      if (change.data) live.set(change.recordId, change.data)
      else live.delete(change.recordId)
    }
    let count = 0
    for (const [id, data] of live) {
      if (matchesFilters({ ...data, id }, where, table.spec)) count++
    }
    return { day, count }
  })
  return { rows, total: rows.length }
}
