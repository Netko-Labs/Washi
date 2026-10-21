import { WorkspaceSwitcher } from '../workspace-switcher'
import type { WorkspaceFooterProps } from './lib'
import { UserMenu } from './user-menu'

/** The workspace is the footer: mark + name switches, the person's avatar beside it. */
export function WorkspaceFooter({ workspace, onNavigate }: WorkspaceFooterProps) {
  return (
    <div className="flex h-[42px] shrink-0 items-center gap-2 border-border border-t px-2">
      <WorkspaceSwitcher workspace={workspace} onNavigate={onNavigate} />
      <UserMenu workspace={workspace} onNavigate={onNavigate} />
    </div>
  )
}
