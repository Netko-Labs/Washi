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
  useLiveStore,
  useSheetsStore,
  useThemesStore,
  useViewStore,
  viewOf,
} from '@washi/ui'
import { useEffect } from 'react'
import { DailyNote } from '@/components/daily/DailyNote'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { SettingsView } from '@/components/settings/SettingsView'
import { ShareButton } from '@/components/share/ShareButton'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { subscribeDevCommands } from '@/lib/dev-commands'
import { useProfileStore } from '@/stores/profile'

export function App() {
  const refresh = useSheetsStore((state) => state.refresh)
  const panelOpen = useAgentStore((state) => state.panelOpen)
  const activeTab = useViewStore((state) => state.activeTab)
  const onboarding = useProfileStore((state) => state.onboarding)
  const view = viewOf(activeTab)

  useEffect(() => {
    void refresh()
    void useThemesStore.getState().refresh()
    subscribeDevCommands()
    // From boot, not from the panel: the inbox badge and Inbox need live approvals
    // whether or not the panel was ever opened.
    void useAgentStore.getState().init()
    useLiveStore.getState().connect()
  }, [refresh])

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
