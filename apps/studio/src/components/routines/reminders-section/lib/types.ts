import type { api } from '@/integrations/trpc'

export type ReminderWire = Awaited<ReturnType<typeof api.reminders.list.query>>[number]
export type TableWire = Awaited<ReturnType<typeof api.tables.list.query>>[number]
export type ReminderInput = Parameters<typeof api.reminders.create.mutate>[0]

/** The add form; `only` is `column:true|false` over a checkbox column, or empty for every row. */
export interface ReminderDraft {
  title: string
  table: string
  dateColumn: string
  daysBefore: number
  only: string
}

export interface ReminderRuleRowProps {
  reminder: ReminderWire
  onToggle: (enabled: boolean) => void
  onRemove: () => void
}

export interface ReminderFormProps {
  tables: TableWire[]
  onCreate: (input: ReminderInput) => Promise<boolean>
  onCancel: () => void
}
