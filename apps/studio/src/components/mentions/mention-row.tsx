import { relativeTime, useViewStore } from '@washi/ui'
import { useCommentsStore } from '@/components/comments'
import { type MentionRowProps, useMentionsStore } from './lib'

export function MentionRow({ item }: MentionRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          useViewStore.getState().openTab(`note:${item.sheetId}`)
          useCommentsStore.getState().open(item.sheetId)
          void useMentionsStore.getState().markRead({ commentIds: [item.commentId] })
        }}
        className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent"
      >
        <span
          className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-primary'}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px]">
            <span className="font-semibold">{item.authorName}</span> mentioned you in{' '}
            <span className="font-semibold">{item.sheetTitle}</span>
          </span>
          <span className="line-clamp-2 block text-[12.5px] text-muted-foreground">
            {item.body}
          </span>
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {relativeTime(item.hlcCreated)}
        </span>
      </button>
    </li>
  )
}
