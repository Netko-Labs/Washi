import { useCallback, useEffect, useRef, useState } from 'react'
import { stateValue, toNodes } from '../../../../lib/sandbox'
import type { ActionRef, ScriptBridge, ScriptLive, ScriptState } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { paperRegistry } from '../../../../registry/specs'
import { useSheetState } from '../../../../state'
import { openScriptSandbox } from '../sandbox'
import { checkTree } from '../utils'
import { MIN_INTERVAL_MS } from '../values'

const NAMES = Object.keys(paperRegistry.components)

/**
 * A script compiled, opened in its sandbox, and drawn again whenever what it read moves: page
 * state, rows it asked for (fetched as the reader, after the run that asked), a clock it set.
 */
export function useScript(source: string) {
  const host = usePaperHost()
  const { values, set } = useSheetState()
  const [state, setState] = useState<ScriptState>({ status: 'starting' })
  const [drawn, redraw] = useState(0)
  const live = useRef<ScriptLive>({ sandbox: null, rows: new Map(), values, set })
  // A press reads the page as it is now, not as it was when the handler was drawn.
  live.current.values = values
  live.current.set = set

  useEffect(() => {
    let alive = true
    const box = live.current
    if (!host.compileScript) {
      setState({ status: 'stopped', reason: 'scripts run inside a workspace' })
      return
    }
    host
      .compileScript(source)
      .then(async (compiled) => {
        if (!compiled.ok) throw new Error(compiled.error)
        const sandbox = await openScriptSandbox(compiled.js, NAMES)
        if (!alive) return sandbox.dispose()
        box.sandbox = sandbox
        redraw((n) => n + 1)
      })
      .catch(
        (cause: unknown) =>
          alive &&
          setState({
            status: 'stopped',
            reason: String(cause instanceof Error ? cause.message : cause),
          }),
      )
    const stop = host.onDataChange?.(() => {
      box.rows.clear()
      redraw((n) => n + 1)
    })
    return () => {
      alive = false
      stop?.()
      box.sandbox?.dispose()
      box.sandbox = null
      box.rows.clear()
    }
  }, [host, source])

  const bridge = (wanted: string[], every: { ms: number }): ScriptBridge => ({
    state: (key) => {
      const page = live.current.values
      return key in page ? JSON.stringify(page[key]) : undefined
    },
    set: (key, json) => live.current.set(key, stateValue(json)),
    rows: (query) => {
      const rows = live.current.rows.get(query)
      if (rows === undefined) wanted.push(query)
      return rows ?? undefined
    },
    interval: (ms) => {
      every.ms = Math.max(
        MIN_INTERVAL_MS,
        Math.min(every.ms || Number.POSITIVE_INFINITY, Number(ms)),
      )
    },
    act: (json) => void host.runAction(JSON.parse(json) as ActionRef).catch(() => {}),
  })

  useEffect(() => {
    const box = live.current
    if (!box.sandbox) return
    const wanted: string[] = []
    const every = { ms: 0 }
    const result = box.sandbox.call('__render()', bridge(wanted, every))
    if (!result.ok) return setState({ status: 'stopped', reason: result.error })
    const checked = checkTree(toNodes(JSON.parse(result.value)))
    setState(
      'root' in checked
        ? { status: 'drawn', root: checked.root }
        : { status: 'stopped', reason: checked.reason },
    )
    for (const query of new Set(wanted)) {
      box.rows.set(query, null)
      host
        .runQuery(JSON.parse(query))
        .then((result) => box.rows.set(query, JSON.stringify(result.rows)))
        .catch(() => box.rows.set(query, '[]'))
        .finally(() => redraw((n) => n + 1))
    }
    if (!every.ms) return
    const timer = setInterval(() => redraw((n) => n + 1), every.ms)
    return () => clearInterval(timer)
  }, [drawn, values])

  /** A press the script drew: its handler runs in the sandbox, then the script draws again. */
  const invoke = useCallback((handler: number) => {
    const box = live.current
    if (!box.sandbox) return
    const result = box.sandbox.call(`__invoke(${Math.trunc(handler)})`, bridge([], { ms: 0 }))
    if (!result.ok) setState({ status: 'stopped', reason: result.error })
    redraw((n) => n + 1)
  }, [])

  return { state, invoke }
}
