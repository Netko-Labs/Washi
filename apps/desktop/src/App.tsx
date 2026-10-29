import {
  AgentFab,
  AgentPanel,
  CommandPalette,
  Dashboard,
  Header,
  Inbox,
  MascotDefs,
  Notice,
  SheetView,
  TabStrip,
} from '@washi/ui'
import { DailyNote } from '@/components/daily/DailyNote'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { SettingsView } from '@/components/settings/SettingsView'
import { ShareButton } from '@/components/share/ShareButton'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { useAppBoot } from '@/hooks/use-app-boot'
import { useAppView } from '@/hooks/use-app-view'

export function App() {
  const { panelOpen, view, onboarding } = useAppView()
  useAppBoot()

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-sans text-[14px] text-foreground">
      <MascotDefs />
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <TabStrip />
        <Header actions={<ShareButton />} />
        {view === 'note' && <SheetView />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'inbox' && <Inbox />}
        {view === 'daily' && <DailyNote />}
        {view === 'settings' && <SettingsView />}
      </main>
      <AgentFab />
      {panelOpen && <AgentPanel />}
      <CommandPalette />
      <Notice />
      {onboarding && <Onboarding />}
    </div>
  )
}
