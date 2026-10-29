import { serialize, type WsxElement } from '@washi/wsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { openSandbox } from '../../../../lib/sandbox'
import type { ProgramLive } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { paperRegistry } from '../../../../registry/specs'
import { useSheetState } from '../../../../state'
import {
  PROGRAM_BRIDGE,
  PROGRAM_DEADLINE_MS,
  PROGRAM_MEMORY_BYTES,
  programPrelude,
} from '../values'

const NAMES = Object.keys(paperRegistry.components)

/**
 * A page's code compiled by the host and opened in its own sandbox, once per source; data or the
 * page tree moving elsewhere asks for another draw. `failure` is why it never opened.
 */
export function useProgramSandbox(root: WsxElement) {
  const host = usePaperHost()
  const { values, set } = useSheetState()
  const source = useMemo(() => serialize(root), [root])
  const [failure, setFailure] = useState<string | null>(null)
  const [drawn, redraw] = useState(0)
  const live = useRef<ProgramLive>({
    sandbox: null,
    title: '',
    rows: new Map(),
    tables: new Map(),
    members: undefined,
    me: undefined,
    halted: null,
    values,
    set,
  })
  // A press reads the page as it is now, not as it was when the handler was drawn.
  live.current.values = values
  live.current.set = set
  live.current.title = typeof root.props.title === 'string' ? root.props.title : ''

  useEffect(() => {
    let alive = true
    const box = live.current
    const again = () => redraw((n) => n + 1)
    setFailure(null)
    if (!host.compilePage) {
      setFailure('this page runs its code inside a workspace')
      return
    }
    host
      .compilePage(source)
      .then(async (compiled) => {
        if (!compiled.ok) throw new Error(compiled.error)
        const sandbox = await openSandbox(compiled.js, {
          prelude: programPrelude(NAMES),
          names: PROGRAM_BRIDGE,
          deadlineMs: PROGRAM_DEADLINE_MS,
          memoryBytes: PROGRAM_MEMORY_BYTES,
        })
        if (!alive) return sandbox.dispose()
        box.sandbox = sandbox
        again()
      })
      .catch(
        (cause: unknown) =>
          alive && setFailure(String(cause instanceof Error ? cause.message : cause)),
      )
    const stopData = host.onDataChange?.(() => {
      box.rows.clear()
      again()
    })
    const stopPages = host.onPagesChange?.(again)
    return () => {
      alive = false
      stopData?.()
      stopPages?.()
      box.sandbox?.dispose()
      box.sandbox = null
      box.rows.clear()
      box.tables.clear()
      box.members = undefined
      box.me = undefined
      box.halted = null
    }
  }, [host, source])

  return { live, failure, drawn, redraw, values }
}
