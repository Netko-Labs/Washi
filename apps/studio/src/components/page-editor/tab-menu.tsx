import { IconArrowLeft, IconArrowRight, IconDots, IconPencil, IconTrash } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import { Floating } from '@/components/shared/floating'
import { type TabMenuProps, useEditorStore } from './lib'

const ITEM =
  'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/10'

/** The ⋯ beside a tab: rename it, move it along the strip, or delete it with what it holds. */
export function TabMenu({ tabsId, tabId, onRename }: TabMenuProps) {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, isOpen, () => setOpen(false))
  const store = useEditorStore.getState
  const act = (run: () => void) => {
    run()
    setOpen(false)
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Tab options"
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
        className={`grid size-6 place-items-center rounded font-sans text-muted-foreground opacity-0 hover:bg-black/5 focus-visible:opacity-100 group-hover/tab:opacity-100 dark:hover:bg-white/10 ${
          isOpen ? 'opacity-100' : ''
        }`}
      >
        <IconDots className="size-4" />
      </button>
      {isOpen && (
        <Floating
          anchor={root}
          role="menu"
          aria-label="Tab options"
          className="w-[200px] rounded-xl border border-border bg-popover p-1 font-sans text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
        >
          <button type="button" role="menuitem" onClick={() => act(onRename)} className={ITEM}>
            <IconPencil className="size-4 text-muted-foreground" />
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => act(() => store().moveTab(tabsId, tabId, -1))}
            className={ITEM}
          >
            <IconArrowLeft className="size-4 text-muted-foreground" />
            Move left
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => act(() => store().moveTab(tabsId, tabId, 1))}
            className={ITEM}
          >
            <IconArrowRight className="size-4 text-muted-foreground" />
            Move right
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => act(() => store().removeTab(tabsId, tabId))}
            className={`${ITEM} text-destructive`}
          >
            <IconTrash className="size-4" />
            Delete tab
          </button>
        </Floating>
      )}
    </div>
  )
}
