import type { InboxRow } from '@washi/ui'
import { useMemo } from 'react'
import { useMentionRows } from '@/components/mentions'
import { useReminderRows } from '@/components/reminders'
import { useSuggestionRows } from '@/components/suggestions'

/** What the studio adds to the Inbox: mentions, rows coming due, visitors' suggestions. */
export function useInboxRows(): InboxRow[] {
  const mentions = useMentionRows()
  const reminders = useReminderRows()
  const suggestions = useSuggestionRows()
  return useMemo(
    () => [...mentions, ...reminders, ...suggestions],
    [mentions, reminders, suggestions],
  )
}
