import { IconX } from '@tabler/icons-react'
import { CommentsList } from './comments-list'
import { type CommentsPanelProps, useCommentsStore, usePanelSheet } from './lib'

/** A page's discussion beside it, Dropbox Dash style; full screen on a phone. */
export function CommentsPanel({ sheetId }: CommentsPanelProps) {
  const isOpen = useCommentsStore((state) => state.isOpen)
  usePanelSheet(sheetId, isOpen)
  if (!isOpen) return null

  return (
    <aside
      aria-label="Comments"
      className="fixed inset-0 z-40 flex flex-col bg-background sm:static sm:w-[340px] sm:shrink-0 sm:border-border sm:border-l"
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-border border-b px-4">
        <span className="font-semibold text-[13px]">Comments</span>
        <button
          type="button"
          aria-label="Close comments"
          onClick={() => useCommentsStore.getState().close()}
          className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
        >
          <IconX className="size-4" />
        </button>
      </div>
      <CommentsList sheetId={sheetId} />
    </aside>
  )
}
