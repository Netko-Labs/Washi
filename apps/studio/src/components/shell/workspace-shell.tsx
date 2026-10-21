import { IconMenu2 } from '@tabler/icons-react'
import { CommandPalette, Header, MascotDefs, Notice } from '@washi/ui'
import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { AgentLayer } from './agent-layer'
import { HeaderActions } from './header-actions'
import { useTabNavigation, useWorkspaceBoot, type WorkspaceShellProps } from './lib'

/** The shell on the web: Sidebar D, the header, the page. No tab strip (D58) — a page is its URL. */
export function WorkspaceShell({ workspace, children }: WorkspaceShellProps) {
  useWorkspaceBoot(workspace.id)
  useTabNavigation(workspace.id)
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-sans text-[14px] text-foreground">
      <MascotDefs />
      <Sidebar workspace={workspace} open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="flex min-w-0 flex-1 flex-col">
        <Header
          leading={
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open the sidebar"
              className="-ml-2 grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
            >
              <IconMenu2 className="size-[18px]" />
            </button>
          }
          actions={<HeaderActions />}
        />
        {children}
      </main>
      <AgentLayer />
      <CommandPalette />
      <Notice />
    </div>
  )
}
