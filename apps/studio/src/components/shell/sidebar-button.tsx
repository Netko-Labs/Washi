import { IconLayoutSidebarLeftExpand } from '@tabler/icons-react'
import { useShellStore } from './lib'

export function SidebarButton() {
  return (
    <button
      type="button"
      onClick={() => useShellStore.getState().setDrawer(true)}
      aria-label="Open the sidebar"
      title="Sidebar"
      className="-ml-2 grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent active:bg-accent"
    >
      <IconLayoutSidebarLeftExpand className="size-[20px]" />
    </button>
  )
}
