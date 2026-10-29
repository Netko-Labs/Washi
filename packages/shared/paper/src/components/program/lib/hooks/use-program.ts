import type { WsxElement } from '@washi/wsx'
import { useCallback, useEffect, useState } from 'react'
import type { ProgramNeeds, ProgramState } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { programBridge } from '../bridge'
import { checkDrawn } from '../utils'
import { useProgramSandbox } from './use-program-sandbox'

const noNeeds = (): ProgramNeeds => ({
  queries: [],
  tables: [],
  members: false,
  me: false,
  every: 0,
})

/**
 * A page that runs, drawn again whenever what it read moves: page state, rows and columns it asked
 * for (fetched as the reader, after the run that asked), the members, a clock it set, a press.
 */
export function useProgram(root: WsxElement) {
  const host = usePaperHost()
  const { live, failure, drawn, redraw, values } = useProgramSandbox(root)
  const [state, setState] = useState<ProgramState>({ status: 'starting' })

  useEffect(() => {
    const box = live.current
    if (failure) return setState({ status: 'stopped', reason: failure })
    if (!box.sandbox) return
    const needs = noNeeds()
    const result = box.sandbox.call('__render()', programBridge(box, host, needs))
    if (!result.ok) return setState({ status: 'stopped', reason: result.error })
    const checked = checkDrawn(JSON.parse(result.value), root)
    setState(
      'root' in checked
        ? { status: 'drawn', root: checked.root }
        : { status: 'stopped', reason: checked.reason },
    )
    const again = () => redraw((n) => n + 1)
    for (const query of new Set(needs.queries)) {
      box.rows.set(query, null)
      host
        .runQuery(JSON.parse(query))
        .then((found) => box.rows.set(query, JSON.stringify(found.rows)))
        .catch(() => box.rows.set(query, '[]'))
        .finally(again)
    }
    for (const name of new Set(needs.tables)) {
      box.tables.set(name, null)
      host
        .describeTable(name)
        .then((spec) => box.tables.set(name, JSON.stringify(spec)))
        .catch(() => box.tables.set(name, 'null'))
        .finally(again)
    }
    if (needs.members) {
      box.members = null
      ;(host.describePeople?.() ?? Promise.resolve([]))
        .then((people) => (box.members = JSON.stringify(people)))
        .catch(() => (box.members = '[]'))
        .finally(again)
    }
    if (needs.me) {
      box.me = null
      ;(host.describeMe?.() ?? Promise.resolve(null))
        .then((me) => (box.me = JSON.stringify(me)))
        .catch(() => (box.me = 'null'))
        .finally(again)
    }
    if (!needs.every) return
    const timer = setInterval(again, needs.every)
    return () => clearInterval(timer)
  }, [drawn, values, failure])

  /** A press the page drew: its handler runs in the sandbox, then the page draws again. */
  const invoke = useCallback(
    (handler: number) => {
      const box = live.current
      if (!box.sandbox) return
      const result = box.sandbox.call(
        `__invoke(${Math.trunc(handler)})`,
        programBridge(box, host, noNeeds()),
      )
      if (!result.ok) setState({ status: 'stopped', reason: result.error })
      redraw((n) => n + 1)
    },
    [host],
  )

  return { state, invoke }
}
