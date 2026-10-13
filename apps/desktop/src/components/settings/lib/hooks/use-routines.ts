import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/rpc'
import type { RoutineWire } from '../types'

export function useRoutines() {
  const [routines, setRoutines] = useState<RoutineWire[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setRoutines(await api.routines.list.query())
  }, [])

  useEffect(() => {
    void refresh().catch((cause) => setError(String(cause)))
  }, [refresh])

  const act = async (action: () => Promise<unknown>) => {
    try {
      await action()
      await refresh()
      setError(null)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      return false
    }
  }

  return {
    routines,
    error,
    create: (input: { title: string; prompt: string; minuteOfDay: number; timeZone: string }) =>
      act(() => api.routines.create.mutate(input)),
    toggle: (id: string, enabled: boolean) =>
      void act(() => api.routines.setEnabled.mutate({ id, enabled })),
    runNow: (id: string) => void act(() => api.routines.runNow.mutate({ id })),
    remove: (id: string) => void act(() => api.routines.remove.mutate({ id })),
  }
}
