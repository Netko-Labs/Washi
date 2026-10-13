import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { SheetListItem } from '@/lib/types'

export function useWorkspaceSheets(workspaceId: string) {
  const [sheets, setSheets] = useState<SheetListItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const current = useRef(workspaceId)
  current.current = workspaceId

  const refresh = useCallback(async () => {
    const issuedFor = current.current
    setLoading(true)
    try {
      const next = await api.sheets.list.query()
      if (issuedFor !== current.current) return
      setSheets(next)
      setError(null)
    } catch (cause) {
      if (issuedFor === current.current) setError(String(cause))
    } finally {
      if (issuedFor === current.current) setLoading(false)
    }
    // workspaceId is not read here — it rides the request header — but changing
    // it must refetch, so it stays in the dependency list deliberately.
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: workspaceId switches the header
  useEffect(() => {
    setActiveId(null)
    void refresh()
  }, [workspaceId, refresh])

  return { sheets, activeId, setActiveId, error, loading, refresh }
}
