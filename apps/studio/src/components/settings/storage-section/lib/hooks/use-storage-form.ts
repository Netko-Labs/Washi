import { useState } from 'react'
import { api } from '@/integrations/trpc'
import type { StorageDraft, StorageField, StorageFormStatus } from '../types'
import { parseDraft } from '../utils'
import { EMPTY_DRAFT } from '../values'

const refusalOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause))

/** Six fields, a test, and a Save that only opens for the draft that just passed. */
export function useStorageForm(onSaved: () => Promise<unknown>) {
  const [draft, setDraft] = useState<StorageDraft>(EMPTY_DRAFT)
  const [status, setStatus] = useState<StorageFormStatus>('idle')

  const setField = (field: StorageField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setStatus('idle')
  }

  const run = async (step: 'testing' | 'saving') => {
    const { config, refusal } = parseDraft(draft)
    if (!config) return setStatus({ refusal: refusal ?? 'Something is missing.' })
    setStatus(step)
    try {
      if (step === 'saving') {
        await api.storage.set.mutate(config)
        setDraft(EMPTY_DRAFT)
        setStatus('idle')
        await onSaved()
        return
      }
      const result = await api.storage.test.mutate(config)
      setStatus(result.ok ? 'passed' : { refusal: result.reason })
    } catch (cause) {
      setStatus({ refusal: refusalOf(cause) })
    }
  }

  return {
    draft,
    status,
    setField,
    test: () => run('testing'),
    save: () => run('saving'),
  }
}
