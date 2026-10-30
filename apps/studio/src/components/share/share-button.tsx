import { IconLock, IconUsers, IconWorld } from '@tabler/icons-react'
import { type ShareButtonProps, useShareMenu } from './lib'
import { SharePanel } from './share-panel'

const ICONS = { shared: IconUsers, private: IconLock, public: IconWorld }

/** The header's Share: the icon says who reads the page before anyone opens it. */
export function ShareButton({ sheet }: ShareButtonProps) {
  const menu = useShareMenu()
  const Icon = ICONS[sheet.visibility]

  return (
    <div ref={menu.root} className="relative">
      <button
        ref={menu.trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={menu.isOpen}
        onClick={menu.toggle}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 font-medium text-[12.5px] hover:bg-accent"
      >
        <Icon className="size-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>
      {menu.isOpen && (
        <div
          ref={menu.panel}
          role="dialog"
          aria-label="Share this page"
          tabIndex={-1}
          className="absolute top-full right-0 z-50 mt-1.5 w-[340px] max-w-[calc(100vw-24px)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)] outline-none"
        >
          <SharePanel sheet={sheet} onClose={menu.close} />
        </div>
      )}
    </div>
  )
}
