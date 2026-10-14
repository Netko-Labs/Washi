import { IconMessageCircle } from '@tabler/icons-react'
import { type CommentsButtonProps, useCommentsStore } from './lib'

export function CommentsButton({ sheetId }: CommentsButtonProps) {
  const isOpen = useCommentsStore((state) => state.isOpen)
  const open = useCommentsStore(
    (state) =>
      state.sheetId === sheetId &&
      state.comments.filter((comment) => comment.id === comment.threadId && !comment.resolved)
        .length,
  )

  return (
    <button
      type="button"
      aria-label="Comments"
      aria-pressed={isOpen}
      title="Comments"
      onClick={() => useCommentsStore.getState().toggle(sheetId)}
      className={`flex h-8 items-center gap-1 rounded-lg px-2 text-muted-foreground hover:bg-accent ${
        isOpen ? 'bg-accent text-foreground' : ''
      }`}
    >
      <IconMessageCircle className="size-4" />
      {open ? <span className="font-medium text-[12px]">{open}</span> : null}
    </button>
  )
}
