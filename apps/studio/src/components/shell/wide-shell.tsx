import { IconLayoutSidebarLeftExpand } from '@tabler/icons-react'
import { Header } from '@washi/ui'
import { Sidebar } from '@/components/sidebar'
import { AgentLayer } from './agent-layer'
import { HeaderActions } from './header-actions'
import { useDock, useFold, useShellStore, type WorkspaceShellProps } from './lib'

/** From `md` up: the sidebar beside the page, folding to nothing; the left edge peeks it back. */
export function WideShell({ workspace, children }: WorkspaceShellProps) {
  const { folded, peeking } = useFold(workspace.id)
  const docked = useDock(workspace.id)
  const shell = useShellStore.getState

  return (
    <>
      <Sidebar
        workspace={workspace}
        folded={folded}
        peeking={peeking}
        onFold={() => shell().toggleFold()}
        onPeekEnd={() => shell().setPeeking(false)}
      />
      {folded && !peeking && (
        <div
          aria-hidden
          className="fixed inset-y-0 left-0 z-30 w-2"
          onPointerEnter={() => shell().setPeeking(true)}
        />
      )}
      <main className="flex min-w-0 flex-1 flex-col">
        <Header
          leading={
            folded && (
              <button
                type="button"
                onClick={() => shell().toggleFold()}
                onPointerEnter={() => shell().setPeeking(true)}
                aria-label="Show the sidebar (⌘\)"
                title="Show sidebar ⌘\"
                className="-ml-2 grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <IconLayoutSidebarLeftExpand className="size-[18px]" />
              </button>
            )
          }
          actions={<HeaderActions />}
        />
        {children}
      </main>
      {/* Docked, the panel is a flex sibling that pushes the page; floating, it is the popover over it. */}
      {docked ? <AgentLayer placement="dock" /> : <AgentLayer />}
    </>
  )
}
