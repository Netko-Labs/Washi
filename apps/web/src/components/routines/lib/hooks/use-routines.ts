import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/rpc'
import type { RoutineInput, RoutineWire } from '../types'

export function useRoutines() {
  const [routines, setRoutines] = useState<RoutineWire[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setRoutines(await api.routines.list.query())
      return true
    } catch (cause) {
      setError(String(cause))
      return false
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const act = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
      return await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      return false
    }
  }

  return {
    routines,
    error,
    create: (input: RoutineInput) => act(() => api.routines.create.mutate(input)),
    toggle: (id: string, enabled: boolean) =>
      void act(() => api.routines.setEnabled.mutate({ id, enabled })),
    runNow: (id: string) => void act(() => api.routines.runNow.mutate({ id })),
    remove: (id: string) => void act(() => api.routines.remove.mutate({ id })),
  }
}
