import { IconCheck, IconRotate } from '@tabler/icons-react'
import { useState } from 'react'
import { CommentComposer } from './comment-composer'
import { CommentItem } from './comment-item'
import { type CommentThreadProps, useCommentsStore } from './lib'

export function CommentThreadCard({ thread, myId }: CommentThreadProps) {
  const [isReplying, setReplying] = useState(false)
  const { root, replies } = thread

  return (
    <article
      className={`space-y-3 rounded-xl border border-border bg-card p-3 ${root.resolved ? 'opacity-60' : ''}`}
    >
      <CommentItem comment={root} isMine={root.authorId === myId} />
      {replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} isMine={reply.authorId === myId} />
      ))}
      {isReplying ? (
        <CommentComposer
          sheetId={root.sheetId}
          threadId={root.id}
          placeholder="Reply…"
          onSent={() => setReplying(false)}
        />
      ) : (
        <div className="flex items-center gap-3 pl-8 text-[12px] text-muted-foreground">
          {!root.resolved && (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="hover:text-foreground"
            >
              Reply
            </button>
          )}
          <button
            type="button"
            onClick={() => void useCommentsStore.getState().resolve(root.id, !root.resolved)}
            className="flex items-center gap-1 hover:text-foreground"
          >
            {root.resolved ? (
              <IconRotate className="size-3.5" />
            ) : (
              <IconCheck className="size-3.5" />
            )}
            {root.resolved ? 'Reopen' : 'Resolve'}
          </button>
        </div>
      )}
    </article>
  )
}
