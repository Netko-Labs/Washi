import { useEffect, useState } from 'react'
import type { WidgetBundle } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { widgetDocument } from '../../../widget'
import { ELSEWHERE_WORDS, TERMINAL_STYLE } from '../values'

/** The program compiled by the host into a widget's frame, once per program. */
export function useTerminalBundle(program: string, isOn: boolean): WidgetBundle {
  const host = usePaperHost()
  const [bundle, setBundle] = useState<WidgetBundle>({ status: 'building' })

  useEffect(() => {
    if (!isOn) return
    if (!host.compileTerminal) {
      setBundle({ status: 'failed', reason: ELSEWHERE_WORDS })
      return
    }
    let alive = true
    setBundle({ status: 'building' })
    host
      .compileTerminal(program)
      .then((compiled) => {
        if (!alive) return
        const look = { style: TERMINAL_STYLE, onerror: '' }
        setBundle(
          compiled.ok
            ? { status: 'ready', document: widgetDocument(compiled.js, compiled.network, look) }
            : { status: 'failed', reason: compiled.error },
        )
      })
      .catch((cause: unknown) => {
        const reason = String(cause instanceof Error ? cause.message : cause)
        if (alive) setBundle({ status: 'failed', reason })
      })
    return () => {
      alive = false
    }
  }, [host, program, isOn])

  return bundle
}
