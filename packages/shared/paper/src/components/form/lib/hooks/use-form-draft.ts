import { useState } from 'react'
import { useRunAction } from '../../../../lib'
import { useSheetState } from '../../../../state'
import { ADDED_FOR_MS, NOTHING_TYPED } from '../constants'
import type { FormDraft, FormDraftOptions, FormEntries, FormStatus } from '../types'
import { hasEntries, missingOf, reasonOf, resolveDefaults, rowOf } from '../utils'

const IDLE: FormStatus = { kind: 'idle' }

/**
 * The row being typed, sent through the page's action path so ink validates it server-side.
 * A send with a required field empty, or nothing typed at all, is turned back in words.
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
  const run = useRunAction()
  const { values: state } = useSheetState()
  const [entries, setEntries] = useState<FormEntries>({})
  const [status, setStatus] = useState<FormStatus>(IDLE)
  const values = { ...resolveDefaults(defaults, state), ...seed, ...entries }

  const set: FormDraft['set'] = (column, value) => {
    setEntries((previous) => ({ ...previous, [column]: value }))
    setStatus((now) => {
      const left = now.kind === 'missing' ? now.columns.filter((name) => name !== column) : []
      return left.length > 0 ? { kind: 'missing', columns: left } : IDLE
    })
  }

  const submit = async () => {
    if (status.kind === 'busy') return null
    const missing = missingOf(required, values)
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
      await run({ verb: 'table.insert', table, data: rowOf(written, values) })
      if (reset) setEntries({})
      setStatus({ kind: 'added' })
      onAdded?.()
      setTimeout(() => setStatus((now) => (now.kind === 'added' ? IDLE : now)), ADDED_FOR_MS)
    } catch (cause) {
      setStatus({ kind: 'refused', reason: reasonOf(cause) })
    }
    return null
  }

  return { values, set, status, submit }
}
