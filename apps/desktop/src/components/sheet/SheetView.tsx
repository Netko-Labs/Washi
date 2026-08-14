import type { SheetDetail } from '@washi/desktop-domain'
import { PaperProvider, WsxView } from '@washi/paper'
import { parse, type WsxElement } from '@washi/wsx'
import { useEffect, useState } from 'react'
import { Mascot } from '@/components/mascot/Mascot'
import { paperHost } from '@/lib/paper-host'
import { api } from '@/lib/rpc'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
import { SheetByline } from './SheetByline'

interface Loaded {
  sheet: SheetDetail
  root: WsxElement | null
  error: string | null
}

/** HLC stamps lead with zero-padded wall-clock ms. */
function relativeTime(hlc: string): string {
  const ms = Number(hlc.slice(0, 14))
  if (!Number.isFinite(ms) || ms === 0) return 'recently'
  const minutes = Math.floor((Date.now() - ms) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / (60 * 24))}d ago`
}

const TAPES = [
  'bg-tape-pink',
  'bg-tape-teal',
  'bg-tape-blue',
  'bg-tape-mustard',
  'bg-tape-violet',
  'bg-tape-moss',
]

/** theme.accent when the sheet declares one; otherwise stable per-id fallback. */
function tapeFor(root: WsxElement | null, id: string): string {
  const theme = root?.props.theme as { accent?: string } | undefined
  if (theme?.accent) return `bg-tape-${theme.accent}`
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return TAPES[Math.abs(hash) % TAPES.length] ?? TAPES[0]!
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

  return (
    <div className="paper-canvas flex-1 overflow-y-auto px-6 py-8" data-sheet-id={loaded.sheet.id}>
      <div className="relative mx-auto max-w-2xl rounded-xl border border-border shadow-[0_3px_14px_rgb(0_0_0/0.08)]">
        <span
          aria-hidden
          className={`-top-3 -rotate-2 absolute left-8 z-10 h-6 w-24 rounded-xs opacity-80 shadow-sm ${tapeFor(loaded.root, loaded.sheet.id)}`}
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.18) 0 6px, transparent 6px 14px)',
            clipPath: 'polygon(2% 0, 98% 5%, 100% 92%, 1% 100%)',
          }}
        />
        <div className="overflow-hidden rounded-xl">
          {loaded.error ? (
            <div className="bg-card px-8 py-6 text-destructive text-sm">{loaded.error}</div>
          ) : (
            loaded.root && (
              <>
                <SheetByline editedLabel={relativeTime(loaded.sheet.hlcUpdated)} />
                <PaperProvider host={paperHost}>
                  <WsxView key={loaded.sheet.id} root={loaded.root} />
                </PaperProvider>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}
