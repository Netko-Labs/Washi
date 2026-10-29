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
  useAgentStore,
  useViewStore,
  viewOf,
} from '@washi/ui'
import { DailyNote } from '@/components/daily/DailyNote'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { SettingsView } from '@/components/settings/SettingsView'
import { ShareButton } from '@/components/share/ShareButton'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { useAppBoot } from '@/hooks/use-app-boot'
import { useProfileStore } from '@/stores/profile'

export function App() {
  const panelOpen = useAgentStore((state) => state.panelOpen)
  const activeTab = useViewStore((state) => state.activeTab)
  const onboarding = useProfileStore((state) => state.onboarding)
  const view = viewOf(activeTab)

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
