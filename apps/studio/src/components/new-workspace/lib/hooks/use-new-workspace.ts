import { useState } from 'react'
import { createWorkspace } from '@/components/workspace'
import { api, setActiveWorkspace } from '@/integrations/trpc'
import type { Made, Starter, Step } from '../types'

/**
 * Name it makes the workspace (an organization and its file) at once, so the steps after it act
 * on something real; leaving after that only skips what is left.
 */
export function useNewWorkspace() {
  const [step, setStep] = useState<Step>('name')
  const [made, setMade] = useState<Made | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const name = async (workspaceName: string) => {
    setBusy(true)
    setError(null)
    const result = await createWorkspace(workspaceName)
    setBusy(false)
    if ('error' in result) return setError(result.error)
    setActiveWorkspace(result.id)
    setMade({ id: result.id, name: workspaceName })
    setStep('start')
  }

  const start = async (starter: Starter) => {
    if (starter === 'team') {
      setBusy(true)
      setError(null)
      try {
        await api.tables.seedTeamSpace.mutate({
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      } catch (cause) {
        setBusy(false)
        return setError(cause instanceof Error ? cause.message : String(cause))
      }
      setBusy(false)
    }
    setStep('invite')
  }

  return { step, made, busy, error, name, start }
}
