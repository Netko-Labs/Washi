import { useEffect } from 'react'
import { useMentionsStore } from './lib'
import { MentionRow } from './mention-row'

/** Above Washi's approvals: the people who asked for you. */
export function MentionsSection() {
  const items = useMentionsStore((state) => state.items)
  const unread = useMentionsStore((state) => state.unread)

  useEffect(() => {
    void useMentionsStore.getState().refresh()
  }, [])

  if (items.length === 0) return null
  const unreadIds = items.filter((item) => !item.isRead).map((item) => item.commentId)
  return (
    <section className="mx-auto w-full max-w-[760px] px-6 pt-8">
      <div className="flex items-baseline justify-between px-3 pb-2">
        <h2 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Mentions{unread > 0 && ` · ${unread} new`}
        </h2>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void useMentionsStore.getState().markRead({ commentIds: unreadIds })}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            Mark all read
          </button>
        )}
      </div>
      <ul className="space-y-px">
        {items.map((item) => (
          <MentionRow key={item.commentId} item={item} />
        ))}
      </ul>
    </section>
  )
}
