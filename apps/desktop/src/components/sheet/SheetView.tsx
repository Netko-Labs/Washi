import type { SheetDetail } from '@washi/desktop-domain'
import { PaperProvider, WsxView } from '@washi/paper'
import { parse, type WsxElement } from '@washi/wsx'
import { useEffect, useState } from 'react'
import { paperHost } from '@/lib/paper-host'
import { api } from '@/lib/rpc'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

interface Loaded {
  sheet: SheetDetail
  root: WsxElement | null
  error: string | null
}

export function SheetView() {
  const activeId = useSheetsStore((state) => state.activeId)
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!activeId) {
      setLoaded(null)
      return
    }
    let alive = true
    api.getSheet({ id: activeId }).then((sheet) => {
      if (!alive || !sheet) return
      try {
        setLoaded({ sheet, root: parse(sheet.source), error: null })
      } catch (error) {
        setLoaded({ sheet, root: null, error: String(error) })
      }
    })
    return () => {
      alive = false
    }
  }, [activeId])

  if (!activeId || !loaded) {
    return (
      <div className="grid flex-1 place-items-center text-muted-foreground text-sm">
        select or create a sheet
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto" data-sheet-id={loaded.sheet.id}>
      {loaded.error ? (
        <div className="mx-auto max-w-2xl px-8 py-6 text-destructive text-sm">{loaded.error}</div>
      ) : (
        loaded.root && (
          <PaperProvider host={paperHost}>
            <WsxView root={loaded.root} />
          </PaperProvider>
        )
      )}
    </div>
  )
}
