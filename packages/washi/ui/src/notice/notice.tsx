import { IconX } from '@tabler/icons-react'
import { useNoticeStore } from '../stores'

export function Notice() {
  const message = useNoticeStore((state) => state.message)
  if (!message) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-popover px-3.5 py-2 text-[13px] text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
    >
      {message}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => useNoticeStore.getState().dismiss()}
        className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-accent"
      >
        <IconX className="size-3.5" />
      </button>
    </div>
  )
}
