import { useEffect } from 'react'
import { AgentPanel } from '@/components/agent/AgentPanel'
import { SheetView } from '@/components/sheet/SheetView'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

export function App() {
  const refresh = useSheetsStore((state) => state.refresh)

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header
        className="h-9 shrink-0 border-border border-b bg-background"
        style={{ appRegion: 'drag' } as never}
      >
        <div className="flex h-full items-center justify-center gap-1.5">
          <span className="font-display font-bold text-muted-foreground text-xs">和紙</span>
          <span className="font-display font-bold text-foreground text-xs tracking-widest">
            WASHI
          </span>
          <span className="size-1.5 rounded-full bg-primary" />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <SheetView />
        </main>
        <AgentPanel />
      </div>
    </div>
  )
}
