import { initials, relativeTime } from '@washi/ui'
import { bodySegments, type CommentItemProps, mentionedIn, useCommentsStore } from './lib'

export function CommentItem({ comment, isMine }: CommentItemProps) {
  return (
    <div className="group/comment flex gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-semibold text-[10px] text-primary-foreground">
        {initials(comment.authorName)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate font-semibold text-[12.5px]">{comment.authorName}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {relativeTime(comment.hlcCreated)}
          </span>
          {isMine && (
            <button
              type="button"
              onClick={() => void useCommentsStore.getState().remove(comment.id)}
              className="ml-auto hidden text-[11px] text-muted-foreground hover:text-destructive group-hover/comment:block"
            >
              Delete
            </button>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
          {bodySegments(comment.body, mentionedIn(comment)).map((segment, index) =>
            segment.isMention ? (
              <span
                key={`${index}-${segment.text}`}
                className="rounded-full bg-primary/12 px-1.5 py-px font-medium text-primary"
              >
                {segment.text}
              </span>
            ) : (
              segment.text
            ),
          )}
        </p>
      </div>
    </div>
  )
}
