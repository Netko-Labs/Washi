import { type RefObject, useEffect, useRef, useState } from 'react'
import type { ActionRef, WidgetGate, WidgetMessage } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { useSheetState } from '../../../../state'
import { isScalar, tokensOf } from '../utils'
import { FIRST_HEIGHT, MAX_HEIGHT, MIN_HEIGHT, RECHECK_MS } from '../values'

/**
 * Whether widgets run here, and the frame's bridge: rows read as the reader, page state both ways,
 * the page's verbs — nothing else. A frame's messages arrive on the window, the one place the
 * browser delivers them; only this frame's own are heard.
 */
export function useWidget(frame: RefObject<HTMLIFrameElement | null>) {
  const host = usePaperHost()
  const { values, set } = useSheetState()
  const [gate, setGate] = useState<WidgetGate>('asking')
  const [height, setHeight] = useState(FIRST_HEIGHT)
  const latest = useRef(values)
  latest.current = values

  // Asked again while it runs: an owner turning widgets off stops this frame too, not just new ones.
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

  useEffect(() => {
    if (gate !== 'on') return
    const post = (message: Record<string, unknown>) =>
      frame.current?.contentWindow?.postMessage({ washi: true, ...message }, '*')
    const hear = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !event.data?.washi) return
      const message = event.data as WidgetMessage
      if (message.type === 'height')
        setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Number(message.value) || 0)))
      if (message.type === 'set' && typeof message.key === 'string' && isScalar(message.value))
        set(message.key, message.value)
      if (message.type === 'act') void host.runAction(message.action as ActionRef).catch(() => {})
      if (message.type === 'rows') {
        host
          .runQuery(message.query as Parameters<typeof host.runQuery>[0])
          .then((result) => post({ type: 'rows', id: message.id, rows: result.rows }))
          .catch(() => post({ type: 'rows', id: message.id, rows: [] }))
      }
    }
    window.addEventListener('message', hear)
    return () => window.removeEventListener('message', hear)
  }, [gate, host, set, frame])

  useEffect(() => {
    if (gate !== 'on') return
    frame.current?.contentWindow?.postMessage({ washi: true, type: 'state', values }, '*')
  }, [gate, values, frame])

  /** A fresh frame learns the page's colours and its state as it is now. */
  const onLoad = () => {
    const target = frame.current
    target?.contentWindow?.postMessage(
      { washi: true, type: 'tokens', css: tokensOf(target.closest('.wsx')) },
      '*',
    )
    target?.contentWindow?.postMessage({ washi: true, type: 'state', values: latest.current }, '*')
  }

  return { gate, height, onLoad }
}
