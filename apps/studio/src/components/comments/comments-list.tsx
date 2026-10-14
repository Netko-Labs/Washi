import { IconMessageCircle } from '@tabler/icons-react'
import { useSession } from '@/integrations/auth'
import { CommentComposer } from './comment-composer'
import { CommentThreadCard } from './comment-thread'
import { type CommentsPanelProps, threadsOf, useCommentsStore } from './lib'

/** Open threads first, resolved ones after; the composer stays at the bottom. */
export function CommentsList({ sheetId }: CommentsPanelProps) {
  const comments = useCommentsStore((state) => state.comments)
  const error = useCommentsStore((state) => state.error)
  const { data: session } = useSession()
  const threads = threadsOf(comments).sort(
    (a, b) => Number(a.root.resolved) - Number(b.root.resolved),
  )

  return (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {threads.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <IconMessageCircle className="size-6" />
            <p className="max-w-56 text-[13px] leading-relaxed">
              No comments yet. Start one below, and type @ to bring someone in.
            </p>
          </div>
        )}
        {threads.map((thread) => (
          <CommentThreadCard key={thread.root.id} thread={thread} myId={session?.user.id ?? null} />
        ))}
      </div>
      <div className="shrink-0 border-border border-t p-3">
        {error && <p className="pb-2 text-[12px] text-destructive">{error}</p>}
        <CommentComposer sheetId={sheetId} placeholder="Add a comment…" />
      </div>
    </>
  )
}
