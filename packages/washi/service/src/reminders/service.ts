import type {
  Reminder,
  ReminderAsk,
  ReminderCreate,
  ReminderInbox,
  ReminderUpdate,
  UserTable,
} from '@washi/domain'
import type { ColumnType } from '@washi/ink'
import {
  countUnreadReminderHits,
  createReminder,
  deleteReminder,
  getReminder,
  getTableByName,
  listReminderHits,
  listReminders,
  markReminderHitsRead,
  recordReminderHit,
  updateReminder,
  type Workspace,
} from '@washi/repository'
import { rowTitle } from '../tables/rows'
import { runQuery } from '../tables/service'
import { DUE_ROWS_PER_TICK } from './constants'
import { ReminderError } from './errors'
import type { DueRow } from './types'
import { addDays, dayIn, dueDayOf } from './utils'

export { ReminderError }

type Rule = Pick<Reminder, 'table' | 'dateColumn' | 'personColumn' | 'where'>

function columnOf(table: UserTable, name: string, type: ColumnType): boolean {
  return table.spec.columns.some((column) => column.name === name && column.type === type)
}

/** The table, a date column, a person column if any, and filters a query accepts. */
function checkRule(ws: Workspace, rule: Rule): void {
  const table = getTableByName(ws, rule.table)
  if (!table) throw new ReminderError(`unknown table "${rule.table}"`)
  if (!columnOf(table, rule.dateColumn, 'date')) {
    throw new ReminderError(`"${rule.dateColumn}" is not a date column of "${rule.table}"`)
  }
  if (rule.personColumn && !columnOf(table, rule.personColumn, 'person')) {
    throw new ReminderError(`"${rule.personColumn}" is not a person column of "${rule.table}"`)
  }
  runQuery(ws, { table: rule.table, where: rule.where, limit: 1 })
}

export function listReminderRules(ws: Workspace): Reminder[] {
  return listReminders(ws)
}

export function createReminderRule(
  ws: Workspace,
  input: ReminderCreate,
  actorId: string | null,
): Reminder {
  checkRule(ws, input)
  return createReminder(ws, { ...input, createdBy: actorId })
}

/** Washi's way in: the asker's zone when it was told one, the server's otherwise. */
export function askReminder(ws: Workspace, input: ReminderAsk, actorId: string | null): Reminder {
  const timeZone = input.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  return createReminderRule(ws, { ...input, timeZone }, actorId)
}

export function updateReminderRule(ws: Workspace, { id, ...patch }: ReminderUpdate): Reminder {
  const reminder = getReminder(ws, id)
  if (!reminder) throw new ReminderError('that reminder no longer exists')
  checkRule(ws, { ...reminder, ...patch })
  return updateReminder(ws, id, patch) as Reminder
}

export function removeReminderRule(ws: Workspace, id: string): void {
  deleteReminder(ws, id)
}

/** Rows whose day falls from today to `daysBefore` ahead; a broken rule finds none. */
function dueRows(ws: Workspace, reminder: Reminder, now: Date): DueRow[] {
  const table = getTableByName(ws, reminder.table)
  if (!table || !columnOf(table, reminder.dateColumn, 'date')) return []
  if (reminder.personColumn && !columnOf(table, reminder.personColumn, 'person')) return []
  const today = dayIn(now, reminder.timeZone)
  const date = reminder.dateColumn
  // A date is stored as written; a plain string comparison holds for days, datetimes and ranges.
  const { rows } = runQuery(ws, {
    table: reminder.table,
    where: [
      ...reminder.where,
      { column: date, op: 'gte', value: today },
      { column: date, op: 'lt', value: addDays(today, reminder.daysBefore + 1) },
    ],
    orderBy: { column: date, direction: 'asc' },
    limit: DUE_ROWS_PER_TICK,
  })
  return rows.flatMap((row) => {
    const dueDay = dueDayOf(row[date])
    const person = reminder.personColumn ? row[reminder.personColumn] : null
    if (!dueDay || typeof row.id !== 'string') return []
    if (reminder.personColumn && (typeof person !== 'string' || !person)) return []
    return [
      {
        recordId: row.id,
        dueDay,
        rowTitle: rowTitle(table.spec, row),
        recipient: typeof person === 'string' ? person : null,
      },
    ]
  })
}

/**
 * Called by the server's minute clock. No turn, no cost: a rule over rows. Each row reminds once
 * per due date; a rule whose table or column is gone stays quiet rather than stopping the rest.
 */
export function tickReminders(ws: Workspace, now = new Date()): number {
  let recorded = 0
  for (const reminder of listReminders(ws)) {
    if (!reminder.enabled) continue
    try {
      for (const row of dueRows(ws, reminder, now)) {
        if (recordReminderHit(ws, { reminderId: reminder.id, ...row })) recorded += 1
      }
    } catch (error) {
      console.error(`[washi] reminder "${reminder.title}" could not be read`, error)
    }
  }
  return recorded
}

export function reminderInbox(ws: Workspace, userId: string): ReminderInbox {
  return { items: listReminderHits(ws, userId), unread: countUnreadReminderHits(ws, userId) }
}

export function unreadReminders(ws: Workspace, userId: string): number {
  return countUnreadReminderHits(ws, userId)
}

export function markRemindersRead(ws: Workspace, userId: string, hitIds?: string[]): void {
  markReminderHitsRead(ws, userId, hitIds)
}
