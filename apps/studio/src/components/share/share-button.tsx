import { IconLock, IconUsers, IconWorld } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { ShareButtonProps } from './lib'
import { SharePanel } from './share-panel'

const ICONS = { shared: IconUsers, private: IconLock, public: IconWorld }

/** The header's Share: the icon says who reads the page before anyone opens it. */
export function ShareButton({ sheet }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, open, () => setOpen(false))
  const Icon = ICONS[sheet.visibility]

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 font-medium text-[12.5px] hover:bg-accent"
      >
        <Icon className="size-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Share this page"
          className="absolute top-full right-0 z-50 mt-1.5 w-[340px] max-w-[calc(100vw-24px)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
        >
          <SharePanel sheet={sheet} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
