import { Header, useViewStore } from '@washi/ui'
import { AskBar, BackHome } from '@/components/sidebar'
import { AgentLayer } from './agent-layer'
import { DrawerEdge } from './drawer-edge'
import { HeaderActions } from './header-actions'
import type { WorkspaceShellProps } from './lib'
import { MobileDrawer } from './mobile-drawer'
import { SidebarButton } from './sidebar-button'

/**
 * Under `md`: the same Home and pages as the desktop, one at a time. ☰ (or a swipe in from the
 * left edge) opens the whole sidebar as a full-screen menu; a page has ‹ back to Home.
 */
export function NarrowShell({ workspace, children }: WorkspaceShellProps) {
  const activeTab = useViewStore((state) => state.activeTab)
  const isHome = !activeTab || activeTab === 'view:dashboard'

  return (
    <>
      <main className="flex min-w-0 flex-1 flex-col pb-[60px]">
        <Header
          leading={
            <>
              <SidebarButton />
              {!isHome && <BackHome workspaceId={workspace.id} />}
            </>
          }
          actions={<HeaderActions />}
        />
        {children}
      </main>
      <DrawerEdge />
      <MobileDrawer workspace={workspace} />
      <AskBar />
      <AgentLayer fab={false} placement="sheet" />
    </>
  )
}
