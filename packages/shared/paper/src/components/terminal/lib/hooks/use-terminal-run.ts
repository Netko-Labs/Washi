import { type RefObject, useEffect, useRef, useState } from 'react'
import { readTerminalFiles } from '../../../../lib'
import type { TerminalState } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { postTo } from '../../../widget'

/**
 * A run starts only from the person's press: the files are read as the reader, a fresh frame is
 * drawn and handed them with `run`. Stop tells the frame to drop every timer; a frame's messages
 * arrive on the window, and only this frame's own are heard.
 */
export function useTerminalRun(
  frame: RefObject<HTMLIFrameElement | null>,
  files: Record<string, string> | undefined,
  document: string | null,
) {
  const host = usePaperHost()
  const [state, setState] = useState<TerminalState>({ status: 'idle' })
  const [runs, setRuns] = useState(0)
  const handed = useRef<Record<string, Uint8Array> | null>(null)

  // A new program is a new frame: whatever ran before is gone with it.
  useEffect(() => {
    if (document) setState({ status: 'idle' })
  }, [document])

  useEffect(() => {
    const hear = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !event.data?.washi) return
      if (event.data.type === 'exit') {
        setState({ status: 'exited', code: Number(event.data.code) || 0 })
      }
    }
    window.addEventListener('message', hear)
    return () => window.removeEventListener('message', hear)
  }, [frame])

  const run = async () => {
    setState({ status: 'loading' })
    try {
      handed.current = await readTerminalFiles(host, files)
      setRuns((count) => count + 1)
      setState({ status: 'running' })
    } catch (cause) {
      setState({ status: 'failed', reason: cause instanceof Error ? cause.message : String(cause) })
    }
  }

  const stop = () => {
    postTo(frame.current, { type: 'stop' })
    setState({ status: 'stopped' })
  }

  /** A frame drawn for a run starts it the moment it has loaded; the first frame only waits. */
  const onLoad = () => {
    if (!handed.current) return
    postTo(frame.current, { type: 'run', files: handed.current })
    handed.current = null
  }

  return { state, runs, run, stop, onLoad }
}
