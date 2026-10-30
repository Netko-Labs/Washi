import { parse } from '@washi/wsx'
import { useEffect, useState } from 'react'
import { api } from '../../../api'
import type { SheetState } from '../types'
import { shownSheet } from '../utils'

/**
 * `version` is the page's last-edit stamp from the list: when Washi rewrites the open page
 * the list refreshes, the stamp moves, and the page reloads instead of showing the old one.
 */
export function useSheet(id: string | null, version: string | undefined): SheetState {
  const [state, setState] = useState<SheetState>({ status: 'idle' })
  const [shown] = useState(shownSheet)

  useEffect(() => {
    if (!id) {
      shown.loading()
      setState({ status: 'idle' })
      return
    }
    // The list catching up to the page already drawn: reloading would redraw every view on it.
    if (shown.isDrawn(id, version)) return
    shown.loading()
    let alive = true
    // A different page shows its own loading state; a new version of this one swaps in place.
    setState((current) =>
      current.status === 'ready' && current.sheet.id === id ? current : { status: 'loading' },
    )
    api.sheets.get
      .query({ id })
      .then((sheet) => {
        if (!alive) return
        if (!sheet) return setState({ status: 'missing' })
        try {
          setState({ status: 'ready', sheet, root: parse(sheet.source) })
          shown.drawn(sheet)
        } catch (error) {
          setState({ status: 'failed', error: String(error) })
        }
      })
      .catch((error: unknown) => {
        if (alive) setState({ status: 'failed', error: String(error) })
      })
    return () => {
      alive = false
    }
  }, [id, version, shown])

  return state
}
