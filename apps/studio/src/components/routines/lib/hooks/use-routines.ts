import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { RoutineWire } from '../types'

/** The list page's routines; a switch flips one in place and rereads. */
export function useRoutines() {
  const [routines, setRoutines] = useState<RoutineWire[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setRoutines(await api.routines.list.query())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggle = async (id: string, enabled: boolean) => {
    setRoutines(
      (current) =>
        current?.map((routine) => (routine.id === id ? { ...routine, enabled } : routine)) ?? null,
    )
    await api.routines.setEnabled.mutate({ id, enabled }).catch(() => undefined)
    await refresh()
  }

  return { routines, error, toggle }
}
