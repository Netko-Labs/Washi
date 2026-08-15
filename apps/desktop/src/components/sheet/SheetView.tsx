import type { SheetDetail } from '@washi/desktop-domain'
import { PaperProvider, WsxView } from '@washi/paper'
import { parse, type WsxElement } from '@washi/wsx'
import { useEffect, useState } from 'react'
import { Mascot } from '@/components/mascot/Mascot'
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
      <div className="paper-canvas grid flex-1 place-items-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot face="happy" motion="bob" size={120} className="mascot-motion" />
          <div className="font-serif text-[23px] italic">Nothing written here yet</div>
          <p className="max-w-72 text-[14px] text-muted-foreground leading-relaxed">
            Start a note and Washi will keep it tidy, tagged and findable.
          </p>
          <button
            type="button"
            onClick={() => void useSheetsStore.getState().createSheet()}
            className="mt-1 rounded-xl bg-primary px-5 py-2.5 font-bold text-[14px] text-primary-foreground"
          >
            New note
          </button>
        </div>
      </div>
    )
  }

  // A bare surface: no tape, no card, no byline, no width (spec Q18). Anything
  // the reader sees on a sheet was authored by the sheet.
  return (
    <div className="flex-1 overflow-y-auto" data-sheet-id={loaded.sheet.id}>
      {loaded.error ? (
        <div className="px-8 py-6 text-destructive text-sm">{loaded.error}</div>
      ) : (
        loaded.root && (
          <PaperProvider host={paperHost}>
            <WsxView key={loaded.sheet.id} root={loaded.root} />
          </PaperProvider>
        )
      )}
    </div>
  )
}
