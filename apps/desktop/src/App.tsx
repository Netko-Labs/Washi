import { useEffect } from 'react'
import { AgentFab, AgentPanel } from '@/components/agent/AgentPanel'
import { DailyNote } from '@/components/daily/DailyNote'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Header } from '@/components/header/Header'
import { Inbox } from '@/components/inbox/Inbox'
import { MascotDefs } from '@/components/mascot/MascotDefs'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { CommandPalette } from '@/components/palette/CommandPalette'
import { SettingsView } from '@/components/settings/SettingsView'
import { SheetView } from '@/components/sheet/SheetView'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { TabStrip } from '@/components/tabs/TabStrip'
import { subscribeDevCommands } from '@/lib/dev-commands'
import { useAgentStore } from '@/stores/agent/agent-store'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
import { useViewStore, viewOf } from '@/stores/view/view-store'

export function App() {
  const refresh = useSheetsStore((state) => state.refresh)
  const panelOpen = useAgentStore((state) => state.panelOpen)
  const activeTab = useViewStore((state) => state.activeTab)
  const onboarding = useViewStore((state) => state.onboarding)
  const view = viewOf(activeTab)

  useEffect(() => {
    void refresh()
    subscribeDevCommands()
  }, [refresh])

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-sans text-[14px] text-foreground">
      <MascotDefs />
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <TabStrip />
        <Header />
        {view === 'note' && <SheetView />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'inbox' && <Inbox />}
        {view === 'daily' && <DailyNote />}
        {view === 'settings' && <SettingsView />}
      </main>
      <AgentFab />
      {panelOpen && <AgentPanel />}
      <CommandPalette />
      {onboarding && <Onboarding />}
    </div>
  )
}
