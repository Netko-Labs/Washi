import { useEffect, useState } from 'react'
import type { WidgetGate } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { RECHECK_MS } from '../values'

/** Whether widgets run here — asked again while one runs, so an owner turning them off stops it too. */
export function useWidgetGate(): WidgetGate {
  const host = usePaperHost()
  const [gate, setGate] = useState<WidgetGate>('asking')

  useEffect(() => {
    let alive = true
    const ask = () => {
      const asked = host.widgetsAllowed?.() ?? Promise.resolve(false)
      asked.then((ok) => alive && setGate(ok ? 'on' : 'off')).catch(() => alive && setGate('off'))
    }
    ask()
    const timer = setInterval(ask, RECHECK_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [host])

  return gate
}
