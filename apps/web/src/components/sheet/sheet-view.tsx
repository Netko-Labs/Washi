import type { PaperHost } from '@washi/paper'
import { PaperProvider, WsxView } from '@washi/paper'
import { parse, type WsxElement } from '@washi/wsx'
import { useEffect, useState } from 'react'
import { api } from '@/lib/rpc'

interface Loaded {
  id: string
  root: WsxElement | null
  error: string | null
}

/**
 * A bare scrolling surface, same as the desktop (spec Q18) — the page brings
 * its own background, width and type, and the shell must not frame it.
 *
 * Parse only, no re-validation: the desktop does the same, and validating on
 * one client would mean a sheet that renders there and reports damage here.
 * That is spec P8, and it has to land on both at once or neither.
 */
export function SheetView({ id, host }: { id: string | null; host: PaperHost }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!id) {
      setLoaded(null)
      return
    }
    let live = true
    api.sheets.get
      .query({ id })
      .then((sheet) => {
        if (!live) return
        if (!sheet) {
          setLoaded({ id, root: null, error: 'That page is gone.' })
          return
        }
        try {
          setLoaded({ id, root: parse(sheet.source), error: null })
        } catch (cause) {
          setLoaded({ id, root: null, error: String(cause) })
        }
      })
      .catch((cause) => live && setLoaded({ id, root: null, error: String(cause) }))
    return () => {
      live = false
    }
  }, [id])

  if (!id) {
    return <Empty title="Nothing open" detail="Pick a page, or ask Washi to write one." />
  }
  if (!loaded || loaded.id !== id) {
    return <Empty title="Loading…" detail="" />
  }
  if (loaded.error || !loaded.root) {
    return <Empty title="That page would not render" detail={loaded.error ?? ''} />
  }

  return (
    <PaperProvider host={host}>
      <WsxView key={loaded.id} root={loaded.root} />
    </PaperProvider>
  )
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid h-full place-items-center px-6 py-16 text-center">
      <div className="max-w-sm">
        <p className="font-bold text-[15px]">{title}</p>
        {detail && (
          <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">{detail}</p>
        )}
      </div>
    </div>
  )
}
