import { useRemindersStore } from '@/components/reminders'
import { useSuggestionsStore } from '@/components/suggestions'
import { useMentionsStore } from '../mentions-store'

/** Unread mentions, reminders and suggestions together: what Mark all read clears. */
export function useInboxUnread(): number {
  return (
    useMentionsStore((state) => state.unread) +
    useRemindersStore((state) => state.unread) +
    useSuggestionsStore((state) => state.unread)
  )
}
