import type { ReminderDraft, ReminderInput, ReminderWire, TableWire } from './types'

const columnsOf = (table: TableWire | undefined, type: string) =>
  (table?.spec.columns ?? []).filter((column) => column.type === type).map((c) => c.name)

export const dateColumns = (table: TableWire | undefined) => columnsOf(table, 'date')

/** Tables a reminder can read: the ones with a date. */
export const datedTables = (tables: TableWire[]) =>
  tables.filter((table) => dateColumns(table).length > 0)

/** "Only where paid is off" and "on", per checkbox column. */
export function onlyOptions(table: TableWire | undefined): { value: string; label: string }[] {
  return columnsOf(table, 'boolean').flatMap((name) => [
    { value: `${name}:false`, label: `Only where ${name} is off` },
    { value: `${name}:true`, label: `Only where ${name} is on` },
  ])
}

export function draftFor(table: TableWire | undefined): ReminderDraft {
  return {
    title: '',
    table: table?.name ?? '',
    dateColumn: dateColumns(table)[0] ?? '',
    daysBefore: 2,
    only: '',
  }
}

export function inputOf(draft: ReminderDraft, timeZone: string): ReminderInput {
  const [column, value] = draft.only.split(':')
  return {
    title: draft.title.trim() || `${draft.table} due`,
    table: draft.table,
    dateColumn: draft.dateColumn,
    daysBefore: draft.daysBefore,
    where: column ? [{ column, op: 'eq', value: value === 'true' }] : [],
    timeZone,
  }
}

/** `2 days before due · bills · only where paid is off`. */
export function ruleSummary(reminder: ReminderWire): string {
  const days = reminder.daysBefore
  const when = days === 0 ? 'On the day' : days === 1 ? 'A day before' : `${days} days before`
  const only = reminder.where.map(
    (filter) =>
      `only where ${filter.column} ${typeof filter.value === 'boolean' ? (filter.value ? 'is on' : 'is off') : `${filter.op} ${String(filter.value)}`}`,
  )
  const person = reminder.personColumn ? [`to each row’s ${reminder.personColumn}`] : []
  return [`${when} ${reminder.dateColumn}`, reminder.table, ...only, ...person].join(' · ')
}
