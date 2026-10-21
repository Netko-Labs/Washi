import {
  type Cell,
  type HistoryQuery,
  type InkQuery,
  matchesFilters,
  type QueryResult,
  type QueryRow,
  type TableSpec,
} from '@washi/ink'
import type { PaperHost } from '@washi/paper'
import type { MemoryTable, Say, SeedTable } from './types'
import { PEOPLE, SEED_TABLES, WELCOME_SHEET } from './values'

const RANGE_DAYS = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 } as const

function number(cell: Cell | undefined): number | null {
  return typeof cell === 'number' ? cell : null
}

function aggregate(fn: string, values: number[]): number | null {
  if (fn === 'count') return values.length
  if (values.length === 0) return null
  switch (fn) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0)
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    default:
      return null
  }
}

function compareCells(a: Cell | undefined, b: Cell | undefined): number {
  if (a === b) return 0
  if (a === undefined || a === null) return -1
  if (b === undefined || b === null) return 1
  return a < b ? -1 : 1
}

/** The ink executor's semantics over rows in memory: filter, order, limit, group. */
export function runQuery(table: MemoryTable, query: InkQuery): QueryResult {
  const limit = query.limit ?? 200
  const matched = table.rows.filter((row) => matchesFilters(row, query.where ?? [], table.spec))
  if (query.groupBy) {
    const { column, aggregates } = query.groupBy
    const groups = new Map<Cell, QueryRow[]>()
    for (const row of matched) {
      const key = row[column] ?? null
      groups.set(key, [...(groups.get(key) ?? []), row])
    }
    const rows = [...groups.entries()].slice(0, limit).map(([key, members]) => {
      const out: QueryRow = { [column]: key }
      for (const each of aggregates) {
        const values = each.column
          ? members.map((row) => number(row[each.column as string])).filter((v) => v !== null)
          : members.map(() => 1)
        out[each.fn === 'count' ? 'count' : `${each.fn}_${each.column}`] = aggregate(
          each.fn,
          values,
        )
      }
      return out
    })
    return { rows, total: rows.length }
  }
  const ordered = query.orderBy
    ? [...matched].sort((a, b) => {
        const order = compareCells(a[query.orderBy?.column ?? ''], b[query.orderBy?.column ?? ''])
        return query.orderBy?.direction === 'desc' ? -order : order
      })
    : matched
  const rows = ordered.slice(0, limit).map((row) => ({ ...row }))
  return { rows, total: rows.length }
}

/** A burn-up with no history table: row k exists from day k·N/total, so the line climbs. */
export function runHistory(table: MemoryTable, query: HistoryQuery): QueryResult {
  const days = RANGE_DAYS[query.range ?? '30d']
  const matched = table.rows.filter((row) => matchesFilters(row, query.where ?? [], table.spec))
  const rows: QueryRow[] = []
  const today = new Date()
  for (let i = 0; i < days; i += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - i))
    const alive = matched.filter((_, k) => Math.floor((k * days) / matched.length) <= i)
    rows.push({ day: date.toISOString().slice(0, 10), count: alive.length })
  }
  return { rows, total: rows.length }
}

export function seedTables(seeds: SeedTable[] = SEED_TABLES): Map<string, MemoryTable> {
  return new Map(
    seeds.map((seed) => [
      seed.spec.name,
      {
        spec: seed.spec,
        rows: seed.rows.map((row, i) => ({ id: `${seed.spec.name}-${i + 1}`, ...row })),
        next: seed.rows.length + 1,
      },
    ]),
  )
}

/** A PaperHost over memory: every verb lands, every bind refetches, nothing leaves the tab. */
export function createBookHost(say: Say, seeds?: SeedTable[]): PaperHost {
  const tables = seedTables(seeds)
  const listeners = new Set<() => void>()
  const notify = () => {
    for (const listener of listeners) listener()
  }
  const need = (name: unknown): MemoryTable => {
    const table = tables.get(String(name))
    if (!table) throw new Error(`no table "${String(name)}"`)
    return table
  }
  const patch = (name: unknown, id: unknown, set: unknown) => {
    const table = need(name)
    const row = table.rows.find((each) => each.id === id)
    if (!row) throw new Error(`no row "${String(id)}"`)
    Object.assign(row, set as Record<string, Cell>)
  }

  return {
    runQuery: async (query) => runQuery(need(query.table), query),
    runHistory: async (query) => runHistory(need(query.table), query),
    onDataChange: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    runAction: async (action) => {
      switch (action.verb) {
        case 'table.insert': {
          const table = need(action.table)
          table.rows.push({
            id: `${table.spec.name}-${table.next++}`,
            ...(action.data as QueryRow),
          })
          break
        }
        case 'table.update':
        case 'table.reorder':
          patch(action.table, action.row, action.set)
          break
        case 'table.delete': {
          const table = need(action.table)
          table.rows = table.rows.filter((row) => row.id !== action.row)
          break
        }
        case 'table.column': {
          const table = need(action.table)
          table.spec = {
            ...table.spec,
            columns: [...table.spec.columns, action.column as TableSpec['columns'][number]],
          }
          break
        }
        default:
          say(`${action.verb} — would reach the host`)
          return
      }
      say(`${action.verb} landed in memory`)
      notify()
    },
    resolveSheet: async () => WELCOME_SHEET,
    openSheet: (id) => say(`would open page ${id}`),
    describePeople: async () => PEOPLE,
    replaceNode: async () => say('canvas edit received — a host would save it'),
    openRow: (recordId) => say(`would open ${recordId} as a page`),
    toggleTask: async (recordId, done) => {
      for (const table of tables.values()) {
        const row = table.rows.find((each) => each.id === recordId)
        if (row) row.done = done
      }
      notify()
    },
    describeTable: async (name) => tables.get(name)?.spec ?? null,
    locale: typeof navigator === 'undefined' ? 'en-US' : navigator.language,
  }
}
