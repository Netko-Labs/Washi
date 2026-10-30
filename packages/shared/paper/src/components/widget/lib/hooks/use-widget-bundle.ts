import { serialize } from '@washi/wsx'
import { useEffect, useMemo, useState } from 'react'
import { usePageRoot } from '../../../../lib'
import type { WidgetBundle } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { widgetDocument } from '../utils'

/** The page's component compiled by the host for the frame, once per page source. */
export function useWidgetBundle(component: string, isOn: boolean): WidgetBundle {
  const host = usePaperHost()
  const root = usePageRoot()
  const source = useMemo(() => (root?.prelude ? serialize(root) : null), [root])
  const [bundle, setBundle] = useState<WidgetBundle>({ status: 'building' })

  useEffect(() => {
    if (!isOn) return
    if (!host.compileWidget || !source) {
      setBundle({
        status: 'failed',
        reason: 'a widget draws inside a workspace, from its page’s code',
      })
      return
    }
    let alive = true
    setBundle({ status: 'building' })
    host
      .compileWidget(source, component)
      .then((compiled) => {
        if (!alive) return
        setBundle(
          compiled.ok
            ? { status: 'ready', document: widgetDocument(compiled.js) }
            : { status: 'failed', reason: compiled.error },
        )
      })
      .catch((cause: unknown) => {
        if (alive)
          setBundle({
            status: 'failed',
            reason: String(cause instanceof Error ? cause.message : cause),
          })
      })
    return () => {
      alive = false
    }
  }, [host, source, component, isOn])

  return bundle
}
