import type { WsxValue } from '@washi/wsx'
import type { RefObject } from 'react'
import { useWidgetBridge } from './use-widget-bridge'
import { useWidgetBundle } from './use-widget-bundle'
import { useWidgetGate } from './use-widget-gate'

/** Whether a widget runs here, its bundle, and its bridge to the page once both are ready. */
export function useWidget(
  frame: RefObject<HTMLIFrameElement | null>,
  component: string,
  args: Record<string, WsxValue> | undefined,
) {
  const gate = useWidgetGate()
  const bundle = useWidgetBundle(component, gate === 'on')
  const { height, onLoad } = useWidgetBridge(
    frame,
    gate === 'on' && bundle.status === 'ready',
    args,
  )
  return { gate, bundle, height, onLoad }
}
