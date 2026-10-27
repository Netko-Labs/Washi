import type { ReminderHit } from '@washi/domain'

export interface RemindersState {
  unread: number
  items: ReminderHit[]
  refreshCount: () => Promise<void>
  refresh: () => Promise<void>
  /** None named marks every hit the person sees. */
  markRead: (hitIds?: string[]) => Promise<void>
  reset: () => void
}
