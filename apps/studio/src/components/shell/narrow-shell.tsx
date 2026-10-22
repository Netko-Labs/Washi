import { Header, useViewStore } from '@washi/ui'
import { AskBar, BackHome, MobileHome } from '@/components/sidebar'
import { AgentLayer } from './agent-layer'
import { HeaderActions } from './header-actions'
import type { WorkspaceShellProps } from './lib'

/** Under `md`: no drawer. Home is the sidebar; a page opens over it with ‹ back; the ask bar is the door. */
export function NarrowShell({ workspace, children }: WorkspaceShellProps) {
  const activeTab = useViewStore((state) => state.activeTab)
  const isHome = !activeTab || activeTab === 'view:dashboard'

  return (
    <>
      {isHome && <MobileHome workspace={workspace} />}
      {/* The dashboard route stays mounted so its route effect keeps the tab honest. */}
      <main className={`min-w-0 flex-1 flex-col pb-[60px] ${isHome ? 'hidden' : 'flex'}`}>
        <Header leading={<BackHome workspaceId={workspace.id} />} actions={<HeaderActions />} />
        {children}
      </main>
      <AskBar />
      <AgentLayer fab={false} placement="sheet" />
    </>
  )
}
