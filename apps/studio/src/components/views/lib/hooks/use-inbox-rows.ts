import type { InboxRow } from '@washi/ui'
import { useMemo } from 'react'
import { useMentionRows } from '@/components/mentions'
import { useReminderRows } from '@/components/reminders'

/** What the studio adds to the Inbox: mentions and rows coming due. */
export function useInboxRows(): InboxRow[] {
  const mentions = useMentionRows()
  const reminders = useReminderRows()
  return useMemo(() => [...mentions, ...reminders], [mentions, reminders])
}
