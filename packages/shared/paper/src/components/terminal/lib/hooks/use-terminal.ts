import type { RefObject } from 'react'
import { useWidgetGate } from '../../../widget'
import { useTerminalBundle } from './use-terminal-bundle'
import { useTerminalRun } from './use-terminal-run'

/** Whether terminals run here (a widget's switch), the program's bundle, and its runs. */
export function useTerminal(
  frame: RefObject<HTMLIFrameElement | null>,
  program: string,
  files: Record<string, string> | undefined,
) {
  const gate = useWidgetGate()
  const bundle = useTerminalBundle(program, gate === 'on')
  const document = bundle.status === 'ready' ? bundle.document : null
  return { gate, bundle, ...useTerminalRun(frame, files, document) }
}
