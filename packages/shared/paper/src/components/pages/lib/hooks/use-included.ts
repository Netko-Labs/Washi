import { useEffect, useState } from 'react'
import type { IncludeState } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'

/** The other page's source, read again whenever the page tree moves (an edit to it moves it). */
export function useIncluded(sheet: string): IncludeState {
  const host = usePaperHost()
  const [state, setState] = useState<IncludeState>({ status: 'loading' })
  useEffect(() => {
    if (!host.loadSheet) {
      setState({ status: 'gone' })
      return
    }
    let alive = true
    const read = () =>
      host
        .loadSheet?.(sheet)
        .then((page) => alive && setState(page ? { status: 'ready', ...page } : { status: 'gone' }))
        .catch(() => alive && setState({ status: 'gone' }))
    void read()
    const stop = host.onPagesChange?.(() => void read())
    return () => {
      alive = false
      stop?.()
    }
  }, [host, sheet])
  return state
}
