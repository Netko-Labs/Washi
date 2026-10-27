import { IconLayoutSidebar } from '@tabler/icons-react'
import type { SidebarToggleProps } from '../lib'

/** One button at one spot: the sidebar's corner open, the header's folded, so the pointer never chases it. */
export function SidebarToggle({ open, onClick, onPointerEnter }: SidebarToggleProps) {
  const label = open ? 'Hide sidebar ⌘\\' : 'Show sidebar ⌘\\'
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      aria-label={label}
      title={label}
      className="grid size-[34px] shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <IconLayoutSidebar className="size-[18px]" stroke={1.75} />
    </button>
  )
}
