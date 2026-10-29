import type { Reminder, ReminderHit, RoutineRun } from '@washi/domain'
import type { Filter, QueryRow, TableSpec } from '@washi/ink'

/** A routine run joined to its chat, as `listRoutineRuns` reads it. */
export interface RunRow {
  id: string
  routineId: string
  sessionId: string
  trigger: RoutineRun['trigger']
  startedAt: string
  sessionStatus: string | null
  costUsd: number | null
  endedAt: string | null
  waiting: number
}

/** Another table's rows for a rollup: its spec, and its rows after filters (formulas computed). */
export type RollupFetch = (
  table: string,
  filters: Filter[],
) => { spec: TableSpec; rows: QueryRow[] } | null

export type ReminderWrite = Omit<Reminder, 'id' | 'enabled' | 'createdAt'>

export type ReminderPatch = Partial<
  Pick<Reminder, 'title' | 'daysBefore' | 'where' | 'personColumn' | 'enabled'>
>

export interface HitWrite {
  reminderId: string
  recordId: string
  dueDay: string
  rowTitle: string
  recipient: string | null
}

export type HitRow = Omit<ReminderHit, 'isRead'> & { readAt: string | null }

export interface SheetIndexInput {
  /** Plain text + outbound refs, extracted by the service before persist. */
  body: string
  refs: string[]
  /** `file:<id>` keys the page uses, so a purge knows which uploads it frees. */
  files?: string[]
  /** The `<Automation>` blocks the page holds, in order: what a row write may run. */
  automations?: AutomationEntry[]
  /** The `<Formula>` functions the page defines, in order: what a formula column may call. */
  formulas?: { name: string; source: string }[]
  /** The user tables the page shows or reads, by name (D109). */
  tables?: string[]
}

export interface AutomationEntry {
  table: string
  event: 'insert' | 'update'
  title: string | null
  source: string
}
