import { parse } from '@washi/wsx'
import { useEffect, useState } from 'react'
import { api } from '../../../api'
import type { SheetState } from '../types'

/**
 * `version` is the page's last-edit stamp from the list: when Washi rewrites the open page
 * the list refreshes, the stamp moves, and the page reloads instead of showing the old one.
 */
export function useSheet(id: string | null, version: string | undefined): SheetState {
  const [state, setState] = useState<SheetState>({ status: 'idle' })

  useEffect(() => {
    if (!id) {
      setState({ status: 'idle' })
      return
    }
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
  }, [id, version])

  return state
}
