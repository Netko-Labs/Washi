import { useEffect } from 'react'
import { AgentPanel } from '@/components/agent/AgentPanel'
import { Header } from '@/components/header/Header'
import { MascotDefs } from '@/components/mascot/MascotDefs'
import { CommandPalette } from '@/components/palette/CommandPalette'
import { SheetView } from '@/components/sheet/SheetView'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { useAgentStore } from '@/stores/agent/agent-store'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

export function App() {
  const refresh = useSheetsStore((state) => state.refresh)
  const panelOpen = useAgentStore((state) => state.panelOpen)

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-sans text-[14px] text-foreground">
      <MascotDefs />
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Header />
        <SheetView />
      </main>
      {panelOpen && <AgentPanel />}
      <CommandPalette />
    </div>
  )
}
