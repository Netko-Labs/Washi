import type { WsxElement } from '@washi/wsx'
import { useCallback, useEffect, useState } from 'react'
import { base64Of, fileAsOf, readFileAs } from '../../../../lib'
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
  files: [],
  refused: null,
  every: 0,
  seeds: {},
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
    const halted = failure ?? box.halted
    if (halted) return setState({ status: 'stopped', reason: halted })
    if (!box.sandbox) return
    const needs = noNeeds()
    const result = box.sandbox.call('__render()', programBridge(box, host, needs, false))
    if (!result.ok) return setState({ status: 'stopped', reason: result.error })
    if (needs.refused) {
      return setState({
        status: 'stopped',
        reason: `${needs.refused} runs from a press, never while the page draws`,
      })
    }
    const checked = checkDrawn(JSON.parse(result.value), root)
    setState(
      'root' in checked
        ? { status: 'drawn', root: checked.root }
        : { status: 'stopped', reason: checked.reason },
    )
    // The page's own default for a key Selects show too — the same as declaring it on <Sheet state>.
    for (const [key, value] of Object.entries(needs.seeds)) {
      if (!(key in box.values)) box.set(key, value)
    }
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
    for (const id of new Set(needs.files)) {
      const [as = 'text', ...rest] = id.split(':')
      box.files.set(id, null)
      readFileAs(host, rest.join(':'), fileAsOf(as))
        .then((value) => {
          const shown = value instanceof Uint8Array ? base64Of(value) : value
          box.files.set(id, JSON.stringify({ value: shown }))
        })
        .catch((cause: unknown) => {
          const error = cause instanceof Error ? cause.message : String(cause)
          box.files.set(id, JSON.stringify({ error }))
        })
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
        programBridge(box, host, noNeeds(), true),
      )
      if (!result.ok) {
        box.halted = result.error
        return setState({ status: 'stopped', reason: result.error })
      }
      redraw((n) => n + 1)
    },
    [host],
  )

  return { state, invoke }
}
