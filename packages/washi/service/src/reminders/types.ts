import type { Reminder } from '@washi/domain'

export type Rule = Pick<Reminder, 'table' | 'dateColumn' | 'personColumn' | 'where'>

export interface DueRow {
  recordId: string
  dueDay: string
  rowTitle: string
  recipient: string | null
}
