import { useCallback, useEffect, useState } from 'react'
import { api, setActiveWorkspace } from '@/integrations/trpc'
import type { WorkspaceSummary } from '@/lib/types'
import { createWorkspace } from '../utils'

/** A workspace is an organization, so this is Better Auth's list plus a create. */
export function useWorkspaces(initial?: WorkspaceSummary[]) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(initial ?? [])
  const [loading, setLoading] = useState(!initial)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setWorkspaces(await api.workspaces.list.query())
    } catch (cause) {
      setError(String(cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = async (name: string) => {
    setError(null)
    const made = await createWorkspace(name)
    if ('error' in made) {
      setError(made.error)
      return null
    }
    await refresh()
    return made.id
  }

  const open = (id: string) => setActiveWorkspace(id)

  return { workspaces, loading, error, create, open, refresh }
}
