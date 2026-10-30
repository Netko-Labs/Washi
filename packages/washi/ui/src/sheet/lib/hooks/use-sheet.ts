import type { SheetDetail } from '@washi/domain'
import { parse } from '@washi/wsx'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../../api'
import type { SheetState } from '../types'

/**
 * `version` is the page's last-edit stamp from the list: when Washi rewrites the open page
 * the list refreshes, the stamp moves, and the page reloads instead of showing the old one.
 */
export function useSheet(id: string | null, version: string | undefined): SheetState {
  const [state, setState] = useState<SheetState>({ status: 'idle' })
  const shown = useRef<SheetDetail | null>(null)

  useEffect(() => {
    if (!id) {
      shown.current = null
      setState({ status: 'idle' })
      return
    }
    // The list catching up to the page already drawn: reloading would redraw every view on it.
    if (shown.current?.id === id && shown.current.hlcUpdated === version) return
    let alive = true
    // A different page shows its own loading state; a new version of this one swaps in place.
    setState((current) =>
      current.status === 'ready' && current.sheet.id === id ? current : { status: 'loading' },
    )
    api.sheets.get
      .query({ id })
      .then((sheet) => {
        if (!alive) return
        shown.current = null
        if (!sheet) return setState({ status: 'missing' })
        try {
          setState({ status: 'ready', sheet, root: parse(sheet.source) })
          shown.current = sheet
        } catch (error) {
          setState({ status: 'failed', error: String(error) })
        }
      })
      .catch((error: unknown) => {
        if (!alive) return
        shown.current = null
        setState({ status: 'failed', error: String(error) })
      })
    return () => {
      alive = false
    }
  }, [id, version])

  return state
}
