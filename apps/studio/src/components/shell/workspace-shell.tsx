import { IconMenu2 } from '@tabler/icons-react'
import { CommandPalette, Header, MascotDefs, TabStrip } from '@washi/ui'
import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { AgentLayer } from './agent-layer'
import { useWorkspaceBoot, type WorkspaceShellProps } from './lib'
import { ShellView } from './shell-view'

/** The desktop's rev-2 shell on the web: the same components, a drawer under `md`. */
export function WorkspaceShell({ workspace, onLeave }: WorkspaceShellProps) {
  useWorkspaceBoot(workspace)
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-sans text-[14px] text-foreground">
      <MascotDefs />
      <Sidebar
        workspace={workspace}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onLeave={onLeave}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="hidden md:block">
          <TabStrip />
        </div>
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
        />
        <ShellView workspace={workspace} />
      </main>
      <AgentLayer />
      <CommandPalette />
    </div>
  )
}
