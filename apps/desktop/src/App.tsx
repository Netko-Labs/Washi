import { useEffect } from 'react'
import { AgentPanel } from '@/components/agent/AgentPanel'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { GraphView } from '@/components/graph/GraphView'
import { Header } from '@/components/header/Header'
import { MascotDefs } from '@/components/mascot/MascotDefs'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { CommandPalette } from '@/components/palette/CommandPalette'
import { SettingsView } from '@/components/settings/SettingsView'
import { SheetView } from '@/components/sheet/SheetView'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { useAgentStore } from '@/stores/agent/agent-store'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
import { useViewStore } from '@/stores/view/view-store'

export function App() {
  const refresh = useSheetsStore((state) => state.refresh)
  const panelOpen = useAgentStore((state) => state.panelOpen)
  const view = useViewStore((state) => state.view)
  const onboarding = useViewStore((state) => state.onboarding)

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-sans text-[14px] text-foreground">
      <MascotDefs />
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Header />
        {view === 'note' && <SheetView />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'graph' && <GraphView />}
        {view === 'settings' && <SettingsView />}
      </main>
      {panelOpen && view === 'note' && <AgentPanel />}
      <CommandPalette />
      {onboarding && <Onboarding />}
    </div>
  )
}
