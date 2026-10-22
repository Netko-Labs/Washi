import type { MobileHomeProps } from '../lib'
import { SidebarPages } from '../sidebar-pages'
import { SidebarPlaces } from '../sidebar-places'
import { UserMenu } from '../workspace-footer'
import { WorkspaceSwitcher } from '../workspace-switcher'

const stay = () => {}

/** Under `md` the sidebar is the Home screen: places as top tabs, Recents as cards, one 48px list. */
export function MobileHome({ workspace }: MobileHomeProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col pb-[60px]">
      <div className="flex h-12 shrink-0 items-center gap-1.5 border-border border-b px-2">
        <WorkspaceSwitcher workspace={workspace} onNavigate={stay} compact />
        <div className="min-w-0 flex-1">
          <SidebarPlaces workspaceId={workspace.id} onNavigate={stay} />
        </div>
        <UserMenu workspace={workspace} onNavigate={stay} placement="down" />
      </div>
      <SidebarPages workspaceId={workspace.id} onNavigate={stay} />
    </div>
  )
}
