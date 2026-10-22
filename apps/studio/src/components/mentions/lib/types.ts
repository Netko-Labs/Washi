import type { MentionItem } from '@washi/domain'

export interface MentionsState {
  unread: number
  items: MentionItem[]
  refreshCount: () => Promise<void>
  refresh: () => Promise<void>
  markRead: (target: { commentIds?: string[]; sheetId?: string }) => Promise<void>
  reset: () => void
}
