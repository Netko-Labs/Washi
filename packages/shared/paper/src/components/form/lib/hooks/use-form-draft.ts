import { useState } from 'react'
import { useData } from '../../../../data'
import { addModeOf, useRunAction } from '../../../../lib'
import { usePaperHost } from '../../../../provider'
import { useSheetState } from '../../../../state'
import { ADDED_FOR_MS, NOTHING_TYPED } from '../constants'
import type { Cell, FormDraft, FormDraftOptions, FormEntries, FormStatus, Visitor } from '../types'
import { hasEntries, missingOf, reasonOf, resolveDefaults, rowOf, visitorGaps } from '../utils'

const IDLE: FormStatus = { kind: 'idle' }
const VISITOR_KEY = 'visitor:'

/**
 * The row being typed, sent through the page's action path so ink validates it server-side.
 * On a link that takes suggestions it goes to the host instead, with who sent it (D120). A send
 * with a required field empty, or nothing typed at all, is turned back in words.
 */
export function useFormDraft({
  table,
  written,
  required,
  defaults,
  seed,
  reset,
  check,
  onAdded,
}: FormDraftOptions): FormDraft {
  const host = usePaperHost()
  const run = useRunAction()
  const { refresh } = useData()
  const { values: state } = useSheetState()
  const [entries, setEntries] = useState<FormEntries>({})
  const [visitor, setVisitorState] = useState<Visitor>({ name: '', email: '' })
  const [status, setStatus] = useState<FormStatus>(IDLE)
  const mode = addModeOf(host)
  const values = { ...resolveDefaults(defaults, state), ...seed, ...entries }

  const clear = (key: string) =>
    setStatus((now) => {
      const left = now.kind === 'missing' ? now.columns.filter((name) => name !== key) : []
      return left.length > 0 ? { kind: 'missing', columns: left } : IDLE
    })

  const set: FormDraft['set'] = (column, value) => {
    setEntries((previous) => ({ ...previous, [column]: value }))
    clear(column)
  }

  const setVisitor: FormDraft['setVisitor'] = (field, value) => {
    setVisitorState((previous) => ({ ...previous, [field]: value }))
    clear(`${VISITOR_KEY}${field}`)
  }

  const send = async (row: Record<string, Cell>) => {
    if (mode !== 'suggest' || !host.suggestRow) {
      await run({ verb: 'table.insert', table, data: row })
      return
    }
    const { name, email, trap } = visitor
    await host.suggestRow(table, row, { name: name.trim(), email: email.trim(), trap })
    refresh()
  }

  const submit = async () => {
    if (status.kind === 'busy') return null
    const gaps = mode === 'suggest' ? visitorGaps(visitor).map((gap) => VISITOR_KEY + gap) : []
    const missing = [...missingOf(required, values), ...gaps]
    if (missing.length > 0) {
      setStatus({ kind: 'missing', columns: missing })
      return missing[0] ?? null
    }
    if (!hasEntries(entries)) {
      setStatus({ kind: 'refused', reason: NOTHING_TYPED })
      return null
    }
    setStatus({ kind: 'busy' })
    try {
      const refusal = await check?.()
      if (refusal) {
        setStatus({ kind: 'refused', reason: refusal })
        return null
      }
      await send(rowOf(written, values))
      if (reset) setEntries({})
      setStatus({ kind: 'added' })
      onAdded?.()
      setTimeout(() => setStatus((now) => (now.kind === 'added' ? IDLE : now)), ADDED_FOR_MS)
    } catch (cause) {
      setStatus({ kind: 'refused', reason: reasonOf(cause) })
    }
    return null
  }

  return { values, set, mode, visitor, setVisitor, status, submit }
}
