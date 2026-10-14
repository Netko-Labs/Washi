import { Dashboard, Inbox, SheetView, useViewStore, viewOf } from '@washi/ui'
import { FirstRunGate } from '@/components/first-run'
import { SettingsScreen } from '@/components/settings'
import type { WorkspaceShellProps } from './lib'

export function ShellView({ workspace }: Pick<WorkspaceShellProps, 'workspace'>) {
  const view = viewOf(useViewStore((state) => state.activeTab))
  if (view === 'settings') return <SettingsScreen workspaceId={workspace.id} />
  return (
    <FirstRunGate workspace={workspace}>
      {view === 'note' && <SheetView />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'inbox' && <Inbox />}
    </FirstRunGate>
  )
}
