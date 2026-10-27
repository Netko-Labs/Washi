import { useViewStore } from '@washi/ui'
import { useRemindersStore } from '@/components/reminders'
import { useMentionsStore } from './lib'

/** In the header while the Inbox is open and a mention or a reminder is still unread. */
export function MarkAllRead() {
  const isInbox = useViewStore((state) => state.activeTab === 'view:inbox')
  const unread =
    useMentionsStore((state) => state.unread) + useRemindersStore((state) => state.unread)
  if (!isInbox || unread === 0) return null

  return (
    <button
      type="button"
      onClick={() => {
        const ids = useMentionsStore
          .getState()
          .items.filter((item) => !item.isRead)
          .map((item) => item.commentId)
        void useMentionsStore.getState().markRead({ commentIds: ids })
        void useRemindersStore.getState().markRead()
      }}
      className="flex h-8 items-center rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      Mark all read
    </button>
  )
}
