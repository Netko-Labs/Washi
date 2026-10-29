import { useState } from 'react'
import { useRunAction } from '../../../../lib'
import { useSheetState } from '../../../../state'
import { ADDED_FOR_MS } from '../constants'
import type { FormDraft, FormDraftOptions, FormEntries, FormStatus } from '../types'
import { hasEntries, reasonOf, resolveDefaults, rowOf } from '../utils'

const IDLE: FormStatus = { kind: 'idle' }

/** The row being typed, sent through the page's action path so ink validates it server-side. */
export function useFormDraft({
  table,
  written,
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
  const canSubmit = hasEntries(entries) && status.kind !== 'busy'

  const set: FormDraft['set'] = (column, value) => {
    setEntries((previous) => ({ ...previous, [column]: value }))
    setStatus(IDLE)
  }

  const submit = async () => {
    if (!canSubmit) return
    setStatus({ kind: 'busy' })
    try {
      const refusal = await check?.()
      if (refusal) {
        setStatus({ kind: 'refused', reason: refusal })
        return
      }
      await run({ verb: 'table.insert', table, data: rowOf(written, values) })
      if (reset) setEntries({})
      setStatus({ kind: 'added' })
      onAdded?.()
      setTimeout(() => setStatus((now) => (now.kind === 'added' ? IDLE : now)), ADDED_FOR_MS)
    } catch (cause) {
      setStatus({ kind: 'refused', reason: reasonOf(cause) })
    }
  }

  return { values, set, status, canSubmit, submit }
}
