import type { WsxValue } from '@washi/wsx'
import { type RefObject, useEffect, useRef, useState } from 'react'
import { usePageRoot } from '../../../../lib'
import type { WidgetMessage, WidgetPage } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { useSheetState } from '../../../../state'
import {
  answerAsk,
  applyWrite,
  isAsk,
  isPressed,
  isScalar,
  isWrite,
  postTo,
  tokensOf,
} from '../utils'
import { FIRST_HEIGHT, MAX_HEIGHT, MIN_HEIGHT } from '../values'

/**
 * The frame's side of the page: reads answered as the reader, page state both ways, the page's
 * verbs from a press — nothing else. A frame's messages arrive on the window, the one place the
 * browser delivers them; only this frame's own are heard.
 */
export function useWidgetBridge(
  frame: RefObject<HTMLIFrameElement | null>,
  isLive: boolean,
  args: Record<string, WsxValue> | undefined,
) {
  const host = usePaperHost()
  const root = usePageRoot()
  const { values, set } = useSheetState()
  const [height, setHeight] = useState(FIRST_HEIGHT)
  const page = useRef<WidgetPage>({ host, values, set })
  page.current = { host, values, set }
  const given = JSON.stringify(args ?? {})

  useEffect(() => {
    if (!isLive) return
    const hear = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !event.data?.washi) return
      const message = event.data as WidgetMessage
      const { values: now, set: put } = page.current
      if (message.type === 'height') {
        setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Number(message.value) || 0)))
      }
      if (message.type === 'seed' && typeof message.key === 'string' && !(message.key in now)) {
        if (isScalar(message.value)) put(message.key, message.value)
      }
      if (isAsk(message)) {
        void answerAsk(message, page.current).then((value) =>
          postTo(frame.current, { type: 'answer', id: message.id, value }),
        )
      }
      if (isWrite(message) && isPressed(frame.current)) applyWrite(message, page.current)
    }
    window.addEventListener('message', hear)
    const stopData = host.onDataChange?.(() => postTo(frame.current, { type: 'changed' }))
    const stopPages = host.onPagesChange?.(() => postTo(frame.current, { type: 'moved' }))
    return () => {
      window.removeEventListener('message', hear)
      stopData?.()
      stopPages?.()
    }
  }, [isLive, host, frame])

  useEffect(() => {
    if (isLive) postTo(frame.current, { type: 'state', values })
  }, [isLive, values, frame])

  useEffect(() => {
    if (isLive) postTo(frame.current, { type: 'props', props: JSON.parse(given) })
  }, [isLive, given, frame])

  /** A fresh frame learns the page's colours, its state and what it was handed, as they are now. */
  const onLoad = () => {
    const target = frame.current
    const title = typeof root?.props.title === 'string' ? root.props.title : ''
    postTo(target, { type: 'tokens', css: tokensOf(target?.closest('.wsx') ?? null) })
    postTo(target, { type: 'page', page: host.pageId ? { id: host.pageId, title } : null })
    postTo(target, { type: 'state', values: page.current.values })
    postTo(target, { type: 'props', props: JSON.parse(given) })
  }

  return { height, onLoad }
}
